import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

const required = ["slot_id", "service_id", "customer_name", "customer_phone"];

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body || required.some((key) => !String(body[key] ?? "").trim())) {
    return NextResponse.json({ error: "Vyplň prosím službu, termín, jméno a telefon." }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: slot, error: slotError } = await supabase
    .from("availability_slots")
    .select("id,is_available")
    .eq("id", body.slot_id)
    .single();

  if (slotError || !slot?.is_available) {
    return NextResponse.json({ error: "Tenhle termín už není volný." }, { status: 409 });
  }

  const { error: bookingError } = await supabase.from("bookings").insert({
    slot_id: body.slot_id,
    service_id: body.service_id,
    customer_name: String(body.customer_name).trim(),
    customer_phone: String(body.customer_phone).trim(),
    customer_email: String(body.customer_email || "").trim() || null,
    note: String(body.note || "").trim() || null,
    status: "confirmed",
  });

  if (bookingError) {
    return NextResponse.json({ error: bookingError.message }, { status: 500 });
  }

  const { error: updateError } = await supabase
    .from("availability_slots")
    .update({ is_available: false })
    .eq("id", body.slot_id)
    .eq("is_available", true);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
