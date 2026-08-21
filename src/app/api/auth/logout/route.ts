import { NextResponse } from "next/server";
import { COOKIE_NAME, clearAuthCookieOptions } from "@/lib/authCookie";

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(COOKIE_NAME, "", clearAuthCookieOptions());
  return res;
}
