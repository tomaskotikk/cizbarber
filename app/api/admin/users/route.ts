import { NextResponse } from "next/server";
import { getCurrentUser, hashPassword } from "@/utils/auth";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser?.can_invite) {
    return NextResponse.json({ error: "Jen majitel může přidávat barbery." }, { status: 403 });
  }

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
  const { data, error } = await supabase
    .from("users")
    .insert({
      full_name: fullName,
      email,
      phone: phone || null,
      profile_image_url: profileImageUrl || null,
      password_hash: hashPassword(password),
      role: "barber",
      can_invite: false,
      is_active: true,
    })
    .select("id,full_name,email,phone,profile_image_url,role,can_invite,is_active")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ user: data });
}
