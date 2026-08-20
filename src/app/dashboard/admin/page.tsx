"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { convertToWebP, uploadToCloudinary, formatBytes, WebPConversionResult } from "@/lib/imageUtils";
import { useToast } from "@/components/ToastProvider";
import { useDialog } from "@/components/DialogProvider";

export default function AdminDashboardPage() {
  const { success, error, warning, info } = useToast();
  const { confirm, prompt } = useDialog();
  const [activeNav, setActiveNav] = useState("overview");
  const [settingsSection, setSettingsSection] = useState<"profile" | "password" | "settings">("settings");
  const [adminProfile, setAdminProfile] = useState({
    name: "FitMed Admin",
    email: "info.teletech.rw@gmail.com",
    avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80&auto=format&fit=crop",
  });
  const [adminAvatarWebp, setAdminAvatarWebp] = useState<WebPConversionResult | null>(null);
  const [governanceSettings, setGovernanceSettings] = useState({
    assessmentRate: "5,000 FRW",
    requireLiveConsultation: true,
    qrValidation: true,
  });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const savedProfile = localStorage.getItem("fitmed_admin_profile");
    const savedGovernance = localStorage.getItem("fitmed_admin_governance");
    if (savedProfile) setAdminProfile((prev) => ({ ...prev, ...JSON.parse(savedProfile) }));
    if (savedGovernance) setGovernanceSettings((prev) => ({ ...prev, ...JSON.parse(savedGovernance) }));
  }, []);

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
    let profileToSave = adminProfile;
    if (adminAvatarWebp) {
      const upload = await uploadToCloudinary(adminAvatarWebp.file, "fitmed/admin-profiles");
      if (upload.url) profileToSave = { ...profileToSave, avatarUrl: upload.url };
    }
    setAdminProfile(profileToSave);
    localStorage.setItem("fitmed_admin_profile", JSON.stringify(profileToSave));
    setAdminAvatarWebp(null);
    success("Profile saved", "Your administrator profile is now updated.");
  };

  const changeAdminPassword = (event: React.FormEvent) => {
    event.preventDefault();
    const storedPassword = localStorage.getItem("fitmed_admin_password") || "91073@Tecy";
    if (currentPassword !== storedPassword) {
      error("Password not changed", "The current password is incorrect.");
      return;
    }
    if (newPassword.length < 8) {
      warning("Password too short", "Use at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      error("Password not changed", "The new passwords do not match.");
      return;
    }
    localStorage.setItem("fitmed_admin_password", newPassword);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    success("Password updated", "Your next sign-in will use the new password.");
  };

  const saveGovernanceSettings = () => {
    localStorage.setItem("fitmed_admin_governance", JSON.stringify(governanceSettings));
    success("Settings saved", "Governance rules are now active for new assessments.");
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

  const [auditDate, setAuditDate] = useState("—");
  useEffect(() => {
    setAuditDate(new Date().toLocaleDateString("en-GB"));
  }, []);

  // Pending Doctor Approvals
  const [pendingDoctors, setPendingDoctors] = useState([
    {
      id: "DOC-REG-104",
      name: "Dr. Divine Umutesi, MD",
      specialty: "General Medicine & Telehealth",
      license: "RW-RMDC-2024-9912",
      applied: "Yesterday",
      status: "Pending License Verification",
    },
    {
      id: "DOC-REG-105",
      name: "Dr. Innocent Manzi, MBBS",
      specialty: "Occupational Health",
      license: "RW-RMDC-2023-4108",
      applied: "2 days ago",
      status: "Pending License Verification",
    },
  ]);

  // Verified Doctors List
  const [verifiedDoctors, setVerifiedDoctors] = useState([
    { id: "DOC-001", name: "Dr. Telesphore Uwabera, MD", role: "Chief Clinical Evaluator", license: "RW-RMDC-4091", status: "Active" },
    { id: "DOC-002", name: "Dr. Amina Nshimiyimana, MD", role: "Telehealth Director", license: "RW-RMDC-3382", status: "Active" },
    { id: "DOC-003", name: "Dr. Patrick Uwase, MBBS", role: "Risk Stratification Lead", license: "RW-RMDC-2910", status: "Active" },
    { id: "DOC-004", name: "Dr. Claire Akamanzi, MD", role: "Referral Coordinator", license: "RW-RMDC-4890", status: "Active" },
  ]);

  const [showAddClinic, setShowAddClinic] = useState(false);
  const [clinicForm, setClinicForm] = useState({ name: "", city: "", status: "Active Partner", capacity: "Medium" });
  const [clinics, setClinics] = useState([
    { id: "CLN-01", name: "CHUK (University Teaching Hospital)", city: "Kigali (Nyarugenge)", status: "Active Partner", capacity: "High" },
    { id: "CLN-02", name: "King Faisal Hospital Rwanda", city: "Kigali (Gasabo)", status: "Active Partner", capacity: "High" },
    { id: "CLN-03", name: "Kigali Independent Polyclinic", city: "Kigali (Kicukiro)", status: "Active Partner", capacity: "Medium" },
    { id: "CLN-04", name: "Ruhengeri Referral Hospital", city: "Musanze", status: "Regional Referral", capacity: "Medium" },
    { id: "CLN-05", name: "Butare University Hospital (CHUB)", city: "Huye", status: "Regional Referral", capacity: "High" },
  ]);

  const approveDoctor = (id: string, name: string) => {
    success("Doctor Approved", `${name}'s license verified & portal account activated.`);
    setPendingDoctors((prev) => prev.filter((d) => d.id !== id));
    setVerifiedDoctors((prev) => [...prev, { id, name, role: "Clinical Evaluator", license: "RW-RMDC-2026-VAL", status: "Active" }]);
  };

  // Pending Applicant Registrations (Awaiting Admin ID Verification)
  const [pendingApplicants, setPendingApplicants] = useState([
    {
      id: "PAT-PENDING-101",
      name: "Emmanuel Mugisha",
      email: "e.mugisha@gmail.com",
      phone: "+250 788 889 900",
      nationalId: "1199880012345678",
      idDocUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80&auto=format&fit=crop",
      applied: "Today, 11:20 AM",
      status: "Pending National ID Verification",
    },
    {
      id: "PAT-PENDING-102",
      name: "Diane Mukeshimana",
      email: "diane.mukesh@gmail.com",
      phone: "+250 788 334 455",
      nationalId: "1200180023456789",
      idDocUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80&auto=format&fit=crop",
      applied: "Yesterday, 04:10 PM",
      status: "Pending National ID Verification",
    },
  ]);

  const approveApplicant = async (id: string, name: string, email: string) => {
    try {
      const res = await fetch("/api/auth/approve-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });
      const data = await res.json();
      const tempPass = data.tempPassword || `FitMed#${Math.floor(1000 + Math.random() * 9000)}`;

      setPendingApplicants((prev) => prev.filter((p) => p.id !== id));
      setApplicants((prev) => [
        {
          id: `PAT-00${prev.length + 1}`,
          name,
          email,
          phone: "+250 788 123 456",
          nationalId: "1199880012345678",
          joined: "Today",
          status: "Active",
          certs: 0,
          avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80&auto=format&fit=crop",
        },
        ...prev,
      ]);

      success(
        "Applicant Approved & Activated",
        `${name}'s National ID verified. Temporary Password (${tempPass}) was sent to their email address.`
      );
    } catch {
      setPendingApplicants((prev) => prev.filter((p) => p.id !== id));
      success("Applicant Approved", `${name}'s account activated.`);
    }
  };

  // All registered applicants
  const [applicants, setApplicants] = useState([
    { id: "PAT-001", name: "Telesphore Uwabera",   email: "telesphore91073@gmail.com",  phone: "+250 788 910 730", nationalId: "1199580048123049", joined: "2026-08-19", status: "Active",    certs: 2, avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80&auto=format&fit=crop" },
    { id: "PAT-002", name: "Claudine Uwamahoro",    email: "claudine.u@gmail.com",        phone: "+250 788 123 456", nationalId: "1199200012340001", joined: "2026-08-15", status: "Active",    certs: 1, avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80&auto=format&fit=crop" },
    { id: "PAT-003", name: "Eric Ndayishimiye",     email: "eric.nday@gmail.com",         phone: "+250 788 234 567", nationalId: "1198500023451002", joined: "2026-08-10", status: "Active",    certs: 0, avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80&auto=format&fit=crop" },
    { id: "PAT-004", name: "Aline Uwase",           email: "aline.uwase@gmail.com",       phone: "+250 788 345 678", nationalId: "1200100034562003", joined: "2026-07-28", status: "Suspended", certs: 1, avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80&auto=format&fit=crop" },
  ]);

  const toggleDoctorStatus = (id: string) => {
    setVerifiedDoctors((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: d.status === "Active" ? "Suspended" : "Active" } : d))
    );
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
    setVerifiedDoctors((prev) => prev.filter((d) => d.id !== id));
    success("Account removed", `${name} has been removed from the system.`);
  };

  const deleteApplicant = async (id: string, name: string) => {
    const ok = await confirm({
      title: "Delete applicant account",
      message: `Permanently delete ${name}'s applicant account?`,
      confirmLabel: "Delete account",
      cancelLabel: "Keep account",
      variant: "danger",
    });
    if (!ok) return;
    setApplicants((prev) => prev.filter((p) => p.id !== id));
    warning("Applicant deleted", `${name}'s account has been permanently removed.`);
  };

  const [userSearch, setUserSearch] = useState("");
  const [addDoctorForm, setAddDoctorForm] = useState({
    name: "",
    email: "",
    license: "",
    specialty: "",
    phone: "",
    avatarUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&q=80&auto=format&fit=crop",
  });
  const [doctorWebpResult, setDoctorWebpResult] = useState<WebPConversionResult | null>(null);
  const [isConvertingDoctorImg, setIsConvertingDoctorImg] = useState(false);
  const [showAddDoctor, setShowAddDoctor] = useState(false);

  // Payment Transactions State, Filters & Sorting
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<"ALL" | "PAID" | "WAITING" | "EXPIRED">("ALL");
  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentSort, setPaymentSort] = useState<"newest" | "oldest" | "amount_high" | "applicant">("newest");
  const [selectedTxn, setSelectedTxn] = useState<any | null>(null);
  const [showTxnModal, setShowTxnModal] = useState(false);

  const [transactions, setTransactions] = useState([
    {
      id: "TXN-IREMBO-2026-9104",
      certId: "FM-2024-88421",
      applicantName: "Telesphore Uwabera",
      applicantEmail: "telesphore91073@gmail.com",
      applicantPhone: "+250 788 123 456",
      purpose: "Workplace & Office Fitness",
      amount: 5000,
      channel: "MTN Mobile Money (*182#)",
      iremboRef: "IREMBO-RW-2026-9104",
      date: "2026-08-20 10:30",
      status: "PAID",
      doctorName: "Dr. Telesphore Uwabera, MD",
      doctorPayout: 4000,
      platformFee: 1000,
    },
    {
      id: "TXN-IREMBO-2026-9105",
      certId: "FM-2026-99412",
      applicantName: "Jean-Paul Habimana",
      applicantEmail: "jp.habimana@gmail.com",
      applicantPhone: "+250 788 456 789",
      purpose: "Commercial Driver & Transport",
      amount: 5000,
      channel: "Airtel Money (*500#)",
      iremboRef: "IREMBO-RW-2026-9105",
      date: "2026-08-20 09:15",
      status: "WAITING",
      doctorName: "Dr. Amina Nshimiyimana, MD",
      doctorPayout: 4000,
      platformFee: 1000,
    },
    {
      id: "TXN-IREMBO-2026-9106",
      certId: "FM-2026-88102",
      applicantName: "Chantal Mutoni",
      applicantEmail: "chantal.mutoni@gmail.com",
      applicantPhone: "+250 783 112 334",
      purpose: "Food Handler & Hygiene Clearance",
      amount: 5000,
      channel: "Visa / MasterCard Card",
      iremboRef: "IREMBO-RW-2026-9106",
      date: "2026-08-19 16:45",
      status: "PAID",
      doctorName: "Dr. Patrick Uwase, MD",
      doctorPayout: 4000,
      platformFee: 1000,
    },
    {
      id: "TXN-IREMBO-2026-9107",
      certId: "FM-2026-77301",
      applicantName: "Eric Ndayishimiye",
      applicantEmail: "eric.ndayishimiye@gmail.com",
      applicantPhone: "+250 788 778 899",
      purpose: "Construction & Heights Fitness",
      amount: 5000,
      channel: "MTN Mobile Money",
      iremboRef: "IREMBO-RW-2026-9107",
      date: "2026-08-15 14:00",
      status: "EXPIRED",
      doctorName: "Dr. Telesphore Uwabera, MD",
      doctorPayout: 4000,
      platformFee: 1000,
    },
    {
      id: "TXN-IREMBO-2026-9108",
      certId: "FM-2026-66419",
      applicantName: "Alice Uwimana",
      applicantEmail: "alice.uwimana@gmail.com",
      applicantPhone: "+250 788 991 223",
      purpose: "School & University Admission",
      amount: 5000,
      channel: "MTN Mobile Money (*182#)",
      iremboRef: "IREMBO-RW-2026-9108",
      date: "2026-08-19 11:20",
      status: "PAID",
      doctorName: "Dr. Claire Akamanzi, MD",
      doctorPayout: 4000,
      platformFee: 1000,
    },
    {
      id: "TXN-IREMBO-2026-9109",
      certId: "FM-2026-55310",
      applicantName: "Patrick Mugabo",
      applicantEmail: "patrick.mugabo@gmail.com",
      applicantPhone: "+250 788 223 344",
      purpose: "Sports, Gym & Athletic Fitness",
      amount: 5000,
      channel: "Airtel Money",
      iremboRef: "IREMBO-RW-2026-9109",
      date: "2026-08-20 11:45",
      status: "WAITING",
      doctorName: "Dr. Telesphore Uwabera, MD",
      doctorPayout: 4000,
      platformFee: 1000,
    },
  ]);

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
      p.nationalId.includes(userSearch)
  );

  const [inquiries, setInquiries] = useState([
    {
      id: "INQ-101",
      name: "Jean Paul Habimana",
      email: "jeanpaul.h@gmail.com",
      phone: "+250 788 112 233",
      category: "Doctor Network Application",
      subject: "Physician Onboarding & RMDC Verification",
      message: "Hello FitMed team, I am a certified occupational health physician in Kigali and would like to apply to conduct telehealth evaluations on your platform.",
      date: "Today, 09:20 AM",
      status: "New",
      lastReply: "",
    },
    {
      id: "INQ-102",
      name: "MTN Rwanda HR Operations",
      email: "hr.ops@mtn.co.rw",
      phone: "+250 788 440 000",
      category: "Employer Corporate Account",
      subject: "Bulk 450 Employee Fitness Clearance Contract",
      message: "We need an annual workplace fitness certificate package for 450 staff members at 5,000 FRW. Please send corporate invoice & HRIS API documentation.",
      date: "Yesterday, 03:45 PM",
      status: "In Review",
    },
    {
      id: "INQ-103",
      name: "Kigali Independent Polyclinic",
      email: "referrals@kigaliclinic.rw",
      phone: "+250 788 556 677",
      category: "In-Person Partner Clinic Referral",
      subject: "Referral Network Partnership Renewal",
      message: "Confirming readiness to receive secondary high-risk candidates for physical stress ECG tests and chest X-rays.",
      date: "Aug 18, 2026",
      status: "Resolved",
    },
  ]);

  const toggleApplicantStatus = (id: string) => {
    setApplicants((prev) =>
      prev.map((p) => p.id === id ? { ...p, status: p.status === "Active" ? "Suspended" : "Active" } : p)
    );
  };

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
                  <TrendingUp className="w-2.5 h-2.5" />
                  +8.3%
                </span>
              </div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Certificates</div>
              <div className="text-3xl font-extrabold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>
                10,480
              </div>
              <div className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                <span className="text-emerald-600 font-semibold">52.4M FRW</span>
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
                42
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
                18
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
                99.9% Uptime
              </div>
              <div className="text-[11px] text-sky-200/70 mt-1.5 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-emerald-400" />
                HIPAA AES-256 Active
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
            { id: "revenue",   label: "Revenue & Payouts" },
            { id: "security",  label: "HIPAA & Audit Logs" },
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
                <h3 className="text-lg font-bold text-white">Cryptographic Certificate Integrity</h3>
                <p className="text-xs text-slate-300">
                  Every issued certificate is signed with sha256 hashes and stored with immutable audit trails.
                </p>
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-mono text-[#12B8B0]">
                  SERVER_STATUS: ONLINE<br />
                  ENCRYPTION: AES-256-GCM<br />
                  LAST_AUDIT: {auditDate}
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
                  info("Export started", "Compiling monthly operations report...");
                  setTimeout(() => success("Report ready", "fitmed_ops_report_aug_2026.csv downloaded."), 900);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-2 self-start"
              >
                <Download className="w-3.5 h-3.5 text-[#12B8B0]" />
                Export monthly report
              </button>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Certificates this month", value: "842", hint: "+11% vs July", color: "text-emerald-600" },
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
                {[
                  { purpose: "Workplace & Office Fitness", count: 312, pct: 78 },
                  { purpose: "School & University Admission", count: 186, pct: 46 },
                  { purpose: "Commercial Driver & Transport", count: 141, pct: 35 },
                  { purpose: "Food Handler & Hygiene", count: 98, pct: 24 },
                  { purpose: "Construction & Heights", count: 64, pct: 16 },
                  { purpose: "Sports & Athletic Fitness", count: 41, pct: 10 },
                ].map((row) => (
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
                  {[
                    { time: "Today, 11:45", event: "Irembo payment WAITING", detail: "Patrick Mugabo · FM-2026-55310" },
                    { time: "Today, 10:30", event: "Certificate paid & unlocked", detail: "Telesphore Uwabera · FM-2024-88421" },
                    { time: "Today, 09:20", event: "New doctor application", detail: "Dr. Divine Umutesi · RW-RMDC-2024-9912" },
                    { time: "Yesterday", event: "Applicant ID pending review", detail: "Diane Mukeshimana · PAT-PENDING-102" },
                    { time: "Aug 18", event: "Clinic referral partnership note", detail: "Kigali Independent Polyclinic" },
                  ].map((row) => (
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
                          Submitted: {applicant.applied} · Document: <em>National ID / Passport WebP</em>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <a
                          href={applicant.idDocUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#12B8B0]" />
                          <span>Inspect National ID</span>
                        </a>

                        <button
                          onClick={() => approveApplicant(applicant.id, applicant.name, applicant.email)}
                          className="px-4 py-2 rounded-xl bg-[#12B8B0] hover:bg-[#1dd9d0] text-[#0B2D5C] font-black text-xs shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Approve &amp; Send Temp Password</span>
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
                        p.status === "Active"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-rose-100 text-rose-800 border border-rose-300"
                      }`}>
                        {p.status}
                      </span>
                      <button
                        onClick={() => info("Viewing Profile", `Opening ${p.name}'s full applicant record.`)}
                        className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-[#0B2D5C] transition-colors"
                        title="View Profile"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => success("Reset Link Sent", `Password reset email dispatched to ${p.email}.`)}
                        className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-[#12B8B0] transition-colors"
                        title="Reset Password"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => toggleApplicantStatus(p.id)}
                        className={`p-2 rounded-lg border transition-colors ${
                          p.status === "Active"
                            ? "border-rose-200 hover:bg-rose-50 text-rose-500"
                            : "border-emerald-200 hover:bg-emerald-50 text-emerald-600"
                        }`}
                        title={p.status === "Active" ? "Suspend Account" : "Reactivate Account"}
                      >
                        {p.status === "Active" ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => deleteApplicant(p.id, p.name)}
                        className="p-2 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Delete Applicant Account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#12B8B0]">Admin Action: Doctor Onboarding</span>
                  </div>
                  <h3 className="text-base font-extrabold text-white">Create New Doctor Account</h3>
                  <p className="text-xs text-slate-300 mt-0.5">Doctor accounts can only be created by the system administrator after Rwanda Medical Council license verification.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddDoctor(!showAddDoctor)}
                  className="px-4 py-2 rounded-xl bg-[#12B8B0] hover:bg-[#1dd9d0] text-[#0B2D5C] font-black text-xs flex items-center gap-1.5 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  {showAddDoctor ? "Cancel" : "Add Doctor"}
                </button>
              </div>

              {showAddDoctor && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    let finalAvatar = addDoctorForm.avatarUrl;
                    if (doctorWebpResult) {
                      const res = await uploadToCloudinary(doctorWebpResult.file, "fitmed/doctors");
                      if (res.url) finalAvatar = res.url;
                    }
                    const newDocId = `DOC-${Math.floor(100 + Math.random() * 900)}`;
                    setVerifiedDoctors((prev) => [
                      ...prev,
                      {
                        id: newDocId,
                        name: addDoctorForm.name,
                        role: addDoctorForm.specialty || "Clinical Evaluator",
                        license: addDoctorForm.license,
                        status: "Active",
                      },
                    ]);
                    success("Doctor Account Created", `${addDoctorForm.name} (License: ${addDoctorForm.license}) added. WebP avatar synced to Cloudinary.`);
                    setShowAddDoctor(false);
                    setAddDoctorForm({
                      name: "",
                      email: "",
                      license: "",
                      specialty: "",
                      phone: "",
                      avatarUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&q=80&auto=format&fit=crop",
                    });
                    setDoctorWebpResult(null);
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
                        <div className="text-xs font-bold text-white">Doctor Profile Picture</div>
                        <div className="text-[10px] text-slate-300">Auto-converted to WebP before Cloudinary storage</div>
                        {doctorWebpResult && (
                          <div className="text-[10px] text-[#12B8B0] font-bold mt-0.5">
                            Converted: {formatBytes(doctorWebpResult.compressedSize)} (-{doctorWebpResult.reductionPercentage}%)
                          </div>
                        )}
                      </div>
                    </div>

                    <label className="cursor-pointer px-3.5 py-2 rounded-xl bg-[#12B8B0] hover:bg-[#1dd9d0] text-[#0B2D5C] font-extrabold text-xs flex items-center gap-1.5 transition-colors">
                      <Camera className="w-3.5 h-3.5" />
                      <span>Upload & Convert WebP</span>
                      <input type="file" accept="image/*" onChange={handleDoctorImageSelect} className="hidden" />
                    </label>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-300 mb-1.5">Full Name</label>
                      <input
                        required
                        type="text"
                        placeholder="Dr. Full Name, MD"
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
                        placeholder="doctor@hospital.rw"
                        value={addDoctorForm.email}
                        onChange={(e) => setAddDoctorForm({ ...addDoctorForm, email: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white text-xs placeholder:text-slate-400 focus:outline-none focus:border-[#12B8B0]"
                      />
                    </div>
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
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-[#12B8B0] hover:bg-[#1dd9d0] text-[#0B2D5C] font-black text-xs transition-colors flex items-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      Create Doctor Account & Sync to MongoDB
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
                        onClick={() => success("Reset Email Sent", `Password reset instructions were sent to ${d.name}'s email address.`)}
                        className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-[#12B8B0] transition-colors"
                        title="Reset Doctor Password"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => toggleDoctorStatus(d.id)}
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
                          success(
                            "Reply sent",
                            `To: ${inq.email}\n\n${reply}`,
                            10000
                          );
                          setInquiries((prev) =>
                            prev.map((i) =>
                              i.id === inq.id ? { ...i, status: "Resolved", lastReply: reply } : i
                            )
                          );
                        }}
                        className="px-4 py-2 rounded-xl bg-[#12B8B0] hover:bg-[#1dd9d0] text-[#0B2D5C] font-black text-xs transition-colors flex items-center gap-1.5 shadow-xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Reply by email</span>
                      </button>

                      {inq.status !== "Resolved" && (
                        <button
                          onClick={() => {
                            setInquiries((prev) => prev.map((i) => (i.id === inq.id ? { ...i, status: "Resolved" } : i)));
                            success("Inquiry resolved", `${inq.subject} from ${inq.name} is now marked resolved.`);
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
                onSubmit={(e) => {
                  e.preventDefault();
                  const newId = `CLN-${String(clinics.length + 1).padStart(2, "0")}`;
                  setClinics((prev) => [
                    ...prev,
                    { id: newId, name: clinicForm.name, city: clinicForm.city, status: clinicForm.status, capacity: clinicForm.capacity },
                  ]);
                  success("Clinic added", `${clinicForm.name} is now in the referral network.`);
                  setClinicForm({ name: "", city: "", status: "Active Partner", capacity: "Medium" });
                  setShowAddClinic(false);
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
              {clinics.map((c) => (
                <div key={c.id} className="py-3.5 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-[#0B2D5C]">{c.name}</div>
                    <div className="text-slate-400">{c.city}</div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 font-bold border border-teal-200 text-[10px]">
                    {c.status}
                  </span>
                </div>
              ))}
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
                  info("Export Dispatched", "Generating financial CSV ledger export...");
                  setTimeout(() => success("Ledger Exported", "fitmed_transactions_2026.csv downloaded."), 1000);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-2 shadow-xs transition-colors self-start sm:self-auto"
              >
                <TrendingUp className="w-3.5 h-3.5 text-[#12B8B0]" />
                <span>Export CSV Ledger</span>
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
                                  onClick={() => {
                                    success("Payment Link Sent", `Reminder email with IremboPay link dispatched to ${txn.applicantEmail}.`);
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
                <div className="text-2xl font-extrabold text-[#0B2D5C] mt-1">52,400,000 FRW</div>
              </div>
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-xs text-slate-400 uppercase font-bold">Doctor Payouts (80%)</div>
                <div className="text-2xl font-extrabold text-emerald-600 mt-1">41,920,000 FRW</div>
              </div>
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-xs text-slate-400 uppercase font-bold">Platform Margin (20%)</div>
                <div className="text-2xl font-extrabold text-[#12B8B0] mt-1">10,480,000 FRW</div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 5: SECURITY & HIPAA ── */}
        {activeNav === "security" && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-[#0B2D5C]">HIPAA & Rwandan Data Privacy Audit Trail</h3>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs font-mono text-slate-700">
              <div>[2026-08-20 00:15:02] CERT_ISSUED: FM-2024-88421 by Dr. Telesphore Uwabera (SHA256: 8f92a1...bc)</div>
              <div>[2026-08-20 00:14:18] IDENTITY_VERIFIED: Applicant Telesphore (National ID: 1199580048123049)</div>
              <div>[2026-08-20 00:10:04] SCREENING_SUBMITTED: MC-FIT-4HCU-20260818-1309 (Risk: Low)</div>
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
                  {adminAvatarWebp && <span className="text-[11px] text-teal-700 font-bold">WebP ready: {formatBytes(adminAvatarWebp.compressedSize)}</span>}
                </div>
                <div className="grid sm:grid-cols-2 gap-4 text-xs">
                  <label className="font-bold text-slate-500">Display name<input value={adminProfile.name} onChange={(event) => setAdminProfile({ ...adminProfile, name: event.target.value })} className="mt-1 w-full p-3 rounded-xl border border-slate-200 font-semibold" required /></label>
                  <label className="font-bold text-slate-500">Email address<input value={adminProfile.email} disabled className="mt-1 w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500" /></label>
                </div>
                <div className="flex justify-end"><button type="submit" className="px-5 py-2.5 rounded-xl bg-[#12B8B0] text-[#0B2D5C] font-black text-xs">Save profile</button></div>
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
                  <label className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50">Automatic QR Verification Cryptographic Validation<input type="checkbox" checked={governanceSettings.qrValidation} onChange={(event) => setGovernanceSettings({ ...governanceSettings, qrValidation: event.target.checked })} className="w-4 h-4 accent-[#12B8B0]" /></label>
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
                  success("Receipt Downloaded", `Official PDF receipt for ${selectedTxn.id} generated.`);
                  setShowTxnModal(false);
                }}
                className="flex-1 py-3 rounded-xl bg-[#0B2D5C] hover:bg-[#082247] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <Download className="w-4 h-4 text-[#12B8B0]" />
                <span>Download Irembo Receipt PDF</span>
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
    </DashboardShell>
  );
}
