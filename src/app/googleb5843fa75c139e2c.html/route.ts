import { NextResponse } from "next/server";

const BODY = "google-site-verification: googleb5843fa75c139e2c.html";

export function GET() {
  return new NextResponse(BODY, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
