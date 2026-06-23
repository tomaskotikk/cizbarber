"use client";

import { FormEvent, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Service = {
  id: string;
  name: string;
  description: string;
  price_czk: number;
  duration_minutes: number;
};

type Slot = {
  id: string;
  starts_at: string;
  ends_at: string;
  barber_name: string;
};

type Step = "service" | "barber" | "time" | "details" | "done";

const stepOrder: Step[] = ["service", "barber", "time", "details"];
const stepLabels = ["Služba", "Barber", "Čas", "Potvrzení"];

const formatDayKey = (value: string) => {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const formatDay = (key: string) =>
  new Intl.DateTimeFormat("cs-CZ", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(`${key}T12:00:00`));

const formatTime = (value: string) =>
  new Intl.DateTimeFormat("cs-CZ", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const monthLabel = (date: Date) =>
  new Intl.DateTimeFormat("cs-CZ", {
    month: "long",
    year: "numeric",
  }).format(date);

const dateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const createCalendarDays = (month: Date) => {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const calendarStart = new Date(month.getFullYear(), month.getMonth(), 1 - mondayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(calendarStart);
    day.setDate(calendarStart.getDate() + index);
    return day;
  });
};

export default function BookingFlow({
  initialServices,
  initialSlots,
}: {
  initialServices: Service[];
  initialSlots: Slot[];
}) {
  const [step, setStep] = useState<Step>("service");
  const [services] = useState(initialServices);
  const [slots, setSlots] = useState(initialSlots);
  const [serviceId, setServiceId] = useState("");
  const [barber, setBarber] = useState("");
  const [slotId, setSlotId] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const service = services.find((item) => item.id === serviceId);
  const slot = slots.find((item) => item.id === slotId);
  const barbers = useMemo(
    () => Array.from(new Set(slots.map((item) => item.barber_name))).filter(Boolean),
    [slots],
  );

  const relevantSlots = useMemo(
    () => slots.filter((item) => !barber || item.barber_name === barber),
    [slots, barber],
  );

  const slotsByDay = useMemo(() => {
    const grouped = new Map<string, Slot[]>();
    relevantSlots.forEach((item) => {
      const key = formatDayKey(item.starts_at);
      grouped.set(key, [...(grouped.get(key) ?? []), item]);
    });
    return grouped;
  }, [relevantSlots]);

  const calendarDays = useMemo(() => createCalendarDays(visibleMonth), [visibleMonth]);

  const daySlots = useMemo(
    () => (slotsByDay.get(selectedDay) ?? []).sort((a, b) => a.starts_at.localeCompare(b.starts_at)),
    [slotsByDay, selectedDay],
  );

  const currentIndex = stepOrder.indexOf(step);
  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);
  const canGoToPreviousMonth = visibleMonth > currentMonth;

  const selectService = (id: string) => {
    setServiceId(id);
    setStep("barber");
  };

  const selectBarber = (name: string) => {
    setBarber(name);
    setSlotId("");
    const available = slots.filter((item) => item.barber_name === name);
    const firstAvailable = available[0];
    setSelectedDay("");
    if (firstAvailable) {
      const firstDate = new Date(firstAvailable.starts_at);
      setVisibleMonth(new Date(firstDate.getFullYear(), firstDate.getMonth(), 1));
    }
    setStep("time");
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const form = new FormData(event.currentTarget);
    const payload = {
      ...Object.fromEntries(form.entries()),
      service_id: serviceId,
      slot_id: slotId,
    };

    const response = await fetch("/api/bookings", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
    const result = await response.json();
    setIsSubmitting(false);

    if (!response.ok) {
      setError(result.error || "Rezervace se nepodařila dokončit.");
      return;
    }

    setSlots((current) => current.filter((item) => item.id !== slotId));
    setStep("done");
  };

  const goBack = () => {
    if (step === "barber") setStep("service");
    if (step === "time") setStep("barber");
    if (step === "details") setStep("time");
  };

  return (
    <main className="booking-page">
      <header className="booking-topbar">
        <button
          className="round-control"
          onClick={step === "service" ? () => window.history.back() : goBack}
          type="button"
        >
          ←
        </button>
        <a className="booking-brand" href="/">
          Číž Barber
        </a>
        <a className="round-control" href="/" aria-label="Zavřít">
          ×
        </a>
      </header>

      <div className="booking-progress">
        {stepLabels.map((label, index) => (
          <div className={index <= currentIndex ? "progress-item active" : "progress-item"} key={label}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            {label}
          </div>
        ))}
      </div>

      <div className="booking-workspace">
        <section className="booking-main">
          <AnimatePresence mode="wait">
            {step === "service" ? (
              <motion.div
                className="booking-step"
                key="service"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              >
                <span className="section-kicker">Krok 1 ze 4</span>
                <h1>Vyber službu</h1>
                <div className="choice-list">
                  {services.map((item) => (
                    <button className="choice-card" type="button" onClick={() => selectService(item.id)} key={item.id}>
                      <div>
                        <h2>{item.name}</h2>
                        <span>{item.duration_minutes} min</span>
                        <p>{item.description}</p>
                      </div>
                      <strong>{item.price_czk} Kč</strong>
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : null}

            {step === "barber" ? (
              <motion.div
                className="booking-step"
                key="barber"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              >
                <span className="section-kicker">Krok 2 ze 4</span>
                <h1>Vyber barbera</h1>
                <div className="barber-grid">
                  {barbers.length ? (
                    barbers.map((name, index) => (
                      <button className="barber-choice" type="button" onClick={() => selectBarber(name)} key={name}>
                        <span
                          className="barber-avatar"
                          style={{
                            backgroundImage: `url(${heroPhotosForBarbers[index % heroPhotosForBarbers.length]})`,
                          }}
                        />
                        <span>
                          <strong>{name}</strong>
                          <small>Nejbližší dostupný termín</small>
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="empty-state">Nejdřív v adminu vypiš volné termíny pro barbery.</div>
                  )}
                </div>
              </motion.div>
            ) : null}

            {step === "time" ? (
              <motion.div
                className="booking-step"
                key="time"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              >
                <span className="section-kicker">Krok 3 ze 4</span>
                <h1>Vyber den a čas</h1>
                <div className="calendar-shell">
                  <div className="calendar-toolbar">
                    <div>
                      <span>Dostupnost</span>
                      <strong>{monthLabel(visibleMonth)}</strong>
                    </div>
                    <div className="calendar-navigation">
                      <button
                        type="button"
                        aria-label="Předchozí měsíc"
                        disabled={!canGoToPreviousMonth}
                        onClick={() => {
                          setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1));
                          setSelectedDay("");
                          setSlotId("");
                        }}
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        aria-label="Další měsíc"
                        onClick={() => {
                          setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1));
                          setSelectedDay("");
                          setSlotId("");
                        }}
                      >
                        →
                      </button>
                    </div>
                  </div>

                  <div className="calendar-legend">
                    <span><i className="available" /> Volný termín</span>
                    <span><i className="unavailable" /> Bez termínu</span>
                  </div>

                  <div className="calendar-weekdays" aria-hidden="true">
                    {["Po", "Út", "St", "Čt", "Pá", "So", "Ne"].map((day) => <span key={day}>{day}</span>)}
                  </div>

                  <div className="calendar-grid">
                    {calendarDays.map((day) => {
                      const key = dateKey(day);
                      const availableCount = slotsByDay.get(key)?.length ?? 0;
                      const isCurrentMonth = day.getMonth() === visibleMonth.getMonth();
                      const isSelected = selectedDay === key;
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const isPast = day < today;
                      const isAvailable = isCurrentMonth && !isPast && availableCount > 0;

                      return (
                        <button
                          className={[
                            "calendar-day",
                            !isCurrentMonth ? "outside" : "",
                            isPast ? "past" : "",
                            isAvailable ? "available" : "unavailable",
                            isSelected ? "selected" : "",
                          ].filter(Boolean).join(" ")}
                          type="button"
                          disabled={!isAvailable}
                          onClick={() => {
                            setSelectedDay(key);
                            setSlotId("");
                          }}
                          key={key}
                        >
                          <span>{day.getDate()}</span>
                          {isAvailable ? <small>{availableCount} {availableCount === 1 ? "čas" : "časy"}</small> : null}
                        </button>
                      );
                    })}
                  </div>

                  <AnimatePresence mode="wait">
                    {selectedDay && daySlots.length ? (
                      <motion.div
                        className="calendar-times"
                        key={selectedDay}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <div className="calendar-times-heading">
                          <div>
                            <span>Volné časy</span>
                            <strong>{formatDay(selectedDay)}</strong>
                          </div>
                          <small>Vyber jeden termín</small>
                        </div>
                        <div className="time-grid">
                          {daySlots.map((item) => (
                            <button
                              className={slotId === item.id ? "time-button active" : "time-button"}
                              type="button"
                              onClick={() => setSlotId(item.id)}
                              key={item.id}
                            >
                              {formatTime(item.starts_at)}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
                <button className="button booking-continue" type="button" disabled={!slotId} onClick={() => setStep("details")}>
                  Pokračovat
                </button>
              </motion.div>
            ) : null}

            {step === "details" ? (
              <motion.form
                className="booking-step details-form"
                onSubmit={submit}
                key="details"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              >
                <span className="section-kicker">Krok 4 ze 4</span>
                <h1>Kontaktní údaje</h1>
                <div className="form-row">
                  <div className="field">
                    <label htmlFor="customer_name">Jméno</label>
                    <input id="customer_name" name="customer_name" required />
                  </div>
                  <div className="field">
                    <label htmlFor="customer_phone">Telefon</label>
                    <input id="customer_phone" name="customer_phone" required />
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="customer_email">E-mail</label>
                  <input id="customer_email" name="customer_email" type="email" />
                </div>
                <div className="field">
                  <label htmlFor="note">Poznámka</label>
                  <textarea id="note" name="note" />
                </div>
                <button className="button booking-continue" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Potvrzuji..." : "Potvrdit rezervaci"}
                </button>
                <p className="status error">{error}</p>
              </motion.form>
            ) : null}

            {step === "done" ? (
              <motion.div
                className="booking-step done-step"
                key="done"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              >
                <span className="done-mark">Hotovo</span>
                <h1>Termín je rezervovaný.</h1>
                <p>Těšíme se na tebe. Kdyby bylo potřeba něco změnit, zavolej nám.</p>
                <a className="button" href="/">
                  Zpět na web
                </a>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </section>

        <aside className="booking-summary">
          <div className="summary-brand">
            <span>CŽ</span>
            <div>
              <strong>Číž Barber</strong>
              <small>Zlín</small>
            </div>
          </div>
          <div className="summary-lines">
            <div>
              <span>Služba</span>
              <strong>{service?.name || "Zatím nevybráno"}</strong>
            </div>
            <div>
              <span>Barber</span>
              <strong>{barber || "Zatím nevybráno"}</strong>
            </div>
            <div>
              <span>Termín</span>
              <strong>{slot ? `${formatDay(formatDayKey(slot.starts_at))}, ${formatTime(slot.starts_at)}` : "Zatím nevybráno"}</strong>
            </div>
          </div>
          <div className="summary-total">
            <span>Celkem</span>
            <strong>{service ? `${service.price_czk} Kč` : "—"}</strong>
          </div>
        </aside>
      </div>
    </main>
  );
}

const heroPhotosForBarbers = [
  "https://images.unsplash.com/photo-1599351431613-18ef1fdd27e1?auto=format&fit=crop&w=300&q=82",
  "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=300&q=82",
  "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=300&q=82",
];
