import { NextResponse } from "next/server";
import { applyNoStoreHeaders, clearAuthCookies } from "@/lib/authCookie";

export async function POST() {
  const res = NextResponse.json({ success: true });
  clearAuthCookies(res);
  return applyNoStoreHeaders(res);
}
