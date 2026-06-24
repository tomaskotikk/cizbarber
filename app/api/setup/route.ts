import { NextResponse } from "next/server";
import { hashPassword, setAuthCookie } from "@/utils/auth";
import { createAdminClient } from "@/utils/supabase/admin";

export async function GET() {
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ isSetupAvailable: (count ?? 0) === 0 });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const fullName = String(body?.full_name || "").trim();
  const email = String(body?.email || "").trim().toLowerCase();
  const phone = String(body?.phone || "").trim();
  const profileImageUrl = String(body?.profile_image_url || "").trim();
  const password = String(body?.password || "");

  if (!fullName || !email || !password) {
    return NextResponse.json({ error: "Vyplň jméno, e-mail a heslo." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Heslo musí mít aspoň 8 znaků." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { count, error: countError } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true });

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  if ((count ?? 0) > 0) {
    return NextResponse.json({ error: "První účet už existuje. Další barbery přidá majitel v administraci." }, { status: 403 });
  }

  const { data: user, error } = await supabase
    .from("users")
    .insert({
      full_name: fullName,
      email,
      phone: phone || null,
      profile_image_url: profileImageUrl || null,
      password_hash: hashPassword(password),
      role: "owner",
      can_invite: true,
      is_active: true,
    })
    .select("id,full_name")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase
    .from("availability_slots")
    .update({ barber_user_id: user.id, barber_name: user.full_name })
    .is("barber_user_id", null);

  const response = NextResponse.json({ ok: true });
  setAuthCookie(response, user.id);
  return response;
}
