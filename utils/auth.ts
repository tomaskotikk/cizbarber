import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { createAdminClient } from "@/utils/supabase/admin";

const COOKIE_NAME = "ciz_user_id";

export type AdminUser = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  profile_image_url: string | null;
  role: "owner" | "barber";
  can_invite: boolean;
  is_active: boolean;
};

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;

  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function getCurrentUser(): Promise<AdminUser | null> {
  const userId = (await cookies()).get(COOKIE_NAME)?.value;
  if (!userId) return null;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("users")
    .select("id,full_name,email,phone,profile_image_url,role,can_invite,is_active")
    .eq("id", userId)
    .eq("is_active", true)
    .single();

  return data as AdminUser | null;
}

export function setAuthCookie(response: NextResponse, userId: string) {
  response.cookies.set(COOKIE_NAME, userId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
