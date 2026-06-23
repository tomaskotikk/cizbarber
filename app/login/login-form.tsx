"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const login = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form.entries())),
    });

    setIsLoading(false);

    if (!response.ok) {
      const result = await response.json();
      setError(result.error || "Přihlášení se nepodařilo.");
      return;
    }

    router.push(searchParams.get("next") || "/admin");
    router.refresh();
  };

  return (
    <form className="login-card" onSubmit={login}>
      <span className="eyebrow">
        Admin
      </span>
      <h1>Přihlášení</h1>
      <p className="admin-muted">Výchozí přístup je jméno admin a heslo admin.</p>
      <div className="field">
        <label htmlFor="username">Jmeno</label>
        <input id="username" name="username" autoComplete="username" required />
      </div>
      <div className="field">
        <label htmlFor="password">Heslo</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <button className="button" type="submit" disabled={isLoading}>
          {isLoading ? "Kontroluju..." : "Přihlásit"}
      </button>
      <p className="status error">{error}</p>
    </form>
  );
}
