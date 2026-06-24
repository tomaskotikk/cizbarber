"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SetupForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/setup", { cache: "no-store" })
      .then((response) => response.json())
      .then((result) => setIsAvailable(Boolean(result.isSetupAvailable)))
      .catch(() => setIsAvailable(false));
  }, []);

  const setup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form.entries())),
    });
    const result = await response.json();
    setIsLoading(false);

    if (!response.ok) {
      setError(result.error || "Účet se nepodařilo vytvořit.");
      return;
    }

    router.push("/admin");
    router.refresh();
  };

  if (isAvailable === false) {
    return (
      <div className="login-card">
        <span className="eyebrow">Setup</span>
        <h1>První účet už existuje.</h1>
        <p className="admin-muted">Další barbery může přidat majitel v administraci.</p>
        <a className="button" href="/login">Přejít na přihlášení</a>
      </div>
    );
  }

  return (
    <form className="login-card" onSubmit={setup}>
      <span className="eyebrow">První účet</span>
      <h1>Založit majitele</h1>
      <p className="admin-muted">Tento formulář funguje jen jednou. Další barbery potom přidáš v administraci.</p>
      <div className="field">
        <label htmlFor="full_name">Jméno barbera</label>
        <input id="full_name" name="full_name" autoComplete="name" required />
      </div>
      <div className="form-row">
        <div className="field">
          <label htmlFor="email">E-mail</label>
          <input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="field">
          <label htmlFor="phone">Telefon</label>
          <input id="phone" name="phone" autoComplete="tel" />
        </div>
      </div>
      <div className="field">
        <label htmlFor="profile_image_url">Profilovka URL</label>
        <input id="profile_image_url" name="profile_image_url" type="url" placeholder="https://..." />
      </div>
      <div className="field">
        <label htmlFor="password">Heslo</label>
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      <button className="button" type="submit" disabled={isLoading || isAvailable === null}>
        {isLoading ? "Vytvářím..." : "Vytvořit účet"}
      </button>
      <p className="status error">{error}</p>
    </form>
  );
}
