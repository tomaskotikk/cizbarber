"use client";

import { FormEvent, useEffect, useState } from "react";
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

const formatFull = (value: string) =>
  new Intl.DateTimeFormat("cs-CZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

export default function AdminPanel() {
  const router = useRouter();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [hasServiceKey, setHasServiceKey] = useState(true);

  const loadSlots = async () => {
    const response = await fetch("/api/admin/slots", { cache: "no-store" });
    const result = await response.json();

    if (!response.ok) {
      setError(result.error || "Termíny se nepodařilo načíst.");
      return;
    }

    setSlots(result.slots || []);
    setHasServiceKey(Boolean(result.hasAdminServiceKey));
  };

  useEffect(() => {
    loadSlots();
  }, []);

  const createSlot = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setError("");

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form.entries())),
    });
    const result = await response.json();

    if (!response.ok) {
      setError(result.error || "Termín se nepodařilo vytvořit.");
      return;
    }

    (event.target as HTMLFormElement).reset();
    setMessage("Termín je vypsaný.");
    await loadSlots();
  };

  const removeSlot = async (id: string) => {
    setMessage("");
    setError("");
    const response = await fetch(`/api/admin/slots?id=${id}`, { method: "DELETE" });
    const result = await response.json();

    if (!response.ok) {
      setError(result.error || "Termín se nepodařilo smazat.");
      return;
    }

    setMessage("Termín je smazaný.");
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
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <span className="eyebrow">Cíž Barber</span>
          <h1>Admin termíny</h1>
        </div>
        <div className="admin-actions">
          <a className="button ghost" href="/">
            Web
          </a>
          <button className="button secondary" onClick={logout} type="button">
            Odhlásit
          </button>
        </div>
      </header>

      {!hasServiceKey ? (
        <p className="status error">
          Chybí SUPABASE_SERVICE_ROLE_KEY. Admin změny můžou selhat, pokud máš v Supabase zapnuté RLS.
        </p>
      ) : null}

      <div className="admin-layout">
        <form className="admin-card" onSubmit={createSlot}>
          <h2>Nový volný čas</h2>
          <div className="field">
            <label htmlFor="date">Datum</label>
            <input id="date" name="date" type="date" required />
          </div>
          <div className="field">
            <label htmlFor="time">Cas</label>
            <input id="time" name="time" type="time" required />
          </div>
          <div className="field">
            <label htmlFor="duration_minutes">Délka</label>
            <select id="duration_minutes" name="duration_minutes" defaultValue="60">
              <option value="30">30 minut</option>
              <option value="45">45 minut</option>
              <option value="60">60 minut</option>
              <option value="75">75 minut</option>
              <option value="90">90 minut</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="barber_name">Barber</label>
            <input id="barber_name" name="barber_name" defaultValue="Cíž" required />
          </div>
          <div className="field">
            <label htmlFor="note">Interní poznámka</label>
            <textarea id="note" name="note" />
          </div>
          <button className="button" type="submit">
            Přidat termín
          </button>
          <p className={error ? "status error" : "status"}>{error || message}</p>
        </form>

        <section className="admin-card">
          <h2>Vypsané termíny</h2>
          <p className="admin-muted">Obsazené termíny zůstávají vidět tady, ale zákazníkům se nenabízí.</p>
          <div className="slot-list">
            {slots.map((slot) => {
              const booking = slot.bookings?.[0];
              return (
                <article className="slot" key={slot.id}>
                  <div>
                    <strong>{formatFull(slot.starts_at)}</strong>
                    <span>{slot.barber_name}</span>
                    {booking ? (
                      <p className="admin-muted">
                        {booking.customer_name}, {booking.customer_phone}
                        {booking.services?.name ? ` - ${booking.services.name}` : ""}
                      </p>
                    ) : slot.note ? (
                      <p className="admin-muted">{slot.note}</p>
                    ) : null}
                  </div>
                  <div className="admin-actions">
                    <button className={slot.is_available ? "pill" : "pill busy"} onClick={() => toggleSlot(slot)} type="button">
                      {slot.is_available ? "Volný" : "Skrytý"}
                    </button>
                    <button className="button ghost" onClick={() => removeSlot(slot.id)} type="button" title="Smazat">
                      Smazat
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
