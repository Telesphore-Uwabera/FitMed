import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Notification from "@/models/Notification";
import { COOKIE_NAME, verifySession } from "@/lib/authCookie";

export async function GET(request: NextRequest) {
  const session = await verifySession(request.cookies.get(COOKIE_NAME)?.value);
  if (!session?.email) {
    return NextResponse.json({ success: false, error: "Please sign in first." }, { status: 401 });
  }
  await connectToDatabase();
  const notifications = await Notification.find({ email: session.email.toLowerCase() })
    .sort({ createdAt: -1 })
    .limit(40)
    .lean();
  return NextResponse.json({
    success: true,
    notifications: notifications.map((n) => ({
      id: String(n._id),
      subject: n.subject,
      from: "FitMed",
      date: n.createdAt ? new Date(n.createdAt).toLocaleString() : "",
      snippet: n.snippet,
      href: n.href || "",
      unread: n.unread !== false,
    })),
  });
}

export async function PATCH(request: NextRequest) {
  const session = await verifySession(request.cookies.get(COOKIE_NAME)?.value);
  if (!session?.email) {
    return NextResponse.json({ success: false, error: "Please sign in first." }, { status: 401 });
  }
  await connectToDatabase();
  await Notification.updateMany({ email: session.email.toLowerCase(), unread: true }, { $set: { unread: false } });
  return NextResponse.json({ success: true });
}
