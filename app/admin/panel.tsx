"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  ExternalLink,
  LogOut,
  Menu,
  Plus,
  RefreshCw,
  Scissors,
  Trash2,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";

type Slot = {
  id: string;
  starts_at: string;
  ends_at: string;
  barber_user_id: string | null;
  barber_name: string;
  is_available: boolean;
  note: string | null;
  users?: Barber | null;
  bookings?: Array<{
    customer_name: string;
    customer_phone: string;
    customer_email: string | null;
    note: string | null;
    services?: { name: string } | null;
  }>;
};

type Barber = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  profile_image_url: string | null;
  role: "owner" | "barber";
  can_invite: boolean;
  is_active: boolean;
};

type View = "calendar" | "create";

const formatTime = (value: string) =>
  new Intl.DateTimeFormat("cs-CZ", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));

const dateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const startOfWeek = (date: Date) => {
  const result = new Date(date);
  const offset = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - offset);
  result.setHours(0, 0, 0, 0);
  return result;
};

const weekDays = (monday: Date) =>
  Array.from({ length: 5 }, (_, index) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);
    return day;
  });

const weekLabel = (monday: Date) => {
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  const start = new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "short" }).format(monday);
  const end = new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "short", year: "numeric" }).format(friday);
  return `${start} – ${end}`;
};

const serviceClass = (name?: string) => {
  const normalized = name?.toLocaleLowerCase("cs") || "";
  if (normalized.includes("+") || (normalized.includes("střih") && normalized.includes("vous"))) return "combo";
  if (normalized.includes("vous")) return "beard";
  if (normalized.includes("střih")) return "haircut";
  return "other";
};

export default function AdminPanel({ view = "calendar" }: { view?: View }) {
  const router = useRouter();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [currentUser, setCurrentUser] = useState<Barber | null>(null);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [hasServiceKey, setHasServiceKey] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingBarber, setIsCreatingBarber] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => dateKey(new Date()));
  const [selectedBarber, setSelectedBarber] = useState("");
  const [createModalDate, setCreateModalDate] = useState<string | null>(null);

  const loadSlots = async () => {
    setIsLoading(true);
    const response = await fetch("/api/admin/slots", { cache: "no-store" });
    const result = await response.json();

    if (!response.ok) {
      setError(result.error || "Termíny se nepodařilo načíst.");
      setIsLoading(false);
      return;
    }

    setSlots(result.slots || []);
    setBarbers(result.barbers || []);
    setCurrentUser(result.user || null);
    setHasServiceKey(Boolean(result.hasAdminServiceKey));
    setIsLoading(false);
  };

  useEffect(() => {
    loadSlots();
  }, []);

  useEffect(() => {
    if (!selectedBarber && barbers[0]) setSelectedBarber(barbers[0].id);
  }, [barbers, selectedBarber]);

  const days = useMemo(() => weekDays(weekStart), [weekStart]);
  const groupedSlots = useMemo(() => {
    const grouped = new Map<string, Slot[]>();
    slots.forEach((slot) => {
      const key = dateKey(new Date(slot.starts_at));
      grouped.set(key, [...(grouped.get(key) ?? []), slot]);
    });
    grouped.forEach((items) => items.sort((a, b) => a.starts_at.localeCompare(b.starts_at)));
    return grouped;
  }, [slots]);

  const weekSlots = useMemo(
    () => days.flatMap((day) => groupedSlots.get(dateKey(day)) ?? []),
    [days, groupedSlots],
  );

  const stats = useMemo(() => {
    const booked = weekSlots.filter((slot) => slot.bookings?.length).length;
    const available = weekSlots.filter((slot) => slot.is_available && !slot.bookings?.length).length;
    return { booked, available, total: weekSlots.length };
  }, [weekSlots]);

  const changeWeek = (direction: number) => {
    setWeekStart((current) => {
      const next = new Date(current);
      next.setDate(current.getDate() + direction * 7);
      return next;
    });
  };

  const createSlot = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsCreating(true);
    const formElement = event.currentTarget;
    const response = await fetch("/api/admin/slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(formElement).entries())),
    });
    const result = await response.json();
    setIsCreating(false);

    if (!response.ok) {
      setError(result.error || "Termín se nepodařilo vytvořit.");
      return;
    }

    setMessage("Termín je připravený a klienti ho uvidí v rezervaci.");
    setCreateModalDate(null);
    await loadSlots();
  };

  const createBarber = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsCreatingBarber(true);
    const formElement = event.currentTarget;
    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(formElement).entries())),
    });
    const result = await response.json();
    setIsCreatingBarber(false);

    if (!response.ok) {
      setError(result.error || "Barbera se nepodařilo vytvořit.");
      return;
    }

    formElement.reset();
    setMessage("Nový barber byl přidán.");
    await loadSlots();
  };

  const removeSlot = async (id: string) => {
    if (!window.confirm("Opravdu chceš tento termín smazat?")) return;
    const response = await fetch(`/api/admin/slots?id=${id}`, { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) {
      setError(result.error || "Termín se nepodařilo smazat.");
      return;
    }
    setMessage("Termín byl smazán.");
    await loadSlots();
  };

  const toggleSlot = async (slot: Slot) => {
    const response = await fetch("/api/admin/slots", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: slot.id, is_available: !slot.is_available }),
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.error || "Termín se nepodařilo upravit.");
      return;
    }
    await loadSlots();
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  return (
    <main className="schedule-admin">
      <header className="schedule-topbar">
        <button className="schedule-mobile-menu" type="button" onClick={() => setMobileNavOpen((open) => !open)}>
          {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <a className="schedule-brand" href="/admin">
          <span><Scissors size={18} /></span>
          <div><strong>Číž Barber</strong><small>Administrace</small></div>
        </a>
        <div className="schedule-top-actions">
          <a href="/" target="_blank"><ExternalLink size={16} /> Web</a>
          <button type="button" onClick={logout}><LogOut size={16} /> Odhlásit</button>
        </div>
      </header>

      <aside className={mobileNavOpen ? "schedule-sidebar open" : "schedule-sidebar"}>
        <p>Pracovní nabídka</p>
        <nav>
          <a className={view === "calendar" ? "active" : ""} href="/admin">
            <CalendarDays size={20} /><span><strong>Termíny</strong><small>Týdenní kalendář</small></span>
          </a>
        </nav>
        <div className="schedule-user">
          <span>{currentUser?.full_name?.slice(0, 2).toUpperCase() || "ČB"}</span>
          <div><strong>{currentUser?.full_name || "Administrátor"}</strong><small>{currentUser?.email}</small></div>
        </div>
      </aside>

      <section className="schedule-content">
        {!hasServiceKey ? <div className="schedule-alert error">Chybí serverový klíč SUPABASE_SERVICE_ROLE_KEY.</div> : null}
        {error || message ? (
          <div className={error ? "schedule-alert error" : "schedule-alert success"}>
            {error || message}
          </div>
        ) : null}

        {view === "calendar" ? (
          <>
            <div className="schedule-page-head">
              <div>
                <span className="schedule-eyebrow">Přehled týdne</span>
                <h1>Termíny</h1>
                <p>Na jednom místě vidíš čas, klienta, službu i volné mezery.</p>
              </div>
            </div>

            <div className="schedule-controls">
              <div className="week-switcher">
                <button type="button" onClick={() => changeWeek(-1)} aria-label="Předchozí týden"><ArrowLeft size={18} /></button>
                <div><small>Zobrazený týden</small><strong>{weekLabel(weekStart)}</strong></div>
                <button type="button" onClick={() => changeWeek(1)} aria-label="Další týden"><ArrowRight size={18} /></button>
              </div>
              <button className="schedule-today" type="button" onClick={() => setWeekStart(startOfWeek(new Date()))}>Tento týden</button>
              <button className="schedule-refresh" type="button" onClick={loadSlots} aria-label="Obnovit">
                <RefreshCw className={isLoading ? "spin" : ""} size={18} />
              </button>
            </div>

            <div className="schedule-summary">
              <span><i className="free" /> {stats.available} volných</span>
              <span><i className="booked" /> {stats.booked} rezervovaných</span>
              <span><i className="hidden" /> {stats.total - stats.available - stats.booked} skrytých</span>
            </div>

            <div className="service-legend">
              <span><i className="haircut" /> Střih</span>
              <span><i className="beard" /> Vousy</span>
              <span><i className="combo" /> Střih + vousy</span>
              <span><i className="free" /> Volný termín</span>
            </div>

            <div className="week-calendar">
              {days.map((day) => {
                const dayItems = groupedSlots.get(dateKey(day)) ?? [];
                const isToday = dateKey(day) === dateKey(new Date());
                return (
                  <section className={isToday ? "week-day today" : "week-day"} key={dateKey(day)}>
                    <header>
                      <span>{new Intl.DateTimeFormat("cs-CZ", { weekday: "long" }).format(day)}</span>
                      <strong>{day.getDate()}</strong>
                      <small>{new Intl.DateTimeFormat("cs-CZ", { month: "long" }).format(day)}</small>
                      <button
                        type="button"
                        onClick={() => {
                          const key = dateKey(day);
                          setSelectedDate(key);
                          setCreateModalDate(key);
                        }}
                      >
                        <Plus size={14} /> Přidat
                      </button>
                    </header>
                    <div className="day-slots">
                      {isLoading ? (
                        <div className="day-empty"><RefreshCw className="spin" size={18} /></div>
                      ) : dayItems.length ? dayItems.map((slot) => {
                        const booking = slot.bookings?.[0];
                        const booked = Boolean(booking);
                        const color = booked ? serviceClass(booking?.services?.name) : slot.is_available ? "free" : "hidden";
                        return (
                          <article className={`week-slot ${color}`} key={slot.id}>
                            <div className="slot-time">
                              <Clock3 size={14} />
                              <strong>{formatTime(slot.starts_at)}</strong>
                              <span>– {formatTime(slot.ends_at)}</span>
                            </div>
                            <div className="slot-main">
                              <strong>{booked ? booking?.customer_name : slot.is_available ? "Volný termín" : "Skrytý termín"}</strong>
                              <span>{booked ? booking?.services?.name : slot.users?.full_name || slot.barber_name}</span>
                            </div>
                            {booked ? (
                              <div className="slot-contact">
                                <span>{booking?.customer_phone}</span>
                                <small>{slot.users?.full_name || slot.barber_name}</small>
                              </div>
                            ) : (
                              <button className="slot-visibility" type="button" onClick={() => toggleSlot(slot)}>
                                {slot.is_available ? "Skrýt" : "Zveřejnit"}
                              </button>
                            )}
                            <button className="slot-delete" type="button" onClick={() => removeSlot(slot.id)} aria-label="Smazat termín">
                              <Trash2 size={15} />
                            </button>
                          </article>
                        );
                      }) : (
                        <button
                          className="day-empty"
                          type="button"
                          onClick={() => {
                            const key = dateKey(day);
                            setSelectedDate(key);
                            setCreateModalDate(key);
                          }}
                        >
                          <Plus size={18} /><span>Přidat první termín</span>
                        </button>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <div className="schedule-page-head create-head">
              <div>
                <span className="schedule-eyebrow">Nová dostupnost</span>
                <h1>Vytvořit termín</h1>
                <p>Stačí vybrat datum, čas, délku a barbera.</p>
              </div>
              <a className="schedule-secondary" href="/admin"><ArrowLeft size={17} /> Zpět na kalendář</a>
            </div>

            <div className="create-layout">
              <form className="friendly-form" onSubmit={createSlot}>
                <div className="friendly-form-intro">
                  <span>1</span>
                  <div><h2>Nový volný čas</h2><p>Po uložení se termín ihned zobrazí zákazníkům.</p></div>
                </div>
                <div className="friendly-fields">
                  <label>
                    <span>Datum</span>
                    <input name="date" type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} required />
                  </label>
                  <label>
                    <span>Začátek</span>
                    <input name="time" type="time" defaultValue="09:00" required />
                  </label>
                  <label>
                    <span>Délka termínu</span>
                    <select name="duration_minutes" defaultValue="60">
                      <option value="30">30 minut</option>
                      <option value="45">45 minut</option>
                      <option value="60">60 minut</option>
                      <option value="75">75 minut</option>
                      <option value="90">90 minut</option>
                    </select>
                  </label>
                  <label>
                    <span>Barber</span>
                    <select name="barber_user_id" value={selectedBarber} onChange={(event) => setSelectedBarber(event.target.value)} required>
                      <option value="" disabled>Vyber barbera</option>
                      {barbers.map((barber) => <option value={barber.id} key={barber.id}>{barber.full_name}</option>)}
                    </select>
                  </label>
                  <label className="wide">
                    <span>Interní poznámka <small>volitelné</small></span>
                    <textarea name="note" placeholder="Například blokace pro stálého klienta" />
                  </label>
                </div>
                <button className="schedule-primary submit" type="submit" disabled={isCreating}>
                  {isCreating ? <RefreshCw className="spin" size={18} /> : <Check size={18} />}
                  {isCreating ? "Ukládám…" : "Vytvořit termín"}
                </button>
              </form>

              <aside className="create-help">
                <CalendarDays size={28} />
                <h3>Co se stane potom?</h3>
                <p>Termín se objeví zeleně v týdenním kalendáři a zákazník si ho může vybrat v rezervaci.</p>
                <div><i className="free" /><span>Zelená znamená volný termín</span></div>
              </aside>
            </div>

            {currentUser?.can_invite ? (
              <form className="friendly-form barber-form" onSubmit={createBarber}>
                <div className="friendly-form-intro">
                  <span><UserPlus size={20} /></span>
                  <div><h2>Přidat barbera</h2><p>Vytvoří nový účet a zpřístupní ho ve výběru termínu.</p></div>
                </div>
                <div className="friendly-fields">
                  <label><span>Jméno</span><input name="full_name" required /></label>
                  <label><span>E-mail</span><input name="email" type="email" required /></label>
                  <label><span>Telefon</span><input name="phone" /></label>
                  <label><span>Dočasné heslo</span><input name="password" type="password" minLength={8} required /></label>
                  <label className="wide"><span>URL profilové fotky <small>volitelné</small></span><input name="profile_image_url" type="url" /></label>
                </div>
                <button className="schedule-secondary submit" type="submit" disabled={isCreatingBarber}>
                  <UsersRound size={18} /> {isCreatingBarber ? "Přidávám…" : "Přidat barbera"}
                </button>
              </form>
            ) : null}
          </>
        )}
      </section>

      {createModalDate ? (
        <div className="slot-modal-backdrop" role="presentation" onMouseDown={() => setCreateModalDate(null)}>
          <form className="slot-modal" onSubmit={createSlot} onMouseDown={(event) => event.stopPropagation()}>
            <header>
              <div>
                <span>Nový termín</span>
                <h2>
                  {new Intl.DateTimeFormat("cs-CZ", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  }).format(new Date(`${createModalDate}T12:00:00`))}
                </h2>
              </div>
              <button type="button" onClick={() => setCreateModalDate(null)} aria-label="Zavřít"><X size={20} /></button>
            </header>
            <input name="date" type="hidden" value={selectedDate} />
            <div className="slot-modal-fields">
              <label>
                <span>Začátek</span>
                <input name="time" type="time" defaultValue="09:00" required autoFocus />
              </label>
              <label>
                <span>Délka termínu</span>
                <select name="duration_minutes" defaultValue="60">
                  <option value="30">30 minut</option>
                  <option value="45">45 minut</option>
                  <option value="60">60 minut</option>
                  <option value="75">75 minut</option>
                  <option value="90">90 minut</option>
                </select>
              </label>
              <label className="wide">
                <span>Barber</span>
                <select name="barber_user_id" value={selectedBarber} onChange={(event) => setSelectedBarber(event.target.value)} required>
                  <option value="" disabled>Vyber barbera</option>
                  {barbers.map((barber) => <option value={barber.id} key={barber.id}>{barber.full_name}</option>)}
                </select>
              </label>
              <label className="wide">
                <span>Poznámka <small>volitelné</small></span>
                <textarea name="note" placeholder="Například blokace pro stálého klienta" />
              </label>
            </div>
            <button className="schedule-primary submit" type="submit" disabled={isCreating}>
              {isCreating ? <RefreshCw className="spin" size={18} /> : <Check size={18} />}
              {isCreating ? "Ukládám…" : "Přidat termín"}
            </button>
          </form>
        </div>
      ) : null}
    </main>
  );
}
