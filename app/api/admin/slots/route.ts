import { NextResponse } from "next/server";
import { getCurrentUser } from "@/utils/auth";
import { createAdminClient, hasAdminServiceKey } from "@/utils/supabase/admin";

const isAdmin = async () => Boolean(await getCurrentUser());

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Nepřihlášeno." }, { status: 401 });
  }

  const supabase = createAdminClient();
  const [slotsResult, barbersResult, user] = await Promise.all([
    supabase
    .from("availability_slots")
      .select("*, users:barber_user_id(id,full_name,email,phone,profile_image_url), bookings(*, services(name,price_czk,duration_minutes))")
    .gte("starts_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order("starts_at"),
    supabase
      .from("users")
      .select("id,full_name,email,phone,profile_image_url,role,can_invite,is_active")
      .eq("is_active", true)
      .order("created_at"),
    getCurrentUser(),
  ]);

  if (slotsResult.error) {
    return NextResponse.json({ error: slotsResult.error.message }, { status: 500 });
  }

  if (barbersResult.error) {
    return NextResponse.json({ error: barbersResult.error.message }, { status: 500 });
  }

  const slots = (slotsResult.data ?? []).map((slot) => ({
    ...slot,
    bookings: slot.bookings ? (Array.isArray(slot.bookings) ? slot.bookings : [slot.bookings]) : [],
  }));

  return NextResponse.json({ slots, barbers: barbersResult.data, user, hasAdminServiceKey });
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
  const barberUserId = String(body.barber_user_id || "").trim();
  const { data: barber, error: barberError } = await supabase
    .from("users")
    .select("id,full_name")
    .eq("id", barberUserId)
    .eq("is_active", true)
    .single();

  if (barberError || !barber) {
    return NextResponse.json({ error: "Vyber barbera." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("availability_slots")
    .insert({
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      barber_user_id: barber.id,
      barber_name: barber.full_name,
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
