import { NextResponse } from "next/server";
import { setAuthCookie, verifyPassword } from "@/utils/auth";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = String(body?.email || "").trim().toLowerCase();
  const password = String(body?.password || "");

  if (!email || !password) {
    return NextResponse.json({ error: "Vyplň e-mail a heslo." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: user, error } = await supabase
    .from("users")
    .select("id,password_hash,is_active")
    .eq("email", email)
    .single();

  if (error || !user?.is_active || !verifyPassword(password, user.password_hash)) {
    return NextResponse.json({ error: "Špatný e-mail nebo heslo." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  setAuthCookie(response, user.id);

  return response;
}
