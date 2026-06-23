# Číž Barber

Moderní Next.js web pro barber shop s vlastním rezervačním systémem přes Supabase.

## Spuštění

```bash
npm install
npm run dev
```

Web bezi na `http://localhost:3000`.

## Supabase

1. V Supabase SQL editoru pusť `supabase/schema.sql`.
2. V `.env.local` doplň `SUPABASE_SERVICE_ROLE_KEY`, pokud chceš admin správu slotů s RLS.
3. Veřejná rezervace používá `NEXT_PUBLIC_SUPABASE_URL` a `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

## Admin

Admin panel je na `/admin`.

Výchozí login:

```txt
jméno: admin
heslo: admin
```

Po přihlášení můžeš přidávat volné časy, skrývat je a mazat. Obsazené termíny se v adminu zobrazí s kontaktem zákazníka a na webu už se nenabízí.
