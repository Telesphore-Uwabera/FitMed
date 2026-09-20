"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import DashboardShell from "@/components/DashboardShell";
import BrandSelect from "@/components/BrandSelect";
import BrandDatePicker from "@/components/BrandDatePicker";
import OfficialMedicalCertificate from "@/components/OfficialMedicalCertificate";
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
  Filter,
  FileSignature,
  FileText,
  QrCode,
  CalendarDays,
  Check,
  FileSpreadsheet,
  FileBadge,
  GraduationCap,
} from "lucide-react";
import { convertToWebP, uploadToCloudinary, WebPConversionResult } from "@/lib/imageUtils";
import { useToast } from "@/components/ToastProvider";
import { subscribeLiveRefresh } from "@/lib/liveRefresh";
import { useDialog } from "@/components/DialogProvider";
import { useSession } from "@/lib/useSession";
import { displayDoctorName } from "@/lib/certificateDisplay";
import DocumentPreviewModal, { DocumentPreviewItem } from "@/components/DocumentPreviewModal";

type ApplicantRecord = {
  id: string;
  applicantId?: string;
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

const PURPOSE_BAR_COLORS = [
  "bg-[#12B8B0]",
  "bg-[#0B2D5C]",
  "bg-sky-500",
  "bg-amber-500",
  "bg-indigo-500",
  "bg-emerald-500",
  "bg-rose-500",
  "bg-violet-500",
];

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
    if (!session?.email) return;
    const loadProfile = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        const data = await res.json();
        if (data.success && data.user) {
          setAdminProfile({
            name: data.user.name || session.name || "",
            email: data.user.email || session.email || "",
            avatarUrl: data.user.avatarUrl || "",
          });
          return;
        }
      } catch {
        // Fall back to the signed-in session if the profile request fails.
      }
      setAdminProfile((prev) => ({
        ...prev,
        name: session.name || prev.name,
        email: session.email || prev.email,
      }));
    };
    void loadProfile();
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
        if (!upload.url) {
          throw new Error("Photo upload failed");
        }
        profileToSave = { ...profileToSave, avatarUrl: upload.url };
      }
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileToSave.name,
          email: session?.email || "",
          avatarUrl: profileToSave.avatarUrl,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        error("Profile not saved", data.error || "Could not update the administrator profile.");
        setAdminProfileSaveStatus("idle");
        return;
      }
      const saved = {
        name: data.user?.name || profileToSave.name,
        email: data.user?.email || profileToSave.email,
        avatarUrl: data.user?.avatarUrl || profileToSave.avatarUrl,
      };
      setAdminProfile(saved);
      setAdminAvatarWebp(null);
      setAdminProfileSaveStatus("saved");
      success("Profile saved", "Your administrator name and photo are now stored in FitMed.");
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
        credentials: "include",
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
        credentials: "include",
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

  // Doctor and Staff state
  const [pendingDoctors, setPendingDoctors] = useState<
    {
      id: string;
      doctorId?: string;
      name: string;
      email?: string;
      phone?: string;
      specialty?: string;
      license?: string;
      licenseExpiryDate?: string;
      applied?: string;
      status: string;
      avatarUrl?: string;
      nationalIdUrl?: string;
      licenseCertificateUrl?: string;
      diplomaUrl?: string;
    }[]
  >([]);

  const [verifiedDoctors, setVerifiedDoctors] = useState<
    {
      id: string;
      doctorId?: string;
      name: string;
      email?: string;
      phone?: string;
      role?: string;
      specialty?: string;
      license?: string;
      licenseExpiryDate?: string;
      status: string;
      avatarUrl?: string;
      nationalIdUrl?: string;
      licenseCertificateUrl?: string;
      diplomaUrl?: string;
    }[]
  >([]);

  const [adminAccounts, setAdminAccounts] = useState<
    { id: string; name: string; email: string; phone?: string; role: string; status?: string; avatarUrl?: string }[]
  >([]);

  const [teamDirectory, setTeamDirectory] = useState<
    { id: string; name: string; email: string; phone?: string; jobTitle?: string; bio?: string; role?: string; status?: string; avatarUrl?: string }[]
  >([]);

  // Edit Staff Modal State
  const [editingStaff, setEditingStaff] = useState<any | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [savingEditStep, setSavingEditStep] = useState("");
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
  const [editNationalIdFile, setEditNationalIdFile] = useState<File | null>(null);
  const [editLicenseFile, setEditLicenseFile] = useState<File | null>(null);
  const [editDiplomaFile, setEditDiplomaFile] = useState<File | null>(null);

  const [showAddClinic, setShowAddClinic] = useState(false);
  const [editingClinicId, setEditingClinicId] = useState<string | null>(null);
  const emptyClinicForm = {
    name: "",
    city: "",
    status: "Active Partner",
    capacity: "Medium",
    phone: "",
    type: "",
  };
  const [clinicForm, setClinicForm] = useState(emptyClinicForm);
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
        credentials: "include",
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
      const res = await fetch("/api/admin/applicants", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, email, name, action: "approve" }),
      });
      const data = await res.json();
      if (!data.success) {
        error("Approval failed", data.error || "Could not approve this applicant.");
        return;
      }
      success(
        "Applicant approved",
        `${name} was emailed automatically. They can sign in with the password they created at registration.`
      );
      setAdminRefresh((n) => n + 1);
    } catch {
      error("Approval failed", "Could not reach the server.");
    }
  };

  const [applicants, setApplicants] = useState<ApplicantRecord[]>([]);
  const [selectedApplicant, setSelectedApplicant] = useState<ApplicantRecord | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ApplicantRecord | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingApplicant, setRejectingApplicant] = useState(false);

  const isPendingApplicant = (status?: string) => {
    const value = String(status || "").toLowerCase();
    return value === "pending" || value === "pending_approval";
  };

  const rejectApplicant = async () => {
    if (!rejectTarget) return;
    const reason = rejectReason.trim();
    if (reason.length < 8) {
      error("Reason required", "Write the rejection reason. It is included in the email to the applicant.");
      return;
    }
    setRejectingApplicant(true);
    try {
      const res = await fetch("/api/admin/applicants", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: rejectTarget.id,
          email: rejectTarget.email,
          action: "reject",
          reason,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        error("Rejection failed", data.error || "Could not reject this applicant.");
        return;
      }
      success("Applicant rejected", data.message || `We emailed ${rejectTarget.name} the reason.`);
      setRejectTarget(null);
      setRejectReason("");
      setSelectedApplicant(null);
      setAdminRefresh((n) => n + 1);
    } catch {
      error("Rejection failed", "Could not reach the server.");
    } finally {
      setRejectingApplicant(false);
    }
  };

  const toggleDoctorStatus = async (id: string, name: string, currentStatus: string) => {
    const action = currentStatus === "Active" ? "suspend" : "activate";
    try {
      const res = await fetch("/api/admin/staff", {
        credentials: "include",
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
        credentials: "include",
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "reset-password" }),
      });
      const data = await res.json();
      if (!data.success) {
        error("Password not reset", data.error || "Please try again.");
        return;
      }
      success("Approval email sent", `${name} was emailed their FitMed sign-in details. The password was reset only after that email went out.`);
    } catch {
      error("Password not reset", "Could not reach the server.");
    }
  };

  const deleteStaffMember = async (id: string, name: string, role = "staff") => {
    const ok = await confirm({
      title: `Delete ${role} account`,
      message: `Remove ${name} from FitMed? This cannot be undone.`,
      confirmLabel: "Delete account",
      cancelLabel: "Keep account",
      variant: "danger",
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/admin/staff?id=${encodeURIComponent(id)}`, { credentials: "include", method: "DELETE" });
      if (res.status === 401) {
        error("Session expired", "Your session has expired. Please sign in again.");
        setTimeout(() => {
          window.location.href = `/signin?expired=1&next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        }, 1200);
        return;
      }
      const data = await res.json();
      if (!data.success) {
        error("Account not deleted", data.error || "Please try again.");
        return;
      }
      setVerifiedDoctors((prev) => prev.filter((d) => d.id !== id));
      setPendingDoctors((prev) => prev.filter((d) => d.id !== id));
      setAdminAccounts((prev) => prev.filter((a) => a.id !== id));
      setTeamDirectory((prev) => prev.filter((m) => m.id !== id));
      success("Account removed", `${name} has been removed.`);
      setAdminRefresh((n) => n + 1);
    } catch {
      error("Account not deleted", "Could not reach the server.");
    }
  };

  const deleteDoctor = async (id: string, name: string) => {
    return deleteStaffMember(id, name, "doctor");
  };

  const handleSaveStaffEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    setSavingEdit(true);
    setSavingEditStep("Preparing updates...");
    try {
      let finalAvatar = editingStaff.avatarUrl;
      let finalNationalId = editingStaff.nationalIdUrl;
      let finalLicenseCert = editingStaff.licenseCertificateUrl;
      let finalDiploma = editingStaff.diplomaUrl;

      // Upload new files sequentially with short spacing to avoid Cloudinary concurrency rate limits (429)
      if (editAvatarFile) {
        setSavingEditStep("Uploading profile photo...");
        const avatarUp = await uploadToCloudinary(editAvatarFile, "fitmed/doctors");
        if (avatarUp.url) finalAvatar = avatarUp.url;
        await new Promise((r) => setTimeout(r, 200));
      }
      if (editNationalIdFile) {
        setSavingEditStep("Uploading National ID...");
        const natUp = await uploadToCloudinary(editNationalIdFile, "fitmed/doctor-documents");
        if (natUp.url) finalNationalId = natUp.url;
        await new Promise((r) => setTimeout(r, 200));
      }
      if (editLicenseFile) {
        setSavingEditStep("Uploading License Certificate...");
        const licUp = await uploadToCloudinary(editLicenseFile, "fitmed/doctor-documents");
        if (licUp.url) finalLicenseCert = licUp.url;
        await new Promise((r) => setTimeout(r, 200));
      }
      if (editDiplomaFile) {
        setSavingEditStep("Uploading Diploma...");
        const dipUp = await uploadToCloudinary(editDiplomaFile, "fitmed/doctor-documents");
        if (dipUp.url) finalDiploma = dipUp.url;
        await new Promise((r) => setTimeout(r, 200));
      }

      setSavingEditStep("Saving changes...");
      const res = await fetch("/api/admin/staff", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingStaff.id,
          name: editingStaff.name,
          email: editingStaff.email,
          phone: editingStaff.phone,
          role: editingStaff.role,
          status: editingStaff.status,
          license: editingStaff.license,
          licenseExpiryDate: editingStaff.licenseExpiryDate || null,
          specialty: editingStaff.specialty,
          jobTitle: editingStaff.jobTitle,
          bio: editingStaff.bio,
          avatarUrl: finalAvatar,
          nationalIdUrl: finalNationalId,
          licenseCertificateUrl: finalLicenseCert,
          diplomaUrl: finalDiploma,
          password: editingStaff.password || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        error("Update failed", data.error || "Could not update staff member.");
        return;
      }
      success("Staff updated", `${editingStaff.name}'s account details have been saved.`);
      setEditingStaff(null);
      setEditAvatarFile(null);
      setEditNationalIdFile(null);
      setEditLicenseFile(null);
      setEditDiplomaFile(null);
      setAdminRefresh((n) => n + 1);
    } catch (err: any) {
      error("Update failed", err?.message || "Could not reach the server.");
    } finally {
      setSavingEdit(false);
      setSavingEditStep("");
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
      const res = await fetch(`/api/admin/applicants?${params.toString()}`, { credentials: "include", method: "DELETE" });
      if (res.status === 401) {
        error("Session expired", "Your session has expired. Please sign in again.");
        setTimeout(() => {
          window.location.href = `/signin?expired=1&next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        }, 1200);
        return;
      }
      const data = await res.json();
      if (!data.success) {
        error("Account not deleted", data.error || "Please try again.");
        return;
      }
      setApplicants((prev) => prev.filter((p) => p.id !== id && p.email !== email));
      setPendingApplicants((prev) => prev.filter((p) => p.id !== id && p.email !== email));
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
    role: "doctor" as "admin" | "doctor" | "staff",
    name: "",
    email: "",
    license: "",
    licenseExpiryDate: "",
    specialty: "",
    phone: "",
    password: "",
    jobTitle: "Licensed Physician",
    newTitle: "",
    bio: "",
    avatarUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&q=80&auto=format&fit=crop",
  });
  const [staffTitles, setStaffTitles] = useState<string[]>([
    "Managing Director & Clinical Director",
    "Chief Operations Officer (COO) & Program Manager",
    "ICT & Digital Health",
    "Legal & Compliance Officer",
    "Marketing & Sales Business Development",
    "Platform Administrator",
    "Licensed Physician",
  ]);
  const [doctorWebpResult, setDoctorWebpResult] = useState<WebPConversionResult | null>(null);
  const [isConvertingDoctorImg, setIsConvertingDoctorImg] = useState(false);
  // Doctor credential documents
  const [doctorNationalIdFile, setDoctorNationalIdFile] = useState<File | null>(null);
  const [doctorLicenseFile, setDoctorLicenseFile] = useState<File | null>(null);
  const [doctorDiplomaFile, setDoctorDiplomaFile] = useState<File | null>(null);
  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [creatingStaff, setCreatingStaff] = useState(false);
  const [creatingStaffStep, setCreatingStaffStep] = useState("");

  // Payment Transactions State, Filters & Sorting
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<"ALL" | "PAID" | "WAITING" | "EXPIRED">("ALL");
  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentSort, setPaymentSort] = useState<"newest" | "oldest" | "amount_high" | "applicant">("newest");
  const [selectedTxn, setSelectedTxn] = useState<any | null>(null);
  const [showTxnModal, setShowTxnModal] = useState(false);
  const [reportTab, setReportTab] = useState<"certificates" | "payments" | "applicants" | "meetings" | "activity">("certificates");
  const [reportSearch, setReportSearch] = useState("");
  const [reportStatus, setReportStatus] = useState("ALL");
  // Admin certificate status-change state
  const [certStatusBusy, setCertStatusBusy] = useState<string | null>(null); // certificateId being updated
  const [certRejectTarget, setCertRejectTarget] = useState<{ id: string; name: string; email: string; purpose: string } | null>(null);
  const [certRejectReason, setCertRejectReason] = useState("");
  const [certificateRows, setCertificateRows] = useState<
    {
      id: string;
      applicant: string;
      email: string;
      purpose: string;
      status: string;
      payment: string;
      doctor: string;
      date: string;
    }[]
  >([]);

  // Consolidated Full Certificates & Clinical Assessments State
  const [allCertificates, setAllCertificates] = useState<any[]>([]);

  // Assessment Reports Filters
  const [assessmentDoctorFilter, setAssessmentDoctorFilter] = useState("ALL");
  const [assessmentStatusFilter, setAssessmentStatusFilter] = useState("ALL");
  const [assessmentDatePreset, setAssessmentDatePreset] = useState<"ALL" | "TODAY" | "WEEK" | "MONTH" | "CUSTOM">("ALL");
  const [assessmentStartDate, setAssessmentStartDate] = useState("");
  const [assessmentEndDate, setAssessmentEndDate] = useState("");
  const [assessmentSearch, setAssessmentSearch] = useState("");
  const [selectedAssessmentDoc, setSelectedAssessmentDoc] = useState<any | null>(null);

  // Issued Certificates Filters
  const [certDoctorFilter, setCertDoctorFilter] = useState("ALL");
  const [certStatusFilter, setCertStatusFilter] = useState("ALL");
  const [certDatePreset, setCertDatePreset] = useState<"ALL" | "TODAY" | "WEEK" | "MONTH" | "CUSTOM">("ALL");
  const [certStartDate, setCertStartDate] = useState("");
  const [certEndDate, setCertEndDate] = useState("");
  const [certSearch, setCertSearch] = useState("");
  const [selectedCertPreview, setSelectedCertPreview] = useState<any | null>(null);
  const [selectedDocPreview, setSelectedDocPreview] = useState<DocumentPreviewItem | null>(null);

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
      approvedAt?: string;
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

  const handleDoctorDocSelect = (
    setter: React.Dispatch<React.SetStateAction<File | null>>
  ) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        warning("File is very large", "This document is over 15MB. Consider compressing it for faster uploads.");
      }
      setter(file);
    }
  };

  const filteredApplicants = applicants.filter(
    (p) =>
      p.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      p.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      (p.applicantId || "").toLowerCase().includes(userSearch.toLowerCase()) ||
      (p.nationalId || "").includes(userSearch)
  );

  // Helper: check if a date falls within calendar filter range
  const checkDateInRange = (
    dateStr?: string | Date | null,
    preset: "ALL" | "TODAY" | "WEEK" | "MONTH" | "CUSTOM" = "ALL",
    customStart: string = "",
    customEnd: string = ""
  ): boolean => {
    if (preset === "ALL" && !customStart && !customEnd) return true;
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return true;
    const now = new Date();

    if (preset === "TODAY") {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return d >= today;
    }
    if (preset === "WEEK") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return d >= weekAgo;
    }
    if (preset === "MONTH") {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return d >= monthAgo;
    }
    if (customStart) {
      const start = new Date(customStart);
      start.setHours(0, 0, 0, 0);
      if (d < start) return false;
    }
    if (customEnd) {
      const end = new Date(customEnd);
      end.setHours(23, 59, 59, 999);
      if (d > end) return false;
    }
    return true;
  };

  // Consolidated unique doctor list across system
  const allDoctorOptions = useMemo(() => {
    const names = new Set<string>();
    verifiedDoctors.forEach((d) => {
      if (d.name) names.add(d.name.trim());
    });
    pendingDoctors.forEach((d) => {
      if (d.name) names.add(d.name.trim());
    });
    allCertificates.forEach((c) => {
      const doc = displayDoctorName(c.assignedDoctor || "");
      if (doc && doc !== "—" && doc !== "Unassigned") names.add(doc.trim());
    });
    return Array.from(names).sort();
  }, [verifiedDoctors, pendingDoctors, allCertificates]);

  // Consolidated Assessment Reports (with doctor, calendar, status, search filtering)
  const filteredAssessmentReports = useMemo(() => {
    return allCertificates.filter((cert) => {
      // 1. Doctor Filter
      if (assessmentDoctorFilter !== "ALL") {
        const docName = displayDoctorName(cert.assignedDoctor || "");
        if (docName !== assessmentDoctorFilter) return false;
      }

      // 2. Status / Clinical Decision Filter
      const dec = cert.decision || cert.structuredAssessment?.decision || "PENDING";
      const stat = String(cert.status || "submitted").toLowerCase();
      if (assessmentStatusFilter !== "ALL") {
        if (assessmentStatusFilter === "FIT" && dec !== "FIT") return false;
        if (assessmentStatusFilter === "FIT_RESTRICTED" && dec !== "FIT_RESTRICTED") return false;
        if (
          assessmentStatusFilter === "PHYSICAL_CONSULTATION" &&
          dec !== "PHYSICAL_CONSULTATION" &&
          stat !== "physical check up requested" &&
          stat !== "physical-checkup"
        )
          return false;
        if (
          assessmentStatusFilter === "INVESTIGATION_SPECIALIST" &&
          dec !== "INVESTIGATION_SPECIALIST" &&
          stat !== "specialist-referral"
        )
          return false;
        if (
          assessmentStatusFilter === "URGENT_REFERRAL" &&
          dec !== "URGENT_REFERRAL" &&
          stat !== "urgent-referral"
        )
          return false;
        if (
          assessmentStatusFilter === "NOT_FIT" &&
          dec !== "NOT_FIT" &&
          dec !== "UNFIT" &&
          stat !== "rejected"
        )
          return false;
        if (
          assessmentStatusFilter === "PENDING" &&
          stat !== "submitted" &&
          stat !== "under-review"
        )
          return false;
      }

      // 3. Calendar / Date Range Filter
      const certDate =
        cert.structuredAssessment?.consultationDate ||
        cert.appliedDate ||
        cert.issuedAt ||
        cert.createdAt;
      if (
        !checkDateInRange(
          certDate,
          assessmentDatePreset,
          assessmentStartDate,
          assessmentEndDate
        )
      ) {
        return false;
      }

      // 4. Search Query Filter
      if (assessmentSearch.trim()) {
        const q = assessmentSearch.toLowerCase();
        const name = String(cert.candidateName || "").toLowerCase();
        const email = String(cert.applicantEmail || "").toLowerCase();
        const id = String(cert.certificateId || "").toLowerCase();
        const natId = String(cert.candidateIdNumber || "").toLowerCase();
        const doc = String(cert.assignedDoctor || "").toLowerCase();
        const notes = String(
          cert.decisionNotes ||
            cert.notes ||
            cert.structuredAssessment?.clinicalImpression ||
            ""
        ).toLowerCase();
        if (
          !name.includes(q) &&
          !email.includes(q) &&
          !id.includes(q) &&
          !natId.includes(q) &&
          !doc.includes(q) &&
          !notes.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [
    allCertificates,
    assessmentDoctorFilter,
    assessmentStatusFilter,
    assessmentDatePreset,
    assessmentStartDate,
    assessmentEndDate,
    assessmentSearch,
  ]);

  // Consolidated Issued Certificates (with doctor, calendar, status, search filtering)
  const filteredIssuedCertificates = useMemo(() => {
    return allCertificates.filter((cert) => {
      // 1. Doctor Filter
      if (certDoctorFilter !== "ALL") {
        const docName = displayDoctorName(cert.assignedDoctor || "");
        if (docName !== certDoctorFilter) return false;
      }

      // 2. Status / Payment Filter
      const stat = String(cert.status || "").toLowerCase();
      const pay = String(cert.paymentStatus || "").toUpperCase();
      if (certStatusFilter !== "ALL") {
        if (certStatusFilter === "PAID" && pay !== "PAID") return false;
        if (certStatusFilter === "UNPAID" && pay === "PAID") return false;
        if (
          certStatusFilter === "VALID" &&
          stat !== "valid" &&
          stat !== "issued" &&
          !(stat === "approved" && pay === "PAID")
        )
          return false;
        if (
          certStatusFilter === "APPROVED_UNPAID" &&
          (stat !== "approved" || pay === "PAID")
        )
          return false;
        if (certStatusFilter === "EXPIRED" && stat !== "expired") return false;
        if (certStatusFilter === "REVOKED" && stat !== "revoked") return false;
        if (certStatusFilter === "REJECTED" && stat !== "rejected") return false;
      }

      // 3. Calendar / Date Range Filter
      const certDate = cert.issuedAt || cert.appliedDate || cert.createdAt;
      if (
        !checkDateInRange(
          certDate,
          certDatePreset,
          certStartDate,
          certEndDate
        )
      ) {
        return false;
      }

      // 4. Search Query Filter
      if (certSearch.trim()) {
        const q = certSearch.toLowerCase();
        const name = String(cert.candidateName || "").toLowerCase();
        const email = String(cert.applicantEmail || "").toLowerCase();
        const id = String(cert.certificateId || "").toLowerCase();
        const natId = String(cert.candidateIdNumber || "").toLowerCase();
        const irembo = String(cert.iremboRef || "").toLowerCase();
        const purpose = String(cert.purpose || "").toLowerCase();
        if (
          !name.includes(q) &&
          !email.includes(q) &&
          !id.includes(q) &&
          !natId.includes(q) &&
          !irembo.includes(q) &&
          !purpose.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [
    allCertificates,
    certDoctorFilter,
    certStatusFilter,
    certDatePreset,
    certStartDate,
    certEndDate,
    certSearch,
  ]);

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
        const staffRes = await fetch("/api/admin/staff", { credentials: "include" });
        if (staffRes.status === 401) {
          error("Session expired", "Please sign in again to access the admin portal.");
          window.location.href = `/signin?expired=1&next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
          return;
        }
        const staffData = await staffRes.json();
        if (staffData.success) {
          const doctors = Array.isArray(staffData.doctors) ? staffData.doctors : [];
          setVerifiedDoctors(
            doctors
              .filter((d: { status?: string }) => d.status !== "Pending")
              .map((d: any) => ({
                id: d.id,
                doctorId: d.doctorId,
                name: d.name,
                email: d.email,
                phone: d.phone || "",
                role: d.role,
                specialty: d.specialty || d.role,
                license: d.license,
                licenseExpiryDate: d.licenseExpiryDate || "",
                status: d.status,
                avatarUrl: d.avatarUrl || "",
                nationalIdUrl: d.nationalIdUrl || "",
                licenseCertificateUrl: d.licenseCertificateUrl || "",
                diplomaUrl: d.diplomaUrl || "",
              }))
          );
          setPendingDoctors(
            doctors
              .filter((d: { status?: string }) => d.status === "Pending")
              .map((d: any) => ({
                id: d.id,
                doctorId: d.doctorId,
                name: d.name,
                email: d.email,
                phone: d.phone || "",
                specialty: d.specialty || d.role,
                license: d.license,
                licenseExpiryDate: d.licenseExpiryDate || "",
                applied: "—",
                status: "Pending License Verification",
                avatarUrl: d.avatarUrl || "",
                nationalIdUrl: d.nationalIdUrl || "",
                licenseCertificateUrl: d.licenseCertificateUrl || "",
                diplomaUrl: d.diplomaUrl || "",
              }))
          );
          setAdminAccounts(
            (staffData.admins || []).map((a: any) => ({
              id: String(a._id || a.id || ""),
              name: a.fullName || a.name || "Admin",
              email: a.email,
              phone: a.phone || "",
              role: a.role || "admin",
              status: a.status || "active",
              avatarUrl: a.avatarUrl || "",
            }))
          );
          setTeamDirectory(
            (staffData.teamMembers || []).map((a: any) => ({
              id: String(a._id || a.id || ""),
              name: a.fullName || a.name || "Team member",
              email: a.email,
              phone: a.phone || "",
              jobTitle: a.jobTitle || "",
              bio: a.bio || "",
              role: a.role || "staff",
              status: a.status || "active",
              avatarUrl: a.avatarUrl || "",
            }))
          );
          if (Array.isArray(staffData.titles) && staffData.titles.length) {
            setStaffTitles(staffData.titles);
          }
        }
      } catch {
        setVerifiedDoctors([]);
        setPendingDoctors([]);
        setAdminAccounts([]);
      }

      try {
        const appRes = await fetch("/api/admin/applicants", { credentials: "include", cache: "no-store" });
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
        const certRes = await fetch("/api/certificates", { credentials: "include", cache: "no-store" });
        const certData = await certRes.json();
        if (certData.success && Array.isArray(certData.certificates)) {
          setAllCertificates(certData.certificates);
          setCertificateRows(
            certData.certificates.map((c: Record<string, unknown>) => {
              const status = String(c.status || "submitted").toLowerCase();
              const decision = String(c.decision || "").toUpperCase();
              const isApproved = ["approved", "valid", "issued"].includes(status);
              const isFit =
                (decision === "FIT" || decision === "FIT_RESTRICTED" || decision.includes("RESTRICT")) &&
                !decision.includes("NOT") &&
                !decision.includes("UNFIT");
              const isPaid = isApproved && isFit && String(c.paymentStatus || "UNPAID").toUpperCase() === "PAID";
              return {
                id: String(c.certificateId || ""),
                applicant: String(c.candidateName || "Applicant"),
                email: String(c.applicantEmail || ""),
                purpose: String(c.purpose || "—"),
                status: String(c.status || "submitted"),
                payment: isPaid ? "PAID" : "UNPAID",
                doctor: displayDoctorName(String(c.assignedDoctor || "")) || "Unassigned",
                date: c.appliedDate ? new Date(String(c.appliedDate)).toLocaleString() : "—",
              };
            })
          );
        } else {
          setAllCertificates([]);
          setCertificateRows([]);
        }
        const payRes = await fetch("/api/payments", { credentials: "include" });
        const payData = await payRes.json();
        if (payData.success && Array.isArray(payData.payments) && payData.payments.length > 0) {
          setTransactions(payData.payments);
        } else if (certData.success && Array.isArray(certData.certificates)) {
          setTransactions(
            certData.certificates.map((c: Record<string, unknown>) => {
              const amount = Number(c.amount) || 5000;
              const statusLower = String(c.status || "submitted").toLowerCase();
              const decision = String(c.decision || "").toUpperCase();
              const isApproved = ["approved", "valid", "issued"].includes(statusLower);
              const isFit =
                (decision === "FIT" || decision === "FIT_RESTRICTED" || decision.includes("RESTRICT")) &&
                !decision.includes("NOT") &&
                !decision.includes("UNFIT");
              const isPaid = isApproved && isFit && String(c.paymentStatus || "UNPAID").toUpperCase() === "PAID";
              const payment = String(c.paymentStatus || "UNPAID").toUpperCase();
              const status = isPaid ? "PAID" : payment === "EXPIRED" ? "EXPIRED" : "WAITING";
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
                doctorName: displayDoctorName(String(c.assignedDoctor || "—")) || "—",
                doctorPayout: Math.round(amount * 0.8),
                platformFee: Math.round(amount * 0.2),
                approvedAt: c.approvedAt ? String(c.approvedAt) : "",
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
        const inqRes = await fetch("/api/contact", { credentials: "include" });
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
        const clinicRes = await fetch("/api/clinics", { credentials: "include" });
        const clinicData = await clinicRes.json();
        setClinics(clinicData.success ? clinicData.clinics || [] : []);
      } catch {
        setClinics([]);
      }

      try {
        const scheduleRes = await fetch("/api/schedules", { credentials: "include" });
        const scheduleData = await scheduleRes.json();
        setDoctorSchedules(scheduleData.success ? scheduleData.schedules || [] : []);
        setPlatformAppointments(scheduleData.success ? scheduleData.appointments || [] : []);
      } catch {
        setDoctorSchedules([]);
        setPlatformAppointments([]);
      }

      try {
        const newsRes = await fetch("/api/admin/newsletter", { credentials: "include" });
        const newsData = await newsRes.json();
        setSubscribers(newsData.success ? newsData.subscribers || [] : []);
      } catch {
        setSubscribers([]);
      }

      try {
        if (adminRefresh === 0) {
        const settingsRes = await fetch("/api/admin/settings", { credentials: "include" });
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
        }
      } catch {
        setAuditLogs([]);
      }
    };

    loadAdminData();
  }, [adminRefresh]);

  useEffect(() => {
    return subscribeLiveRefresh(() => {
      setAdminRefresh((n) => n + 1);
    }, 30000);
  }, []);

  const paidTransactions = transactions.filter((t) => t.status === "PAID");
  const grossRevenue = paidTransactions.reduce((sum, t) => sum + t.amount, 0);
  const purposeRows = (() => {
    const counts = new Map<string, number>();
    for (const t of transactions) {
      const key = t.purpose || "Other";
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    const max = Math.max(1, ...counts.values());
    return [...counts.entries()].map(([purpose, count], index) => ({
      purpose,
      count,
      pct: Math.round((count / max) * 100),
      barClass: PURPOSE_BAR_COLORS[index % PURPOSE_BAR_COLORS.length],
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

  const reportStatusOptions = useMemo(() => {
    if (reportTab === "certificates") return ["ALL", "submitted", "issued", "approved", "pending"];
    if (reportTab === "payments") return ["ALL", "PAID", "WAITING", "EXPIRED"];
    if (reportTab === "applicants") return ["ALL", "Active", "Pending", "Suspended"];
    if (reportTab === "meetings") return ["ALL", "scheduled", "in-progress", "completed", "overdue", "rescheduled"];
    return ["ALL"];
  }, [reportTab]);

  const filteredReportRows = useMemo(() => {
    const q = reportSearch.trim().toLowerCase();
    const matches = (values: (string | undefined | null)[]) => !q || values.some((v) => String(v || "").toLowerCase().includes(q));
    const statusOk = (status: string) =>
      reportStatus === "ALL" || String(status || "").toLowerCase() === reportStatus.toLowerCase();

    if (reportTab === "certificates") {
      return certificateRows
        .filter((row) => statusOk(row.status) && matches([row.id, row.applicant, row.email, row.purpose, row.doctor, row.payment]))
        .map((row) => ({
          key: row.id,
          cells: [row.id, row.applicant, row.email, row.purpose, row.doctor, row.status, row.payment, row.date],
        }));
    }
    if (reportTab === "payments") {
      return transactions
        .filter((row) => statusOk(row.status) && matches([row.certId, row.applicantName, row.applicantEmail, row.purpose, row.doctorName, row.iremboRef]))
        .map((row) => ({
          key: row.id,
          cells: [row.certId, row.applicantName, row.applicantEmail, row.purpose, displayDoctorName(row.doctorName), row.status, `${row.amount.toLocaleString()} FRW`, row.date],
        }));
    }
    if (reportTab === "applicants") {
      return applicants
        .filter((row) => statusOk(row.status) && matches([row.applicantId, row.name, row.email, row.nationalId, row.phone]))
        .map((row) => ({
          key: row.id,
          cells: [row.applicantId || row.id, row.name, row.email, row.phone, row.nationalId || "—", row.status, String(row.certs), row.joined],
        }));
    }
    if (reportTab === "meetings") {
      return platformAppointments
        .filter((row: any) => statusOk(String(row.status || "scheduled")) && matches([row.applicantName, row.applicantEmail, row.doctorName, row.purpose, row.appointmentId]))
        .map((row: any) => ({
          key: String(row.appointmentId || row._id),
          cells: [
            row.appointmentId || "—",
            row.applicantName || "—",
            row.doctorName || "—",
            row.purpose || "—",
            `${row.scheduledDate || "—"} ${row.scheduledTime || ""}`.trim(),
            row.status || "scheduled",
            `${row.durationMinutes || 15} min`,
          ],
        }));
    }
    return recentEvents
      .filter((row) => matches([row.event, row.detail, row.time]))
      .map((row, index) => ({
        key: `${row.time}-${row.event}-${index}`,
        cells: [row.event, row.detail, row.time],
      }));
  }, [reportTab, reportSearch, reportStatus, certificateRows, transactions, applicants, platformAppointments, recentEvents]);

  const reportHeaders =
    reportTab === "certificates"
      ? ["Official No.", "Applicant", "Email", "Purpose", "Doctor", "Status", "Payment", "Date"]
      : reportTab === "payments"
        ? ["Certificate", "Applicant", "Email", "Purpose", "Doctor", "Status", "Amount", "Date"]
        : reportTab === "applicants"
          ? ["Applicant ID", "Name", "Email", "Phone", "National ID", "Status", "Certificates", "Joined"]
          : reportTab === "meetings"
            ? ["Meeting ID", "Applicant", "Doctor", "Purpose", "When", "Status", "Duration"]
            : ["Event", "Detail", "Time"];

  const toggleApplicantStatus = async (id: string, name: string, currentStatus: string, email?: string) => {
    const action = isActiveAccount(currentStatus) ? "suspend" : "activate";
    try {
      const res = await fetch("/api/admin/applicants", {
        credentials: "include",
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
          <div className="bg-white dark:bg-[#0d1f38] rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-50/60 to-transparent dark:from-teal-900/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-[#12B8B0]/15 dark:bg-[#12B8B0]/25 border border-[#12B8B0]/30 dark:border-[#12B8B0]/40 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-[#12B8B0]" />
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                  Live
                </span>
              </div>
              <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Total Certificates</div>
              <div className="text-3xl font-extrabold text-[#0B2D5C] dark:text-slate-100" style={{ fontFamily: "var(--font-primary)" }}>
                {transactions.length.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{grossRevenue.toLocaleString()} FRW</span>
                &nbsp;total revenue
              </div>
            </div>
          </div>

          {/* Card 2: Active Doctors */}
          <div className="bg-white dark:bg-[#0d1f38] rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-50/60 to-transparent dark:from-sky-900/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-sky-100 dark:bg-sky-900/40 border border-sky-200 dark:border-sky-700 flex items-center justify-center">
                  <Stethoscope className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </span>
              </div>
              <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Active Doctors</div>
              <div className="text-3xl font-extrabold text-[#0B2D5C] dark:text-slate-100" style={{ fontFamily: "var(--font-primary)" }}>
                {verifiedDoctors.filter((d) => d.status === "Active").length}
                <span className="text-sm font-semibold text-slate-400 dark:text-slate-500 ml-1">physicians</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-sky-500 dark:text-sky-400" />
                Verified &amp; licensed
              </div>
            </div>
          </div>

          {/* Card 3: Partner Clinics */}
          <div className="bg-white dark:bg-[#0d1f38] rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/60 to-transparent dark:from-indigo-900/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-700 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider">
                  Network
                </span>
              </div>
              <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Partner Clinics</div>
              <div className="text-3xl font-extrabold text-[#0B2D5C] dark:text-slate-100" style={{ fontFamily: "var(--font-primary)" }}>
                {clinics.length}
                <span className="text-sm font-semibold text-slate-400 dark:text-slate-500 ml-1">clinics</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
                Physical exam network
              </div>
            </div>
          </div>

          {/* Card 4: Security Status */}
          <div className="bg-white dark:bg-[#0d1f38] rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/60 to-transparent dark:from-emerald-900/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-700 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Secure
                </span>
              </div>
              <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Security Status</div>
              <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400" style={{ fontFamily: "var(--font-primary)" }}>
                Protected
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                Signed sessions and role access
              </div>
            </div>
          </div>
        </div>

        {/* Top Tab Bar */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-4 flex-wrap">
          {[
            { id: "overview",     label: "System Analytics" },
            { id: "reports",      label: `Assessment Reports (${allCertificates.length})` },
            { id: "certificates", label: `Issued Certificates (${allCertificates.filter(c => ["valid", "approved", "issued"].includes(String(c.status || "").toLowerCase())).length})` },
            { id: "users",        label: `Users Management (${applicants.length})` },
            { id: "doctors",      label: `Doctor Accounts (${pendingDoctors.length + verifiedDoctors.length})` },
            { id: "payments",     label: `Payments (${transactions.length})` },
            { id: "inquiries",    label: `Contact Inquiries (${inquiries.filter(i => i.status === 'New').length} New)` },
            { id: "clinics",      label: `Partner Clinics (${clinics.length})` },
            { id: "schedules",    label: `Schedules (${platformAppointments.length})` },
            { id: "newsletter",   label: `News (${subscribers.length})` },
            { id: "revenue",      label: "Revenue & Payouts" },
            { id: "security",     label: "Privacy & activity log" },
            { id: "settings",     label: "Governance Settings" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => goToNav(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeNav === tab.id
                  ? "bg-[#0B2D5C] dark:bg-[#12B8B0] text-white dark:text-[#0B2D5C] shadow-md"
                  : "bg-white dark:bg-[#0d1f38] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
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

              <div className="bg-white dark:bg-[#0d1e30] rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-[#12B8B0]/20 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-[#12B8B0]/10 border border-teal-200 dark:border-[#12B8B0]/30 flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#12B8B0]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </div>
                  <h3 className="text-lg font-bold text-[#0B2D5C] dark:text-slate-100">Certificate security</h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Issued certificates can be checked with a QR code so employers know they are genuine.
                </p>
                <div className="p-4 rounded-2xl bg-teal-50 dark:bg-[#091628] border border-teal-200 dark:border-slate-700 text-xs text-teal-700 dark:text-[#12B8B0]">
                  System status: <span className="font-bold">Online</span><br />
                  Last check: {auditLogs[0]?.time || "—"}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: ASSESSMENT REPORTS (CONSOLIDATED ACROSS ALL DOCTORS) ── */}
        {activeNav === "reports" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header & Export */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-[#12B8B0] text-[10px] font-extrabold uppercase tracking-wider">
                    Consolidated Clinical Intelligence
                  </span>
                  <span className="text-xs text-slate-400 font-bold">
                    {filteredAssessmentReports.length} {filteredAssessmentReports.length === 1 ? "Record" : "Records"}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B2D5C] mt-1" style={{ fontFamily: "var(--font-primary)" }}>
                  Doctor Clinical Assessment Reports
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Consolidated clinical evaluations, screening answers, vital signs, red-flag screening, and certification decisions across all FitMed physicians.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    const headers = [
                      "Certificate ID",
                      "Candidate Name",
                      "National ID",
                      "Email",
                      "Purpose",
                      "Evaluating Doctor",
                      "Doctor License",
                      "Assessment Date",
                      "Clinical Decision",
                      "Decision Reason / Notes",
                      "Restrictions",
                      "Blood Pressure",
                      "Heart Rate",
                      "SpO2",
                      "BMI",
                    ];
                    const rows = filteredAssessmentReports.map((c) => [
                      c.certificateId || "",
                      c.candidateName || "",
                      c.candidateIdNumber || "",
                      c.applicantEmail || "",
                      c.purpose || "",
                      displayDoctorName(c.assignedDoctor || ""),
                      c.assignedDoctorLicense || "",
                      c.structuredAssessment?.consultationDate || c.appliedDate ? new Date(c.structuredAssessment?.consultationDate || c.appliedDate).toLocaleDateString() : "",
                      c.decision || c.structuredAssessment?.decision || "PENDING",
                      c.decisionNotes || c.notes || "",
                      c.restrictions || "",
                      c.vitals?.bloodPressure || c.structuredAssessment?.vitals?.bp || "",
                      c.vitals?.heartRate || c.structuredAssessment?.vitals?.heartRate || "",
                      c.vitals?.spo2 || c.structuredAssessment?.vitals?.spo2 || "",
                      c.vitals?.bmi || c.structuredAssessment?.vitals?.bmi || "",
                    ]);
                    downloadCsv(`fitmed_assessment_reports_${new Date().toISOString().split("T")[0]}.csv`, headers, rows);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-[#0B2D5C] text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Comprehensive Multi-Filter Bar */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-xs font-extrabold text-[#0B2D5C] uppercase tracking-wider">
                  <Filter className="w-4 h-4 text-[#12B8B0]" />
                  <span>Multi-Doctor &amp; Clinical Filters</span>
                </div>
                {(assessmentDoctorFilter !== "ALL" || assessmentStatusFilter !== "ALL" || assessmentDatePreset !== "ALL" || assessmentSearch.trim() || assessmentStartDate || assessmentEndDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setAssessmentDoctorFilter("ALL");
                      setAssessmentStatusFilter("ALL");
                      setAssessmentDatePreset("ALL");
                      setAssessmentStartDate("");
                      setAssessmentEndDate("");
                      setAssessmentSearch("");
                    }}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset all filters</span>
                  </button>
                )}
              </div>

              {/* Filter controls row 1: Doctor, Decision, Date Preset */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* 1. Doctor Filter */}
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                    Evaluating Doctor
                  </label>
                  <BrandSelect
                    value={assessmentDoctorFilter}
                    onChange={setAssessmentDoctorFilter}
                    options={[
                      { value: "ALL", label: `All Doctors (${allDoctorOptions.length})` },
                      ...allDoctorOptions.map((doc) => ({
                        value: doc,
                        label: `Dr. ${doc.replace(/^Dr\.\s*/i, "")}`,
                      })),
                    ]}
                  />
                </div>

                {/* 2. Clinical Decision Filter */}
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                    Clinical Decision &amp; Status
                  </label>
                  <BrandSelect
                    value={assessmentStatusFilter}
                    onChange={setAssessmentStatusFilter}
                    options={[
                      { value: "ALL", label: "All Decisions & Statuses" },
                      { value: "FIT", label: "FIT — Certified Requirements Met" },
                      { value: "FIT_RESTRICTED", label: "FIT WITH RESTRICTIONS" },
                      { value: "PHYSICAL_CONSULTATION", label: "PHYSICAL CONSULTATION REQUIRED" },
                      { value: "INVESTIGATION_SPECIALIST", label: "SPECIALIST / LAB REQUIRED" },
                      { value: "URGENT_REFERRAL", label: "URGENT MEDICAL REFERRAL" },
                      { value: "NOT_FIT", label: "NOT FIT / DECLINED" },
                      { value: "PENDING", label: "PENDING CLINICAL EVALUATION" },
                    ]}
                  />
                </div>

                {/* 3. Calendar Preset */}
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                    Calendar Range Filter
                  </label>
                  <BrandSelect
                    value={assessmentDatePreset}
                    onChange={(v) => setAssessmentDatePreset(v as any)}
                    options={[
                      { value: "ALL", label: "All Time (Entire History)" },
                      { value: "TODAY", label: "Today" },
                      { value: "WEEK", label: "Last 7 Days" },
                      { value: "MONTH", label: "Last 30 Days" },
                      { value: "CUSTOM", label: "Custom Date Range…" },
                    ]}
                  />
                </div>
              </div>

              {/* Filter controls row 2: Custom Date Pickers & Search */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
                {assessmentDatePreset === "CUSTOM" && (
                  <>
                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                        From Date
                      </label>
                      <BrandDatePicker value={assessmentStartDate} onChange={setAssessmentStartDate} preset="any" />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                        To Date
                      </label>
                      <BrandDatePicker value={assessmentEndDate} onChange={setAssessmentEndDate} preset="any" />
                    </div>
                  </>
                )}

                <div className={assessmentDatePreset === "CUSTOM" ? "sm:col-span-6" : "sm:col-span-12"}>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                    Search Candidate, Doctor, Certificate ID or Notes
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Type patient name, certificate ID (e.g. FM-2026-00001), national ID or keyword..."
                      value={assessmentSearch}
                      onChange={(e) => setAssessmentSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#12B8B0]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Assessment Metrics Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Filtered</div>
                <div className="text-2xl font-black text-[#0B2D5C] mt-1">{filteredAssessmentReports.length}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Evaluated assessments</div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-sm bg-emerald-50/20">
                <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Fit Clearances</div>
                <div className="text-2xl font-black text-emerald-700 mt-1">
                  {filteredAssessmentReports.filter((c) => (c.decision === "FIT" || c.decision === "FIT_RESTRICTED" || c.status === "approved" || c.status === "valid" || c.status === "issued")).length}
                </div>
                <div className="text-[11px] text-emerald-700/80 mt-0.5">Approved certificates</div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-orange-200 shadow-sm bg-orange-50/20">
                <div className="text-[10px] font-bold text-orange-800 uppercase tracking-wider">Physical / Specialist</div>
                <div className="text-2xl font-black text-orange-700 mt-1">
                  {filteredAssessmentReports.filter((c) => (c.decision === "PHYSICAL_CONSULTATION" || c.decision === "INVESTIGATION_SPECIALIST" || c.status === "physical check up requested" || c.status === "specialist-referral")).length}
                </div>
                <div className="text-[11px] text-orange-700/80 mt-0.5">Further exams required</div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-sm bg-rose-50/20">
                <div className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">Urgent &amp; Declined</div>
                <div className="text-2xl font-black text-rose-700 mt-1">
                  {filteredAssessmentReports.filter((c) => (c.decision === "URGENT_REFERRAL" || c.decision === "NOT_FIT" || c.status === "rejected" || c.status === "urgent-referral")).length}
                </div>
                <div className="text-[11px] text-rose-700/80 mt-0.5">Escalations &amp; un-fit</div>
              </div>
            </div>

            {/* Assessment Records Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[900px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">
                      <th className="py-3.5 px-4">Certificate ID</th>
                      <th className="py-3.5 px-4">Applicant / Patient</th>
                      <th className="py-3.5 px-4">Evaluating Doctor</th>
                      <th className="py-3.5 px-4">Consultation Date</th>
                      <th className="py-3.5 px-4">Clinical Decision</th>
                      <th className="py-3.5 px-4">Vitals &amp; Red Flags</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAssessmentReports.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <FileText className="w-8 h-8 text-slate-300" />
                            <p className="font-bold text-slate-600">No clinical assessment records match your filters.</p>
                            <p className="text-[11px] text-slate-400">Try changing the selected doctor, date range, or search keyword.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredAssessmentReports.map((cert) => {
                        const decision = cert.decision || cert.structuredAssessment?.decision || "PENDING";
                        const docName = displayDoctorName(cert.assignedDoctor || "FitMed Physician");
                        const dateStr = cert.structuredAssessment?.consultationDate || cert.appliedDate || cert.issuedAt || cert.createdAt;
                        const formattedDate = dateStr ? new Date(dateStr).toLocaleDateString() : "—";
                        const hasRedFlags = Boolean(cert.structuredAssessment?.redFlags && Object.values(cert.structuredAssessment.redFlags).some(Boolean));
                        const bp = cert.vitals?.bloodPressure || cert.structuredAssessment?.vitals?.bp || "—";
                        const hr = cert.vitals?.heartRate || cert.structuredAssessment?.vitals?.heartRate || "—";
                        const spo2 = cert.vitals?.spo2 || cert.structuredAssessment?.vitals?.spo2 || "—";

                        // Decision badge styling
                        let decBadgeClass = "bg-slate-100 text-slate-700 border-slate-200";
                        let decLabel = decision;
                        if (decision === "FIT") {
                          decBadgeClass = "bg-emerald-100 text-emerald-800 border-emerald-300";
                          decLabel = "FIT (Requirements Met)";
                        } else if (decision === "FIT_RESTRICTED") {
                          decBadgeClass = "bg-teal-100 text-teal-800 border-teal-300";
                          decLabel = "FIT WITH RESTRICTIONS";
                        } else if (decision === "PHYSICAL_CONSULTATION" || cert.status === "physical check up requested") {
                          decBadgeClass = "bg-orange-100 text-orange-900 border-orange-300";
                          decLabel = "PHYSICAL CONSULTATION REQ.";
                        } else if (decision === "INVESTIGATION_SPECIALIST" || cert.status === "specialist-referral") {
                          decBadgeClass = "bg-indigo-100 text-indigo-900 border-indigo-300";
                          decLabel = "SPECIALIST INVESTIGATION";
                        } else if (decision === "URGENT_REFERRAL" || cert.status === "urgent-referral") {
                          decBadgeClass = "bg-rose-100 text-rose-800 border-rose-300";
                          decLabel = "URGENT MEDICAL REFERRAL";
                        } else if (decision === "NOT_FIT" || decision === "UNFIT" || cert.status === "rejected") {
                          decBadgeClass = "bg-rose-100 text-rose-800 border-rose-300";
                          decLabel = "NOT FIT / DECLINED";
                        } else {
                          decBadgeClass = "bg-sky-100 text-sky-800 border-sky-300";
                          decLabel = "UNDER REVIEW / PENDING";
                        }

                        return (
                          <tr key={cert._id || cert.certificateId} className="hover:bg-slate-50/60 transition-colors text-slate-700">
                            {/* Certificate ID */}
                            <td className="py-3.5 px-4 font-mono font-bold text-[#0B2D5C]">
                              {cert.certificateId || "—"}
                            </td>

                            {/* Applicant Info */}
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-[#0B2D5C]">{cert.candidateName || "Applicant"}</div>
                              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                                <span>ID: <strong className="font-mono">{cert.candidateIdNumber || "—"}</strong></span>
                                <span>·</span>
                                <span>{cert.purpose || "Medical fitness"}</span>
                              </div>
                            </td>

                            {/* Evaluating Doctor */}
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                <Stethoscope className="w-3.5 h-3.5 text-[#12B8B0]" />
                                <span>{docName}</span>
                              </div>
                              <div className="text-[11px] text-slate-400">
                                License: {cert.assignedDoctorLicense || "RW-RMDC-4091"}
                              </div>
                            </td>

                            {/* Consultation Date */}
                            <td className="py-3.5 px-4 text-slate-600 font-medium">
                              {formattedDate}
                            </td>

                            {/* Clinical Decision */}
                            <td className="py-3.5 px-4">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${decBadgeClass}`}>
                                {decLabel}
                              </span>
                              {cert.restrictions && (
                                <div className="text-[10px] text-amber-800 font-semibold mt-1 max-w-[180px] truncate" title={cert.restrictions}>
                                  Conditions: {cert.restrictions}
                                </div>
                              )}
                            </td>

                            {/* Vitals & Red Flags */}
                            <td className="py-3.5 px-4">
                              <div className="text-[11px] font-mono text-slate-600 space-y-0.5">
                                <div>BP: <strong>{bp}</strong> · HR: <strong>{hr}</strong></div>
                                <div>SpO2: <strong>{spo2}</strong></div>
                              </div>
                              {hasRedFlags && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[9px] font-bold mt-1">
                                  <AlertCircle className="w-2.5 h-2.5" /> Red flags reported
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => setSelectedAssessmentDoc(cert)}
                                className="px-3 py-1.5 rounded-xl bg-[#0B2D5C] hover:bg-slate-800 text-white font-bold text-xs transition-colors flex items-center gap-1.5 ml-auto shadow-sm"
                              >
                                <Eye className="w-3.5 h-3.5 text-[#12B8B0]" />
                                <span>View Report</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: ISSUED CERTIFICATES (CONSOLIDATED ACROSS ALL DOCTORS) ── */}
        {activeNav === "certificates" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header & Export */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-extrabold uppercase tracking-wider">
                    Official Digital Registry
                  </span>
                  <span className="text-xs text-slate-400 font-bold">
                    {filteredIssuedCertificates.length} {filteredIssuedCertificates.length === 1 ? "Certificate" : "Certificates"}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B2D5C] mt-1" style={{ fontFamily: "var(--font-primary)" }}>
                  Issued Medical Fitness Certificates
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Consolidated registry of all issued, verified, and active digital certificates signed across all FitMed physicians.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    const headers = [
                      "Certificate ID",
                      "Candidate Name",
                      "National ID",
                      "Applicant Email",
                      "Purpose",
                      "Category",
                      "Issuing Doctor",
                      "Doctor License",
                      "Issue Date",
                      "Expiry Date",
                      "Payment Status",
                      "Certificate Status",
                      "Irembo Ref",
                      "SHA256 Hash",
                    ];
                    const rows = filteredIssuedCertificates.map((c) => [
                      c.certificateId || "",
                      c.candidateName || "",
                      c.candidateIdNumber || "",
                      c.applicantEmail || "",
                      c.purpose || "",
                      c.category || "",
                      displayDoctorName(c.assignedDoctor || ""),
                      c.assignedDoctorLicense || "",
                      c.issuedAt || c.appliedDate ? new Date(c.issuedAt || c.appliedDate).toLocaleDateString() : "",
                      c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "",
                      c.paymentStatus || "UNPAID",
                      c.status || "submitted",
                      c.iremboRef || "",
                      c.sha256Hash || "",
                    ]);
                    downloadCsv(`fitmed_issued_certificates_${new Date().toISOString().split("T")[0]}.csv`, headers, rows);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-[#0B2D5C] text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Export Registry CSV</span>
                </button>
              </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-xs font-extrabold text-[#0B2D5C] uppercase tracking-wider">
                  <Filter className="w-4 h-4 text-[#12B8B0]" />
                  <span>Filter Registry Records</span>
                </div>
                {(certDoctorFilter !== "ALL" || certStatusFilter !== "ALL" || certDatePreset !== "ALL" || certSearch.trim() || certStartDate || certEndDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setCertDoctorFilter("ALL");
                      setCertStatusFilter("ALL");
                      setCertDatePreset("ALL");
                      setCertStartDate("");
                      setCertEndDate("");
                      setCertSearch("");
                    }}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset filters</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* 1. Doctor Filter */}
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                    Issuing Physician
                  </label>
                  <BrandSelect
                    value={certDoctorFilter}
                    onChange={setCertDoctorFilter}
                    options={[
                      { value: "ALL", label: `All Doctors (${allDoctorOptions.length})` },
                      ...allDoctorOptions.map((doc) => ({
                        value: doc,
                        label: `Dr. ${doc.replace(/^Dr\.\s*/i, "")}`,
                      })),
                    ]}
                  />
                </div>

                {/* 2. Status & Payment Filter */}
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                    Status &amp; Payment State
                  </label>
                  <BrandSelect
                    value={certStatusFilter}
                    onChange={setCertStatusFilter}
                    options={[
                      { value: "ALL", label: "All Certificate States" },
                      { value: "PAID", label: "Valid & Paid (Unlocked)" },
                      { value: "APPROVED_UNPAID", label: "Approved — Awaiting Payment" },
                      { value: "VALID", label: "Valid Certificates Only" },
                      { value: "EXPIRED", label: "Expired Certificates" },
                      { value: "REVOKED", label: "Revoked Certificates" },
                      { value: "REJECTED", label: "Declined / Rejected Applications" },
                    ]}
                  />
                </div>

                {/* 3. Calendar Preset */}
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                    Issued Date Filter
                  </label>
                  <BrandSelect
                    value={certDatePreset}
                    onChange={(v) => setCertDatePreset(v as any)}
                    options={[
                      { value: "ALL", label: "All Time" },
                      { value: "TODAY", label: "Issued Today" },
                      { value: "WEEK", label: "Issued in Last 7 Days" },
                      { value: "MONTH", label: "Issued in Last 30 Days" },
                      { value: "CUSTOM", label: "Custom Date Range…" },
                    ]}
                  />
                </div>
              </div>

              {/* Custom Date Pickers & Search */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
                {certDatePreset === "CUSTOM" && (
                  <>
                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                        Issued After
                      </label>
                      <BrandDatePicker value={certStartDate} onChange={setCertStartDate} preset="any" />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                        Issued Before
                      </label>
                      <BrandDatePicker value={certEndDate} onChange={setCertEndDate} preset="any" />
                    </div>
                  </>
                )}

                <div className={certDatePreset === "CUSTOM" ? "sm:col-span-6" : "sm:col-span-12"}>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                    Search Certificate ID, Name, National ID or Irembo Ref
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search certificate ID (FM-2026-00001), applicant name, Irembo ref or national ID..."
                      value={certSearch}
                      onChange={(e) => setCertSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#12B8B0]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Issued Certificates Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[950px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">
                      <th className="py-3.5 px-4">Certificate ID</th>
                      <th className="py-3.5 px-4">Candidate Details</th>
                      <th className="py-3.5 px-4">Purpose &amp; Category</th>
                      <th className="py-3.5 px-4">Issuing Doctor</th>
                      <th className="py-3.5 px-4">Issued &amp; Expiry</th>
                      <th className="py-3.5 px-4">Payment &amp; Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredIssuedCertificates.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <FileSignature className="w-8 h-8 text-slate-300" />
                            <p className="font-bold text-slate-600">No issued certificates match your filters.</p>
                            <p className="text-[11px] text-slate-400">Try selecting another physician, status or adjusting the calendar date range.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredIssuedCertificates.map((cert) => {
                        const docName = displayDoctorName(cert.assignedDoctor || "FitMed Physician");
                        const isPaid = cert.paymentStatus === "PAID";
                        const issueDate = cert.issuedAt || cert.appliedDate ? new Date(cert.issuedAt || cert.appliedDate).toLocaleDateString() : "—";
                        const expiryDate = cert.expiresAt ? new Date(cert.expiresAt).toLocaleDateString() : "—";
                        const isBusy = certStatusBusy === cert.certificateId;

                        const patchCertAdmin = async (body: Record<string, unknown>) => {
                          setCertStatusBusy(cert.certificateId);
                          try {
                            const res = await fetch("/api/certificates", {
                              credentials: "include",
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ certificateId: cert.certificateId, actor: "admin", ...body }),
                            });
                            const data = await res.json();
                            if (!data.success) throw new Error(data.error || "Update failed");
                            setAllCertificates((prev) =>
                              prev.map((c) =>
                                c.certificateId === cert.certificateId
                                  ? { ...c, ...body }
                                  : c
                              )
                            );
                            setCertificateRows((prev) =>
                              prev.map((c) =>
                                c.id === cert.certificateId
                                  ? { ...c, status: (body.status as string) ?? c.status }
                                  : c
                              )
                            );
                            success(
                              "Certificate status updated",
                              `${cert.candidateName} — ${String(body.status || "").replace(/-/g, " ")}`
                            );
                          } catch (e: any) {
                            error("Update failed", e.message || "Could not update certificate.");
                          } finally {
                            setCertStatusBusy(null);
                          }
                        };

                        return (
                          <tr key={cert._id || cert.certificateId} className="hover:bg-slate-50/60 transition-colors text-slate-700">
                            {/* ID & Hash */}
                            <td className="py-3.5 px-4 font-mono font-bold text-[#0B2D5C]">
                              <div className="flex items-center gap-1.5">
                                <span>{cert.certificateId || "—"}</span>
                              </div>
                              {cert.sha256Hash && (
                                <div className="text-[9px] text-slate-400 font-mono truncate max-w-[120px]" title={cert.sha256Hash}>
                                  hash: {cert.sha256Hash.slice(0, 10)}…
                                </div>
                              )}
                            </td>

                            {/* Candidate */}
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-[#0B2D5C]">{cert.candidateName || "Applicant"}</div>
                              <div className="text-[11px] text-slate-500">
                                ID: <strong className="font-mono">{cert.candidateIdNumber || "—"}</strong>
                              </div>
                              <div className="text-[10px] text-slate-400">{cert.applicantEmail}</div>
                            </td>

                            {/* Purpose & Category */}
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-slate-800">{cert.purpose || "General Fitness"}</div>
                              <div className="text-[10px] text-teal-700 font-medium">
                                {cert.category || cert.jobType || "Standard Certificate"}
                              </div>
                            </td>

                            {/* Issuing Doctor */}
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                <Stethoscope className="w-3.5 h-3.5 text-[#12B8B0]" />
                                <span>{docName}</span>
                              </div>
                              <div className="text-[11px] text-slate-400">
                                License: {cert.assignedDoctorLicense || "RW-RMDC-4091"}
                              </div>
                            </td>

                            {/* Dates */}
                            <td className="py-3.5 px-4 text-[11px]">
                              <div>Issued: <strong>{issueDate}</strong></div>
                              <div className="text-slate-500">Expires: {expiryDate}</div>
                            </td>

                            {/* Payment & Status */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                                  isPaid
                                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                    : "bg-amber-100 text-amber-800 border-amber-300"
                                }`}>
                                  {isPaid ? "PAID (5,000 FRW)" : "PAYMENT DUE"}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                                  cert.status === "approved" || cert.status === "valid" || cert.status === "issued"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : cert.status === "rejected"
                                    ? "bg-rose-100 text-rose-800 border-rose-300"
                                    : "bg-sky-50 text-sky-700 border-sky-200"
                                }`}>
                                  {cert.status}
                                </span>
                              </div>
                              {cert.iremboRef && (
                                <div className="text-[10px] text-teal-800 font-mono mt-1 font-semibold">
                                  Ref: {cert.iremboRef}
                                </div>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => setSelectedCertPreview(cert)}
                                  className="px-2.5 py-1.5 rounded-lg bg-[#0B2D5C] hover:bg-slate-800 text-white font-bold text-[11px] transition-colors flex items-center gap-1 shadow-sm"
                                  title="View Official Certificate Preview"
                                >
                                  <Eye className="w-3.5 h-3.5 text-[#12B8B0]" />
                                  <span>Preview</span>
                                </button>

                                {cert.status !== "revoked" && (
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={async () => {
                                      const ok = await confirm({
                                        title: "Revoke Certificate",
                                        message: `Are you sure you want to revoke certificate ${cert.certificateId}?`,
                                        confirmLabel: "Revoke Certificate",
                                        cancelLabel: "Cancel",
                                        variant: "danger",
                                      });
                                      if (ok) {
                                        patchCertAdmin({ status: "revoked", decisionNotes: "Revoked by platform administrator." });
                                      }
                                    }}
                                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-rose-600 disabled:opacity-30 transition-colors"
                                    title="Revoke Certificate"
                                  >
                                    <Ban className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: USERS MANAGEMENT ── */}
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
                          <span className="font-mono text-[10px] text-slate-500 font-bold">{applicant.applicantId || applicant.id}</span>
                        </div>
                        <div className="text-slate-600 flex flex-wrap items-center gap-3">
                          <span>Email: <strong>{applicant.email}</strong></span>
                          <span>·</span>
                          <span>Phone: <strong>{applicant.phone}</strong></span>
                          <span>·</span>
                          <span>National ID: <strong className="font-mono text-[#0B2D5C]">{applicant.nationalId}</strong></span>
                        </div>
                        <div className="text-[11px] text-amber-900 font-semibold flex items-center gap-2 flex-wrap pt-0.5">
                          <span>Submitted: {applicant.applied}</span>
                          {applicant.idDocUrl ? (
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedDocPreview({
                                  url: applicant.idDocUrl!,
                                  title: `${applicant.name} — National ID`,
                                  subtitle: `Applicant ID: ${applicant.applicantId || applicant.id} · National ID: ${applicant.nationalId}`,
                                  badge: "Pending Applicant ID",
                                  badgeColor: "amber",
                                })
                              }
                              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300 hover:bg-blue-200 transition-colors cursor-pointer"
                              title="Preview National ID within Dashboard"
                            >
                              <IdCard className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                              <span>Preview ID</span>
                              <Eye className="w-3 h-3 text-blue-600 shrink-0" />
                            </button>
                          ) : (
                            <span className="text-slate-400 italic">· No ID attached</span>
                          )}
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
                        <button
                          type="button"
                          onClick={() => {
                            setRejectTarget(applicant);
                            setRejectReason("");
                          }}
                          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject</span>
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
                        <div className="font-bold text-[#0B2D5C]">{p.name} <span className="text-slate-400 font-normal font-mono">({p.applicantId || p.id})</span></div>
                        <div className="text-slate-500 flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{p.email}</span>
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{p.phone}</span>
                          <span className="flex items-center gap-1"><IdCard className="w-3 h-3" />{p.nationalId}</span>
                        </div>
                        <div className="text-slate-400 mt-0.5">Joined: {p.joined} · Certificates: <strong>{p.certs}</strong></div>
                        <div className="flex flex-wrap gap-1.5 pt-1.5">
                          {p.idDocUrl ? (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                setSelectedDocPreview({
                                  url: p.idDocUrl!,
                                  title: `${p.name} — National ID`,
                                  subtitle: `Applicant ID: ${p.applicantId || p.id} · National ID: ${p.nationalId}`,
                                  badge: "Applicant National ID",
                                  badgeColor: "blue",
                                });
                              }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300 hover:bg-blue-200 transition-colors cursor-pointer"
                              title="Preview National ID within Dashboard"
                            >
                              <IdCard className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                              <span>National ID</span>
                              <Eye className="w-3 h-3 text-blue-600 shrink-0" />
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium text-slate-400 bg-slate-50 border border-slate-200">
                              <IdCard className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>No ID Uploaded</span>
                            </span>
                          )}
                        </div>
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
                    <div key={admin.email} className="flex items-center justify-between text-xs gap-3 py-1.5 border-b border-white/5 last:border-0">
                      <div>
                        <span className="font-bold text-white">{admin.name}</span>
                        <span className="text-slate-300 ml-2 text-[11px] truncate">{admin.email}</span>
                        {admin.phone && <span className="text-slate-400 ml-2 text-[10px]">· {admin.phone}</span>}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setEditingStaff({
                              id: admin.id,
                              name: admin.name,
                              email: admin.email,
                              phone: admin.phone || "",
                              role: "admin",
                              status: admin.status || "active",
                              avatarUrl: admin.avatarUrl || "",
                            })
                          }
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
                          title="Edit Administrator"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-[#12B8B0]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteStaffMember(admin.id, admin.name, "Administrator")}
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Delete Administrator"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {teamDirectory.length > 0 && (
                <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-2">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#12B8B0]">About Us team ({teamDirectory.length})</div>
                  {teamDirectory.map((member) => (
                    <div key={member.email} className="flex items-center justify-between text-xs gap-3 py-1.5 border-b border-white/5 last:border-0">
                      <div>
                        <span className="font-bold text-white">{member.name}</span>
                        <span className="text-slate-300 ml-2 text-[11px] truncate">{member.jobTitle || member.email}</span>
                        {member.phone && <span className="text-slate-400 ml-2 text-[10px]">· {member.phone}</span>}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setEditingStaff({
                              id: member.id,
                              name: member.name,
                              email: member.email,
                              phone: member.phone || "",
                              role: "staff",
                              jobTitle: member.jobTitle || "",
                              bio: member.bio || "",
                              status: member.status || "active",
                              avatarUrl: member.avatarUrl || "",
                            })
                          }
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
                          title="Edit Team Member"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-[#12B8B0]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteStaffMember(member.id, member.name, "Team Member")}
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Delete Team Member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {showAddDoctor && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setCreatingStaff(true);
                    setCreatingStaffStep("Preparing documents...");
                    try {
                      let finalAvatar = addDoctorForm.avatarUrl;
                      let finalNationalIdUrl = "";
                      let finalLicenseCertUrl = "";
                      let finalDiplomaUrl = "";

                      // Upload avatar & credential documents sequentially to avoid Cloudinary rate limits (429)
                      if (doctorWebpResult) {
                        setCreatingStaffStep("Uploading profile photo...");
                        const avatarUpload = await uploadToCloudinary(doctorWebpResult.file, "fitmed/doctors");
                        if (!avatarUpload.url) throw new Error(avatarUpload.error || "Failed to upload profile photo.");
                        finalAvatar = avatarUpload.url;
                        await new Promise((r) => setTimeout(r, 200));
                      }

                      if (doctorNationalIdFile) {
                        setCreatingStaffStep("Uploading National ID...");
                        const nationalIdUpload = await uploadToCloudinary(doctorNationalIdFile, "fitmed/doctor-documents");
                        if (!nationalIdUpload.url) throw new Error(nationalIdUpload.error || "Failed to upload National ID.");
                        finalNationalIdUrl = nationalIdUpload.url;
                        await new Promise((r) => setTimeout(r, 200));
                      }

                      if (addDoctorForm.role === "doctor" && doctorLicenseFile) {
                        setCreatingStaffStep("Uploading License Certificate...");
                        const licenseUpload = await uploadToCloudinary(doctorLicenseFile, "fitmed/doctor-documents");
                        if (!licenseUpload.url) throw new Error(licenseUpload.error || "Failed to upload License Certificate.");
                        finalLicenseCertUrl = licenseUpload.url;
                        await new Promise((r) => setTimeout(r, 200));
                      }

                      if (doctorDiplomaFile) {
                        setCreatingStaffStep(addDoctorForm.role === "doctor" ? "Uploading Medical Diploma..." : "Uploading Diploma...");
                        const diplomaUpload = await uploadToCloudinary(doctorDiplomaFile, "fitmed/doctor-documents");
                        if (!diplomaUpload.url) throw new Error(diplomaUpload.error || "Failed to upload Diploma.");
                        finalDiplomaUrl = diplomaUpload.url;
                        await new Promise((r) => setTimeout(r, 200));
                      }

                      setCreatingStaffStep("Creating account...");
                      const res = await fetch("/api/admin/staff", {
                        credentials: "include",
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          role: addDoctorForm.role,
                          name: addDoctorForm.name,
                          email: addDoctorForm.email,
                          license: addDoctorForm.license,
                          licenseExpiryDate: addDoctorForm.licenseExpiryDate || undefined,
                          specialty: addDoctorForm.specialty,
                          phone: addDoctorForm.phone,
                          password: addDoctorForm.password || undefined,
                          avatarUrl: finalAvatar,
                          nationalIdUrl: finalNationalIdUrl || undefined,
                          licenseCertificateUrl: finalLicenseCertUrl || undefined,
                          diplomaUrl: finalDiplomaUrl || undefined,
                          jobTitle: addDoctorForm.jobTitle === "__new__" ? "" : addDoctorForm.jobTitle,
                          newTitle: addDoctorForm.newTitle,
                          bio: addDoctorForm.bio,
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
                            email: addDoctorForm.email,
                            phone: addDoctorForm.phone,
                            role: addDoctorForm.specialty || "Clinical Evaluator",
                            specialty: addDoctorForm.specialty || "Clinical Evaluator",
                            license: addDoctorForm.license,
                            licenseExpiryDate: addDoctorForm.licenseExpiryDate,
                            status: "Active",
                          },
                        ]);
                      } else if (addDoctorForm.role === "staff") {
                        setTeamDirectory((prev) => [
                          ...prev,
                          {
                            id: data.user.id,
                            name: addDoctorForm.name,
                            email: addDoctorForm.email.toLowerCase(),
                            phone: addDoctorForm.phone,
                            jobTitle: addDoctorForm.newTitle || addDoctorForm.jobTitle,
                            bio: addDoctorForm.bio,
                            role: "staff",
                            status: "active",
                          },
                        ]);
                      } else {
                        setAdminAccounts((prev) => [
                          {
                            id: data.user.id,
                            name: addDoctorForm.name,
                            email: addDoctorForm.email.toLowerCase(),
                            phone: addDoctorForm.phone,
                            role: "admin",
                            status: "active",
                          },
                          ...prev,
                        ]);
                      }
                      const extra =
                        addDoctorForm.role === "staff"
                          ? " They will appear on the About Us team page."
                          : data.oneTimePassword
                            ? " We emailed them a first-time sign-in password."
                            : " They can sign in with the password you set.";
                      success(
                        "Account created",
                        addDoctorForm.role === "staff"
                          ? `${addDoctorForm.name} was added to the FitMed team directory.${extra}`
                          : `${addDoctorForm.name} can now sign in as ${addDoctorForm.role === "admin" ? "an administrator" : "a doctor"}.${extra}`
                      );
                      setAdminRefresh((n) => n + 1);
                      setShowAddDoctor(false);
                      setAddDoctorForm({
                        role: "doctor",
                        name: "",
                        email: "",
                        license: "",
                        licenseExpiryDate: "",
                        specialty: "",
                        phone: "",
                        password: "",
                        jobTitle: "Licensed Physician",
                        newTitle: "",
                        bio: "",
                        avatarUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&q=80&auto=format&fit=crop",
                      });
                      setDoctorWebpResult(null);
                      setDoctorNationalIdFile(null);
                      setDoctorLicenseFile(null);
                      setDoctorDiplomaFile(null);
                    } catch (err: any) {
                      error("Account not created", err?.message || "Could not reach the server.");
                    } finally {
                      setCreatingStaff(false);
                      setCreatingStaffStep("");
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
                        onChange={(v) =>
                          setAddDoctorForm({
                            ...addDoctorForm,
                            role: v as "admin" | "doctor" | "staff",
                            jobTitle:
                              v === "admin"
                                ? "Platform Administrator"
                                : v === "staff"
                                  ? "Managing Director & Clinical Director"
                                  : "Licensed Physician",
                          })
                        }
                        options={[
                          { value: "doctor", label: "Doctor" },
                          { value: "admin", label: "Administrator" },
                          { value: "staff", label: "Team member" },
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
                        placeholder={addDoctorForm.role === "staff" ? "Not required for team directory" : "Leave blank to auto-generate"}
                        value={addDoctorForm.password}
                        onChange={(e) => setAddDoctorForm({ ...addDoctorForm, password: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white text-xs placeholder:text-slate-400 focus:outline-none focus:border-[#12B8B0]"
                      />
                    </div>
                    {/* Public identity: specialty for doctors, job title for staff/admin */}
                    {addDoctorForm.role !== "doctor" && (
                      <div className="sm:col-span-2">
                        <BrandSelect
                          variant="dark"
                          label="Public Title (About Us)"
                          value={addDoctorForm.jobTitle}
                          onChange={(v) => setAddDoctorForm({ ...addDoctorForm, jobTitle: v, newTitle: v === "__new__" ? addDoctorForm.newTitle : "" })}
                          options={[
                            ...staffTitles
                              .filter((t) => t !== "Licensed Physician")
                              .map((title) => ({ value: title, label: title })),
                            { value: "__new__", label: "Add a new title…" },
                          ]}
                        />
                      </div>
                    )}
                    {addDoctorForm.role !== "doctor" && addDoctorForm.jobTitle === "__new__" && (
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-300 mb-1.5">New title</label>
                        <input
                          required
                          type="text"
                          placeholder="e.g. Head of Partnerships"
                          value={addDoctorForm.newTitle}
                          onChange={(e) => setAddDoctorForm({ ...addDoctorForm, newTitle: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white text-xs placeholder:text-slate-400 focus:outline-none focus:border-[#12B8B0]"
                        />
                      </div>
                    )}
                    {addDoctorForm.role !== "doctor" && (
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-300 mb-1.5">
                          Bio for About Us {addDoctorForm.role === "staff" ? "" : "(optional)"}
                        </label>
                        <textarea
                          required={addDoctorForm.role === "staff"}
                          rows={3}
                          placeholder="Short biography shown on the public About Us team section."
                          value={addDoctorForm.bio}
                          onChange={(e) => setAddDoctorForm({ ...addDoctorForm, bio: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white text-xs placeholder:text-slate-400 focus:outline-none focus:border-[#12B8B0]"
                        />
                      </div>
                    )}
                    {addDoctorForm.role === "doctor" && (
                      <>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-300 mb-1.5">RMDC License Number *</label>
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
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-300 mb-1.5">
                        License Expiration Date <span className="text-[#12B8B0]">*</span>
                      </label>
                      <BrandDatePicker
                        value={addDoctorForm.licenseExpiryDate}
                        onChange={(date) => setAddDoctorForm({ ...addDoctorForm, licenseExpiryDate: date })}
                        placeholder="Select license expiration date"
                        preset="future"
                        variant="dark"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Admin will receive an automated email alert 30 days before expiration.</p>
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-300 mb-1.5">Specialty *</label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Occupational Medicine"
                        value={addDoctorForm.specialty}
                        onChange={(e) => setAddDoctorForm({ ...addDoctorForm, specialty: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white text-xs placeholder:text-slate-400 focus:outline-none focus:border-[#12B8B0]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-300 mb-1.5">Phone Number</label>
                      <input
                        type="tel"
                        placeholder="+250 7XX XXX XXX"
                        value={addDoctorForm.phone}
                        onChange={(e) => setAddDoctorForm({ ...addDoctorForm, phone: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white text-xs placeholder:text-slate-400 focus:outline-none focus:border-[#12B8B0]"
                      />
                    </div>
                      </>
                    )}


                    {/* ── Credential Document Uploads (all roles) ── */}
                    {/* Doctors: National ID + License Certificate + Medical Diploma */}
                    {/* Staff / Admin: National ID + Diploma only */}
                    <div className="sm:col-span-2 pt-2">
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#12B8B0] mb-3">Credential Documents</div>
                      <div className={`grid gap-3 ${addDoctorForm.role === "doctor" ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>

                        {/* National ID — all roles */}
                        <label className={`cursor-pointer group flex flex-col items-center justify-center gap-2.5 p-4 rounded-xl border-2 border-dashed transition-all text-center ${
                          doctorNationalIdFile
                            ? "border-[#12B8B0] bg-[#12B8B0]/10"
                            : "border-white/20 hover:border-[#12B8B0] bg-white/5 hover:bg-white/10"
                        }`}>
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                            doctorNationalIdFile
                              ? "bg-[#12B8B0]/20 text-[#12B8B0] border border-[#12B8B0]/40"
                              : "bg-white/10 text-cyan-400 border border-white/10 group-hover:bg-[#12B8B0]/20 group-hover:text-[#12B8B0]"
                          }`}>
                            <IdCard className="w-5 h-5" />
                          </div>
                          <div className="text-[11px] font-bold text-white">National ID</div>
                          {doctorNationalIdFile ? (
                            <div className="text-[10px] text-[#12B8B0] font-bold break-all line-clamp-2 flex items-center justify-center gap-1">
                              <Check className="w-3 h-3 shrink-0" />
                              <span>{doctorNationalIdFile.name}</span>
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-400">JPG, PNG or PDF</div>
                          )}
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            onChange={handleDoctorDocSelect(setDoctorNationalIdFile)}
                          />
                        </label>

                        {/* RMDC License Certificate — doctors only */}
                        {addDoctorForm.role === "doctor" && (
                          <label className={`cursor-pointer group flex flex-col items-center justify-center gap-2.5 p-4 rounded-xl border-2 border-dashed transition-all text-center ${
                            doctorLicenseFile
                              ? "border-[#12B8B0] bg-[#12B8B0]/10"
                              : "border-white/20 hover:border-[#12B8B0] bg-white/5 hover:bg-white/10"
                          }`}>
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                              doctorLicenseFile
                                ? "bg-[#12B8B0]/20 text-[#12B8B0] border border-[#12B8B0]/40"
                                : "bg-white/10 text-amber-400 border border-white/10 group-hover:bg-[#12B8B0]/20 group-hover:text-[#12B8B0]"
                            }`}>
                              <FileBadge className="w-5 h-5" />
                            </div>
                            <div className="text-[11px] font-bold text-white">License Certificate</div>
                            {doctorLicenseFile ? (
                              <div className="text-[10px] text-[#12B8B0] font-bold break-all line-clamp-2 flex items-center justify-center gap-1">
                                <Check className="w-3 h-3 shrink-0" />
                                <span>{doctorLicenseFile.name}</span>
                              </div>
                            ) : (
                              <div className="text-[10px] text-slate-400">JPG, PNG or PDF</div>
                            )}
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              className="hidden"
                              onChange={handleDoctorDocSelect(setDoctorLicenseFile)}
                            />
                          </label>
                        )}

                        {/* Diploma — all roles */}
                        <label className={`cursor-pointer group flex flex-col items-center justify-center gap-2.5 p-4 rounded-xl border-2 border-dashed transition-all text-center ${
                          doctorDiplomaFile
                            ? "border-[#12B8B0] bg-[#12B8B0]/10"
                            : "border-white/20 hover:border-[#12B8B0] bg-white/5 hover:bg-white/10"
                        }`}>
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                            doctorDiplomaFile
                              ? "bg-[#12B8B0]/20 text-[#12B8B0] border border-[#12B8B0]/40"
                              : "bg-white/10 text-emerald-400 border border-white/10 group-hover:bg-[#12B8B0]/20 group-hover:text-[#12B8B0]"
                          }`}>
                            <GraduationCap className="w-5 h-5" />
                          </div>
                          <div className="text-[11px] font-bold text-white">{addDoctorForm.role === "doctor" ? "Medical Diploma" : "Diploma / Certificate"}</div>
                          {doctorDiplomaFile ? (
                            <div className="text-[10px] text-[#12B8B0] font-bold break-all line-clamp-2 flex items-center justify-center gap-1">
                              <Check className="w-3 h-3 shrink-0" />
                              <span>{doctorDiplomaFile.name}</span>
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-400">JPG, PNG or PDF</div>
                          )}
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            onChange={handleDoctorDocSelect(setDoctorDiplomaFile)}
                          />
                        </label>

                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={creatingStaff}
                      className="px-6 py-2.5 rounded-xl bg-[#12B8B0] hover:bg-[#1dd9d0] text-[#0B2D5C] font-black text-xs transition-colors flex items-center gap-2 disabled:opacity-60"
                    >
                      <UserPlus className="w-4 h-4" />
                      {creatingStaff
                        ? creatingStaffStep || "Saving…"
                        : addDoctorForm.role === "admin"
                          ? "Create Admin Account"
                          : addDoctorForm.role === "staff"
                            ? "Add team member"
                            : "Create Doctor Account"}
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
              {pendingDoctors.length === 0 && (
                <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center text-slate-500 text-xs">
                  No doctor applications awaiting verification.
                </div>
              )}
              {pendingDoctors.map((doc) => {
                const expiry = doc.licenseExpiryDate ? new Date(doc.licenseExpiryDate) : null;
                const daysLeft = expiry ? Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

                return (
                  <div
                    key={doc.id}
                    className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-[#0B2D5C]">{doc.name} ({doc.doctorId || doc.id})</h4>
                        {doc.licenseExpiryDate && (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              daysLeft !== null && daysLeft <= 0
                                ? "bg-rose-100 text-rose-800 border-rose-300"
                                : daysLeft !== null && daysLeft <= 30
                                ? "bg-amber-200/80 text-amber-900 border-amber-400"
                                : "bg-teal-100 text-teal-800 border-teal-300"
                            }`}
                          >
                            <Calendar className="w-3 h-3 shrink-0" />
                            <span>
                              {daysLeft !== null && daysLeft <= 0
                                ? `License Expired (${expiry?.toLocaleDateString()})`
                                : daysLeft !== null && daysLeft <= 30
                                ? `Expiring Soon: ${daysLeft}d left (${expiry?.toLocaleDateString()})`
                                : `License Expiry: ${expiry?.toLocaleDateString()}`}
                            </span>
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-600">Specialty: {doc.specialty} · License: {doc.license}</div>
                      {doc.phone && <div className="text-[11px] text-slate-500">Phone: {doc.phone}</div>}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {doc.nationalIdUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedDocPreview({
                                url: doc.nationalIdUrl!,
                                title: `${doc.name} — National ID`,
                                subtitle: `Specialty: ${doc.specialty} · License: ${doc.license}`,
                                badge: "National ID",
                                badgeColor: "blue",
                              })
                            }
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300 hover:bg-blue-200 transition-colors cursor-pointer"
                            title="Preview National ID within Dashboard"
                          >
                            <IdCard className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                            <span>National ID</span>
                            <Eye className="w-3 h-3 text-blue-600 shrink-0 opacity-80" />
                          </button>
                        )}
                        {doc.licenseCertificateUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedDocPreview({
                                url: doc.licenseCertificateUrl!,
                                title: `${doc.name} — License Certificate`,
                                subtitle: `License: ${doc.license} · Specialty: ${doc.specialty}`,
                                badge: "License Certificate",
                                badgeColor: "amber",
                              })
                            }
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200 transition-colors cursor-pointer"
                            title="Preview License Certificate within Dashboard"
                          >
                            <FileBadge className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                            <span>License Certificate</span>
                            <Eye className="w-3 h-3 text-amber-600 shrink-0 opacity-80" />
                          </button>
                        )}
                        {doc.diplomaUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedDocPreview({
                                url: doc.diplomaUrl!,
                                title: `${doc.name} — Medical Diploma`,
                                subtitle: `Specialty: ${doc.specialty} · License: ${doc.license}`,
                                badge: "Diploma / Degree",
                                badgeColor: "emerald",
                              })
                            }
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200 transition-colors cursor-pointer"
                            title="Preview Diploma within Dashboard"
                          >
                            <GraduationCap className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                            <span>Diploma</span>
                            <Eye className="w-3 h-3 text-emerald-600 shrink-0 opacity-80" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setEditingStaff({
                            id: doc.id,
                            role: "doctor",
                            name: doc.name,
                            email: doc.email || "",
                            phone: doc.phone || "",
                            license: doc.license || "",
                            licenseExpiryDate: doc.licenseExpiryDate ? new Date(doc.licenseExpiryDate).toISOString().split("T")[0] : "",
                            specialty: doc.specialty || "",
                            jobTitle: "",
                            bio: "",
                            status: "Pending",
                            avatarUrl: doc.avatarUrl || "",
                            nationalIdUrl: doc.nationalIdUrl || "",
                            licenseCertificateUrl: doc.licenseCertificateUrl || "",
                            diplomaUrl: doc.diplomaUrl || "",
                            password: "",
                          })
                        }
                        className="p-2 rounded-xl border border-amber-300 hover:bg-amber-100 text-amber-800 transition-colors"
                        title="Edit Doctor Details & License Expiry"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteDoctor(doc.id, doc.name)}
                        className="p-2 rounded-xl border border-amber-300 hover:bg-rose-50 text-amber-800 hover:text-rose-600 transition-colors"
                        title="Delete Doctor"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => approveDoctor(doc.id, doc.name)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verify & Activate</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4">
              <h4 className="text-sm font-bold text-[#0B2D5C] mb-3">Active Practicing Physicians ({verifiedDoctors.length})</h4>
              <div className="divide-y divide-slate-100 text-xs">
                {verifiedDoctors.map((d) => {
                  const expiry = d.licenseExpiryDate ? new Date(d.licenseExpiryDate) : null;
                  const daysLeft = expiry ? Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

                  return (
                    <div key={d.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-[#0B2D5C] flex items-center gap-2 flex-wrap">
                          <span>{d.name}</span>
                          <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">ID: {d.doctorId || d.id}</span>
                          <span className="text-xs text-slate-500">· {d.license}</span>
                          {d.licenseExpiryDate ? (
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                daysLeft !== null && daysLeft <= 0
                                  ? "bg-rose-100 text-rose-800 border-rose-300"
                                  : daysLeft !== null && daysLeft <= 30
                                  ? "bg-amber-100 text-amber-900 border-amber-300"
                                  : "bg-slate-100 text-slate-700 border-slate-200"
                              }`}
                            >
                              {daysLeft !== null && daysLeft <= 0 ? (
                                <>
                                  <AlertCircle className="w-3 h-3 text-rose-600 animate-pulse" />
                                  <span>Expired: {expiry?.toLocaleDateString()}</span>
                                </>
                              ) : daysLeft !== null && daysLeft <= 30 ? (
                                <>
                                  <AlertCircle className="w-3 h-3 text-amber-600 animate-pulse" />
                                  <span>Expires in {daysLeft}d ({expiry?.toLocaleDateString()})</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3 h-3 text-slate-500" />
                                  <span>Exp: {expiry?.toLocaleDateString()}</span>
                                </>
                              )}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-slate-400 bg-slate-50 border border-slate-200">
                              <Clock className="w-3 h-3" />
                              <span>No Expiry Set</span>
                            </span>
                          )}
                        </div>
                        <div className="text-slate-400 text-[11px] mt-0.5">{d.role} {d.phone ? `· ${d.phone}` : ""}</div>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {d.nationalIdUrl && (
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedDocPreview({
                                  url: d.nationalIdUrl!,
                                  title: `${d.name} — National ID`,
                                  subtitle: `ID: ${d.doctorId || d.id} · Specialty: ${d.specialty} · License: ${d.license}`,
                                  badge: "National ID",
                                  badgeColor: "blue",
                                })
                              }
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300 hover:bg-blue-200 transition-colors cursor-pointer"
                              title="Preview National ID within Dashboard"
                            >
                              <IdCard className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                              <span>National ID</span>
                              <Eye className="w-3 h-3 text-blue-600 shrink-0 opacity-80" />
                            </button>
                          )}
                          {d.licenseCertificateUrl && (
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedDocPreview({
                                  url: d.licenseCertificateUrl!,
                                  title: `${d.name} — License Certificate`,
                                  subtitle: `License: ${d.license} · Specialty: ${d.specialty}`,
                                  badge: "License Certificate",
                                  badgeColor: "amber",
                                })
                              }
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200 transition-colors cursor-pointer"
                              title="Preview License Certificate within Dashboard"
                            >
                              <FileBadge className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                              <span>License Certificate</span>
                              <Eye className="w-3 h-3 text-amber-600 shrink-0 opacity-80" />
                            </button>
                          )}
                          {d.diplomaUrl && (
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedDocPreview({
                                  url: d.diplomaUrl!,
                                  title: `${d.name} — Medical Diploma`,
                                  subtitle: `License: ${d.license} · Specialty: ${d.specialty}`,
                                  badge: "Diploma / Degree",
                                  badgeColor: "emerald",
                                })
                              }
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200 transition-colors cursor-pointer"
                              title="Preview Diploma within Dashboard"
                            >
                              <GraduationCap className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                              <span>Diploma</span>
                              <Eye className="w-3 h-3 text-emerald-600 shrink-0 opacity-80" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                          d.status === "Active"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : "bg-rose-100 text-rose-800 border border-rose-300"
                        }`}>
                          {d.status}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            setEditingStaff({
                              id: d.id,
                              role: "doctor",
                              name: d.name,
                              email: d.email || "",
                              phone: d.phone || "",
                              license: d.license || "",
                              licenseExpiryDate: d.licenseExpiryDate ? new Date(d.licenseExpiryDate).toISOString().split("T")[0] : "",
                              specialty: d.specialty || "",
                              jobTitle: "",
                              bio: "",
                              status: d.status || "Active",
                              avatarUrl: d.avatarUrl || "",
                              nationalIdUrl: d.nationalIdUrl || "",
                              licenseCertificateUrl: d.licenseCertificateUrl || "",
                              diplomaUrl: d.diplomaUrl || "",
                              password: "",
                            })
                          }
                          className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-[#12B8B0] transition-colors"
                          title="Edit Doctor Details & License Expiry"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

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
                  );
                })}
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
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 leading-relaxed">
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 mb-1.5">
                        Completed — reply sent
                      </div>
                      {/<(p|div|br|strong|em|u|h[1-6]|ul|ol|li|a)\b/i.test(inq.lastReply) ? (
                        <div
                          className="rich-email-editor"
                          dangerouslySetInnerHTML={{ __html: inq.lastReply }}
                        />
                      ) : (
                        <div className="whitespace-pre-wrap">{inq.lastReply}</div>
                      )}
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
                            richText: true,
                            defaultValue: `Dear ${inq.name},\n\nThank you for contacting FitMed Rwanda. We have reviewed your inquiry.\n\nKind regards,\nFitMed Clinical Support`,
                            confirmLabel: "Send reply",
                            cancelLabel: "Cancel",
                            variant: "info",
                          });
                          if (!reply) return;
                          try {
                            const res = await fetch("/api/contact", {
                              credentials: "include",
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
                                credentials: "include",
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
                <p className="text-xs text-slate-500">Add, edit, activate, deactivate, or remove facilities that receive risk-based referrals.</p>
              </div>
              <button
                onClick={() => {
                  setEditingClinicId(null);
                  setClinicForm(emptyClinicForm);
                  setShowAddClinic((open) => !open);
                }}
                className="px-4 py-2 rounded-xl bg-[#0B2D5C] text-white font-bold text-xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>{showAddClinic && !editingClinicId ? "Cancel" : "Add Partner Clinic"}</span>
              </button>
            </div>

            {showAddClinic && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    const res = await fetch("/api/clinics", {
                      method: editingClinicId ? "PATCH" : "POST",
                      credentials: "include",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(editingClinicId ? { id: editingClinicId, ...clinicForm } : clinicForm),
                    });
                    const data = await res.json();
                    if (!data.success) {
                      error(editingClinicId ? "Clinic not updated" : "Clinic not saved", data.error || "Please try again.");
                      return;
                    }
                    if (editingClinicId) {
                      setClinics((prev) => prev.map((row) => (row.id === editingClinicId ? data.clinic : row)));
                      success("Clinic updated", `${data.clinic.name} was saved.`);
                    } else {
                      setClinics((prev) => [data.clinic, ...prev]);
                      success("Clinic added", `${clinicForm.name} is now in the referral network.`);
                    }
                    setClinicForm(emptyClinicForm);
                    setEditingClinicId(null);
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
                  className="p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                />
                <input
                  required
                  placeholder="City / district"
                  value={clinicForm.city}
                  onChange={(e) => setClinicForm({ ...clinicForm, city: e.target.value })}
                  className="p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                />
                <input
                  placeholder="Phone"
                  value={clinicForm.phone}
                  onChange={(e) => setClinicForm({ ...clinicForm, phone: e.target.value })}
                  className="p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                />
                <input
                  placeholder="Type (e.g. Referral hospital)"
                  value={clinicForm.type}
                  onChange={(e) => setClinicForm({ ...clinicForm, type: e.target.value })}
                  className="p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                />
                <button type="submit" className="p-2.5 rounded-xl bg-[#12B8B0] text-[#0B2D5C] font-black text-xs sm:col-span-2">
                  {editingClinicId ? "Update clinic" : "Save clinic"}
                </button>
              </form>
            )}

            <div className="divide-y divide-slate-100 text-xs">
              {clinics.length === 0 && (
                <div className="py-6 text-slate-400">No partner clinics in the database yet.</div>
              )}
              {clinics.map((c) => {
                const active = !String(c.status || "").toLowerCase().includes("inactive");
                return (
                  <div key={c.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-[#0B2D5C]">{c.name}</div>
                      <div className="text-slate-400">
                        {c.city}
                        {c.phone ? ` · ${c.phone}` : ""}
                        {c.type ? ` · ${c.type}` : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2.5 py-1 rounded-full font-bold border text-[10px] ${
                          active
                            ? "bg-teal-50 text-teal-800 border-teal-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {active ? "Active Partner" : "Inactive"}
                      </span>
                      <button
                        type="button"
                        title="Edit clinic"
                        onClick={() => {
                          setEditingClinicId(c.id);
                          setClinicForm({
                            name: c.name,
                            city: c.city,
                            status: c.status,
                            capacity: c.capacity || "Medium",
                            phone: c.phone || "",
                            type: c.type || "",
                          });
                          setShowAddClinic(true);
                        }}
                        className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-[#12B8B0] transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        title={active ? "Deactivate clinic" : "Activate clinic"}
                        onClick={async () => {
                          try {
                            const res = await fetch("/api/clinics", {
                              method: "PATCH",
                              credentials: "include",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ id: c.id, action: active ? "deactivate" : "activate" }),
                            });
                            const data = await res.json();
                            if (!data.success) {
                              error("Clinic not updated", data.error || "Please try again.");
                              return;
                            }
                            setClinics((prev) => prev.map((row) => (row.id === c.id ? data.clinic : row)));
                            success(
                              active ? "Clinic deactivated" : "Clinic activated",
                              `${c.name} is now ${active ? "inactive" : "an active partner"}.`
                            );
                          } catch {
                            error("Clinic not updated", "Could not reach the server.");
                          }
                        }}
                        className={`p-2 rounded-lg border transition-colors ${
                          active
                            ? "border-rose-200 text-rose-600 hover:bg-rose-50"
                            : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        }`}
                      >
                        {active ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        title="Delete clinic"
                        onClick={async () => {
                          if (!window.confirm(`Delete ${c.name} from the partner network?`)) return;
                          try {
                            const res = await fetch(`/api/clinics?id=${encodeURIComponent(c.id)}`, {
                              method: "DELETE",
                              credentials: "include",
                            });
                            const data = await res.json();
                            if (!data.success) {
                              error("Clinic not deleted", data.error || "Please try again.");
                              return;
                            }
                            setClinics((prev) => prev.filter((row) => row.id !== c.id));
                            success("Clinic deleted", `${c.name} was removed.`);
                          } catch {
                            error("Clinic not deleted", "Could not reach the server.");
                          }
                        }}
                        className="p-2 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
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
                {platformAppointments.length === 0 && <p className="text-xs text-slate-400">No scheduled appointments.</p>}
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
                    credentials: "include",
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
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
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
                              {txn.status === "WAITING" && (() => {
                                const withinHour =
                                  !txn.approvedAt || Date.now() - new Date(txn.approvedAt).getTime() <= 60 * 60 * 1000;
                                if (!withinHour) {
                                  return (
                                    <span className="text-[10px] text-slate-400 font-bold pr-1">Reminder window ended</span>
                                  );
                                }
                                return (
                                <button
                                  onClick={async () => {
                                    try {
                                      const res = await fetch("/api/certificates", {
                                        credentials: "include",
                                        method: "PATCH",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ certificateId: txn.certId, action: "payment-reminder" }),
                                      });
                                      const data = await res.json().catch(() => ({ success: false }));
                                      if (!res.ok || !data.success) {
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
                                );
                              })()}
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
            <div className="grid sm:grid-cols-1 gap-4">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-xs text-slate-400 uppercase font-bold">Total Gross Revenue</div>
                <div className="text-2xl font-extrabold text-[#0B2D5C] mt-1">{grossRevenue.toLocaleString()} FRW</div>
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
                <span className="font-bold text-slate-800">{displayDoctorName(selectedTxn.doctorName) || "—"}</span>
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
                <p className="text-xs text-slate-500 mt-1">{selectedApplicant.applicantId || "Applicant record"}</p>
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
                ["Applicant ID", selectedApplicant.applicantId || "—"],
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
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">National ID / passport photo</div>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedDocPreview({
                        url: selectedApplicant.idDocUrl!,
                        title: `${selectedApplicant.name} — National ID`,
                        subtitle: `Applicant ID: ${selectedApplicant.applicantId || selectedApplicant.id} · National ID: ${selectedApplicant.nationalId}`,
                        badge: "National ID",
                        badgeColor: "blue",
                      })
                    }
                    className="text-[11px] font-bold text-[#12B8B0] hover:text-[#0fa49c] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Expand & Preview in Dashboard</span>
                  </button>
                </div>
                <div
                  className="relative group cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
                  onClick={() =>
                    setSelectedDocPreview({
                      url: selectedApplicant.idDocUrl!,
                      title: `${selectedApplicant.name} — National ID`,
                      subtitle: `Applicant ID: ${selectedApplicant.applicantId || selectedApplicant.id} · National ID: ${selectedApplicant.nationalId}`,
                      badge: "National ID",
                      badgeColor: "blue",
                    })
                  }
                  title="Click to preview within dashboard"
                >
                  <img src={selectedApplicant.idDocUrl} alt="National ID" className="w-full max-h-72 object-contain transition-transform duration-200 group-hover:scale-[1.01]" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-xs backdrop-blur-[2px]">
                    <Eye className="w-4 h-4 text-[#12B8B0]" />
                    <span>Click to open full dashboard preview</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">No ID document was uploaded.</p>
            )}
            <div className="flex flex-wrap gap-2 justify-end">
              {isPendingApplicant(selectedApplicant.status) && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      approveApplicant(selectedApplicant.id, selectedApplicant.name, selectedApplicant.email);
                      setSelectedApplicant(null);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-[#12B8B0] text-[#0B2D5C] text-xs font-black hover:bg-[#1dd9d0]"
                  >
                    Approve &amp; send sign-in details
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRejectTarget(selectedApplicant);
                      setRejectReason("");
                    }}
                    className="px-4 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-black hover:bg-rose-700"
                  >
                    Reject
                  </button>
                </>
              )}
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
      {portalReady && rejectTarget && createPortal(
        <div className="fixed inset-0 z-[210] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => !rejectingApplicant && setRejectTarget(null)}>
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-extrabold text-[#0B2D5C]">Reject {rejectTarget.name}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              This sends an automatic email to <strong>{rejectTarget.email}</strong>. The reason you write here is included in that email.
            </p>
            <textarea
              rows={5}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Example: The National ID photo is unclear. Please register again with a readable document."
              className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 text-sm text-[#0B2D5C] focus:outline-none focus:border-rose-400"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={rejectingApplicant}
                onClick={() => setRejectTarget(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={rejectingApplicant}
                onClick={() => void rejectApplicant()}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black disabled:opacity-60"
              >
                {rejectingApplicant ? "Sending email…" : "Reject and email reason"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {/* ── Admin Clinical Assessment Detail Modal ── */}
      {selectedAssessmentDoc && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 relative text-slate-800 space-y-6 p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-[#12B8B0] text-[10px] font-extrabold uppercase tracking-wider">
                    Official Clinical Record
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-400">
                    ID: {selectedAssessmentDoc.certificateId}
                  </span>
                </div>
                <h2 className="text-xl font-extrabold text-[#0B2D5C] mt-1" style={{ fontFamily: "var(--font-primary)" }}>
                  Doctor Clinical Assessment Report
                </h2>
                <p className="text-xs text-slate-500">
                  Full 9-section telemedicine clinical examination recorded by evaluating physician.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAssessmentDoc(null)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Section 1: Patient & Evaluation Info */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <h3 className="font-extrabold text-[#0B2D5C] uppercase tracking-wider text-[11px]">
                1. Patient &amp; Telehealth Consultation Details
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-slate-700">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Patient Name</span>
                  <span className="font-bold text-[#0B2D5C]">{selectedAssessmentDoc.candidateName || "—"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">National ID</span>
                  <span className="font-mono font-bold">{selectedAssessmentDoc.candidateIdNumber || "—"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Age / Gender</span>
                  <span>{selectedAssessmentDoc.age ? `${selectedAssessmentDoc.age} yrs` : "—"} · {selectedAssessmentDoc.gender || "—"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Evaluating Physician</span>
                  <span className="font-bold text-[#0B2D5C]">{displayDoctorName(selectedAssessmentDoc.assignedDoctor || "")}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Physician License</span>
                  <span>{selectedAssessmentDoc.assignedDoctorLicense || "RW-RMDC-4091"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Certificate Purpose</span>
                  <span className="font-semibold text-teal-800">{selectedAssessmentDoc.purpose || "—"}</span>
                </div>
              </div>
            </div>

            {/* Section 2: Vitals Panel */}
            <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-200 space-y-2 text-xs">
              <h3 className="font-extrabold text-[#0B2D5C] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#12B8B0]" />
                <span>Recorded Vital Signs</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="bg-white p-2.5 rounded-xl border border-teal-100 shadow-sm">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Blood Pressure</div>
                  <div className="text-sm font-extrabold text-[#0B2D5C] font-mono mt-0.5">
                    {selectedAssessmentDoc.vitals?.bloodPressure || selectedAssessmentDoc.structuredAssessment?.vitals?.bp || "120/80"}
                  </div>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-teal-100 shadow-sm">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Heart Rate</div>
                  <div className="text-sm font-extrabold text-[#0B2D5C] font-mono mt-0.5">
                    {selectedAssessmentDoc.vitals?.heartRate || selectedAssessmentDoc.structuredAssessment?.vitals?.heartRate || "72"} bpm
                  </div>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-teal-100 shadow-sm">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Blood Oxygen (SpO2)</div>
                  <div className="text-sm font-extrabold text-[#0B2D5C] font-mono mt-0.5">
                    {selectedAssessmentDoc.vitals?.spo2 || selectedAssessmentDoc.structuredAssessment?.vitals?.spo2 || "98"}%
                  </div>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-teal-100 shadow-sm">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">BMI (Calculated)</div>
                  <div className="text-sm font-extrabold text-[#0B2D5C] font-mono mt-0.5">
                    {selectedAssessmentDoc.vitals?.bmi || selectedAssessmentDoc.structuredAssessment?.vitals?.bmi || "22.5"}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Red Flags Screening Checklist */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <h3 className="font-extrabold text-[#0B2D5C] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                <span>Red-Flag Clinical Screening</span>
              </h3>
              {selectedAssessmentDoc.structuredAssessment?.redFlags && Object.keys(selectedAssessmentDoc.structuredAssessment.redFlags).length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(selectedAssessmentDoc.structuredAssessment.redFlags).map(([key, val]) => (
                    <div key={key} className={`p-2 rounded-xl border text-[11px] flex items-center gap-1.5 ${val ? "bg-rose-50 border-rose-200 text-rose-800 font-bold" : "bg-white border-slate-200 text-slate-600"}`}>
                      {val ? <AlertCircle className="w-3 h-3 text-rose-600" /> : <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                      <span className="capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 italic">No acute red flags identified during telemedicine intake.</p>
              )}
            </div>

            {/* Section 4: Clinical Findings & Impression */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <h3 className="font-extrabold text-[#0B2D5C] uppercase tracking-wider text-[11px]">
                Doctor Clinical Findings &amp; Summary
              </h3>
              <div className="bg-white p-3 rounded-xl border border-slate-200 text-slate-700 leading-relaxed">
                {selectedAssessmentDoc.structuredAssessment?.clinicalImpression ||
                  selectedAssessmentDoc.decisionNotes ||
                  selectedAssessmentDoc.doctorNotes ||
                  selectedAssessmentDoc.additionalNotes ||
                  "No abnormal physical or functional limitations observed virtually. Candidate fulfills fitness requirements."}
              </div>
            </div>

            {/* Section 5: Certification Decision & Doctor Declaration */}
            <div className={`p-5 rounded-2xl border-2 space-y-3 ${
              selectedAssessmentDoc.decision === "FIT" || selectedAssessmentDoc.status === "approved" || selectedAssessmentDoc.status === "valid"
                ? "bg-emerald-50/70 border-emerald-300"
                : selectedAssessmentDoc.decision === "PHYSICAL_CONSULTATION"
                ? "bg-orange-50/70 border-orange-300"
                : selectedAssessmentDoc.decision === "INVESTIGATION_SPECIALIST"
                ? "bg-indigo-50/70 border-indigo-300"
                : selectedAssessmentDoc.decision === "URGENT_REFERRAL" || selectedAssessmentDoc.decision === "NOT_FIT"
                ? "bg-rose-50/70 border-rose-300"
                : "bg-sky-50/70 border-sky-300"
            }`}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">Final Clinical Decision</div>
                  <div className="text-base font-extrabold text-[#0B2D5C]">
                    {selectedAssessmentDoc.decision || selectedAssessmentDoc.structuredAssessment?.decision || "PENDING"}
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-white border font-bold text-xs shadow-sm">
                  Status: {selectedAssessmentDoc.status || "submitted"}
                </span>
              </div>

              {selectedAssessmentDoc.restrictions && (
                <div className="p-2.5 rounded-xl bg-white border border-amber-300 text-xs text-amber-900">
                  <strong>Restrictions / Conditions:</strong> {selectedAssessmentDoc.restrictions}
                </div>
              )}

              <div className="border-t border-slate-200/60 pt-2 flex items-center justify-between text-[11px] text-slate-500">
                <span>Signed electronically by: <strong>{displayDoctorName(selectedAssessmentDoc.assignedDoctor || "")}</strong></span>
                <span>License: <strong>{selectedAssessmentDoc.assignedDoctorLicense || "RW-RMDC-4091"}</strong></span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedAssessmentDoc(null)}
                className="px-5 py-2.5 rounded-xl bg-[#0B2D5C] hover:bg-slate-800 text-white font-bold text-xs transition-colors"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Admin Edit Staff Member Modal ── */}
      {portalReady && editingStaff && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 bg-[#0B2D5C] text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#12B8B0]/20 border border-[#12B8B0]/40 flex items-center justify-center text-[#12B8B0]">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    Edit {editingStaff.role === "doctor" ? "Doctor" : editingStaff.role === "admin" ? "Administrator" : "Team Member"} Details
                  </h3>
                  <p className="text-xs text-slate-300">{editingStaff.name} · {editingStaff.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingStaff(null);
                  setEditAvatarFile(null);
                  setEditNationalIdFile(null);
                  setEditLicenseFile(null);
                  setEditDiplomaFile(null);
                }}
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveStaffEdit} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
              {/* Photo & Role Banner */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#12B8B0] bg-slate-200 relative shrink-0">
                    <img
                      src={editAvatarFile ? URL.createObjectURL(editAvatarFile) : (editingStaff.avatarUrl || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&q=80&auto=format&fit=crop")}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-sm">{editingStaff.name}</div>
                    <div className="text-[11px] text-slate-500">
                      {editingStaff.role === "doctor"
                        ? (editingStaff.specialty || "Physician")
                        : editingStaff.role === "staff"
                          ? (editingStaff.jobTitle || "Team Member")
                          : "Administrator"}
                    </div>
                    <label className="cursor-pointer inline-flex items-center gap-1.5 text-[11px] font-bold text-[#12B8B0] hover:text-[#0fa19a] mt-1">
                      <Camera className="w-3.5 h-3.5" />
                      <span>Change profile photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) setEditAvatarFile(e.target.files[0]);
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-extrabold uppercase text-slate-500">Status:</label>
                  <select
                    value={editingStaff.status || "Active"}
                    onChange={(e) => setEditingStaff({ ...editingStaff, status: e.target.value })}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-xs bg-white text-slate-700 focus:outline-none focus:border-[#12B8B0]"
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>

              {/* Standard Account Details */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
                    Full Name *
                  </label>
                  <input
                    required
                    type="text"
                    value={editingStaff.name || ""}
                    onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-800 text-xs focus:outline-none focus:border-[#12B8B0] focus:ring-1 focus:ring-[#12B8B0]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
                    Email Address *
                  </label>
                  <input
                    required
                    type="email"
                    value={editingStaff.email || ""}
                    onChange={(e) => setEditingStaff({ ...editingStaff, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-800 text-xs focus:outline-none focus:border-[#12B8B0] focus:ring-1 focus:ring-[#12B8B0]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+250 7XX XXX XXX"
                    value={editingStaff.phone || ""}
                    onChange={(e) => setEditingStaff({ ...editingStaff, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-800 text-xs focus:outline-none focus:border-[#12B8B0] focus:ring-1 focus:ring-[#12B8B0]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
                    Reset Password (optional)
                  </label>
                  <input
                    type="password"
                    placeholder="Leave blank to keep current password"
                    value={editingStaff.password || ""}
                    onChange={(e) => setEditingStaff({ ...editingStaff, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-800 text-xs focus:outline-none focus:border-[#12B8B0] focus:ring-1 focus:ring-[#12B8B0]"
                  />
                </div>
              </div>

              {/* Doctor-Specific Fields */}
              {editingStaff.role === "doctor" && (
                <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-200 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-[#0B2D5C] uppercase tracking-wider">
                    <Stethoscope className="w-4 h-4 text-[#12B8B0]" />
                    <span>Physician Credentials & Licensing</span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
                        Medical Specialty *
                      </label>
                      <input
                        required
                        type="text"
                        value={editingStaff.specialty || ""}
                        onChange={(e) => setEditingStaff({ ...editingStaff, specialty: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs focus:outline-none focus:border-[#12B8B0]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
                        RMDC License Number *
                      </label>
                      <input
                        required
                        type="text"
                        value={editingStaff.license || ""}
                        onChange={(e) => setEditingStaff({ ...editingStaff, license: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs font-mono focus:outline-none focus:border-[#12B8B0]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
                        License Expiration Date
                      </label>
                      <BrandDatePicker
                        value={editingStaff.licenseExpiryDate || ""}
                        onChange={(date) => setEditingStaff({ ...editingStaff, licenseExpiryDate: date })}
                        placeholder="Select license expiration date"
                        preset="future"
                        variant="light"
                      />
                      {editingStaff.licenseExpiryDate && (
                        <div className="mt-2">
                          {(() => {
                            const exp = new Date(editingStaff.licenseExpiryDate);
                            const days = Math.ceil((exp.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                            if (days <= 0) {
                              return (
                                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-100 border border-rose-300 text-rose-900 text-xs font-bold">
                                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                  <span>License has expired ({exp.toLocaleDateString()}). Automated renewal notice is active.</span>
                                </div>
                              );
                            }
                            if (days <= 30) {
                              return (
                                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-100 border border-amber-300 text-amber-950 text-xs font-bold">
                                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                                  <span>Expiring in {days} days ({exp.toLocaleDateString()}). Email alert will notify admin 30 days before expiration.</span>
                                </div>
                              );
                            }
                            return (
                              <div className="flex items-center gap-2 p-2 rounded-xl bg-teal-100/70 border border-teal-200 text-teal-900 text-xs font-medium">
                                <Clock className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                                <span>Valid until {exp.toLocaleDateString()} ({days} days remaining).</span>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Credential Documents Replacement */}
                  <div className="pt-2">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 mb-2">
                      Doctor Credential Documents
                    </div>
                    <div className="grid sm:grid-cols-3 gap-3">
                      {/* National ID */}
                      <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 text-[11px]">National ID</span>
                          {editingStaff.nationalIdUrl && (
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedDocPreview({
                                  url: editingStaff.nationalIdUrl!,
                                  title: `${editingStaff.name} — National ID`,
                                  subtitle: `Role: ${editingStaff.role} · Specialty: ${editingStaff.specialty || "General"}`,
                                  badge: "National ID",
                                  badgeColor: "blue",
                                })
                              }
                              className="text-[#12B8B0] hover:underline font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Preview</span>
                            </button>
                          )}
                        </div>
                        <label className="cursor-pointer block text-center py-2 px-1 rounded-lg border border-dashed border-slate-300 hover:border-[#12B8B0] text-[10px] text-slate-500 hover:text-[#12B8B0] transition-colors">
                          <span>{editNationalIdFile ? editNationalIdFile.name : "Replace document"}</span>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) setEditNationalIdFile(e.target.files[0]);
                            }}
                          />
                        </label>
                      </div>

                      {/* License Certificate */}
                      <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 text-[11px]">License Cert</span>
                          {editingStaff.licenseCertificateUrl && (
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedDocPreview({
                                  url: editingStaff.licenseCertificateUrl!,
                                  title: `${editingStaff.name} — License Certificate`,
                                  subtitle: `Role: ${editingStaff.role} · License: ${editingStaff.license || "—"}`,
                                  badge: "License Certificate",
                                  badgeColor: "amber",
                                })
                              }
                              className="text-[#12B8B0] hover:underline font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Preview</span>
                            </button>
                          )}
                        </div>
                        <label className="cursor-pointer block text-center py-2 px-1 rounded-lg border border-dashed border-slate-300 hover:border-[#12B8B0] text-[10px] text-slate-500 hover:text-[#12B8B0] transition-colors">
                          <span>{editLicenseFile ? editLicenseFile.name : "Replace document"}</span>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) setEditLicenseFile(e.target.files[0]);
                            }}
                          />
                        </label>
                      </div>

                      {/* Diploma */}
                      <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 text-[11px]">Diploma</span>
                          {editingStaff.diplomaUrl && (
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedDocPreview({
                                  url: editingStaff.diplomaUrl!,
                                  title: `${editingStaff.name} — Medical Diploma`,
                                  subtitle: `Role: ${editingStaff.role} · Specialty: ${editingStaff.specialty || "General"}`,
                                  badge: "Diploma / Degree",
                                  badgeColor: "emerald",
                                })
                              }
                              className="text-[#12B8B0] hover:underline font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Preview</span>
                            </button>
                          )}
                        </div>
                        <label className="cursor-pointer block text-center py-2 px-1 rounded-lg border border-dashed border-slate-300 hover:border-[#12B8B0] text-[10px] text-slate-500 hover:text-[#12B8B0] transition-colors">
                          <span>{editDiplomaFile ? editDiplomaFile.name : "Replace document"}</span>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) setEditDiplomaFile(e.target.files[0]);
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Staff / Admin specific fields */}
              {(editingStaff.role === "staff" || editingStaff.role === "admin") && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
                      Public Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Managing Director & Clinical Director"
                      value={editingStaff.jobTitle || ""}
                      onChange={(e) => setEditingStaff({ ...editingStaff, jobTitle: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-800 text-xs focus:outline-none focus:border-[#12B8B0]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
                      Bio / Summary
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Short professional bio shown on the About Us page..."
                      value={editingStaff.bio || ""}
                      onChange={(e) => setEditingStaff({ ...editingStaff, bio: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-800 text-xs focus:outline-none focus:border-[#12B8B0]"
                    />
                  </div>

                  {/* Staff/Admin document uploads: National ID + Diploma only */}
                  <div className="pt-2">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 mb-2">
                      Identity &amp; Qualification Documents
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {/* National ID */}
                      <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 text-[11px]">National ID</span>
                          {editingStaff.nationalIdUrl && (
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedDocPreview({
                                  url: editingStaff.nationalIdUrl!,
                                  title: `${editingStaff.name} — National ID`,
                                  subtitle: `Role: ${editingStaff.role} · Staff Record`,
                                  badge: "National ID",
                                  badgeColor: "blue",
                                })
                              }
                              className="text-[#12B8B0] hover:underline font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Preview</span>
                            </button>
                          )}
                        </div>
                        <label className="cursor-pointer block text-center py-2 px-1 rounded-lg border border-dashed border-slate-300 hover:border-[#12B8B0] text-[10px] text-slate-500 hover:text-[#12B8B0] transition-colors">
                          <span>{editNationalIdFile ? editNationalIdFile.name : "Replace document"}</span>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) setEditNationalIdFile(e.target.files[0]);
                            }}
                          />
                        </label>
                      </div>

                      {/* Diploma */}
                      <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 text-[11px]">Diploma / Certificate</span>
                          {editingStaff.diplomaUrl && (
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedDocPreview({
                                  url: editingStaff.diplomaUrl!,
                                  title: `${editingStaff.name} — Diploma / Certificate`,
                                  subtitle: `Role: ${editingStaff.role} · Staff Record`,
                                  badge: "Diploma / Degree",
                                  badgeColor: "emerald",
                                })
                              }
                              className="text-[#12B8B0] hover:underline font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Preview</span>
                            </button>
                          )}
                        </div>
                        <label className="cursor-pointer block text-center py-2 px-1 rounded-lg border border-dashed border-slate-300 hover:border-[#12B8B0] text-[10px] text-slate-500 hover:text-[#12B8B0] transition-colors">
                          <span>{editDiplomaFile ? editDiplomaFile.name : "Replace document"}</span>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) setEditDiplomaFile(e.target.files[0]);
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={savingEdit}
                  onClick={() => {
                    setEditingStaff(null);
                    setEditAvatarFile(null);
                    setEditNationalIdFile(null);
                    setEditLicenseFile(null);
                    setEditDiplomaFile(null);
                  }}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-6 py-2.5 rounded-xl bg-[#12B8B0] hover:bg-[#10a59e] text-white font-extrabold text-xs transition-colors flex items-center gap-2 shadow-sm disabled:opacity-60"
                >
                  {savingEdit ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{savingEditStep || "Saving Changes…"}</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── Admin Certificate Preview Modal ── */}
      {selectedCertPreview && (
        <OfficialMedicalCertificate
          data={{
            certificateId: selectedCertPreview.certificateId,
            candidateName: selectedCertPreview.candidateName,
            nationalId: selectedCertPreview.candidateIdNumber || selectedCertPreview.nationalId || "—",
            gender: (selectedCertPreview.gender === "Female" ? "Female" : "Male") as any,
            dateOfBirth: selectedCertPreview.dateOfBirth || "1995-01-01",
            purpose: selectedCertPreview.purpose || "Medical fitness certificate",
            category: selectedCertPreview.category || selectedCertPreview.jobType || "Standard",
            decision: selectedCertPreview.decision || "FIT",
            restrictions: selectedCertPreview.restrictions || "",
            bloodPressure: selectedCertPreview.vitals?.bloodPressure || "120/80",
            heartRate: selectedCertPreview.vitals?.heartRate || "72",
            spo2: selectedCertPreview.vitals?.spo2 || "98",
            bmi: selectedCertPreview.vitals?.bmi || "22.5",
            doctorName: displayDoctorName(selectedCertPreview.assignedDoctor || "Physician"),
            doctorLicense: selectedCertPreview.assignedDoctorLicense || "RW-RMDC-4091",
            issueDate: selectedCertPreview.issuedAt || selectedCertPreview.appliedDate ? new Date(selectedCertPreview.issuedAt || selectedCertPreview.appliedDate).toLocaleDateString() : new Date().toLocaleDateString(),
            expiryDate: selectedCertPreview.expiresAt ? new Date(selectedCertPreview.expiresAt).toLocaleDateString() : "—",
            sha256Hash: selectedCertPreview.sha256Hash || "—",
            qrUrl: selectedCertPreview.qrCodeUrl || "",
          }}
          onClose={() => setSelectedCertPreview(null)}
        />
      )}

      {/* ── In-Dashboard Document Preview Modal (National ID, License, Diploma) ── */}
      <DocumentPreviewModal
        isOpen={!!selectedDocPreview}
        onClose={() => setSelectedDocPreview(null)}
        document={selectedDocPreview}
      />
    </DashboardShell>
  );
}
