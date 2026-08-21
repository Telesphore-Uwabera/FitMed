import { NextResponse } from "next/server";
import { getPublicStaff } from "@/lib/publicStaff";

export async function GET() {
  try {
    const data = await getPublicStaff();
    return NextResponse.json(
      { success: true, ...data },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Could not load staff.";
    return NextResponse.json({ success: false, error: message, team: [], doctors: [] }, { status: 500 });
  }
}
