"use client";

import { useState, useEffect, ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  LayoutDashboard,
  FileCheck2,
  PlusCircle,
  Activity,
  MapPin,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  Stethoscope,
  Users,
  ShieldCheck,
  Building2,
  Video,
  FileSignature,
  FileText as FileTextIcon,
  DollarSign,
  Lock,
  ChevronRight,
  UserCheck,
  ChevronDown,
  Sparkles,
  Home,
  Check,
  User as UserIcon,
  KeyRound,
  Mail,
  Calendar,
  CalendarCheck,
  CreditCard,
  Clock,
  ExternalLink,
  Sun,
  Moon,
} from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { useTheme } from "@/components/ThemeProvider";

export type DashboardRole = "user" | "doctor" | "admin";

interface NavItem {
  id: string;
  label: string;
  icon: any;
  badge?: string;
}

interface DashboardShellProps {
  role: DashboardRole;
  activeNav: string;
  onNavChange?: (id: string) => void;
  children: ReactNode;
  userProfile: {
    name: string;
    email: string;
    avatarUrl?: string;
    badgeLabel: string;
    subtext?: string;
  };
  quickAction?: {
    label: string;
    onClick: () => void;
    icon: any;
  };
  onSettingsAction?: (action: "profile" | "password" | "settings") => void;
}

const roleConfigs: Record<
  DashboardRole,
  {
    roleTitle: string;
    badgeBg: string;
    badgeBorder: string;
    badgeText: string;
    navItems: NavItem[];
  }
> = {
  user: {
    roleTitle: "Applicant Portal",
    badgeBg: "bg-teal-500/10",
    badgeBorder: "border-teal-500/30",
    badgeText: "text-[#12B8B0]",
    navItems: [
      { id: "overview", label: "Overview", icon: LayoutDashboard },
      { id: "services", label: "All FitMed Services", icon: Sparkles, badge: "7 Available" },
      { id: "request", label: "Request Certificate", icon: PlusCircle, badge: "5,000 FRW" },
      { id: "appointments", label: "My Appointments", icon: Calendar, badge: "Upcoming" },
      { id: "consultation", label: "Doctor Telehealth & Chat", icon: Video, badge: "Live" },
      { id: "certificates", label: "My Certificates", icon: FileCheck2, badge: "1 Active" },
      { id: "history", label: "Assessment History", icon: Activity },
      { id: "referrals", label: "Clinic Referrals", icon: MapPin },
      { id: "settings", label: "Account & Settings", icon: Settings },
    ],
  },
  doctor: {
    roleTitle: "Doctor Workstation",
    badgeBg: "bg-sky-500/10",
    badgeBorder: "border-sky-500/30",
    badgeText: "text-sky-400",
    navItems: [
      { id: "queue",         label: "Applicant Queue",         icon: LayoutDashboard, badge: "Pending" },
      { id: "applications",  label: "All Applications",       icon: ClipboardList,   badge: "Records" },
      { id: "telehealth",   label: "Video Consultation",      icon: Video,           badge: "Live" },
      { id: "appointments", label: "Meetings",  icon: CalendarCheck,   badge: "Upcoming" },
      { id: "reports",      label: "Assessment Reports",      icon: FileTextIcon,        badge: "Stats" },
      { id: "signed",       label: "Issued Certificates",     icon: FileSignature,   badge: "History" },
      { id: "schedule",     label: "My Availability",         icon: Calendar,        badge: "Active" },
      { id: "referrals",    label: "Physical Referrals",      icon: Building2,       badge: "Referrals" },
      { id: "settings",     label: "Profile Settings",        icon: Settings },
    ],
  },
  admin: {
    roleTitle: "Admin Console",
    badgeBg: "bg-amber-500/10",
    badgeBorder: "border-amber-500/30",
    badgeText: "text-amber-400",
    navItems: [
      { id: "overview",   label: "System Analytics",       icon: LayoutDashboard },
      { id: "reports",    label: "Reports & History",       icon: Activity,    badge: "New" },
      { id: "doctors",    label: "Doctor Accounts",         icon: UserCheck,   badge: "Live" },
      { id: "users",      label: "Users Management",        icon: Users,       badge: "Active" },
      { id: "payments",   label: "Payment Transactions",    icon: CreditCard,  badge: "Irembo" },
      { id: "inquiries",  label: "Contact Inquiries",       icon: Mail,        badge: "3 New" },
      { id: "clinics",    label: "Partner Clinic Network",  icon: Building2,   badge: "18 Active" },
      { id: "revenue",    label: "Financials & Revenue",    icon: DollarSign,  badge: "52.4M" },
      { id: "security",   label: "Privacy & activity log",      icon: Lock },
      { id: "settings",   label: "Platform Governance",     icon: Settings },
    ],
  },
};

export default function DashboardShell({
  role,
  activeNav,
  onNavChange,
  children,
  userProfile,
  quickAction,
  onSettingsAction,
}: DashboardShellProps) {
  const { success, info } = useToast();
  const { theme, toggleTheme } = useTheme();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [shellReady, setShellReady] = useState(false);
  const router = useRouter();
  const config = roleConfigs[role];

  useEffect(() => {
    setShellReady(true);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("fitmed_session");
    router.push("/signin");
  };

  const currentNavLabel =
    config.navItems.find((item) => item.id === activeNav)?.label || "Dashboard";

  const profileImageSrc = userProfile.avatarUrl;
  const profileImageClass = "w-full h-full object-cover";

  const emailNotifications: { id: string; subject: string; from: string; date: string; snippet: string; unread: boolean }[] = [];

  if (!shellReady) {
    return <div className={`dashboard-app min-h-screen bg-[#f8fafc] ${theme === "dark" ? "dark" : ""}`} />;
  }

  return (
    <div className={`dashboard-app min-h-screen bg-[#f8fafc] dark:bg-[#071422] flex flex-col lg:flex-row text-slate-800 dark:text-slate-100 antialiased ${theme === "dark" ? "dark" : ""}`}>
      {/* ── MOBILE BACKDROP ── */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ── FIXED SIDEBAR (DESKTOP & MOBILE DRAWER) ── */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#0B2D5C] text-white flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Logo & Header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <Link href="/" className="inline-block focus:outline-none">
              <Image
                src="/logo-4.webp"
                alt="FitMed"
                width={641}
                height={390}
                className="w-36 h-auto object-contain"
                priority
                loading="eager"
              />
            </Link>

            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Card in Sidebar */}
          <div className="p-4 mx-4 my-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white overflow-hidden flex-shrink-0 border border-white/20">
                {profileImageSrc ? (
                  <img
                    src={profileImageSrc}
                    alt={userProfile.name}
                    className={profileImageClass}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-[#12B8B0] to-sky-400 flex items-center justify-center font-black text-slate-900 text-sm">
                    {userProfile.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="overflow-hidden">
                <div className="text-sm font-bold text-white truncate">{userProfile.name}</div>
                <div className="text-[11px] text-slate-400 truncate">{userProfile.email}</div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${config.badgeBg} ${config.badgeBorder} ${config.badgeText}`}
              >
                {role === "admin" && <ShieldCheck className="w-3 h-3" />}
                {role === "doctor" && <Stethoscope className="w-3 h-3" />}
                {role === "user" && <Sparkles className="w-3 h-3" />}
                {userProfile.badgeLabel}
              </span>

              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
          </div>

          {/* Quick Action Button */}
          {quickAction && (
            <div className="px-4 mb-3">
              <button
                onClick={quickAction.onClick}
                className="w-full py-3 px-4 rounded-xl bg-[#12B8B0] hover:bg-[#1dd9d0] text-[#0B2D5C] font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-teal-500/20"
              >
                <quickAction.icon className="w-4 h-4" />
                <span>{quickAction.label}</span>
              </button>
            </div>
          )}

          {/* Navigation Links — Directly activates target view */}
          <div className="px-3 py-2 space-y-1">
            <div className="px-3 pb-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
              {config.roleTitle}
            </div>

            {config.navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (onNavChange) onNavChange(item.id);
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-white text-[#0B2D5C] font-black shadow-md"
                      : "text-slate-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? "text-[#12B8B0]" : "text-slate-400"
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive
                          ? "bg-[#0B2D5C] text-[#12B8B0]"
                          : "bg-white/10 text-slate-300"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/10 space-y-2 bg-[#082247]">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-colors font-medium"
          >
            <ChevronRight className="w-4 h-4 text-[#12B8B0]" />
            <span>Back to Public Homepage</span>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <LogOut className="w-4 h-4 text-rose-400" />
              <span>Sign Out</span>
            </div>
            <span className="text-[10px] text-slate-400">Lock Session</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA (OFFSET FOR FIXED 72-WIDTH SIDEBAR ON LG) ── */}
      <div className="dashboard-main flex-1 lg:pl-72 flex flex-col min-h-screen bg-[#f8fafc] dark:bg-[#071422]">
        {/* ── CLEAN DASHBOARD TOPBAR (STICKY ON TOP) ── */}
        <header className="sticky top-0 z-30 w-full bg-white/95 dark:bg-[#08162c]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm h-[72px]">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 lg:hidden flex-shrink-0"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb / Page Title */}
            <div className="flex items-center gap-2 truncate">
              <span className="text-xs font-semibold text-slate-400 hidden sm:inline truncate">
                {config.roleTitle}
              </span>
              <span className="text-slate-300 hidden sm:inline">/</span>
              <span className="text-sm font-extrabold text-[#0B2D5C] truncate">
                {currentNavLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Search Input */}
            <div className="relative hidden xl:block w-52">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search records..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#0e1c31] border border-slate-200 dark:border-slate-600 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#12B8B0] focus:bg-white dark:focus:bg-[#12253d] transition-all"
              />
            </div>

            {/* Theme toggle — RBAC keeps role fixed; users only switch appearance */}
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => {
                toggleTheme();
                setShowNotifications(false);
                setShowProfileDropdown(false);
              }}
              className="text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-[#0B2D5C] bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 transition-all shadow-xs"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={theme === "dark" ? "Light mode" : "Dark mode"}
            >
              {theme === "dark" ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-[#0B2D5C]" />
              )}
              <span className="hidden sm:inline">{theme === "dark" ? "Light" : "Dark"}</span>
            </button>

            {/* Email & Notification Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowProfileDropdown(false);
                }}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-[#0B2D5C] transition-colors relative"
                aria-label="View notifications & emails"
              >
                <Mail className="w-4 h-4" />
                {emailNotifications.some((em) => em.unread) && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#12B8B0]" />
                )}
              </button>

              {/* Email & Notifications Dropdown Drawer */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-88 sm:w-96 bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 z-50 space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-[#12B8B0]" />
                      <span className="text-xs font-extrabold uppercase tracking-wider text-[#0B2D5C]">
                        Email & Clinical Notifications
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Live Sync
                    </span>
                  </div>

                  <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                    {emailNotifications.length === 0 && (
                      <p className="text-xs text-slate-500 px-1 py-4">No notifications yet.</p>
                    )}
                    {emailNotifications.map((em) => (
                      <div
                        key={em.id}
                        onClick={() => info(em.subject, `From: ${em.from} — ${em.snippet}`)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                          em.unread
                            ? "bg-teal-50/60 border-teal-200 hover:bg-teal-50"
                            : "bg-slate-50 border-slate-200 hover:bg-slate-100/70"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-extrabold text-[#0B2D5C] truncate max-w-[200px]">
                            {em.from}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">{em.date}</span>
                        </div>
                        <div className="text-xs font-bold text-slate-800 leading-tight mb-1">
                          {em.subject}
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                          {em.snippet}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                    <span>Encrypted Healthcare Delivery</span>
                    <button
                      onClick={() => {
                        success("Notifications Read", "Marked all system emails and clinical notices as read.");
                        setShowNotifications(false);
                      }}
                      className="text-[#12B8B0] font-bold hover:underline"
                    >
                      Mark All as Read
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── TOP RIGHT PROFILE BUTTON WITH DROPDOWN ── */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowProfileDropdown(!showProfileDropdown);
                  setShowNotifications(false);
                }}
                className="flex items-center gap-2.5 pl-2 py-1 pr-2 rounded-xl border border-transparent hover:border-slate-200 hover:bg-slate-50 transition-all focus:outline-none"
              >
                <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 text-white flex items-center justify-center font-black text-xs shadow-sm overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-600">
                  {profileImageSrc ? (
                    <img
                      src={profileImageSrc}
                      alt={userProfile.name}
                      className={profileImageClass}
                    />
                  ) : (
                    <span className="bg-[#0B2D5C] w-full h-full flex items-center justify-center">
                      {userProfile.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-[#0B2D5C] leading-tight">
                    {userProfile.name}
                  </div>
                  <div className="text-[10px] text-slate-400 capitalize">
                    {role === "user" ? "Applicant" : role}
                  </div>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showProfileDropdown ? "rotate-180" : ""}`} />
              </button>

              {/* ── TOP RIGHT PROFILE DROPDOWN MENU ── */}
              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-3xl p-3 shadow-2xl border border-slate-200 z-50 space-y-1 animate-in fade-in">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 mb-2 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 text-white flex items-center justify-center font-black text-sm shadow-sm overflow-hidden flex-shrink-0 border border-slate-200">
                      {profileImageSrc ? (
                        <img
                          src={profileImageSrc}
                          alt={userProfile.name}
                          className={profileImageClass}
                        />
                      ) : (
                        <span className="bg-[#0B2D5C] w-full h-full flex items-center justify-center">
                          {userProfile.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold text-[#0B2D5C] truncate">{userProfile.name}</div>
                      <div className="text-[11px] text-slate-400 truncate">{userProfile.email}</div>
                      <span className="mt-1 inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                        {userProfile.badgeLabel}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onSettingsAction?.("profile");
                      if (onNavChange) onNavChange("settings");
                      setShowProfileDropdown(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-[#12B8B0]" />
                    <span>View Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      onSettingsAction?.("password");
                      if (onNavChange) onNavChange("settings");
                      setShowProfileDropdown(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <KeyRound className="w-4 h-4 text-sky-600" />
                    <span>Reset Password</span>
                  </button>

                  <button
                    onClick={() => {
                      onSettingsAction?.("settings");
                      if (onNavChange) onNavChange("settings");
                      setShowProfileDropdown(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-amber-600" />
                    <span>Account Settings</span>
                  </button>

                  <button
                    onClick={() => {
                      toggleTheme();
                      setShowProfileDropdown(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    {theme === "dark" ? (
                      <Sun className="w-4 h-4 text-amber-500" />
                    ) : (
                      <Moon className="w-4 h-4 text-[#0B2D5C]" />
                    )}
                    <span>{theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}</span>
                  </button>

                  <div className="border-t border-slate-100 my-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── DASHBOARD BODY ── */}
        <main className="p-6 sm:p-8 flex-1 max-w-[1600px] w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
