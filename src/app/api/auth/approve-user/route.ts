import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { approveApplicantAccount } from "@/lib/approveApplicant";
import User from "@/models/User";
import { COOKIE_NAME, verifySession } from "@/lib/authCookie";
import { isAdminRole } from "@/lib/roles";

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession(request.cookies.get(COOKIE_NAME)?.value);
    if (!session) {
      return NextResponse.json({ success: false, error: "Please sign in first." }, { status: 401 });
    }

    await connectToDatabase();
    const actor = await User.findOne({ email: session.email });
    if (!isAdminRole(session.role) && !isAdminRole(actor?.role)) {
      return NextResponse.json({ success: false, error: "Administrator access required." }, { status: 403 });
    }

    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const nameHint = String(body.name || "").trim();
    if (!email) {
      return NextResponse.json({ success: false, error: "Applicant email required." }, { status: 400 });
    }

    const result = await approveApplicantAccount(email, nameHint);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.status });
    }
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Approval failed.";
    console.error("Approve user error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
