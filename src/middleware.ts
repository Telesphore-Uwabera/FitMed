import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, verifySession } from "@/lib/authCookie";
import { isAdminRole, normalizeRole } from "@/lib/roles";

function signInUrl(request: NextRequest, reason?: string) {
  const url = request.nextUrl.clone();
  url.pathname = "/signin";
  url.search = "";
  if (reason) url.searchParams.set(reason, "1");
  url.searchParams.set("next", request.nextUrl.pathname);
  return url;
}

function unauthorizedJson(message = "Please sign in first.", status = 401) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await verifySession(request.cookies.get(COOKIE_NAME)?.value);

  const isDashboard = pathname.startsWith("/dashboard");
  const isMeet = pathname.startsWith("/meet/");
  const isAdminApi = pathname.startsWith("/api/admin");
  const isStaffApi =
    pathname.startsWith("/api/certificates") ||
    pathname.startsWith("/api/appointments") ||
    pathname.startsWith("/api/chat") ||
    pathname.startsWith("/api/upload") ||
    pathname.startsWith("/api/telehealth") ||
    pathname.startsWith("/api/doctors") ||
    pathname.startsWith("/api/clinics") ||
    pathname.startsWith("/api/schedules") ||
    pathname.startsWith("/api/referrals") ||
    pathname.startsWith("/api/payments") ||
    pathname.startsWith("/api/notifications") ||
    pathname === "/api/auth/me";
  const isAdminContactRead = pathname.startsWith("/api/contact") && request.method !== "POST";

  if (!isDashboard && !isMeet && !isAdminApi && !isStaffApi && !isAdminContactRead) {
    return NextResponse.next();
  }

  if (!session) {
    if (isDashboard || isMeet) {
      return NextResponse.redirect(signInUrl(request));
    }
    return unauthorizedJson();
  }

  if (pathname.startsWith("/dashboard/admin") && !isAdminRole(session.role)) {
    return NextResponse.redirect(signInUrl(request, "unauthorized"));
  }
  if (pathname.startsWith("/dashboard/doctor") && normalizeRole(session.role) !== "doctor") {
    return NextResponse.redirect(signInUrl(request, "unauthorized"));
  }
  if (pathname.startsWith("/dashboard/user") && normalizeRole(session.role) !== "user") {
    return NextResponse.redirect(signInUrl(request, "unauthorized"));
  }
  if ((isAdminApi || isAdminContactRead) && !isAdminRole(session.role)) {
    const doctorMayListStaff =
      normalizeRole(session.role) === "doctor" && request.method === "GET" && pathname.startsWith("/api/admin/staff");
    if (!doctorMayListStaff) {
      return unauthorizedJson("Administrator access required.", 403);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/meet/:path*",
    "/api/admin/:path*",
    "/api/auth/approve-user",
    "/api/auth/me",
    "/api/certificates",
    "/api/certificates/:path*",
    "/api/appointments",
    "/api/appointments/:path*",
    "/api/chat",
    "/api/chat/:path*",
    "/api/upload",
    "/api/upload/:path*",
    "/api/telehealth/:path*",
    "/api/doctors",
    "/api/doctors/:path*",
    "/api/clinics",
    "/api/clinics/:path*",
    "/api/schedules",
    "/api/schedules/:path*",
    "/api/referrals",
    "/api/referrals/:path*",
    "/api/payments",
    "/api/payments/:path*",
    "/api/notifications",
    "/api/notifications/:path*",
    "/api/contact",
    "/api/contact/:path*",
  ],
};
