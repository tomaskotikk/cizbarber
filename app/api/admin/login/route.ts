import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (body?.username !== "admin" || body?.password !== "admin") {
    return NextResponse.json({ error: "Špatné jméno nebo heslo." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("ciz_admin", "ok", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return response;
}
