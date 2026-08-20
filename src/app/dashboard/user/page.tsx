"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import DashboardShell from "@/components/DashboardShell";
import BrandDatePicker from "@/components/BrandDatePicker";
import FitnessCertificateWizard from "@/components/FitnessCertificateWizard";
import VideoCallOverlay from "@/components/VideoCallOverlay";
import { useToast } from "@/components/ToastProvider";
import {
  FileCheck2,
  Clock,
  CheckCircle2,
  QrCode,
  Download,
  PlusCircle,
  ShieldAlert,
  Calendar,
  User,
  ArrowRight,
  ExternalLink,
  MapPin,
  X,
  Activity,
  AlertCircle,
  Video,
  Sparkles,
  Watch,
  Smartphone,
  Check,
  ShieldCheck,
  Hospital,
  ChevronRight,
  CreditCard,
  Building,
  KeyRound,
  Eye,
  EyeOff,
  Lock,
  FileText,
  Briefcase,
  GraduationCap,
  Car,
  Utensils,
  Plane,
  HardHat,
  HeartPulse,
  Camera,
  UploadCloud,
  Stethoscope,
  BadgeCheck,
  Shield,
  PlayCircle,
  Info,
  Building2,
} from "lucide-react";
import { convertToWebP, uploadToCloudinary, formatBytes, WebPConversionResult } from "@/lib/imageUtils";
import OfficialMedicalCertificate from "@/components/OfficialMedicalCertificate";

export default function UserDashboard() {
  const { success, error, warning, info } = useToast();
  const [activeTab, setActiveTab] = useState<string>("overview");

  const goToTab = (id: string) => {
    setActiveTab(id);
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("tab", id);
    window.history.replaceState({}, "", url);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab") || params.get("nav");
    if (tab) setActiveTab(tab);
  }, []);
  const [selectedServicePurpose, setSelectedServicePurpose] = useState<string>("School / Workplace Fitness");
  const [wizardStartStep, setWizardStartStep] = useState<number>(1);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showOfficialCertModal, setShowOfficialCertModal] = useState(false);
  const [selectedCert, setSelectedCert] = useState<any | null>(null);
  const [submittedAlert, setSubmittedAlert] = useState<string | null>(null);

  // Quick Service Apply handler: Sets purpose and jumps directly to Step 2 (Measurements)
  const handleServiceApply = (serviceTitle: string) => {
    const purposeMap: Record<string, string> = {
      "Workplace & Office Fitness": "School / Workplace Fitness",
      "School & University Admission": "School / Workplace Fitness",
      "Sports, Gym & Athletic Fitness": "Sports & Athletic Fitness",
      "Commercial Driver & Transport": "Transport / Commercial Driver Clearance",
      "Food Handler & Hygiene Clearance": "Food Handler & Hygiene Clearance",
      "Visa & International Travel Medical": "Visa & Travel Medical Assessment",
      "Construction & Heights Fitness": "Construction & Physical Labour",
    };

    const mappedPurpose = purposeMap[serviceTitle] || serviceTitle;
    setSelectedServicePurpose(mappedPurpose);
    setWizardStartStep(2);
    goToTab("request");
  };

  // Account Settings Subtabs
  const [settingsTab, setSettingsTab] = useState<"profile" | "security" | "billing" | "employer" | "wearables">("profile");
  const [savedSettingsAlert, setSavedSettingsAlert] = useState(false);

  // Profile data
  const [profileData, setProfileData] = useState({
    name: "Telesphore Uwabera",
    email: "telesphore91073@gmail.com",
    phone: "+250 788 123 456",
    nationalId: "1199580048123049",
    dob: "1995-08-14",
    address: "KG 549 St, Nyarutarama, Kigali",
    emergencyName: "Claudine Uwabera",
    emergencyPhone: "+250 788 654 321",
    employerCode: "CORP-MTN-RW",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80&auto=format&fit=crop",
  });

  const [avatarWebpResult, setAvatarWebpResult] = useState<WebPConversionResult | null>(null);
  const [isConvertingAvatar, setIsConvertingAvatar] = useState(false);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsConvertingAvatar(true);
      const converted = await convertToWebP(file, 0.85, 800);
      setAvatarWebpResult(converted);
      setProfileData((prev) => ({ ...prev, avatarUrl: converted.dataUrl }));
    } catch (err) {
      console.error("Avatar WebP conversion failed:", err);
    } finally {
      setIsConvertingAvatar(false);
    }
  };

  // Password change state
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);

  // Google Meet-style video call state
  const [isCallActive, setIsCallActive] = useState(false);
  const [activeCallAppointment, setActiveCallAppointment] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState([
    {
      sender: "doctor" as const,
      name: "Dr. Telesphore Uwabera, MD",
      text: "Hello Telesphore! I'm reviewing your questionnaire for the workplace fitness certificate. How are you feeling today?",
      time: "10:15 AM",
    },
    {
      sender: "applicant" as const,
      name: "Telesphore",
      text: "Good morning Doctor. Feeling great, ready for the assessment.",
      time: "10:16 AM",
    },
    {
      sender: "doctor" as const,
      name: "Dr. Telesphore Uwabera, MD",
      text: "Excellent. Your blood pressure (120/80) and SpO2 (98%) are well within standard ranges. Let's do a quick visual check.",
      time: "10:16 AM",
    },
  ]);

  const handleStartCall = (apt?: any) => {
    const appointment = apt || appointments[0] || null;
    setActiveCallAppointment(appointment);
    if (appointment?.appointmentId) {
      localStorage.setItem(`fitmed_meeting:${appointment.appointmentId}`, "connected");
    }
    setIsCallActive(true);
  };

  const handleEndCall = () => {
    if (activeCallAppointment?.appointmentId) {
      localStorage.removeItem(`fitmed_meeting:${activeCallAppointment.appointmentId}`);
    }
    setIsCallActive(false);
    setActiveCallAppointment(null);
  };

  const [showIremboModal, setShowIremboModal] = useState(false);
  const [certToPay, setCertToPay] = useState<any | null>(null);
  const [iremboChannel, setIremboChannel] = useState<"momo" | "airtel" | "card">("momo");
  const [momoNumber, setMomoNumber] = useState("0788123456");
  const [isPayingIrembo, setIsPayingIrembo] = useState(false);
  const [paymentSuccessAlert, setPaymentSuccessAlert] = useState<string | null>(null);

  const [activeCerts, setActiveCerts] = useState([
    {
      id: "FM-2024-88421",
      purpose: "Workplace & Office Fitness",
      doctor: "Dr. Telesphore Uwabera, MD",
      license: "RW-MMC-4091",
      issueDate: "18 Aug 2026",
      expiryDate: "18 Aug 2027",
      status: "approved",
      statusLabel: "VERIFIED FIT (PAID)",
      paymentStatus: "PAID",
      iremboRef: "IREMBO-RW-2024-9104",
      fee: "5,000 FRW",
      notes: "Clearance approved following clinical examination.",
      qrUrl: "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://fitmed.rw/verify/FM-2024-88421",
    },
    {
      id: "FM-2026-99412",
      purpose: "Transport & Commercial Driver",
      doctor: "Dr. Amina Nshimiyimana, MD",
      license: "RW-MMC-3382",
      issueDate: "Today, 11:30 AM",
      expiryDate: "20 Aug 2027",
      status: "approved",
      statusLabel: "APPROVED - AWAITING PAYMENT",
      paymentStatus: "UNPAID",
      iremboRef: null,
      fee: "5,000 FRW",
      notes: "Approved by physician. Complete 5,000 FRW Irembo payment to unlock certificate & QR.",
      qrUrl: "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://fitmed.rw/verify/FM-2026-99412",
    },
    {
      id: "FM-2026-77301",
      purpose: "Construction & Heights Fitness",
      doctor: "Dr. Patrick Uwase, MBBS",
      license: "RW-MMC-2910",
      issueDate: "Today, 09:15 AM",
      expiryDate: "—",
      status: "video appointment requested",
      statusLabel: "VIDEO APPOINTMENT REQUESTED",
      paymentStatus: "UNPAID",
      iremboRef: null,
      fee: "5,000 FRW",
      notes: "Doctor requested a live video consultation to review vertigo and balance screening.",
      qrUrl: "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://fitmed.rw/verify/FM-2026-77301",
    },
    {
      id: "FM-2026-88102",
      purpose: "Food Handler & Hygiene Clearance",
      doctor: "Dr. Claire Akamanzi, MD",
      license: "RW-MMC-4890",
      issueDate: "Yesterday",
      expiryDate: "—",
      status: "physical check up requested",
      statusLabel: "PHYSICAL CHECK UP REQUESTED",
      paymentStatus: "UNPAID",
      iremboRef: null,
      fee: "5,000 FRW",
      notes: "In-person stool exam and lab diagnostics required at CHUK partner clinic before issuance.",
      qrUrl: "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://fitmed.rw/verify/FM-2026-88102",
    },
    {
      id: "FM-2026-66419",
      purpose: "Sports, Gym & Athletic Fitness",
      doctor: "Dr. Telesphore Uwabera, MD",
      license: "RW-MMC-4091",
      issueDate: "17 Aug 2026",
      expiryDate: "—",
      status: "rejected",
      statusLabel: "REJECTED (DECLINED)",
      paymentStatus: "UNPAID",
      iremboRef: null,
      fee: "5,000 FRW",
      notes: "Declined: Stage 2 severe hypertension (BP 185/112) detected. Immediate cardiology referral required.",
      qrUrl: "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://fitmed.rw/verify/FM-2026-66419",
    },
  ]);

  const [history, setHistory] = useState([
    {
      id: "FM-2024-88421",
      purpose: "Workplace & Office Fitness",
      date: "18 Aug 2026",
      doctor: "Dr. Telesphore Uwabera, MD",
      outcome: "Fit for Activity",
      status: "Active",
    },
    {
      id: "FM-2025-11048",
      purpose: "Sports & Gym Clearance",
      date: "10 Feb 2025",
      doctor: "Dr. Amina Nshimiyimana, MD",
      outcome: "Fit for Activity",
      status: "Expired",
    },
  ]);

  // Scheduled Appointments State
  const [appointments, setAppointments] = useState<any[]>([
    {
      appointmentId: "APT-2026-891",
      doctorName: "Dr. Telesphore Uwabera, MD",
      doctorSpecialty: "Licensed Telehealth & Occupational Physician",
      doctorLicense: "RW-MMC-4091",
      purpose: "Workplace & Office Fitness Certification",
      scheduledDate: "Today",
      scheduledTime: "14:30",
      durationMinutes: 15,
      status: "scheduled",
      roomUrl: "/dashboard/user?tab=consultation",
      notes: "Routine medical clearance, identity cross-check & vital symptom review.",
    },
    {
      appointmentId: "APT-2026-904",
      doctorName: "Dr. Amina Nshimiyimana, MD",
      doctorSpecialty: "High-Risk & Transport Clearance Lead",
      doctorLicense: "RW-MMC-3382",
      purpose: "Commercial Driver & Transport License",
      scheduledDate: "22 Aug 2026",
      scheduledTime: "10:00",
      durationMinutes: 20,
      status: "scheduled",
      roomUrl: "/dashboard/user?tab=consultation",
      notes: "Vision, reflex, and blood pressure screening review.",
    },
  ]);

  // Fetch live chat messages and appointments from MongoDB
  useEffect(() => {
    async function loadData() {
      try {
        const chatRes = await fetch("/api/chat?consultationId=ROOM-FM-9941", { signal: AbortSignal.timeout(8000) });
        const chatData = await chatRes.json();
        if (chatData.success && chatData.messages?.length > 0) {
          const formatted = chatData.messages.map((m: any) => ({
            sender: m.senderRole === "doctor" ? "doctor" : "applicant",
            name: m.senderName,
            text: m.messageText,
            time: new Date(m.timestamp || m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          }));
          setChatMessages(formatted);
        }
      } catch (err) {
        console.warn("Could not load initial chat history:", err);
      }

      try {
        const aptRes = await fetch("/api/appointments?applicantEmail=telesphore91073@gmail.com", { signal: AbortSignal.timeout(8000) });
        const aptData = await aptRes.json();
        if (aptData.success && aptData.appointments?.length > 0) {
          setAppointments(aptData.appointments);
        }
      } catch (err) {
        console.warn("Could not load appointments:", err);
      }
    }

    loadData();
  }, []);




  const handleWizardComplete = (data: any) => {
    const newId = `FM-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    // ALWAYS SUBMITTED FIRST — DOCTOR MUST REVIEW BEFORE APPROVAL
    const newCert = {
      id: newId,
      purpose: data.purpose,
      doctor: "Dr. Telesphore Uwabera, MD (Assigned Physician)",
      license: "RW-MMC-4091",
      issueDate: "Today",
      expiryDate: "—",
      status: "submitted",
      statusLabel: "SUBMITTED - AWAITING DOCTOR REVIEW",
      paymentStatus: "UNPAID",
      iremboRef: null,
      fee: "5,000 FRW",
      notes: "Your responses have been securely submitted and routed to Dr. Telesphore Uwabera for clinical evaluation.",
      qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://fitmed.rw/verify/${newId}`,
    };

    setActiveCerts((prev) => [newCert, ...prev]);

    const newEntry = {
      id: newId,
      purpose: data.purpose,
      date: "Just now",
      doctor: "Dr. Telesphore Uwabera, MD (Assigned)",
      outcome: "Awaiting Clinical Review",
      status: "Submitted",
    };

    setHistory((prev) => [newEntry, ...prev]);
    success("Application Submitted", `Your fitness certificate application for "${data.purpose}" is now in review with Dr. Telesphore.`);
    goToTab("certificates");
  };

  const handlePayIrembo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certToPay) return;
    setIsPayingIrembo(true);

    setTimeout(() => {
      const txRef = `IREMBO-RW-2026-${Math.floor(10000 + Math.random() * 90000)}`;
      setActiveCerts((prev) =>
        prev.map((c) =>
          c.id === certToPay.id
            ? { ...c, status: "VERIFIED FIT", paymentStatus: "PAID", iremboRef: txRef }
            : c
        )
      );
      setHistory((prev) =>
        prev.map((h) =>
          h.id === certToPay.id
            ? { ...h, status: "Active (Paid)", outcome: "Fit for Activity" }
            : h
        )
      );
      setIsPayingIrembo(false);
      setShowIremboModal(false);
      setPaymentSuccessAlert(
        `Payment of 5,000 FRW successfully confirmed via IremboPay (${txRef})! Certificate ${certToPay.id} is now active, with downloadable PDF and verifiable QR code unlocked.`
      );
      setTimeout(() => setPaymentSuccessAlert(null), 8000);
    }, 1500);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSettingsAlert(true);
    setTimeout(() => setSavedSettingsAlert(false), 3000);
  };

  return (
    <DashboardShell
      role="user"
      activeNav={activeTab}
      onNavChange={goToTab}
      userProfile={{
        name: profileData.name,
        email: profileData.email,
        avatarUrl: profileData.avatarUrl,
        badgeLabel: "Identity Verified",
      }}
      quickAction={{
        label: "Request Certificate",
        onClick: () => goToTab("request"),
        icon: PlusCircle,
      }}
    >
      <div className="space-y-8">
        {/* Success Alert if just submitted */}
        {submittedAlert && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 flex items-start justify-between gap-3 shadow-sm animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Assessment Submitted:</strong> {submittedAlert}
              </div>
            </div>
            <button
              onClick={() => setSubmittedAlert(null)}
              className="text-emerald-700 hover:text-emerald-950 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── TAB 1: OVERVIEW ── */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* ── MAIN INFO STAT CARDS ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Card 1: Active Certificates */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-50/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl bg-[#12B8B0]/15 border border-[#12B8B0]/30 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-[#12B8B0]" />
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                      Valid
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Active Certs</div>
                  <div className="text-3xl font-extrabold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>
                    {activeCerts.length}
                    <span className="text-sm font-semibold text-slate-400 ml-1">certs</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                    <FileCheck2 className="w-3 h-3 text-[#12B8B0]" />
                    Digitally signed &amp; verified
                  </div>
                </div>
              </div>

              {/* Card 2: Assigned Doctor */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-sky-50/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl bg-sky-100 border border-sky-200 flex items-center justify-center">
                      <Stethoscope className="w-5 h-5 text-sky-600" />
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Online
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Assigned Doctor</div>
                  <div className="text-sm font-extrabold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>
                    Dr. Telesphore Uwabera
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                    <Video className="w-3 h-3 text-sky-500" />
                    Available for telehealth
                  </div>
                </div>
              </div>

              {/* Card 3: Standard Fee */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-emerald-600" />
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-[10px] font-bold uppercase tracking-wider">
                      Fixed Rate
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Cert Fee</div>
                  <div className="text-2xl font-extrabold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>
                    5,000
                    <span className="text-sm font-semibold text-slate-400 ml-1">FRW</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                    <FileCheck2 className="w-3 h-3 text-emerald-500" />
                    All certification categories
                  </div>
                </div>
              </div>

              {/* Card 4: Services CTA (dark accent) */}
              <div className="bg-gradient-to-br from-[#071d3d] to-[#0B2D5C] rounded-2xl p-5 sm:p-6 border border-[#12B8B0]/30 shadow-lg hover:shadow-xl transition-shadow relative overflow-hidden group cursor-pointer"
                onClick={() => goToTab("request")}>
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#12B8B0]/10 rounded-full blur-2xl pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl bg-[#12B8B0]/20 border border-[#12B8B0]/40 flex items-center justify-center">
                      <PlusCircle className="w-5 h-5 text-[#12B8B0]" />
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#12B8B0]/20 border border-[#12B8B0]/30 text-[#12B8B0] text-[10px] font-bold uppercase tracking-wider">
                      Apply Now
                    </span>
                  </div>
                  <div className="text-xs font-bold text-sky-300/80 uppercase tracking-wider mb-1">New Application</div>
                  <div className="text-lg font-extrabold text-white" style={{ fontFamily: "var(--font-primary)" }}>
                    Request Certificate
                  </div>
                  <div className="text-[11px] text-sky-200/70 mt-1.5 flex items-center gap-1">
                    <ArrowRight className="w-3 h-3 text-[#12B8B0]" />
                    7 available categories
                  </div>
                </div>
              </div>
            </div>


            {/* Active Certificates Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>
                  Active Digital Certificates
                </h2>
                <span className="text-xs text-slate-500 font-semibold">{activeCerts.length} Active Certificate</span>
              </div>

              {activeCerts.map((cert) => {
                const isPaid = cert.paymentStatus === "PAID";
                const isApproved = cert.status === "approved";
                const isRejected = cert.status === "rejected";
                const isVideoRequested = cert.status === "video appointment requested";
                const isPhysicalRequested = cert.status === "physical check up requested";
                const isSubmitted = cert.status === "submitted" || cert.status === "under-review";
                return (
                  <div
                    key={cert.id}
                    className={`bg-white rounded-3xl p-6 sm:p-8 border shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-all ${
                      isPaid ? "border-slate-200 hover:border-[#12B8B0]" : "border-amber-300 bg-amber-50/20 shadow-amber-500/5"
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        {isPaid ? (
                          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-extrabold flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{cert.statusLabel || "VERIFIED FIT (PAID)"}</span>
                          </span>
                        ) : isApproved ? (
                          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-extrabold flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5 text-amber-700" />
                            <span>APPROVED — AWAITING PAYMENT (5,000 FRW)</span>
                          </span>
                        ) : isVideoRequested ? (
                          <span className="px-3 py-1 rounded-full bg-teal-100 text-teal-900 border border-teal-300 text-xs font-extrabold flex items-center gap-1.5">
                            <Video className="w-3.5 h-3.5" />
                            <span>VIDEO APPOINTMENT REQUESTED</span>
                          </span>
                        ) : isPhysicalRequested ? (
                          <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-900 border border-orange-300 text-xs font-extrabold flex items-center gap-1.5">
                            <Hospital className="w-3.5 h-3.5" />
                            <span>PHYSICAL CHECK UP REQUESTED</span>
                          </span>
                        ) : isRejected ? (
                          <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300 text-xs font-extrabold flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>REJECTED (DECLINED)</span>
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full bg-sky-100 text-sky-800 border border-sky-300 text-xs font-extrabold flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{cert.statusLabel || "SUBMITTED — AWAITING REVIEW"}</span>
                          </span>
                        )}
                        <span className="text-xs font-bold text-slate-400 font-mono">ID: {cert.id}</span>
                        {cert.iremboRef && (
                          <span className="text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                            Ref: {cert.iremboRef}
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl font-bold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>
                        {cert.purpose}
                      </h3>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                        <span>Doctor: <strong>{cert.doctor}</strong> (License: {cert.license})</span>
                        <span>·</span>
                        <span>Issued: <strong>{cert.issueDate}</strong></span>
                        <span>·</span>
                        <span>Valid Until: <strong>{cert.expiryDate}</strong></span>
                      </div>

                      {isApproved && !isPaid && (
                        <div className="p-3 rounded-xl bg-amber-100/80 border border-amber-300 text-xs text-amber-950 font-medium flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0" />
                          <span>
                            This certificate was approved by the doctor. Complete payment of <strong>5,000 FRW via IremboPay</strong> to unlock high-res PDF download and official QR verification.
                          </span>
                        </div>
                      )}
                      {cert.notes && !isApproved && (
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium">
                          <strong className="text-[#0B2D5C]">Physician notice:</strong> {cert.notes}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto flex-wrap sm:flex-nowrap">
                      {isApproved && !isPaid ? (
                        <>
                          <button
                            onClick={() => {
                              setCertToPay(cert);
                              setShowIremboModal(true);
                            }}
                            className="flex-1 md:flex-none px-6 py-3.5 rounded-xl bg-[#12B8B0] hover:bg-[#1dd9d0] text-[#0B2D5C] font-black text-xs flex items-center justify-center gap-2 shadow-md transition-transform active:scale-95"
                          >
                            <CreditCard className="w-4 h-4 text-[#0B2D5C]" />
                            <span>Pay 5,000 FRW (IremboPay)</span>
                          </button>

                          <button
                            onClick={() => {
                              setCertToPay(cert);
                              setShowIremboModal(true);
                            }}
                            className="px-4 py-3 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-200 hover:bg-slate-200 transition-colors"
                            title="Payment required to view QR code"
                          >
                            <Lock className="w-3.5 h-3.5 text-amber-600" />
                            <span>QR Locked</span>
                          </button>
                        </>
                      ) : isPaid ? (
                        <>
                          <button
                            onClick={() => {
                              setSelectedCert(cert);
                              setShowQRModal(true);
                            }}
                            className="flex-1 md:flex-none px-5 py-3 rounded-xl bg-[#0B2D5C] text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
                          >
                            <QrCode className="w-4 h-4 text-[#12B8B0]" />
                            <span>View QR Code</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedCert(cert);
                              setShowOfficialCertModal(true);
                            }}
                            className="flex-1 md:flex-none px-5 py-3 rounded-xl bg-[#12B8B0] text-[#0B2D5C] font-black text-xs flex items-center justify-center gap-2 hover:bg-[#1dd9d0] transition-colors shadow-sm"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download PDF</span>
                          </button>
                        </>
                      ) : isVideoRequested ? (
                        <button
                          onClick={() => goToTab("consultation")}
                          className="px-5 py-3 rounded-xl bg-[#12B8B0] text-[#0B2D5C] font-black text-xs flex items-center justify-center gap-2 hover:bg-[#1dd9d0] transition-colors shadow-sm"
                        >
                          <Video className="w-4 h-4" />
                          <span>Enter live video room</span>
                        </button>
                      ) : isPhysicalRequested ? (
                        <button
                          onClick={() => goToTab("referrals")}
                          className="px-5 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
                        >
                          <Building2 className="w-4 h-4" />
                          <span>View hospital referral</span>
                        </button>
                      ) : isSubmitted ? (
                        <div className="px-4 py-2.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 font-bold text-xs flex items-center gap-2">
                          <Clock className="w-4 h-4 text-sky-600" />
                          <span>Doctor evaluating</span>
                        </div>
                      ) : isRejected ? (
                        <div className="px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-bold text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-600" />
                          <span>Certification declined</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Link to Telehealth */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#0B2D5C] to-[#082247] text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-[#12B8B0]/30 shadow-xl">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-bold uppercase">
                  <Video className="w-3.5 h-3.5" />
                  Live Applicant-Doctor Communication
                </div>
                <h3 className="text-xl font-bold text-white">Join Doctor Telehealth Room & Messaging</h3>
                <p className="text-xs text-slate-300 max-w-xl">
                  Connect with Dr. Telesphore Uwabera for identity verification, vital symptom discussion, and real-time clinical assessment.
                </p>
              </div>
              <button
                onClick={() => goToTab("consultation")}
                className="px-6 py-3.5 rounded-xl bg-[#12B8B0] hover:bg-[#1dd9d0] text-[#0B2D5C] font-black text-xs transition-colors flex items-center gap-2 flex-shrink-0"
              >
                <span>Enter Telehealth Room</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── TAB 2: ALL FITMED SERVICES ── */}
        {activeTab === "services" && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>
                All FitMed Medical Certification Services
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Select any service below to launch structured clinical evaluation with licensed medical doctor review.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  id: "workplace",
                  title: "Workplace & Office Fitness",
                  desc: "Pre-employment screening, annual corporate health checks, and sedentary desk fitness.",
                  icon: Briefcase,
                  tag: "Most Popular",
                  time: "Under 15 mins",
                },
                {
                  id: "school",
                  title: "School & University Admission",
                  desc: "Academic clearance, boarding school admissions, and physical education fitness clearance.",
                  icon: GraduationCap,
                  tag: "Student Fast-Track",
                  time: "Under 10 mins",
                },
                {
                  id: "sports",
                  title: "Sports, Gym & Athletic Fitness",
                  desc: "Cardiovascular endurance screening, marathon clearance, and gym club memberships.",
                  icon: HeartPulse,
                  tag: "Athletic Ready",
                  time: "Under 15 mins",
                },
                {
                  id: "transport",
                  title: "Commercial Driver & Transport",
                  desc: "Vision, reflex, and blood pressure screening for taxi, bus, and fleet operators.",
                  icon: Car,
                  tag: "Regulatory Approved",
                  time: "Under 20 mins",
                },
                {
                  id: "food",
                  title: "Food Handler & Hygiene Clearance",
                  desc: "Gastrointestinal screening, infectious symptom check, and commercial hygiene compliance.",
                  icon: Utensils,
                  tag: "Hygienic Verified",
                  time: "Under 15 mins",
                },
                {
                  id: "travel",
                  title: "Visa & International Travel Medical",
                  desc: "Embassy and immigration health assessments, travel clearance, and vaccine status checks.",
                  icon: Plane,
                  tag: "Global Format",
                  time: "Under 15 mins",
                },
                {
                  id: "construction",
                  title: "Construction & Heights Fitness",
                  desc: "Balance, vertigo, and occupational physical readiness for manual and high-risk work.",
                  icon: HardHat,
                  tag: "High Risk Review",
                  time: "Physician & Clinic",
                },
              ].map((service) => {
                const Icon = service.icon;
                return (
                  <div
                    key={service.id}
                    className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm hover:border-[#12B8B0] transition-all flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-[#12B8B0] flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-[#edf6f6] text-[#0B2D5C] text-[10px] font-extrabold border border-teal-200">
                          {service.tag}
                        </span>
                      </div>

                      <h3 className="text-base font-extrabold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>
                        {service.title}
                      </h3>

                      <p className="text-xs text-slate-500 leading-relaxed">
                        {service.desc}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="text-xs">
                        <div className="text-slate-400 font-medium">Rate</div>
                        <div className="text-sm font-extrabold text-[#0B2D5C]">5,000 FRW</div>
                      </div>

                      <button
                        onClick={() => handleServiceApply(service.title)}
                        className="px-4 py-2 rounded-xl bg-[#0B2D5C] hover:bg-[#082247] text-white font-extrabold text-xs transition-colors flex items-center gap-1.5 shadow-sm active:scale-95"
                      >
                        <span>Apply Now</span>
                        <ChevronRight className="w-3.5 h-3.5 text-[#12B8B0]" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── TAB 3: REQUEST WIZARD ── */}
        {activeTab === "request" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>
                  Medical Fitness Screening Questionnaire
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Applying for: <strong className="text-[#0B2D5C]">{selectedServicePurpose}</strong> · Complete intake for physician review.
                </p>
              </div>
              <button
                onClick={() => {
                  setWizardStartStep(1);
                  goToTab("overview");
                }}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors"
              >
                Cancel &amp; Return
              </button>
            </div>

            <FitnessCertificateWizard
              key={`${selectedServicePurpose}-${wizardStartStep}`}
              initialPurpose={selectedServicePurpose}
              initialStep={wizardStartStep}
              onComplete={handleWizardComplete}
              onCancel={() => {
                setWizardStartStep(1);
                goToTab("overview");
              }}
            />
          </div>
        )}

        {/* ── TAB: MY APPOINTMENTS & SCHEDULED CONSULTATIONS ── */}
        {activeTab === "appointments" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>
                  Scheduled Telehealth Appointments
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Manage upcoming clinical video consultations and physical examinations with licensed physicians.
                </p>
              </div>
              <button
                onClick={() => goToTab("consultation")}
                className="px-5 py-3 rounded-2xl bg-[#0B2D5C] hover:bg-[#082247] text-white font-extrabold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95 self-start sm:self-auto"
              >
                <Video className="w-4 h-4 text-[#12B8B0]" />
                <span>Join Active Video Room</span>
              </button>
            </div>

            <div className="grid gap-4">
              {appointments.map((apt) => (
                <div
                  key={apt.appointmentId}
                  className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-sm hover:border-[#12B8B0] transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-[#0B2D5C] text-xs font-extrabold flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#12B8B0]" />
                        <span>{apt.scheduledDate} at {apt.scheduledTime}</span>
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider">
                        ● {apt.status}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-400">ID: {apt.appointmentId}</span>
                    </div>

                    <h3 className="text-lg font-extrabold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>
                      {apt.purpose}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                      <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <Stethoscope className="w-3.5 h-3.5 text-[#12B8B0]" />
                        {apt.doctorName}
                      </span>
                      <span>·</span>
                      <span>Duration: <strong>{apt.durationMinutes} mins</strong></span>
                      <span>·</span>
                      <span className="text-slate-500">{apt.notes}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <button
                      onClick={() => {
                        info("Reschedule Request", `Request sent to ${apt.doctorName} to reschedule appointment.`);
                      }}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors"
                    >
                      Reschedule
                    </button>
                    <button
                      onClick={() => goToTab("consultation")}
                      className="px-5 py-2.5 rounded-xl bg-[#12B8B0] hover:bg-[#1dd9d0] text-[#0B2D5C] font-black text-xs flex items-center gap-2 shadow-sm transition-all active:scale-95"
                    >
                      <Video className="w-4 h-4" />
                      <span>Enter Video Room</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 4: DOCTOR TELEHEALTH LOBBY ── */}
        {activeTab === "consultation" && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>
                Doctor Video Consultation
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Start your encrypted live session with your assigned physician. You can navigate the dashboard while in a call.
              </p>
            </div>

            {/* Active call indicator (if call is running) */}
            {isCallActive && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                  <div>
                    <p className="text-sm font-extrabold text-emerald-900">Consultation in Progress</p>
                    <p className="text-xs text-emerald-700">
                      You are in a live session with {activeCallAppointment?.doctorName || "Dr. Telesphore Uwabera, MD"}. Navigate freely — the call continues in a floating window.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCallActive(false)}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold flex items-center gap-1.5 flex-shrink-0 transition-colors"
                >
                  End Call
                </button>
              </div>
            )}

            {/* Scheduled appointments waiting room */}
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-[#0B2D5C] uppercase tracking-wider">Your Scheduled Consultations</h3>
              {appointments.map((apt) => (
                <div
                  key={apt.appointmentId}
                  className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-sm hover:border-[#12B8B0] transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-[#0B2D5C] text-xs font-extrabold flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#12B8B0]" />
                        {apt.scheduledDate} at {apt.scheduledTime}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider">
                        ● {apt.status}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-400">ID: {apt.appointmentId}</span>
                    </div>
                    <h3 className="text-lg font-extrabold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>
                      {apt.purpose}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                      <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <Stethoscope className="w-3.5 h-3.5 text-[#12B8B0]" />
                        {apt.doctorName}
                      </span>
                      <span>·</span>
                      <span>Duration: <strong>{apt.durationMinutes} mins</strong></span>
                      <span>·</span>
                      <span className="text-slate-500">{apt.notes}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <button
                      onClick={() => info("Reschedule", `Request sent to ${apt.doctorName} to reschedule.`)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors"
                    >
                      Reschedule
                    </button>
                    <button
                      onClick={() => handleStartCall(apt)}
                      className="px-6 py-3 rounded-xl bg-[#12B8B0] hover:bg-[#1dd9d0] text-[#0B2D5C] font-black text-xs flex items-center gap-2 shadow-md transition-all active:scale-95"
                    >
                      <PlayCircle className="w-4 h-4" />
                      <span>Start Consultation</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* How it works */}
            <div className="p-6 rounded-3xl border border-slate-200 bg-slate-50 space-y-4">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-[#12B8B0]" />
                <h4 className="text-sm font-extrabold text-[#0B2D5C]">How Video Consultation Works</h4>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { step: "1", title: "Join the room", desc: "Click 'Start Consultation' to launch your encrypted video session." },
                  { step: "2", title: "Navigate freely", desc: "Minimise to a floating window and continue browsing the dashboard while in call." },
                  { step: "3", title: "Doctor reviews", desc: "The doctor verifies your ID, reviews vitals, and issues their clinical decision." },
                ].map((s) => (
                  <div key={s.step} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-xl bg-[#12B8B0]/15 border border-[#12B8B0]/30 text-[#12B8B0] flex items-center justify-center font-extrabold text-xs flex-shrink-0">{s.step}</div>
                    <div>
                      <p className="text-xs font-extrabold text-[#0B2D5C]">{s.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 5: MY CERTIFICATES ── */}
        {activeTab === "certificates" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>
                  My Digitally Signed Certificates
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Download verifiable PDF certificates or present QR codes for employer/organization verification.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {activeCerts.map((cert) => {
                const isPaid = cert.paymentStatus === "PAID";
                const isApproved = cert.status === "approved";
                const isSubmitted = cert.status === "submitted";
                const isUnderReview = cert.status === "under-review";
                const isVideoRequested = cert.status === "video appointment requested";
                const isPhysicalRequested = cert.status === "physical check up requested";
                const isRejected = cert.status === "rejected";

                return (
                  <div
                    key={cert.id}
                    className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-[#12B8B0] transition-colors"
                  >
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border ${
                            isPaid
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : isApproved
                              ? "bg-amber-100 text-amber-900 border-amber-300"
                              : isVideoRequested
                              ? "bg-teal-100 text-teal-900 border-teal-300"
                              : isPhysicalRequested
                              ? "bg-orange-100 text-orange-900 border-orange-300"
                              : isRejected
                              ? "bg-rose-100 text-rose-800 border-rose-300"
                              : "bg-sky-100 text-sky-800 border-sky-300"
                          }`}
                        >
                          {cert.statusLabel || cert.status}
                        </span>
                        <span className="text-xs font-bold text-slate-400 font-mono">ID: {cert.id}</span>
                      </div>

                      <h3 className="text-xl font-bold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>
                        {cert.purpose}
                      </h3>

                      {cert.notes && (
                        <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200/80 p-3 rounded-xl max-w-xl">
                          <strong className="text-[#0B2D5C]">Physician Notice:</strong> {cert.notes}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                        <span>Physician: <strong>{cert.doctor}</strong></span>
                        <span>·</span>
                        <span>Issued / Submitted: <strong>{cert.issueDate}</strong></span>
                        {cert.expiryDate !== "—" && (
                          <>
                            <span>·</span>
                            <span>Expires: <strong>{cert.expiryDate}</strong></span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                      {isApproved && !isPaid && (
                        <button
                          onClick={() => {
                            setCertToPay(cert);
                            setShowIremboModal(true);
                          }}
                          className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-[#0B2D5C] font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
                        >
                          <CreditCard className="w-4 h-4" />
                          <span>Pay 5,000 FRW to Unlock</span>
                        </button>
                      )}

                      {isPaid && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedCert(cert);
                              setShowQRModal(true);
                            }}
                            className="px-4 py-3 rounded-xl bg-[#0B2D5C] text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
                          >
                            <QrCode className="w-4 h-4 text-[#12B8B0]" />
                            <span>QR Code</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedCert(cert);
                              setShowOfficialCertModal(true);
                            }}
                            className="px-5 py-3 rounded-xl bg-[#12B8B0] text-[#0B2D5C] font-black text-xs flex items-center justify-center gap-2 hover:bg-[#1dd9d0] transition-colors shadow-sm"
                          >
                            <FileCheck2 className="w-4 h-4" />
                            <span>View &amp; Print Official Certificate</span>
                          </button>
                        </>
                      )}

                      {isVideoRequested && (
                        <button
                          onClick={() => goToTab("consultation")}
                          className="px-5 py-3 rounded-xl bg-[#12B8B0] text-[#0B2D5C] font-black text-xs flex items-center justify-center gap-2 hover:bg-[#1dd9d0] transition-colors shadow-sm"
                        >
                          <Video className="w-4 h-4" />
                          <span>Enter Live Video Room</span>
                        </button>
                      )}

                      {isPhysicalRequested && (
                        <button
                          onClick={() => goToTab("referrals")}
                          className="px-5 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
                        >
                          <Building2 className="w-4 h-4" />
                          <span>View Hospital Referral Slip</span>
                        </button>
                      )}

                      {(isSubmitted || isUnderReview) && (
                        <div className="px-4 py-2.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 font-bold text-xs flex items-center gap-2">
                          <Clock className="w-4 h-4 text-sky-600 animate-spin" />
                          <span>Doctor Evaluating Details</span>
                        </div>
                      )}

                      {isRejected && (
                        <div className="px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-bold text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-600" />
                          <span>Certification Declined</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── TAB 6: HISTORY ── */}
        {activeTab === "history" && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-lg sm:text-xl font-bold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>
              Complete Clinical Assessment & Clearance History
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-extrabold uppercase">
                    <th className="pb-3">Reference ID</th>
                    <th className="pb-3">Purpose</th>
                    <th className="pb-3">Assessment Date</th>
                    <th className="pb-3">Evaluating Doctor</th>
                    <th className="pb-3">Clinical Decision</th>
                    <th className="pb-3 text-right">Fee Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {history.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50">
                      <td className="py-4 font-bold text-[#0B2D5C] font-mono">{row.id}</td>
                      <td className="py-4">{row.purpose}</td>
                      <td className="py-4">{row.date}</td>
                      <td className="py-4">{row.doctor}</td>
                      <td className="py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full font-bold border ${
                            row.outcome === "Fit for Activity"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {row.outcome}
                        </span>
                      </td>
                      <td className="py-4 text-right font-bold text-[#0B2D5C]">5,000 FRW</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 7: CLINIC REFERRALS ── */}
        {activeTab === "referrals" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>
                In-Person Physical Examination Partner Clinics
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                When screening questions or vitals indicate elevated risk, candidates are referred directly to accredited clinics.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  name: "Centre Hospitalier Universitaire de Kigali (CHUK)",
                  district: "Nyarugenge, Kigali",
                  phone: "+250 788 382 000",
                  type: "Tertiary Teaching Hospital",
                },
                {
                  name: "King Faisal Hospital Rwanda",
                  district: "Kacyiru, Gasabo",
                  phone: "+250 788 123 200",
                  type: "Occupational & Specialized Medicine",
                },
                {
                  name: "Kigali Independent Polyclinic",
                  district: "Remera, Kicukiro",
                  phone: "+250 788 440 112",
                  type: "Rapid Occupational Health & Lab Panel",
                },
              ].map((c) => (
                <div key={c.name} className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-[#12B8B0] flex items-center justify-center font-bold">
                    <Hospital className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-[#0B2D5C]">{c.name}</h4>
                  <div className="text-xs text-slate-500 space-y-1">
                    <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" />{c.district}</div>
                    <div>Type: <strong>{c.type}</strong></div>
                    <div>Contact: <strong>{c.phone}</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 8: ACCOUNT MANAGEMENT & SETTINGS ── */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>
                Applicant Account Management
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Manage your identity verification, security credentials, corporate employer billing, and connected health devices.
              </p>
            </div>

            {/* Sub-tab navigation */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3 flex-wrap">
              {[
                { id: "profile", label: "Personal Identity", icon: User },
                { id: "security", label: "Security & Password", icon: Lock },
                { id: "billing", label: "Payment & Invoices", icon: CreditCard },
                { id: "employer", label: "Employer Corporate Link", icon: Building },
                { id: "wearables", label: "Connected Devices", icon: Watch },
              ].map((st) => {
                const Icon = st.icon;
                const isActive = settingsTab === st.id;
                return (
                  <button
                    key={st.id}
                    onClick={() => setSettingsTab(st.id as any)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isActive
                        ? "bg-[#0B2D5C] text-white shadow-md"
                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#12B8B0]" : "text-slate-400"}`} />
                    <span>{st.label}</span>
                  </button>
                );
              })}
            </div>

            {savedSettingsAlert && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 font-bold flex items-center gap-2 shadow-sm animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Account settings successfully updated!</span>
              </div>
            )}

            {/* Subtab 1: Personal Identity */}
            {settingsTab === "profile" && (
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (avatarWebpResult) {
                  const res = await uploadToCloudinary(avatarWebpResult.file, "fitmed/applicants");
                  if (res.url) {
                    setProfileData((prev) => ({ ...prev, avatarUrl: res.url }));
                  }
                }
                setSavedSettingsAlert(true);
                setTimeout(() => setSavedSettingsAlert(false), 3000);
              }} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-[#0B2D5C]">Personal Demographic & Identity Information</h3>
                    <p className="text-xs text-slate-500">Avatar images are auto-converted to WebP format before storage in Cloudinary.</p>
                  </div>
                </div>

                {/* Avatar Uploader */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#12B8B0] relative shadow-sm flex-shrink-0 bg-slate-200 flex items-center justify-center">
                      <img src={profileData.avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
                      {isConvertingAvatar && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#0B2D5C]">Profile Picture (WebP)</div>
                      <div className="text-[11px] text-slate-500">Auto-compressed and uploaded to Cloudinary CDN</div>
                      {avatarWebpResult && (
                        <div className="text-[10px] text-teal-700 font-bold mt-1 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200 inline-block">
                          WebP: {formatBytes(avatarWebpResult.compressedSize)} (Saved {avatarWebpResult.reductionPercentage}%)
                        </div>
                      )}
                    </div>
                  </div>

                  <label className="cursor-pointer px-4 py-2 rounded-xl bg-white border border-slate-200 hover:border-[#12B8B0] text-[#0B2D5C] font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all">
                    <Camera className="w-3.5 h-3.5 text-[#12B8B0]" />
                    <span>Upload New Photo</span>
                    <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                  </label>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-400 font-bold uppercase mb-1">Full Name</label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className="w-full p-3 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-[#12B8B0]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold uppercase mb-1">Email Address</label>
                    <input
                      type="email"
                      value={profileData.email}
                      disabled
                      className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold uppercase mb-1">National ID / Passport</label>
                    <input
                      type="text"
                      value={profileData.nationalId}
                      onChange={(e) => setProfileData({ ...profileData, nationalId: e.target.value })}
                      className="w-full p-3 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-[#12B8B0]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold uppercase mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="w-full p-3 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-[#12B8B0]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold uppercase mb-1">Date of Birth</label>
                    <BrandDatePicker value={profileData.dob} onChange={(dob) => setProfileData({ ...profileData, dob })} />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold uppercase mb-1">Residential Address</label>
                    <input
                      type="text"
                      value={profileData.address}
                      onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                      className="w-full p-3 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-[#12B8B0]"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl bg-[#12B8B0] hover:bg-[#1dd9d0] text-[#0B2D5C] font-black text-xs transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            )}

            {/* Subtab 2: Security & Password */}
            {settingsTab === "security" && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <h3 className="text-base font-bold text-[#0B2D5C]">Security & Authentication Management</h3>

                <div className="space-y-4 max-w-md text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold uppercase mb-1">Current Password</label>
                    <input
                      type="password"
                      value={currentPass}
                      onChange={(e) => setCurrentPass(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full p-3 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-[#12B8B0]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold uppercase mb-1">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPass ? "text" : "password"}
                        value={newPass}
                        onChange={(e) => setNewPass(e.target.value)}
                        placeholder="Minimum 8 characters"
                        className="w-full pl-3 pr-11 py-3 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-[#12B8B0]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-700"
                      >
                        {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!currentPass || !newPass) {
                        warning("Missing Fields", "Please fill in both current and new password.");
                        return;
                      }
                      success("Password Updated", "Your account password has been securely changed.");
                      setCurrentPass("");
                      setNewPass("");
                    }}
                    className="px-6 py-2.5 rounded-xl bg-[#0B2D5C] text-white font-bold text-xs hover:bg-slate-800 transition-colors"
                  >
                    Update Password
                  </button>
                </div>

                <div className="pt-6 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50">
                    <div>
                      <div className="text-xs font-bold text-[#0B2D5C]">Two-Factor Authentication (2FA)</div>
                      <div className="text-[11px] text-slate-500">Require SMS OTP confirmation on every login.</div>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Subtab 3: Billing & Payments */}
            {settingsTab === "billing" && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#0B2D5C]">Payment Methods & Invoices</h3>
                  <span className="text-xs font-extrabold text-[#12B8B0]">Rate: 5,000 FRW / Assessment</span>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0B2D5C]">MTN Mobile Money</span>
                      <span className="px-2 py-0.5 rounded bg-[#12B8B0] text-[#0B2D5C] font-extrabold text-[10px]">Default</span>
                    </div>
                    <div className="text-xs text-slate-700 font-mono">+250 788 123 456</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0B2D5C]">Airtel Money / Visa</span>
                      <span className="text-[10px] text-slate-400 font-semibold">Backup</span>
                    </div>
                    <div className="text-xs text-slate-700 font-mono">+250 738 000 000</div>
                  </div>
                </div>
              </div>
            )}

            {/* Subtab 4: Employer Corporate Link */}
            {settingsTab === "employer" && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <h3 className="text-base font-bold text-[#0B2D5C]">Employer / Corporate Organization Integration</h3>
                <p className="text-xs text-slate-500">
                  Link your account to your employer to enable sponsored direct billing and rapid occupational compliance.
                </p>

                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-emerald-950">Linked Corporate Employer</div>
                    <div className="text-xs font-bold text-emerald-800">MTN Rwanda PLC (Code: {profileData.employerCode})</div>
                    <div className="text-[11px] text-emerald-700">Assessment fees are covered directly by your organization.</div>
                  </div>
                  <span className="px-3 py-1 bg-emerald-600 text-white rounded-full text-xs font-bold">
                    Verified Link
                  </span>
                </div>
              </div>
            )}

            {/* Subtab 5: Wearables */}
            {settingsTab === "wearables" && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <Watch className="w-5 h-5 text-[#12B8B0]" />
                  <h3 className="text-base font-bold text-[#0B2D5C]">
                    Connected Health & Wearable Devices
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  Sync resting heart rate, blood pressure, and activity data directly for physician evaluation.
                </p>

                <div className="grid sm:grid-cols-3 gap-4 pt-2">
                  {[
                    { name: "Apple Health / Google Health", status: "Connected", icon: Smartphone },
                    { name: "Garmin / Fitbit Smartwatch", status: "Ready to Sync", icon: Watch },
                    { name: "Bluetooth BP Monitor / Oximeter", status: "Ready to Sync", icon: Activity },
                  ].map((d) => (
                    <div key={d.name} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-[#0B2D5C]">{d.name}</div>
                        <div className="text-[11px] text-emerald-600 font-semibold">{d.status}</div>
                      </div>
                      <d.icon className="w-5 h-5 text-slate-400" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Interactive IremboPay Checkout Modal (Pay-On-Approval) */}
      {showIremboModal && certToPay && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative border border-slate-200 text-slate-800">
            <button
              onClick={() => setShowIremboModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header with IremboPay Branding */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-extrabold uppercase tracking-wider border border-teal-200">
                  Official Government Gateway
                </span>
                <span className="text-[10px] font-bold text-slate-400 font-mono">Rwanda IremboPay</span>
              </div>
              <h3 className="text-2xl font-extrabold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>
                Pay for Medical Certificate
              </h3>
              <p className="text-xs text-slate-500">
                Approved by <strong>{certToPay.doctor}</strong> · Certificate ID: <strong>{certToPay.id}</strong>
              </p>
            </div>

            {/* Invoice Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Service:</span>
                <span className="font-bold text-slate-800">{certToPay.purpose}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Government Clinical Fee:</span>
                <span className="font-bold text-slate-800">5,000 FRW</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Payment Gate:</span>
                <span className="font-bold text-teal-700">Pay-On-Approval (Zero Risk)</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center font-extrabold text-[#0B2D5C] text-sm">
                <span>Total Amount Due:</span>
                <span className="text-lg text-emerald-600">5,000 FRW</span>
              </div>
            </div>

            {/* Payment Channel Selection */}
            <form onSubmit={handlePayIrembo} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "momo", label: "MTN MoMo", desc: "*182# USSD Push", color: "border-amber-400 bg-amber-50/50" },
                    { id: "airtel", label: "Airtel Money", desc: "*500# USSD Push", color: "border-rose-400 bg-rose-50/50" },
                    { id: "card", label: "Bank Card", desc: "Visa / MasterCard", color: "border-sky-400 bg-sky-50/50" },
                  ].map((ch) => (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => setIremboChannel(ch.id as any)}
                      className={`p-3 rounded-2xl text-left border-2 transition-all ${
                        iremboChannel === ch.id
                          ? `${ch.color} shadow-sm border-current`
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="text-xs font-bold text-[#0B2D5C]">{ch.label}</div>
                      <div className="text-[10px] text-slate-400 font-medium mt-0.5">{ch.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Channel Input Fields */}
              {iremboChannel === "momo" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    MTN Mobile Money Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={momoNumber}
                    onChange={(e) => setMomoNumber(e.target.value)}
                    placeholder="078... or 079..."
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#12B8B0]"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    A secure USSD PIN prompt will be sent to your MTN handset to authorize 5,000 FRW.
                  </p>
                </div>
              )}

              {iremboChannel === "airtel" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Airtel Money Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    defaultValue="0733123456"
                    placeholder="073... or 072..."
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#12B8B0]"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Enter Airtel Money PIN on your phone to complete payment.
                  </p>
                </div>
              )}

              {iremboChannel === "card" && (
                <div className="space-y-2 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Card Number</label>
                    <input
                      type="text"
                      required
                      placeholder="4111 2222 3333 4444"
                      className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Expiry (MM/YY)</label>
                      <input type="text" placeholder="12/28" className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold" />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">CVV</label>
                      <input type="password" placeholder="123" maxLength={3} className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold" />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isPayingIrembo}
                className="w-full py-4 rounded-xl bg-[#12B8B0] hover:bg-[#1dd9d0] text-[#0B2D5C] font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.99] disabled:opacity-50"
              >
                {isPayingIrembo ? (
                  <>
                    <span className="w-4 h-4 border-2 border-[#0B2D5C]/30 border-t-[#0B2D5C] rounded-full animate-spin" />
                    <span>Processing with IremboPay Gateway...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Authorize &amp; Pay 5,000 FRW</span>
                  </>
                )}
              </button>
            </form>

            <div className="text-center text-[10px] text-slate-400">
              Transactions are encrypted using 256-bit SSL and processed via the official IremboPay Gateway.
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full space-y-6 text-center shadow-2xl relative">
            <button
              onClick={() => setShowQRModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                ✓ Cryptographically Verified
              </div>
              <h3 className="text-xl font-extrabold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>
                QR Certificate Code
              </h3>
              <p className="text-xs text-slate-500">Scan to verify authenticity on fitmed.rw</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block">
              <Image
                src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=https://fitmed.rw/verify/FM-2024-88421"
                alt="QR Verification Code"
                width={220}
                height={220}
                unoptimized
                className="mx-auto rounded-xl"
              />
            </div>

            <div className="text-xs text-slate-500">
              Certificate ID: <strong className="text-slate-800">{selectedCert?.id || "FM-2024-88421"}</strong>
            </div>

            <button
              onClick={() => setShowQRModal(false)}
              className="w-full py-3 rounded-xl bg-[#0B2D5C] text-white font-bold text-xs hover:bg-slate-800 transition-colors"
            >
              Close Window
            </button>
          </div>
        </div>
      )}

      {/* Official Medical Fitness Certificate Modal */}
      {showOfficialCertModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="max-w-4xl w-full my-auto">
            <OfficialMedicalCertificate
              data={{
                certificateId: selectedCert?.id || "FM-2024-88421",
                candidateName: profileData.name,
                applicantImageUrl: profileData.avatarUrl,
                nationalId: profileData.nationalId,
                purpose: selectedCert?.purpose || "Workplace & Office Fitness",
                doctorName: selectedCert?.doctor || "Dr. Telesphore Uwabera, MD",
                issueDate: selectedCert?.issueDate || "18 Aug 2026",
                expiryDate: selectedCert?.expiryDate || "18 Aug 2027",
              }}
              onClose={() => setShowOfficialCertModal(false)}
            />
          </div>
        </div>
      )}
      {/* ── Google Meet-style Video Call Overlay ── */}
      <VideoCallOverlay
        isOpen={isCallActive}
        onEnd={handleEndCall}
        appointmentId={activeCallAppointment?.appointmentId}
        purpose={activeCallAppointment?.purpose || "Medical Fitness Consultation"}
        initialMessages={chatMessages}
        onSendMessage={async (text) => {
          try {
            await fetch("/api/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                senderName: profileData.name,
                senderRole: "applicant",
                messageText: text,
                consultationId: activeCallAppointment?.appointmentId || "ROOM-FM-9941",
              }),
            });
          } catch (_) {}
        }}
        doctor={{
          name: activeCallAppointment?.doctorName || "Dr. Telesphore Uwabera, MD",
          role: activeCallAppointment?.doctorSpecialty || "Licensed Telehealth Physician",
          avatarUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=1000&q=80&auto=format&fit=crop",
          isOnline: true,
        }}
        applicant={{
          name: profileData.name,
          role: "Applicant",
          avatarUrl: profileData.avatarUrl,
        }}
      />
    </DashboardShell>
  );
}
