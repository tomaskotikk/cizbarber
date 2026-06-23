"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronDown,
  CircleUserRound,
  Clock3,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  RefreshCw,
  Scissors,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UsersRound,
} from "lucide-react";
import { useRouter } from "next/navigation";

type Slot = {
  id: string;
  starts_at: string;
  ends_at: string;
  barber_name: string;
  is_available: boolean;
  note: string | null;
  bookings?: Array<{
    customer_name: string;
    customer_phone: string;
    customer_email: string | null;
    note: string | null;
    services?: { name: string } | null;
  }>;
};

type Filter = "all" | "available" | "booked";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("cs-CZ", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

const formatTime = (value: string) =>
  new Intl.DateTimeFormat("cs-CZ", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

export default function AdminPanel() {
  const router = useRouter();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [hasServiceKey, setHasServiceKey] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

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
    setHasServiceKey(Boolean(result.hasAdminServiceKey));
    setIsLoading(false);
  };

  useEffect(() => {
    loadSlots();
  }, []);

  const stats = useMemo(() => {
    const available = slots.filter((slot) => slot.is_available && !slot.bookings?.length).length;
    const booked = slots.filter((slot) => Boolean(slot.bookings?.length)).length;
    return { all: slots.length, available, booked };
  }, [slots]);

  const filteredSlots = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("cs");

    return slots.filter((slot) => {
      const booking = slot.bookings?.[0];
      const matchesFilter =
        filter === "all" ||
        (filter === "available" && slot.is_available && !booking) ||
        (filter === "booked" && Boolean(booking));
      const matchesQuery =
        !normalizedQuery ||
        [slot.barber_name, slot.note, booking?.customer_name, booking?.customer_phone, booking?.services?.name]
          .filter(Boolean)
          .some((value) => value!.toLocaleLowerCase("cs").includes(normalizedQuery));

      return matchesFilter && matchesQuery;
    });
  }, [filter, query, slots]);

  const createSlot = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsCreating(true);

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const response = await fetch("/api/admin/slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form.entries())),
    });
    const result = await response.json();
    setIsCreating(false);

    if (!response.ok) {
      setError(result.error || "Termín se nepodařilo vytvořit.");
      return;
    }

    formElement.reset();
    setMessage("Nový termín byl přidán.");
    await loadSlots();
  };

  const removeSlot = async (id: string) => {
    if (!window.confirm("Opravdu chceš tento termín smazat?")) return;

    setMessage("");
    setError("");
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
    setMessage("");
    setError("");
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
    <main className="admin-app">
      <header className="admin-topbar">
        <button
          className="admin-icon-button admin-mobile-menu"
          type="button"
          onClick={() => setMobileNavOpen((open) => !open)}
          aria-label="Otevřít navigaci"
        >
          <Menu size={18} />
        </button>
        <a className="admin-logo" href="/admin">
          <span>ČŽ</span>
          <strong>Číž Barber</strong>
        </a>
        <div className="admin-topbar-path">
          <span>Administrace</span>
          <span>/</span>
          <strong>Termíny</strong>
        </div>
        <div className="admin-topbar-actions">
          <a className="admin-icon-button" href="/" target="_blank" title="Otevřít web">
            <ExternalLink size={17} />
          </a>
          <div className="admin-profile-wrap">
            <button
              className={profileOpen ? "admin-user-menu active" : "admin-user-menu"}
              type="button"
              onClick={() => setProfileOpen((open) => !open)}
              aria-expanded={profileOpen}
              aria-label="Zobrazit profil"
            >
              <span>ČŽ</span>
              <div>
                <strong>Administrator</strong>
                <small>admin</small>
              </div>
              <ChevronDown size={14} />
            </button>
            {profileOpen ? (
              <div className="admin-profile-menu">
                <div className="admin-profile-heading">
                  <span>ČŽ</span>
                  <div>
                    <strong>Administrator</strong>
                    <small>Číž Barber</small>
                  </div>
                </div>
                <div className="admin-profile-role">
                  <ShieldCheck size={16} />
                  <div>
                    <strong>Plný přístup</strong>
                    <small>Správa termínů a rezervací</small>
                  </div>
                </div>
                <a href="/" target="_blank"><ExternalLink size={16} /> Zobrazit web</a>
                <button type="button" onClick={logout}><LogOut size={16} /> Odhlásit se</button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <aside className={mobileNavOpen ? "admin-sidebar open" : "admin-sidebar"}>
        <div className="admin-project">
          <span className="admin-project-mark"><Scissors size={18} /></span>
          <div>
            <strong>Číž Barber</strong>
            <small>Rezervační systém</small>
          </div>
        </div>

        <nav className="admin-nav">
          <a href="#prehled"><LayoutDashboard size={17} /><span>Přehled</span></a>
          <a className="active" href="#terminy"><CalendarDays size={17} /><span>Termíny</span><b>{stats.all}</b></a>
          <a href="#novy-termin"><Plus size={17} /><span>Nový termín</span></a>
          <a href="#klienti"><UsersRound size={17} /><span>Klienti</span></a>
        </nav>

        <div className="admin-nav-section">
          <span>Nastavení</span>
          <nav className="admin-nav">
            <a href="/"><Settings size={17} /><span>Web</span></a>
            <button type="button" onClick={logout}><LogOut size={17} /><span>Odhlásit se</span></button>
          </nav>
        </div>

        <div className="admin-sidebar-footer">
          <CircleUserRound size={18} />
          <div><strong>Administrator</strong><small>admin</small></div>
        </div>
      </aside>

      <section className="admin-content">
        <div className="admin-page-header" id="prehled">
          <div>
            <div className="admin-breadcrumb">Číž Barber <span>/</span> Rezervace</div>
            <h1>Termíny</h1>
            <p>Správa dostupnosti, rezervací a klientů na jednom místě.</p>
          </div>
          <a className="admin-primary-button" href="#novy-termin">
            <Plus size={16} /> Nový termín
          </a>
        </div>

        {!hasServiceKey ? (
          <div className="admin-alert error">
            <strong>Chybí serverový klíč</strong>
            <span>Přidej `SUPABASE_SERVICE_ROLE_KEY`, jinak mohou změny při zapnutém RLS selhat.</span>
          </div>
        ) : null}

        {error || message ? (
          <div className={error ? "admin-alert error" : "admin-alert success"}>
            {error ? <SlidersHorizontal size={17} /> : <Check size={17} />}
            <span>{error || message}</span>
          </div>
        ) : null}

        <div className="admin-stats">
          <article>
            <span>Všechny termíny</span>
            <strong>{stats.all}</strong>
            <small><CalendarDays size={14} /> Nadcházející záznamy</small>
          </article>
          <article>
            <span>Volné</span>
            <strong>{stats.available}</strong>
            <small className="positive"><Check size={14} /> Viditelné pro klienty</small>
          </article>
          <article>
            <span>Rezervované</span>
            <strong>{stats.booked}</strong>
            <small><UsersRound size={14} /> Potvrzené rezervace</small>
          </article>
        </div>

        <div className="admin-dashboard-grid">
          <section className="admin-panel admin-schedule-panel" id="terminy">
            <div className="admin-panel-header">
              <div>
                <h2>Přehled termínů</h2>
                <p>{filteredSlots.length} zobrazených položek</p>
              </div>
              <button className="admin-icon-button bordered" type="button" onClick={loadSlots} title="Obnovit">
                <RefreshCw className={isLoading ? "spin" : ""} size={16} />
              </button>
            </div>

            <div className="admin-toolbar">
              <div className="admin-search">
                <Search size={16} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Hledat klienta, službu nebo barbera"
                  aria-label="Hledat termín"
                />
              </div>
              <div className="admin-filter-tabs">
                {([
                  ["all", "Vše", stats.all],
                  ["available", "Volné", stats.available],
                  ["booked", "Rezervované", stats.booked],
                ] as const).map(([value, label, count]) => (
                  <button className={filter === value ? "active" : ""} type="button" onClick={() => setFilter(value)} key={value}>
                    {label} <span>{count}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="admin-table">
              <div className="admin-table-head">
                <span>Datum a čas</span><span>Barber / služba</span><span>Klient</span><span>Stav</span><span />
              </div>

              {isLoading ? (
                <div className="admin-empty"><RefreshCw className="spin" size={22} /><span>Načítám termíny…</span></div>
              ) : filteredSlots.length ? (
                filteredSlots.map((slot) => {
                  const booking = slot.bookings?.[0];
                  const isBooked = Boolean(booking);
                  return (
                    <article className="admin-table-row" key={slot.id}>
                      <div className="admin-date-cell">
                        <span className="admin-date-icon"><CalendarDays size={17} /></span>
                        <div>
                          <strong>{formatDate(slot.starts_at)}</strong>
                          <small><Clock3 size={13} /> {formatTime(slot.starts_at)}–{formatTime(slot.ends_at)}</small>
                        </div>
                      </div>
                      <div>
                        <strong>{slot.barber_name}</strong>
                        <small>{booking?.services?.name || slot.note || "Volný termín"}</small>
                      </div>
                      <div>
                        <strong>{booking?.customer_name || "—"}</strong>
                        <small>{booking?.customer_phone || "Bez klienta"}</small>
                      </div>
                      <div>
                        <button
                          className={isBooked ? "admin-status booked" : slot.is_available ? "admin-status available" : "admin-status hidden"}
                          type="button"
                          disabled={isBooked}
                          onClick={() => toggleSlot(slot)}
                          title={isBooked ? "Rezervovaný termín nelze skrýt" : "Změnit viditelnost"}
                        >
                          <i />
                          {isBooked ? "Rezervováno" : slot.is_available ? "Volný" : "Skrytý"}
                        </button>
                      </div>
                      <div className="admin-row-actions">
                        <button type="button" onClick={() => removeSlot(slot.id)} title="Smazat termín">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="admin-empty">
                  <CalendarDays size={24} />
                  <strong>Žádné termíny</strong>
                  <span>Změň filtr nebo vytvoř nový termín.</span>
                </div>
              )}
            </div>
          </section>

          <form className="admin-panel admin-create-panel" id="novy-termin" onSubmit={createSlot}>
            <div className="admin-panel-header">
              <div><h2>Nový termín</h2><p>Přidá volný čas do rezervace</p></div>
              <span className="admin-panel-icon"><Plus size={18} /></span>
            </div>

            <div className="admin-form-grid">
              <div className="admin-field">
                <label htmlFor="date">Datum</label>
                <input id="date" name="date" type="date" required />
              </div>
              <div className="admin-field">
                <label htmlFor="time">Začátek</label>
                <input id="time" name="time" type="time" required />
              </div>
              <div className="admin-field">
                <label htmlFor="duration_minutes">Délka služby</label>
                <select id="duration_minutes" name="duration_minutes" defaultValue="60">
                  <option value="30">30 minut</option>
                  <option value="45">45 minut</option>
                  <option value="60">60 minut</option>
                  <option value="75">75 minut</option>
                  <option value="90">90 minut</option>
                </select>
              </div>
              <div className="admin-field">
                <label htmlFor="barber_name">Barber</label>
                <input id="barber_name" name="barber_name" defaultValue="Číž" required />
              </div>
              <div className="admin-field full">
                <label htmlFor="note">Interní poznámka <span>volitelné</span></label>
                <textarea id="note" name="note" placeholder="Např. blokace pro stálého klienta" />
              </div>
            </div>

            <div className="admin-form-footer">
              <button className="admin-primary-button" type="submit" disabled={isCreating}>
                {isCreating ? <RefreshCw className="spin" size={16} /> : <Plus size={16} />}
                {isCreating ? "Přidávám…" : "Přidat termín"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
