"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import DashboardShell from "@/components/DashboardShell";
import BrandSelect from "@/components/BrandSelect";
import {
  ShieldAlert,
  Users,
  Stethoscope,
  Building2,
  DollarSign,
  UserCheck,
  CheckCircle2,
  Loader2,
  XCircle,
  Plus,
  Edit2,
  Trash2,
  Activity,
  Lock,
  Search,
  ArrowUpRight,
  TrendingUp,
  Hospital,
  AlertCircle,
  FileCheck,
  Mail,
  Shield,
  UserX,
  UserPlus,
  IdCard,
  Phone,
  Ban,
  RotateCcw,
  Eye,
  Camera,
  UploadCloud,
  Send,
  ShieldCheck,
  Clock,
  X,
  CreditCard,
  Download,
  Calendar,
} from "lucide-react";
import { convertToWebP, uploadToCloudinary, WebPConversionResult } from "@/lib/imageUtils";
import { useToast } from "@/components/ToastProvider";
import { useDialog } from "@/components/DialogProvider";
import { useSession } from "@/lib/useSession";

type ApplicantRecord = {
  id: string;
  name: string;
  email: string;
  phone: string;
  nationalId: string;
  idDocUrl?: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  applied?: string;
  joined: string;
  status: string;
  certs: number;
};

function isActiveAccount(status?: string) {
  return String(status || "").toLowerCase() === "active";
}

function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const escape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  const csv = [headers.map(escape).join(","), ...rows.map((row) => row.map(escape).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function AdminDashboardPage() {
  const { success, error, warning, info } = useToast();
  const { confirm, prompt } = useDialog();
  const { session, loading: sessionLoading } = useSession("admin");
  const [activeNav, setActiveNav] = useState("overview");
  const [settingsSection, setSettingsSection] = useState<"profile" | "password" | "settings">("settings");
  const [adminProfile, setAdminProfile] = useState({
    name: "",
    email: "",
    avatarUrl: "",
  });
  const [adminAvatarWebp, setAdminAvatarWebp] = useState<WebPConversionResult | null>(null);
  const [adminProfileSaveStatus, setAdminProfileSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [governanceSettings, setGovernanceSettings] = useState({
    assessmentRate: "5,000 FRW",
    requireLiveConsultation: true,
    qrValidation: true,
  });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem("fitmed_admin_profile");
      const savedGovernance = localStorage.getItem("fitmed_admin_governance");
      if (savedProfile) setAdminProfile((prev) => ({ ...prev, ...JSON.parse(savedProfile) }));
      if (savedGovernance) setGovernanceSettings((prev) => ({ ...prev, ...JSON.parse(savedGovernance) }));
    } catch {
      // Ignore stored profile/settings that are not valid JSON.
    }
  }, []);

  useEffect(() => {
    if (!session) return;
    setAdminProfile((prev) => ({
      ...prev,
      name: session.name || prev.name,
      email: session.email || prev.email,
    }));
  }, [session]);

  const handleAdminAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const converted = await convertToWebP(file, 0.85, 800);
      setAdminAvatarWebp(converted);
      setAdminProfile((prev) => ({ ...prev, avatarUrl: converted.dataUrl }));
    } catch {
      error("Photo upload failed", "Choose a valid image file and try again.");
    }
  };

  const saveAdminProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (adminProfileSaveStatus === "saving") return;
    setAdminProfileSaveStatus("saving");
    try {
      let profileToSave = adminProfile;
      if (adminAvatarWebp) {
        const upload = await uploadToCloudinary(adminAvatarWebp.file, "fitmed/admin-profiles");
        if (upload.url) profileToSave = { ...profileToSave, avatarUrl: upload.url };
      }
      setAdminProfile(profileToSave);
      localStorage.setItem("fitmed_admin_profile", JSON.stringify(profileToSave));
      setAdminAvatarWebp(null);
      setAdminProfileSaveStatus("saved");
      success("Profile saved", "Your administrator profile is now updated.");
      setTimeout(() => setAdminProfileSaveStatus("idle"), 2500);
    } catch {
      setAdminProfileSaveStatus("idle");
      error("Profile not saved", "Could not save the administrator profile.");
    }
  };

  const changeAdminPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (newPassword.length < 8) {
      warning("Password too short", "Use at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      error("Password not changed", "The new passwords do not match.");
      return;
    }
    try {
      const res = await fetch("/api/auth/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: adminProfile.email,
          currentPassword,
          newPassword,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        error("Password not changed", data.error || "The current password is incorrect.");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      success("Password updated", "Your next sign-in will use the new password.");
    } catch {
      error("Password not changed", "Could not update the password.");
    }
  };

  const saveGovernanceSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(governanceSettings),
      });
      const data = await res.json();
      if (!data.success) {
        error("Settings not saved", data.error || "Please try again.");
        return;
      }
      success("Settings saved", "Governance rules are now stored in FitMed.");
    } catch {
      error("Settings not saved", "Could not reach the server.");
    }
  };

  const goToNav = (id: string) => {
    setActiveNav(id);
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("nav", id);
    window.history.replaceState({}, "", url);
  };

  const handleSettingsAction = (action: "profile" | "password" | "settings") => {
    setSettingsSection(action);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nav = params.get("nav") || params.get("tab");
    if (nav) setActiveNav(nav);
  }, []);

  const [adminRefresh, setAdminRefresh] = useState(0);
  const [auditLogs, setAuditLogs] = useState<{ id: string; action: string; detail: string; actor?: string; time: string }[]>([]);

  // Pending Doctor Approvals
  const [pendingDoctors, setPendingDoctors] = useState<
    { id: string; name: string; specialty?: string; license?: string; applied?: string; status: string }[]
  >([]);

  const [verifiedDoctors, setVerifiedDoctors] = useState<
    { id: string; name: string; role?: string; license?: string; status: string }[]
  >([]);

  const [showAddClinic, setShowAddClinic] = useState(false);
  const [clinicForm, setClinicForm] = useState({
    name: "",
    city: "",
    status: "Active Partner",
    capacity: "Medium",
    phone: "",
    type: "",
  });
  const [clinics, setClinics] = useState<
    { id: string; name: string; city: string; status: string; capacity: string; phone?: string; type?: string }[]
  >([]);
  const [platformAppointments, setPlatformAppointments] = useState<any[]>([]);
  const [doctorSchedules, setDoctorSchedules] = useState<any[]>([]);
  const [subscribers, setSubscribers] = useState<{ id: string; email: string; name: string; date: string }[]>([]);
  const [broadcastForm, setBroadcastForm] = useState({ subject: "", message: "" });
  const [broadcastBusy, setBroadcastBusy] = useState(false);

  const approveDoctor = async (id: string, name: string) => {
    try {
      const res = await fetch("/api/admin/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "approve" }),
      });
      const data = await res.json();
      if (!data.success) {
        error("Could not approve doctor", data.error || "Please try again.");
        return;
      }
      success("Doctor approved", `${name} can now sign in and see their cases.`);
      setAdminRefresh((n) => n + 1);
    } catch {
      error("Could not approve doctor", "Could not reach the server.");
    }
  };

  // Pending Applicant Registrations (Awaiting Admin ID Verification)
  const [pendingApplicants, setPendingApplicants] = useState<ApplicantRecord[]>([]);

  const approveApplicant = async (id: string, name: string, email: string) => {
    try {
      const res = await fetch("/api/auth/approve-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });
      const data = await res.json();
      if (!data.success) {
        error("Approval failed", data.error || "Could not approve this applicant.");
        return;
      }
      success(
        "Applicant approved",
        data.usedOwnPassword
          ? `${name} can now sign in with the password they created at registration.`
          : `We emailed ${name} a first-time sign-in password. They will choose their own password after signing in.`
      );
      setAdminRefresh((n) => n + 1);
    } catch {
      error("Approval failed", "Could not reach the server.");
    }
  };

  const [applicants, setApplicants] = useState<ApplicantRecord[]>([]);
  const [selectedApplicant, setSelectedApplicant] = useState<ApplicantRecord | null>(null);

  const toggleDoctorStatus = async (id: string, name: string, currentStatus: string) => {
    const action = currentStatus === "Active" ? "suspend" : "activate";
    try {
      const res = await fetch("/api/admin/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json();
      if (!data.success) {
        error("Status not updated", data.error || "Please try again.");
        return;
      }
      success(action === "suspend" ? "Doctor paused" : "Doctor reactivated", `${name}'s account is now ${action === "suspend" ? "paused" : "active"}.`);
      setAdminRefresh((n) => n + 1);
    } catch {
      error("Status not updated", "Could not reach the server.");
    }
  };

  const resetStaffPassword = async (id: string, name: string) => {
    try {
      const res = await fetch("/api/admin/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "reset-password" }),
      });
      const data = await res.json();
      if (!data.success) {
        error("Password not reset", data.error || "Please try again.");
        return;
      }
      success("New password emailed", `${name} will receive a first-time sign-in password by email.`);
    } catch {
      error("Password not reset", "Could not reach the server.");
    }
  };

  const deleteDoctor = async (id: string, name: string) => {
    const ok = await confirm({
      title: "Delete doctor account",
      message: `Remove ${name} from FitMed? This cannot be undone.`,
      confirmLabel: "Delete account",
      cancelLabel: "Keep account",
      variant: "danger",
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/admin/staff?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) {
        error("Account not deleted", data.error || "Please try again.");
        return;
      }
      success("Account removed", `${name} has been removed.`);
      setAdminRefresh((n) => n + 1);
    } catch {
      error("Account not deleted", "Could not reach the server.");
    }
  };

  const resetApplicantPassword = async (id: string, name: string, email?: string) => {
    try {
      const res = await fetch("/api/admin/applicants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, email, action: "reset-password" }),
      });
      const data = await res.json();
      if (!data.success) {
        error("Password not reset", data.error || "Please try again.");
        return;
      }
      success("New password emailed", `${name} will receive a first-time sign-in password by email.`);
    } catch {
      error("Password not reset", "Could not reach the server.");
    }
  };

  const deleteApplicant = async (id: string, name: string, email?: string) => {
    const ok = await confirm({
      title: "Delete applicant account",
      message: `Permanently delete ${name}'s applicant account?`,
      confirmLabel: "Delete account",
      cancelLabel: "Keep account",
      variant: "danger",
    });
    if (!ok) return;
    try {
      const params = new URLSearchParams({ id });
      if (email) params.set("email", email);
      const res = await fetch(`/api/admin/applicants?${params.toString()}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) {
        error("Account not deleted", data.error || "Please try again.");
        return;
      }
      setApplicants((prev) => prev.filter((p) => p.id !== id && p.email !== email));
      success("Applicant deleted", `${name}'s account has been removed.`);
      setSelectedApplicant(null);
      setAdminRefresh((n) => n + 1);
    } catch {
      error("Account not deleted", "Could not reach the server.");
    }
  };

  const [userSearch, setUserSearch] = useState("");
  const [portalReady, setPortalReady] = useState(false);
  useEffect(() => {
    setPortalReady(true);
  }, []);
  const [addDoctorForm, setAddDoctorForm] = useState({
    role: "doctor" as "admin" | "doctor",
    name: "",
    email: "",
    license: "",
    specialty: "",
    phone: "",
    password: "",
    avatarUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&q=80&auto=format&fit=crop",
  });
  const [doctorWebpResult, setDoctorWebpResult] = useState<WebPConversionResult | null>(null);
  const [isConvertingDoctorImg, setIsConvertingDoctorImg] = useState(false);
  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [creatingStaff, setCreatingStaff] = useState(false);
  const [adminAccounts, setAdminAccounts] = useState<{ name: string; email: string; role: string; status?: string }[]>([]);

  // Payment Transactions State, Filters & Sorting
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<"ALL" | "PAID" | "WAITING" | "EXPIRED">("ALL");
  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentSort, setPaymentSort] = useState<"newest" | "oldest" | "amount_high" | "applicant">("newest");
  const [selectedTxn, setSelectedTxn] = useState<any | null>(null);
  const [showTxnModal, setShowTxnModal] = useState(false);

  const [transactions, setTransactions] = useState<
    {
      id: string;
      certId: string;
      applicantName: string;
      applicantEmail: string;
      applicantPhone: string;
      purpose: string;
      amount: number;
      channel: string;
      iremboRef: string;
      date: string;
      status: string;
      doctorName: string;
      doctorPayout: number;
      platformFee: number;
    }[]
  >([]);

  const filteredTransactions = transactions
    .filter((txn) => {
      if (paymentStatusFilter !== "ALL" && txn.status !== paymentStatusFilter) return false;
      if (paymentSearch.trim()) {
        const q = paymentSearch.toLowerCase();
        return (
          txn.applicantName.toLowerCase().includes(q) ||
          txn.applicantEmail.toLowerCase().includes(q) ||
          txn.certId.toLowerCase().includes(q) ||
          txn.iremboRef.toLowerCase().includes(q) ||
          txn.purpose.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (paymentSort === "newest") return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (paymentSort === "oldest") return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (paymentSort === "amount_high") return b.amount - a.amount;
      if (paymentSort === "applicant") return a.applicantName.localeCompare(b.applicantName);
      return 0;
    });

  const handleDoctorImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsConvertingDoctorImg(true);
      const converted = await convertToWebP(file, 0.85, 800);
      setDoctorWebpResult(converted);
      setAddDoctorForm((prev) => ({ ...prev, avatarUrl: converted.dataUrl }));
    } catch (err) {
      console.error("Doctor WebP conversion error:", err);
    } finally {
      setIsConvertingDoctorImg(false);
    }
  };

  const filteredApplicants = applicants.filter(
    (p) =>
      p.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      p.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      (p.nationalId || "").includes(userSearch)
  );

  const [inquiries, setInquiries] = useState<
    {
      id: string;
      name: string;
      email: string;
      phone: string;
      category: string;
      subject: string;
      message: string;
      date: string;
      status: string;
      lastReply?: string;
    }[]
  >([]);

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        const staffRes = await fetch("/api/admin/staff");
        const staffData = await staffRes.json();
        if (staffData.success) {
          const doctors = Array.isArray(staffData.doctors) ? staffData.doctors : [];
          setVerifiedDoctors(doctors.filter((d: { status?: string }) => d.status !== "Pending"));
          setPendingDoctors(
            doctors
              .filter((d: { status?: string }) => d.status === "Pending")
              .map((d: { id: string; name: string; role?: string; license?: string; status: string }) => ({
                id: d.id,
                name: d.name,
                specialty: d.role,
                license: d.license,
                applied: "—",
                status: "Pending License Verification",
              }))
          );
          setAdminAccounts(
            (staffData.admins || []).map((a: { fullName?: string; name?: string; email: string; role: string; status?: string }) => ({
              name: a.fullName || a.name || "Admin",
              email: a.email,
              role: a.role,
              status: a.status,
            }))
          );
        }
      } catch {
        setVerifiedDoctors([]);
        setPendingDoctors([]);
        setAdminAccounts([]);
      }

      try {
        const appRes = await fetch("/api/admin/applicants");
        const appData = await appRes.json();
        if (appData.success) {
          setPendingApplicants(appData.pending || []);
          setApplicants(appData.applicants || []);
        }
      } catch {
        setPendingApplicants([]);
        setApplicants([]);
      }

      try {
        const certRes = await fetch("/api/certificates");
        const certData = await certRes.json();
        const payRes = await fetch("/api/payments");
        const payData = await payRes.json();
        if (payData.success && Array.isArray(payData.payments) && payData.payments.length > 0) {
          setTransactions(payData.payments);
        } else if (certData.success && Array.isArray(certData.certificates)) {
          setTransactions(
            certData.certificates.map((c: Record<string, unknown>) => {
              const amount = Number(c.amount) || 5000;
              const payment = String(c.paymentStatus || "UNPAID").toUpperCase();
              const status = payment === "PAID" ? "PAID" : payment === "EXPIRED" ? "EXPIRED" : "WAITING";
              const applied = c.appliedDate ? new Date(String(c.appliedDate)).toLocaleString() : "—";
              return {
                id: String(c.iremboRef || c.certificateId),
                certId: String(c.certificateId || ""),
                applicantName: String(c.candidateName || "Applicant"),
                applicantEmail: String(c.applicantEmail || ""),
                applicantPhone: String(c.applicantPhone || "—"),
                purpose: String(c.purpose || "—"),
                amount,
                channel: String(c.paymentChannel || "Irembo"),
                iremboRef: String(c.iremboRef || c.certificateId || "—"),
                date: applied,
                status,
                doctorName: String(c.assignedDoctor || "—"),
                doctorPayout: Math.round(amount * 0.8),
                platformFee: Math.round(amount * 0.2),
              };
            })
          );
        } else {
          setTransactions([]);
        }
      } catch {
        setTransactions([]);
      }

      try {
        const inqRes = await fetch("/api/contact");
        const inqData = await inqRes.json();
        if (inqData.success && Array.isArray(inqData.inquiries)) {
          setInquiries(
            inqData.inquiries.map((i: Record<string, unknown>) => ({
              id: String(i._id || i.id),
              name: String(i.fullName || "Contact"),
              email: String(i.email || ""),
              phone: String(i.phone || "—"),
              category: String(i.category || "general"),
              subject: String(i.subject || ""),
              message: String(i.message || ""),
              date: i.createdAt ? new Date(String(i.createdAt)).toLocaleString() : "—",
              status: String(i.status || "New"),
              lastReply: String(i.adminNotes || ""),
            }))
          );
        } else {
          setInquiries([]);
        }
      } catch {
        setInquiries([]);
      }

      try {
        const clinicRes = await fetch("/api/clinics");
        const clinicData = await clinicRes.json();
        setClinics(clinicData.success ? clinicData.clinics || [] : []);
      } catch {
        setClinics([]);
      }

      try {
        const scheduleRes = await fetch("/api/schedules");
        const scheduleData = await scheduleRes.json();
        setDoctorSchedules(scheduleData.success ? scheduleData.schedules || [] : []);
        setPlatformAppointments(scheduleData.success ? scheduleData.appointments || [] : []);
      } catch {
        setDoctorSchedules([]);
        setPlatformAppointments([]);
      }

      try {
        const newsRes = await fetch("/api/admin/newsletter");
        const newsData = await newsRes.json();
        setSubscribers(newsData.success ? newsData.subscribers || [] : []);
      } catch {
        setSubscribers([]);
      }

      try {
        const settingsRes = await fetch("/api/admin/settings");
        const settingsData = await settingsRes.json();
        if (settingsData.success && settingsData.settings) {
          setGovernanceSettings((prev) => ({
            ...prev,
            assessmentRate: settingsData.settings.assessmentRate || prev.assessmentRate,
            requireLiveConsultation: settingsData.settings.requireLiveConsultation,
            qrValidation: settingsData.settings.qrValidation,
          }));
          setAuditLogs(settingsData.logs || []);
        }
      } catch {
        setAuditLogs([]);
      }
    };

    loadAdminData();
  }, [adminRefresh]);

  const paidTransactions = transactions.filter((t) => t.status === "PAID");
  const grossRevenue = paidTransactions.reduce((sum, t) => sum + t.amount, 0);
  const doctorPayoutTotal = paidTransactions.reduce((sum, t) => sum + t.doctorPayout, 0);
  const platformMargin = paidTransactions.reduce((sum, t) => sum + t.platformFee, 0);
  const purposeRows = (() => {
    const counts = new Map<string, number>();
    for (const t of transactions) {
      const key = t.purpose || "Other";
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    const max = Math.max(1, ...counts.values());
    return [...counts.entries()].map(([purpose, count]) => ({
      purpose,
      count,
      pct: Math.round((count / max) * 100),
    }));
  })();
  const recentEvents = [
    ...transactions.slice(0, 5).map((t) => ({
      time: t.date,
      event: t.status === "PAID" ? "Certificate paid" : t.status === "EXPIRED" ? "Payment expired" : "Payment waiting",
      detail: `${t.applicantName} · ${t.certId}`,
    })),
    ...pendingApplicants.slice(0, 3).map((p) => ({
      time: p.applied,
      event: "Applicant pending review",
      detail: `${p.name} · ${p.email}`,
    })),
    ...pendingDoctors.slice(0, 3).map((d) => ({
      time: d.applied || "—",
      event: "Doctor pending verification",
      detail: `${d.name}${d.license ? ` · ${d.license}` : ""}`,
    })),
  ].slice(0, 8);

  const toggleApplicantStatus = async (id: string, name: string, currentStatus: string, email?: string) => {
    const action = isActiveAccount(currentStatus) ? "suspend" : "activate";
    try {
      const res = await fetch("/api/admin/applicants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, email, action }),
      });
      const data = await res.json();
      if (!data.success) {
        error("Status not updated", data.error || "Please try again.");
        return;
      }
      const nextStatus = action === "suspend" ? "Suspended" : "Active";
      setApplicants((prev) => prev.map((p) => (p.id === id || p.email === email ? { ...p, status: nextStatus } : p)));
      success(action === "suspend" ? "Account paused" : "Account reactivated", `${name}'s account is now ${action === "suspend" ? "paused" : "active"}.`);
      setAdminRefresh((n) => n + 1);
    } catch {
      error("Status not updated", "Could not reach the server.");
    }
  };

  if (sessionLoading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-sm text-slate-500">
        Loading administrator console…
      </div>
    );
  }

  return (
    <DashboardShell
      role="admin"
      activeNav={activeNav}
      onNavChange={goToNav}
      onSettingsAction={handleSettingsAction}
      userProfile={{
        name: adminProfile.name,
        email: adminProfile.email,
        avatarUrl: adminProfile.avatarUrl,
        badgeLabel: "System Administrator",
      }}
    >
      <div className="space-y-8">
        {/* ── MAIN INFO STAT CARDS (always visible above tabs) ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Card 1: Total Certificates */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-50/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-[#12B8B0]/15 border border-[#12B8B0]/30 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-[#12B8B0]" />
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                  Live
                </span>
              </div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Certificates</div>
              <div className="text-3xl font-extrabold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>
                {transactions.length.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                <span className="text-emerald-600 font-semibold">{grossRevenue.toLocaleString()} FRW</span>
                &nbsp;total revenue
              </div>
            </div>
          </div>

          {/* Card 2: Active Doctors */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-50/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-sky-100 border border-sky-200 flex items-center justify-center">
                  <Stethoscope className="w-5 h-5 text-sky-600" />
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </span>
              </div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Active Doctors</div>
              <div className="text-3xl font-extrabold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>
                {verifiedDoctors.filter((d) => d.status === "Active").length}
                <span className="text-sm font-semibold text-slate-400 ml-1">physicians</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-sky-500" />
                Verified &amp; licensed
              </div>
            </div>
          </div>

          {/* Card 3: Partner Clinics */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold uppercase tracking-wider">
                  Network
                </span>
              </div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Partner Clinics</div>
              <div className="text-3xl font-extrabold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>
                {clinics.length}
                <span className="text-sm font-semibold text-slate-400 ml-1">clinics</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-indigo-500" />
                Physical exam network
              </div>
            </div>
          </div>

          {/* Card 4: Security Status (dark accent) */}
          <div className="bg-gradient-to-br from-[#071d3d] to-[#0B2D5C] rounded-2xl p-5 sm:p-6 border border-emerald-500/30 shadow-lg hover:shadow-xl transition-shadow relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Secure
                </span>
              </div>
              <div className="text-xs font-bold text-emerald-300/80 uppercase tracking-wider mb-1">Security Status</div>
              <div className="text-2xl font-extrabold text-emerald-400" style={{ fontFamily: "var(--font-primary)" }}>
                Protected
              </div>
              <div className="text-[11px] text-sky-200/70 mt-1.5 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-emerald-400" />
                Signed sessions and role access
              </div>
            </div>
          </div>
        </div>

        {/* Top Tab Bar */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-4 flex-wrap">
          {[
            { id: "overview",  label: "System Analytics" },
            { id: "reports",   label: "Reports & History" },
            { id: "users",     label: `Users Management (${applicants.length})` },
            { id: "doctors",   label: `Doctor Accounts (${pendingDoctors.length + verifiedDoctors.length})` },
            { id: "payments",  label: `Payments (${transactions.length})` },
            { id: "inquiries", label: `Contact Inquiries (${inquiries.filter(i => i.status === 'New').length} New)` },
            { id: "clinics",   label: `Partner Clinics (${clinics.length})` },
            { id: "schedules", label: `Schedules (${platformAppointments.length})` },
            { id: "newsletter", label: `News (${subscribers.length})` },
            { id: "revenue",   label: "Revenue & Payouts" },
            { id: "security",  label: "Privacy & activity log" },
            { id: "settings",  label: "Governance Settings" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => goToNav(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeNav === tab.id
                  ? "bg-[#0B2D5C] text-white shadow-md"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB 1: OVERVIEW ── */}
        {activeNav === "overview" && (
          <div className="space-y-8">

            {/* Quick overview panels */}
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-lg font-bold text-[#0B2D5C]">Recent Doctor Registrations</h3>
                <div className="space-y-3">
                  {pendingDoctors.map((doc) => (
                    <div key={doc.id} className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-[#0B2D5C]">{doc.name}</div>
                        <div className="text-[11px] text-slate-600">{doc.specialty} · {doc.license}</div>
                      </div>
                      <button
                        onClick={() => approveDoctor(doc.id, doc.name)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs"
                      >
                        Approve
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#082247] text-white rounded-3xl p-6 sm:p-8 border border-[#12B8B0]/30 shadow-lg space-y-4">
                <h3 className="text-lg font-bold text-white">Certificate security</h3>
                <p className="text-xs text-slate-300">
                  Issued certificates can be checked with a QR code so employers know they are genuine.
                </p>
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-[#12B8B0]">
                  System status: Online<br />
                  Last check: {auditLogs[0]?.time || "—"}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: REPORTS & HISTORY ── */}
        {activeNav === "reports" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>
                  Platform Reports &amp; Activity History
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Operational snapshot of certificates, physician throughput, applicant activity, and settlements.
                </p>
              </div>
              <button
                onClick={() => {
                  info("Preparing report", "Building a spreadsheet of current activity…");
                  downloadCsv(
                    "fitmed_activity_report.csv",
                    ["Event", "Detail", "Time"],
                    recentEvents.map((row) => [row.event, row.detail, row.time])
                  );
                  success("Report ready", "Your activity spreadsheet has been downloaded.");
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-2 self-start"
              >
                <Download className="w-3.5 h-3.5 text-[#12B8B0]" />
                Export monthly report
              </button>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Certificates this month", value: String(transactions.length), hint: "From live certificate records", color: "text-emerald-600" },
                { label: "Pending clinical reviews", value: String(pendingApplicants.length + pendingDoctors.length), hint: "Awaiting admin or doctor action", color: "text-amber-600" },
                { label: "Active applicants", value: String(applicants.filter((a) => a.status === "Active").length), hint: `${applicants.length} total accounts`, color: "text-[#0B2D5C]" },
                { label: "Paid transactions", value: String(transactions.filter((t) => t.status === "PAID").length), hint: `${transactions.filter((t) => t.status === "WAITING").length} waiting payment`, color: "text-[#12B8B0]" },
              ].map((card) => (
                <div key={card.label} className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm">
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{card.label}</div>
                  <div className={`text-2xl font-black mt-1 ${card.color}`}>{card.value}</div>
                  <div className="text-[11px] text-slate-500 mt-1">{card.hint}</div>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-sm font-extrabold text-[#0B2D5C]">Certificate volume by purpose</h3>
                {(purposeRows.length > 0 ? purposeRows : [{ purpose: "No certificates yet", count: 0, pct: 0 }]).map((row) => (
                  <div key={row.purpose} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">{row.purpose}</span>
                      <span className="font-bold text-[#0B2D5C]">{row.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-[#12B8B0]" style={{ width: `${row.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-sm font-extrabold text-[#0B2D5C]">Recent system events</h3>
                <div className="divide-y divide-slate-100 text-xs">
                  {(recentEvents.length > 0 ? recentEvents : [{ time: "—", event: "No recent activity", detail: "Events appear here as certificates, applicants, and staff are created." }]).map((row) => (
                    <div key={row.time + row.event} className="py-3 flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold text-[#0B2D5C]">{row.event}</div>
                        <div className="text-slate-500 mt-0.5">{row.detail}</div>
                      </div>
                      <span className="text-[11px] text-slate-400 whitespace-nowrap">{row.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: USERS MANAGEMENT ── */}
        {activeNav === "users" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>User Account Management</h2>
                <p className="text-xs text-slate-500 mt-1">View, manage, suspend, or reset all registered applicant accounts on the platform.</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by name, email or ID..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#12B8B0] w-56"
                  />
                </div>
              </div>
            </div>

            {/* Pending Applicant ID Verifications */}
            {pendingApplicants.length > 0 && (
              <div className="bg-white rounded-3xl border-2 border-amber-200 shadow-md p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                    <h3 className="text-sm font-extrabold text-[#0B2D5C] uppercase tracking-wider">
                      Pending Applicant Registrations ({pendingApplicants.length} Awaiting Verification)
                    </h3>
                  </div>
                  <span className="text-[11px] text-amber-800 font-bold bg-amber-50 border border-amber-300 px-3 py-0.5 rounded-full">
                    Admin Approval Required
                  </span>
                </div>

                <div className="grid gap-3">
                  {pendingApplicants.map((applicant) => (
                    <div
                      key={applicant.id}
                      className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-[#0B2D5C] text-sm">{applicant.name}</span>
                          <span className="font-mono text-[10px] text-slate-500 font-bold">{applicant.id}</span>
                        </div>
                        <div className="text-slate-600 flex flex-wrap items-center gap-3">
                          <span>Email: <strong>{applicant.email}</strong></span>
                          <span>·</span>
                          <span>Phone: <strong>{applicant.phone}</strong></span>
                          <span>·</span>
                          <span>National ID: <strong className="font-mono text-[#0B2D5C]">{applicant.nationalId}</strong></span>
                        </div>
                        <div className="text-[11px] text-amber-900 font-semibold">
                          Submitted: {applicant.applied} · ID document attached
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => setSelectedApplicant(applicant)}
                          className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#12B8B0]" />
                          <span>View details</span>
                        </button>

                        <button
                          onClick={() => approveApplicant(applicant.id, applicant.name, applicant.email)}
                          className="px-4 py-2 rounded-xl bg-[#12B8B0] hover:bg-[#1dd9d0] text-[#0B2D5C] font-black text-xs shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Approve &amp; send sign-in details</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Applicant Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#12B8B0]" />
                <span className="text-sm font-bold text-[#0B2D5C]">Registered Applicants ({filteredApplicants.length})</span>
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                {filteredApplicants.length === 0 && (
                  <div className="px-5 py-8 text-center text-slate-400">No applicant accounts yet.</div>
                )}
                {filteredApplicants.map((p) => (
                  <div key={p.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 border border-[#12B8B0]/40 flex-shrink-0 relative shadow-sm">
                        <img src={p.avatarUrl} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="font-bold text-[#0B2D5C]">{p.name} <span className="text-slate-400 font-normal">({p.id})</span></div>
                        <div className="text-slate-500 flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{p.email}</span>
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{p.phone}</span>
                          <span className="flex items-center gap-1"><IdCard className="w-3 h-3" />{p.nationalId}</span>
                        </div>
                        <div className="text-slate-400 mt-0.5">Joined: {p.joined} · Certificates: <strong>{p.certs}</strong></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                        isActiveAccount(p.status)
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-rose-100 text-rose-800 border border-rose-300"
                      }`}>
                        {p.status}
                      </span>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          setSelectedApplicant(p);
                        }}
                        className="px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-bold flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#12B8B0]" />
                        View
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          void resetApplicantPassword(p.id, p.name, p.email);
                        }}
                        className="px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-bold flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-[#12B8B0]" />
                        Reset
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          void toggleApplicantStatus(p.id, p.name, p.status, p.email);
                        }}
                        className={`px-3 py-2 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 ${
                          isActiveAccount(p.status)
                            ? "border-rose-200 hover:bg-rose-50 text-rose-600"
                            : "border-emerald-200 hover:bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {isActiveAccount(p.status) ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        {isActiveAccount(p.status) ? "Pause" : "Restore"}
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          void deleteApplicant(p.id, p.name, p.email);
                        }}
                        className="px-3 py-2 rounded-lg border border-slate-200 hover:bg-rose-50 text-rose-600 text-[11px] font-bold flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Doctor Account (Admin-Only) */}
            <div className="bg-[#0B2D5C] rounded-3xl p-6 sm:p-8 border border-[#12B8B0]/30 text-white space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-4 h-4 text-[#12B8B0]" />
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#12B8B0]">Admin Action: Staff Onboarding</span>
                  </div>
                  <h3 className="text-base font-extrabold text-white">Create Admin or Doctor Account</h3>
                  <p className="text-xs text-slate-300 mt-0.5">New staff can sign in as soon as you create the account.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddDoctor(!showAddDoctor)}
                  className="px-4 py-2 rounded-xl bg-[#12B8B0] hover:bg-[#1dd9d0] text-[#0B2D5C] font-black text-xs flex items-center gap-1.5 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  {showAddDoctor ? "Cancel" : "Add Staff"}
                </button>
              </div>

              {adminAccounts.length > 0 && (
                <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-2">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#12B8B0]">Administrators ({adminAccounts.length})</div>
                  {adminAccounts.map((admin) => (
                    <div key={admin.email} className="flex items-center justify-between text-xs gap-3">
                      <span className="font-bold text-white">{admin.name}</span>
                      <span className="text-slate-300 truncate">{admin.email}</span>
                    </div>
                  ))}
                </div>
              )}

              {showAddDoctor && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setCreatingStaff(true);
                    try {
                      let finalAvatar = addDoctorForm.avatarUrl;
                      if (doctorWebpResult) {
                        const upload = await uploadToCloudinary(doctorWebpResult.file, "fitmed/doctors");
                        if (upload.url) finalAvatar = upload.url;
                      }
                      const res = await fetch("/api/admin/staff", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          role: addDoctorForm.role,
                          name: addDoctorForm.name,
                          email: addDoctorForm.email,
                          license: addDoctorForm.license,
                          specialty: addDoctorForm.specialty,
                          phone: addDoctorForm.phone,
                          password: addDoctorForm.password || undefined,
                          avatarUrl: finalAvatar,
                        }),
                      });
                      const data = await res.json();
                      if (!data.success) {
                        error("Account not created", data.error || "Please try again.");
                        return;
                      }
                      if (addDoctorForm.role === "doctor") {
                        setVerifiedDoctors((prev) => [
                          ...prev,
                          {
                            id: data.user.id,
                            name: addDoctorForm.name,
                            role: addDoctorForm.specialty || "Clinical Evaluator",
                            license: addDoctorForm.license,
                            status: "Active",
                          },
                        ]);
                      } else {
                        setAdminAccounts((prev) => [
                          ...prev,
                          { name: addDoctorForm.name, email: addDoctorForm.email.toLowerCase(), role: "admin", status: "active" },
                        ]);
                      }
                      const extra = data.oneTimePassword
                        ? " We emailed them a first-time sign-in password."
                        : " They can sign in with the password you set.";
                      success("Account created", `${addDoctorForm.name} can now sign in as ${addDoctorForm.role === "admin" ? "an administrator" : "a doctor"}.${extra}`);
                      setAdminRefresh((n) => n + 1);
                      setShowAddDoctor(false);
                      setAddDoctorForm({
                        role: "doctor",
                        name: "",
                        email: "",
                        license: "",
                        specialty: "",
                        phone: "",
                        password: "",
                        avatarUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&q=80&auto=format&fit=crop",
                      });
                      setDoctorWebpResult(null);
                    } catch {
                      error("Account not created", "Could not reach the server.");
                    } finally {
                      setCreatingStaff(false);
                    }
                  }}
                  className="bg-white/10 rounded-2xl p-6 border border-white/10 space-y-4"
                >
                  {/* Photo Upload with WebP conversion */}
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-[#12B8B0] bg-white/10 relative flex-shrink-0 flex items-center justify-center">
                        <img src={addDoctorForm.avatarUrl} alt="Doctor Preview" className="w-full h-full object-cover" />
                        {isConvertingDoctorImg && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Profile photo</div>
                        <div className="text-[10px] text-slate-300">We shrink the photo automatically so it loads quickly.</div>
                        {doctorWebpResult && (
                          <div className="text-[10px] text-[#12B8B0] font-bold mt-0.5">
                            Photo ready · smaller by {`${doctorWebpResult.reductionPercentage}%`}
                          </div>
                        )}
                      </div>
                    </div>

                    <label className="cursor-pointer px-3.5 py-2 rounded-xl bg-[#12B8B0] hover:bg-[#1dd9d0] text-[#0B2D5C] font-extrabold text-xs flex items-center gap-1.5 transition-colors">
                      <Camera className="w-3.5 h-3.5" />
                      <span>Upload photo</span>
                      <input type="file" accept="image/*" onChange={handleDoctorImageSelect} className="hidden" />
                    </label>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <BrandSelect
                        variant="dark"
                        label="Account Type"
                        value={addDoctorForm.role}
                        onChange={(v) => setAddDoctorForm({ ...addDoctorForm, role: v as "admin" | "doctor" })}
                        options={[
                          { value: "doctor", label: "Doctor" },
                          { value: "admin", label: "Admin" },
                        ]}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-300 mb-1.5">Full Name</label>
                      <input
                        required
                        type="text"
                        placeholder={addDoctorForm.role === "admin" ? "Admin full name" : "Dr. Full Name, MD"}
                        value={addDoctorForm.name}
                        onChange={(e) => setAddDoctorForm({ ...addDoctorForm, name: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white text-xs placeholder:text-slate-400 focus:outline-none focus:border-[#12B8B0]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-300 mb-1.5">Email Address</label>
                      <input
                        required
                        type="email"
                        placeholder="Email address"
                        value={addDoctorForm.email}
                        onChange={(e) => setAddDoctorForm({ ...addDoctorForm, email: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white text-xs placeholder:text-slate-400 focus:outline-none focus:border-[#12B8B0]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-300 mb-1.5">Password (optional)</label>
                      <input
                        type="text"
                        placeholder="Leave blank to auto-generate"
                        value={addDoctorForm.password}
                        onChange={(e) => setAddDoctorForm({ ...addDoctorForm, password: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white text-xs placeholder:text-slate-400 focus:outline-none focus:border-[#12B8B0]"
                      />
                    </div>
                    {addDoctorForm.role === "doctor" && (
                      <>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-300 mb-1.5">RMDC License Number</label>
                      <input
                        required
                        type="text"
                        placeholder="RW-RMDC-2024-XXXX"
                        value={addDoctorForm.license}
                        onChange={(e) => setAddDoctorForm({ ...addDoctorForm, license: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white text-xs placeholder:text-slate-400 focus:outline-none focus:border-[#12B8B0]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-300 mb-1.5">Specialty</label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Occupational Medicine"
                        value={addDoctorForm.specialty}
                        onChange={(e) => setAddDoctorForm({ ...addDoctorForm, specialty: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white text-xs placeholder:text-slate-400 focus:outline-none focus:border-[#12B8B0]"
                      />
                    </div>
                      </>
                    )}
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={creatingStaff}
                      className="px-6 py-2.5 rounded-xl bg-[#12B8B0] hover:bg-[#1dd9d0] text-[#0B2D5C] font-black text-xs transition-colors flex items-center gap-2 disabled:opacity-60"
                    >
                      <UserPlus className="w-4 h-4" />
                      {creatingStaff ? "Saving…" : addDoctorForm.role === "admin" ? "Create Admin Account" : "Create Doctor Account"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 2: DOCTOR VERIFICATION & ACCOUNTS MANAGEMENT ── */}
        {activeNav === "doctors" && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#0B2D5C]">Doctor Credential & Licensing Management</h3>
                <p className="text-xs text-slate-500">Admin can activate, suspend, reset passwords, or delete registered physician accounts.</p>
              </div>
            </div>

            <div className="space-y-4">
              {pendingDoctors.map((doc) => (
                <div
                  key={doc.id}
                  className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-[#0B2D5C]">{doc.name} ({doc.id})</h4>
                    <div className="text-xs text-slate-600">Specialty: {doc.specialty} · License: {doc.license}</div>
                  </div>
                  <button
                    onClick={() => approveDoctor(doc.id, doc.name)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
                  >
                    Verify & Activate Doctor
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <h4 className="text-sm font-bold text-[#0B2D5C] mb-3">Active Practicing Physicians ({verifiedDoctors.length})</h4>
              <div className="divide-y divide-slate-100 text-xs">
                {verifiedDoctors.map((d) => (
                  <div key={d.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-[#0B2D5C] flex items-center gap-2">
                        <span>{d.name}</span>
                        <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">ID: {d.id}</span>
                        <span className="text-xs text-slate-500">· {d.license}</span>
                      </div>
                      <div className="text-slate-400 text-[11px] mt-0.5">{d.role}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                        d.status === "Active"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-rose-100 text-rose-800 border border-rose-300"
                      }`}>
                        {d.status}
                      </span>

                      <button
                        onClick={() => resetStaffPassword(d.id, d.name)}
                        className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-[#12B8B0] transition-colors"
                        title="Email a new sign-in password"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => toggleDoctorStatus(d.id, d.name, d.status)}
                        className={`p-2 rounded-lg border transition-colors ${
                          d.status === "Active"
                            ? "border-rose-200 hover:bg-rose-50 text-rose-500"
                            : "border-emerald-200 hover:bg-emerald-50 text-emerald-600"
                        }`}
                        title={d.status === "Active" ? "Suspend Doctor" : "Reactivate Doctor"}
                      >
                        {d.status === "Active" ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => deleteDoctor(d.id, d.name)}
                        className="p-2 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Delete Doctor"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: CONTACT INQUIRIES & SUPPORT TICKETS ── */}
        {activeNav === "inquiries" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>
                  Contact Portal & Support Inquiries
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Review and respond to messages submitted from the public contact portal, doctor applications, and corporate employers.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
                  Email notifications: <strong className="text-[#12B8B0]">Active</strong>
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {inquiries.map((inq) => (
                <div
                  key={inq.id}
                  className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4 hover:border-slate-300 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center font-bold text-[#12B8B0]">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-extrabold text-[#0B2D5C]">{inq.subject}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>From: <strong>{inq.name}</strong></span>
                          <span>·</span>
                          <span>{inq.email}</span>
                          <span>·</span>
                          <span>{inq.phone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        inq.status === "New"
                          ? "bg-amber-50 text-amber-800 border-amber-300"
                          : inq.status === "In Review"
                          ? "bg-sky-50 text-sky-800 border-sky-300"
                          : "bg-emerald-50 text-emerald-800 border-emerald-300"
                      }`}>
                        {inq.status}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">{inq.date}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed font-medium">
                    "{inq.message}"
                  </div>

                  {inq.lastReply && (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 leading-relaxed whitespace-pre-wrap">
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 mb-1.5">
                        Completed — reply sent
                      </div>
                      {inq.lastReply}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-lg">
                      Category: {inq.category}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          const reply = await prompt({
                            title: "Reply by email",
                            message: `Send a secure email reply to ${inq.name} (${inq.email}).`,
                            inputLabel: "Message",
                            defaultValue: `Dear ${inq.name},\n\nThank you for contacting FitMed Rwanda. We have reviewed your inquiry.\n\nKind regards,\nFitMed Clinical Support`,
                            confirmLabel: "Send reply",
                            cancelLabel: "Cancel",
                            variant: "info",
                          });
                          if (!reply) return;
                          try {
                            const res = await fetch("/api/contact", {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ id: inq.id, action: "reply", message: reply }),
                            });
                            const data = await res.json();
                            if (!data.success) {
                              error("Reply not sent", data.error || "Please try again.");
                              return;
                            }
                            success("Reply sent", `Email delivered to ${inq.email}.`);
                            setInquiries((prev) =>
                              prev.map((i) =>
                                i.id === inq.id ? { ...i, status: "Resolved", lastReply: reply } : i
                              )
                            );
                          } catch {
                            error("Reply not sent", "Could not reach the server.");
                          }
                        }}
                        className="px-4 py-2 rounded-xl bg-[#12B8B0] hover:bg-[#1dd9d0] text-[#0B2D5C] font-black text-xs transition-colors flex items-center gap-1.5 shadow-xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Reply by email</span>
                      </button>

                      {inq.status !== "Resolved" && (
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch("/api/contact", {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ id: inq.id, status: "Resolved" }),
                              });
                              const data = await res.json();
                              if (!data.success) {
                                error("Not updated", data.error || "Please try again.");
                                return;
                              }
                              setInquiries((prev) => prev.map((i) => (i.id === inq.id ? { ...i, status: "Resolved" } : i)));
                              success("Inquiry resolved", `${inq.subject} from ${inq.name} is now marked resolved.`);
                            } catch {
                              error("Not updated", "Could not reach the server.");
                            }
                          }}
                          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                        >
                          Mark Resolved
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 3: PARTNER CLINICS ── */}
        {activeNav === "clinics" && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#0B2D5C]">Accredited Partner Clinic Network</h3>
                <p className="text-xs text-slate-500">Facilities receiving automated risk-based candidate referrals.</p>
              </div>
              <button
                onClick={() => setShowAddClinic((open) => !open)}
                className="px-4 py-2 rounded-xl bg-[#0B2D5C] text-white font-bold text-xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>{showAddClinic ? "Cancel" : "Add Partner Clinic"}</span>
              </button>
            </div>

            {showAddClinic && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    const res = await fetch("/api/clinics", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(clinicForm),
                    });
                    const data = await res.json();
                    if (!data.success) {
                      error("Clinic not saved", data.error || "Please try again.");
                      return;
                    }
                    setClinics((prev) => [data.clinic, ...prev]);
                    success("Clinic added", `${clinicForm.name} is now in the referral network.`);
                    setClinicForm({ name: "", city: "", status: "Active Partner", capacity: "Medium", phone: "", type: "" });
                    setShowAddClinic(false);
                  } catch {
                    error("Clinic not saved", "Could not reach the server.");
                  }
                }}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid sm:grid-cols-2 gap-3"
              >
                <input
                  required
                  placeholder="Clinic name"
                  value={clinicForm.name}
                  onChange={(e) => setClinicForm({ ...clinicForm, name: e.target.value })}
                  className="p-2.5 text-xs font-semibold"
                />
                <input
                  required
                  placeholder="City / district"
                  value={clinicForm.city}
                  onChange={(e) => setClinicForm({ ...clinicForm, city: e.target.value })}
                  className="p-2.5 text-xs font-semibold"
                />
                <input
                  placeholder="Partnership status"
                  value={clinicForm.status}
                  onChange={(e) => setClinicForm({ ...clinicForm, status: e.target.value })}
                  className="p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                />
                <button type="submit" className="p-2.5 rounded-xl bg-[#12B8B0] text-[#0B2D5C] font-black text-xs">
                  Save clinic
                </button>
              </form>
            )}

            <div className="divide-y divide-slate-100 text-xs">
              {clinics.length === 0 && (
                <div className="py-6 text-slate-400">No partner clinics in the database yet.</div>
              )}
              {clinics.map((c) => (
                <div key={c.id} className="py-3.5 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-[#0B2D5C]">{c.name}</div>
                    <div className="text-slate-400">{c.city}{c.phone ? ` · ${c.phone}` : ""}</div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 font-bold border border-teal-200 text-[10px]">
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeNav === "schedules" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>Schedules</h2>
              <p className="text-xs text-slate-500 mt-1">Doctor weekly availability and booked applicant appointments from the database.</p>
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
                <h3 className="text-sm font-extrabold text-[#0B2D5C]">Doctor availability</h3>
                {doctorSchedules.length === 0 && <p className="text-xs text-slate-400">No saved doctor schedules yet. Doctors publish hours from My Availability.</p>}
                {doctorSchedules.map((row) => (
                  <div key={row.id} className="p-4 rounded-2xl bg-slate-50 text-xs">
                    <div className="font-bold text-[#0B2D5C]">{row.doctorName}</div>
                    <div className="text-slate-500">{row.doctorEmail} · {row.status}</div>
                    <div className="mt-2 space-y-1 text-slate-600">
                      {(row.weeklySchedule || []).filter((d: { dayEnabled?: boolean; nightEnabled?: boolean }) => d.dayEnabled || d.nightEnabled).map((d: { day: string; dayEnabled?: boolean; dayStart?: string; dayEnd?: string; nightEnabled?: boolean; nightStart?: string; nightEnd?: string }) => (
                        <div key={d.day}>
                          {d.day}: {d.dayEnabled ? `Day ${d.dayStart}–${d.dayEnd}` : ""}{d.nightEnabled ? ` Night ${d.nightStart}–${d.nightEnd}` : ""}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
                <h3 className="text-sm font-extrabold text-[#0B2D5C]">Booked appointments</h3>
                {platformAppointments.length === 0 && <p className="text-xs text-slate-400">No appointments in the database yet.</p>}
                {platformAppointments.map((apt: any) => (
                  <div key={apt.appointmentId || apt._id} className="p-4 rounded-2xl border border-slate-100 text-xs">
                    <div className="font-bold text-[#0B2D5C]">{apt.applicantName}</div>
                    <div className="text-slate-500">{apt.scheduledDate} · {apt.scheduledTime} · {apt.doctorName || "Unassigned"}</div>
                    <div className="text-slate-400 mt-1">{apt.purpose} · {apt.status}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeNav === "newsletter" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>News broadcast</h2>
              <p className="text-xs text-slate-500 mt-1">Email everyone who subscribed from the public footer.</p>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setBroadcastBusy(true);
                try {
                  const res = await fetch("/api/admin/newsletter", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(broadcastForm),
                  });
                  const data = await res.json();
                  if (!data.success) {
                    error("Broadcast not sent", data.error || "Please try again.");
                    return;
                  }
                  success("Broadcast sent", data.message);
                  setBroadcastForm({ subject: "", message: "" });
                } catch {
                  error("Broadcast not sent", "Could not reach the server.");
                } finally {
                  setBroadcastBusy(false);
                }
              }}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4"
            >
              <label className="block text-xs font-bold text-slate-600">
                Subject
                <input
                  required
                  value={broadcastForm.subject}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, subject: e.target.value })}
                  className="mt-1 w-full text-sm"
                  placeholder="FitMed update"
                />
              </label>
              <label className="block text-xs font-bold text-slate-600">
                Message
                <textarea
                  required
                  value={broadcastForm.message}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                  className="mt-1 w-full text-sm"
                  placeholder="Write the news you want subscribers to receive…"
                />
              </label>
              <button type="submit" disabled={broadcastBusy} className="px-5 py-2.5 rounded-xl bg-[#0B2D5C] text-white text-xs font-bold disabled:opacity-60">
                {broadcastBusy ? "Sending…" : `Send to ${subscribers.length} subscriber${subscribers.length === 1 ? "" : "s"}`}
              </button>
            </form>
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-sm font-extrabold text-[#0B2D5C] mb-3">Subscribers</h3>
              {subscribers.length === 0 && <p className="text-xs text-slate-400">No subscribers yet.</p>}
              <div className="divide-y divide-slate-100 text-xs">
                {subscribers.map((s) => (
                  <div key={s.id} className="py-2.5 flex justify-between gap-3">
                    <span className="font-semibold text-[#0B2D5C]">{s.email}</span>
                    <span className="text-slate-400">{s.name || "—"} · {s.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: PAYMENT TRANSACTIONS & IREMBO AUDIT HUB ── */}
        {activeNav === "payments" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>
                  Payment &amp; Financial Transactions Hub
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Live IremboPay transaction ledger, paid approvals, pending collections, and expired invoices.
                </p>
              </div>

              <button
                onClick={() => {
                  downloadCsv(
                    "fitmed_payments.csv",
                    ["Reference", "Certificate", "Applicant", "Email", "Purpose", "Amount", "Status", "Date"],
                    filteredTransactions.map((t) => [t.iremboRef, t.certId, t.applicantName, t.applicantEmail, t.purpose, t.amount, t.status, t.date])
                  );
                  success("Spreadsheet downloaded", "Payment records were saved to your computer.");
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-2 shadow-xs transition-colors self-start sm:self-auto"
              >
                <TrendingUp className="w-3.5 h-3.5 text-[#12B8B0]" />
                <span>Export spreadsheet</span>
              </button>
            </div>

            {/* Financial Overview Metrics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Collected (Paid)</div>
                <div className="text-2xl font-black text-emerald-600">
                  {transactions.filter(t => t.status === "PAID").reduce((sum, t) => sum + t.amount, 0).toLocaleString()} FRW
                </div>
                <div className="text-[11px] text-emerald-700 font-semibold">
                  {transactions.filter(t => t.status === "PAID").length} verified payments
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Waiting Collection</div>
                <div className="text-2xl font-black text-amber-500">
                  {transactions.filter(t => t.status === "WAITING").reduce((sum, t) => sum + t.amount, 0).toLocaleString()} FRW
                </div>
                <div className="text-[11px] text-amber-700 font-semibold">
                  {transactions.filter(t => t.status === "WAITING").length} approved pending payment
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Expired / Overdue</div>
                <div className="text-2xl font-black text-rose-500">
                  {transactions.filter(t => t.status === "EXPIRED").reduce((sum, t) => sum + t.amount, 0).toLocaleString()} FRW
                </div>
                <div className="text-[11px] text-rose-700 font-semibold">
                  {transactions.filter(t => t.status === "EXPIRED").length} unpaid &gt; 48h
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Doctor Payouts (80%)</div>
                <div className="text-2xl font-black text-[#0B2D5C]">
                  {transactions.filter(t => t.status === "PAID").reduce((sum, t) => sum + t.doctorPayout, 0).toLocaleString()} FRW
                </div>
                <div className="text-[11px] text-[#12B8B0] font-semibold">Platform: {transactions.filter(t => t.status === "PAID").reduce((sum, t) => sum + t.platformFee, 0).toLocaleString()} FRW</div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Status Filter Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {[
                    { id: "ALL", label: `All Transactions (${transactions.length})` },
                    { id: "PAID", label: `Paid (${transactions.filter(t => t.status === "PAID").length})` },
                    { id: "WAITING", label: `Waiting Payment (${transactions.filter(t => t.status === "WAITING").length})` },
                    { id: "EXPIRED", label: `Expired (${transactions.filter(t => t.status === "EXPIRED").length})` },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setPaymentStatusFilter(tab.id as any)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                        paymentStatusFilter === tab.id
                          ? "bg-[#0B2D5C] text-white shadow-xs"
                          : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Sort dropdown */}
                <div className="flex items-center gap-2 self-end md:self-auto">
                  <span className="text-xs text-slate-400 font-bold whitespace-nowrap">Sort by:</span>
                  <BrandSelect
                    value={paymentSort}
                    onChange={(sort) => setPaymentSort(sort as typeof paymentSort)}
                    options={[{ value: "newest", label: "Newest First" }, { value: "oldest", label: "Oldest First" }, { value: "amount_high", label: "Highest Amount" }, { value: "applicant", label: "Applicant Name (A-Z)" }]}
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search by Applicant Name, Email, Cert ID (e.g. FM-2024-88421) or Irembo Ref..."
                  value={paymentSearch}
                  onChange={(e) => setPaymentSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#12B8B0]"
                />
              </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
                    <tr>
                      <th className="py-3.5 px-6">Transaction / Cert ID</th>
                      <th className="py-3.5 px-6">Applicant</th>
                      <th className="py-3.5 px-6">Purpose</th>
                      <th className="py-3.5 px-6">Amount / Channel</th>
                      <th className="py-3.5 px-6">Status</th>
                      <th className="py-3.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          No transactions found matching the selected filters.
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((txn) => (
                        <tr key={txn.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-4 px-6 font-mono font-bold text-[#0B2D5C]">
                            <div>{txn.id}</div>
                            <div className="text-[10px] text-teal-800 font-semibold">{txn.certId}</div>
                            <div className="text-[10px] text-slate-400 font-normal">{txn.date}</div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-extrabold text-slate-800">{txn.applicantName}</div>
                            <div className="text-[11px] text-slate-500">{txn.applicantEmail}</div>
                            <div className="text-[10px] text-slate-400">{txn.applicantPhone}</div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-semibold text-slate-800">{txn.purpose}</div>
                            <div className="text-[10px] text-slate-400">Doctor: {txn.doctorName}</div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-black text-[#0B2D5C]">{txn.amount.toLocaleString()} FRW</div>
                            <div className="text-[10px] text-slate-500">{txn.channel}</div>
                          </td>
                          <td className="py-4 px-6">
                            {txn.status === "PAID" && (
                              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold text-[10px] inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>PAID (5,000 FRW)</span>
                              </span>
                            )}
                            {txn.status === "WAITING" && (
                              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-[10px] inline-flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-700" />
                                <span>WAITING PAYMENT</span>
                              </span>
                            )}
                            {txn.status === "EXPIRED" && (
                              <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300 font-extrabold text-[10px] inline-flex items-center gap-1">
                                <XCircle className="w-3 h-3 text-rose-600" />
                                <span>EXPIRED / OVERDUE</span>
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {txn.status === "WAITING" && (
                                <button
                                  onClick={async () => {
                                    try {
                                      const res = await fetch("/api/certificates", {
                                        method: "PATCH",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ certificateId: txn.certId, action: "payment-reminder" }),
                                      });
                                      const data = await res.json();
                                      if (!data.success) {
                                        error("Reminder not sent", data.error || "Please try again.");
                                        return;
                                      }
                                      success("Payment reminder sent", `We emailed ${txn.applicantName} the payment link.`);
                                    } catch {
                                      error("Reminder not sent", "Could not reach the server.");
                                    }
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[11px] font-bold transition-colors"
                                >
                                  Remind Pay
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setSelectedTxn(txn);
                                  setShowTxnModal(true);
                                }}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-[11px] font-bold transition-colors"
                              >
                                Details
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: REVENUE ── */}
        {activeNav === "revenue" && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-[#0B2D5C]">Financial Performance & Revenue Distribution</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-xs text-slate-400 uppercase font-bold">Total Gross Revenue</div>
                <div className="text-2xl font-extrabold text-[#0B2D5C] mt-1">{grossRevenue.toLocaleString()} FRW</div>
              </div>
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-xs text-slate-400 uppercase font-bold">Doctor Payouts (80%)</div>
                <div className="text-2xl font-extrabold text-emerald-600 mt-1">{doctorPayoutTotal.toLocaleString()} FRW</div>
              </div>
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-xs text-slate-400 uppercase font-bold">Platform Margin (20%)</div>
                <div className="text-2xl font-extrabold text-[#12B8B0] mt-1">{platformMargin.toLocaleString()} FRW</div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 5: SECURITY & HIPAA ── */}
        {activeNav === "security" && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-[#0B2D5C]">Privacy & activity log</h3>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs font-mono text-slate-700">
              {auditLogs.length === 0 ? (
                <div>No audit events yet. Assignments and certificate activity will appear here.</div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id}>
                    [{log.time}] {log.action}: {log.detail}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── TAB 6: SETTINGS ── */}
        {activeNav === "settings" && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {[
                ["profile", "Admin profile"],
                ["password", "Password & security"],
                ["settings", "Governance rules"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSettingsSection(id as typeof settingsSection)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${settingsSection === id ? "bg-[#0B2D5C] text-white border-[#0B2D5C]" : "bg-white text-slate-600 border-slate-200 hover:border-[#12B8B0]"}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {settingsSection === "profile" && (
              <form onSubmit={saveAdminProfile} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-[#0B2D5C]">Administrator profile</h3>
                  <p className="text-xs text-slate-500 mt-1">Use a real profile photo so the administrator identity is clear across the console.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <img src={adminProfile.avatarUrl} alt="Administrator profile" className="w-20 h-20 rounded-2xl object-cover border-2 border-[#12B8B0]" />
                  <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-[#12B8B0] text-[#0B2D5C] font-bold text-xs flex items-center gap-2">
                    <Camera className="w-4 h-4 text-[#12B8B0]" />
                    Upload real profile photo
                    <input type="file" accept="image/*" onChange={handleAdminAvatarChange} className="hidden" />
                  </label>
                  {adminAvatarWebp && <span className="text-[11px] text-teal-700 font-bold">Photo ready · smaller by {`${adminAvatarWebp.reductionPercentage}%`}</span>}
                </div>
                <div className="grid sm:grid-cols-2 gap-4 text-xs">
                  <label className="font-bold text-slate-500">Display name<input value={adminProfile.name} onChange={(event) => setAdminProfile({ ...adminProfile, name: event.target.value })} className="mt-1 w-full p-3 rounded-xl border border-slate-200 font-semibold" required /></label>
                  <label className="font-bold text-slate-500">Email address<input value={adminProfile.email} disabled className="mt-1 w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500" /></label>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={adminProfileSaveStatus === "saving"}
                    className={`px-5 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 disabled:cursor-wait ${
                      adminProfileSaveStatus === "saving"
                        ? "bg-amber-400 text-[#0B2D5C]"
                        : adminProfileSaveStatus === "saved"
                        ? "bg-emerald-600 text-white"
                        : "bg-[#12B8B0] text-[#0B2D5C]"
                    }`}
                  >
                    {adminProfileSaveStatus === "saving" && <Loader2 className="w-4 h-4 animate-spin" />}
                    {adminProfileSaveStatus === "saved" && <CheckCircle2 className="w-4 h-4" />}
                    {adminProfileSaveStatus === "saving"
                      ? "Saving changes…"
                      : adminProfileSaveStatus === "saved"
                      ? "Saved"
                      : "Save profile"}
                  </button>
                </div>
              </form>
            )}

            {settingsSection === "password" && (
              <form onSubmit={changeAdminPassword} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5 max-w-2xl">
                <div><h3 className="text-lg font-bold text-[#0B2D5C]">Password & security</h3><p className="text-xs text-slate-500 mt-1">Verify your current password before saving a new one.</p></div>
                <div className="grid gap-4 text-xs">
                  <label className="font-bold text-slate-500">Current password<input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="mt-1 w-full p-3 rounded-xl border border-slate-200" required /></label>
                  <label className="font-bold text-slate-500">New password<input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="mt-1 w-full p-3 rounded-xl border border-slate-200" minLength={8} required /></label>
                  <label className="font-bold text-slate-500">Confirm new password<input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-1 w-full p-3 rounded-xl border border-slate-200" minLength={8} required /></label>
                </div>
                <div className="flex justify-end"><button type="submit" className="px-5 py-2.5 rounded-xl bg-[#12B8B0] text-[#0B2D5C] font-black text-xs">Update password</button></div>
              </form>
            )}

            {settingsSection === "settings" && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <h3 className="text-lg font-bold text-[#0B2D5C]">Platform Clinical Governance Settings</h3>
                <div className="space-y-3 text-xs">
                  <label className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50">Standard Assessment Rate (FRW)<input type="text" value={governanceSettings.assessmentRate} onChange={(event) => setGovernanceSettings({ ...governanceSettings, assessmentRate: event.target.value })} className="p-2 rounded-lg border border-slate-200 font-bold text-right" required /></label>
                  <label className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50">Require Live Video Consultation for High-Risk Categories<input type="checkbox" checked={governanceSettings.requireLiveConsultation} onChange={(event) => setGovernanceSettings({ ...governanceSettings, requireLiveConsultation: event.target.checked })} className="w-4 h-4 accent-[#12B8B0]" /></label>
                  <label className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50">Confirm certificates with a QR code<input type="checkbox" checked={governanceSettings.qrValidation} onChange={(event) => setGovernanceSettings({ ...governanceSettings, qrValidation: event.target.checked })} className="w-4 h-4 accent-[#12B8B0]" /></label>
                </div>
                <div className="flex justify-end"><button type="button" onClick={saveGovernanceSettings} className="px-5 py-2.5 rounded-xl bg-[#12B8B0] text-[#0B2D5C] font-black text-xs">Save governance settings</button></div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      {showTxnModal && selectedTxn && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative border border-slate-200 text-slate-800">
            <button
              onClick={() => setShowTxnModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-extrabold uppercase tracking-wider border border-teal-200">
                <CreditCard className="w-3 h-3 text-[#12B8B0]" />
                <span>IremboPay Ledger Audit</span>
              </div>
              <h3 className="text-xl font-extrabold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>
                Transaction &amp; Fee Breakdown
              </h3>
              <p className="text-xs text-slate-500 font-mono">Ref: {selectedTxn.id}</p>
            </div>

            <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Applicant:</span>
                <span className="font-bold text-slate-800">{selectedTxn.applicantName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Email:</span>
                <span className="font-semibold text-slate-700">{selectedTxn.applicantEmail}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Certificate ID:</span>
                <span className="font-mono font-bold text-teal-800">{selectedTxn.certId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Irembo Reference:</span>
                <span className="font-mono font-bold text-slate-800">{selectedTxn.iremboRef}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Payment Channel:</span>
                <span className="font-bold text-slate-800">{selectedTxn.channel}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Evaluating Doctor:</span>
                <span className="font-bold text-slate-800">{selectedTxn.doctorName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Doctor Payout (80%):</span>
                <span className="font-bold text-emerald-600">{selectedTxn.doctorPayout.toLocaleString()} FRW</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Platform Margin (20%):</span>
                <span className="font-bold text-[#12B8B0]">{selectedTxn.platformFee.toLocaleString()} FRW</span>
              </div>
              <div className="flex justify-between pt-2 text-sm font-black text-[#0B2D5C]">
                <span>Total Amount:</span>
                <span>{selectedTxn.amount.toLocaleString()} FRW</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  downloadCsv(
                    `fitmed_receipt_${selectedTxn.certId}.csv`,
                    ["Field", "Value"],
                    [
                      ["Receipt", selectedTxn.id],
                      ["Certificate", selectedTxn.certId],
                      ["Applicant", selectedTxn.applicantName],
                      ["Email", selectedTxn.applicantEmail],
                      ["Purpose", selectedTxn.purpose],
                      ["Amount (FRW)", selectedTxn.amount],
                      ["Status", selectedTxn.status],
                      ["Date", selectedTxn.date],
                    ]
                  );
                  success("Receipt downloaded", `Payment details for ${selectedTxn.certId} were saved.`);
                  setShowTxnModal(false);
                }}
                className="flex-1 py-3 rounded-xl bg-[#0B2D5C] hover:bg-[#082247] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <Download className="w-4 h-4 text-[#12B8B0]" />
                <span>Download receipt</span>
              </button>
              <button
                onClick={() => setShowTxnModal(false)}
                className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {portalReady && selectedApplicant && createPortal(
        <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={() => setSelectedApplicant(null)}>
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full my-auto shadow-2xl relative space-y-5" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setSelectedApplicant(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#12B8B0] bg-slate-100 flex-shrink-0">
                {selectedApplicant.avatarUrl ? (
                  <img src={selectedApplicant.avatarUrl} alt={selectedApplicant.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#0B2D5C] font-black">{selectedApplicant.name.charAt(0)}</div>
                )}
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-[#0B2D5C]">{selectedApplicant.name}</h3>
                <p className="text-xs text-slate-500 mt-1">Applicant record</p>
                <span className={`mt-2 inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                  selectedApplicant.status === "Active"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}>
                  {selectedApplicant.status}
                </span>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              {[
                ["Email", selectedApplicant.email],
                ["Phone", selectedApplicant.phone],
                ["National ID", selectedApplicant.nationalId],
                ["Date of birth", selectedApplicant.dateOfBirth || "—"],
                ["Gender", selectedApplicant.gender || "—"],
                ["Joined", selectedApplicant.joined || selectedApplicant.applied || "—"],
                ["Certificates", String(selectedApplicant.certs ?? 0)],
                ["Address", selectedApplicant.address || "—"],
              ].map(([label, value]) => (
                <div key={label} className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{label}</div>
                  <div className="font-bold text-[#0B2D5C] mt-1 break-words">{value}</div>
                </div>
              ))}
            </div>
            {selectedApplicant.idDocUrl ? (
              <div className="space-y-2">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">National ID / passport photo</div>
                <img src={selectedApplicant.idDocUrl} alt="National ID" className="w-full max-h-72 object-contain rounded-2xl border border-slate-200 bg-slate-50" />
              </div>
            ) : (
              <p className="text-xs text-slate-500">No ID document was uploaded.</p>
            )}
            <div className="flex flex-wrap gap-2 justify-end">
              <button
                type="button"
                onClick={() => resetApplicantPassword(selectedApplicant.id, selectedApplicant.name, selectedApplicant.email)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Email new password
              </button>
              <button
                type="button"
                onClick={() => setSelectedApplicant(null)}
                className="px-4 py-2.5 rounded-xl bg-[#0B2D5C] text-white text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </DashboardShell>
  );
}
