import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createAdminClient, hasAdminServiceKey } from "@/utils/supabase/admin";

const isAdmin = async () => (await cookies()).get("ciz_admin")?.value === "ok";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Nepřihlášeno." }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("availability_slots")
    .select("*, bookings(*, services(name,price_czk,duration_minutes))")
    .gte("starts_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order("starts_at");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ slots: data, hasAdminServiceKey });
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Nepřihlášeno." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  if (!body?.date || !body?.time) {
    return NextResponse.json({ error: "Vyber datum a čas." }, { status: 400 });
  }

  const startsAt = new Date(`${body.date}T${body.time}:00`);
  const duration = Number(body.duration_minutes || 60);
  const endsAt = new Date(startsAt.getTime() + duration * 60 * 1000);

  if (Number.isNaN(startsAt.getTime())) {
    return NextResponse.json({ error: "Neplatný datum nebo čas." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("availability_slots")
    .insert({
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      barber_name: String(body.barber_name || "Číž").trim(),
      note: String(body.note || "").trim() || null,
      is_available: true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ slot: data });
}

export async function PATCH(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Nepřihlášeno." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  if (!body?.id) {
    return NextResponse.json({ error: "Chybí ID termínu." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("availability_slots")
    .update({ is_available: Boolean(body.is_available) })
    .eq("id", body.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Nepřihlášeno." }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Chybí ID termínu." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("availability_slots").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
