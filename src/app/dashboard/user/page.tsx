"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import DashboardShell from "@/components/DashboardShell";
import BrandDatePicker from "@/components/BrandDatePicker";
import { meetingLifecycleStatus, meetingStatusClass, meetingStatusLabel } from "@/lib/meetingTime";
import FitnessCertificateWizard from "@/components/FitnessCertificateWizard";
import { ageFromDateOfBirth } from "@/lib/clinicalEngine";
import WebRTCVideoCall, { FITMED_LIVE_ROOM } from "@/components/WebRTCVideoCall";
import { useSession } from "@/lib/useSession";
import OfficialMedicalCertificate from "@/components/OfficialMedicalCertificate";
import IremboPayCheckoutModal from "@/components/IremboPayCheckoutModal";
import CertificateQr from "@/components/CertificateQr";
import { consultationRoomId, formatCertificateCard, formatChatMessages } from "@/lib/consultation";
import { publicVerifyUrl, toOfficialCertificateData } from "@/lib/certificateDisplay";
import { DEFAULT_FITMED_PURPOSE, FITMED_SERVICES } from "@/lib/fitmedServices";
import { subscribeLiveRefresh, broadcastLiveRefresh } from "@/lib/liveRefresh";
import {
  FileCheck2,
  Clock,
  CheckCircle2,
  Loader2,
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
import { convertToWebP, uploadToCloudinary, isCloudinaryUrl, WebPConversionResult } from "@/lib/imageUtils";
import { applicantRegistrationError, compactPhone } from "@/lib/registrationRules";

export default function UserDashboard() {
  const { success, error, warning, info } = useToast();
  const { session, loading: sessionLoading } = useSession("user");
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
  const [selectedServicePurpose, setSelectedServicePurpose] = useState<string>(DEFAULT_FITMED_PURPOSE);
  const [wizardStartStep, setWizardStartStep] = useState<number>(1);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showOfficialCertModal, setShowOfficialCertModal] = useState(false);
  const [selectedCert, setSelectedCert] = useState<any | null>(null);
  const [submittedAlert, setSubmittedAlert] = useState<string | null>(null);

  // Quick Service Apply handler: Sets purpose and jumps directly to Step 2 (Measurements)
  const handleServiceApply = (serviceTitle: string) => {
    setSelectedServicePurpose(serviceTitle);
    setWizardStartStep(2);
    goToTab("request");
  };

  // Account Settings Subtabs
  const [settingsTab, setSettingsTab] = useState<"profile" | "security" | "billing" | "employer" | "wearables">("profile");
  const [savedSettingsAlert, setSavedSettingsAlert] = useState(false);
  const [profileSaveStatus, setProfileSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // Profile data
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    nationalId: "",
    applicantId: "",
    dob: "",
    gender: "",
    address: "",
    emergencyName: "",
    emergencyPhone: "",
    employerCode: "",
    avatarUrl: "",
    nationalIdImageUrl: "",
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

  // WebRTC video call state
  const [isCallActive, setIsCallActive] = useState(false);
  const [activeCallAppointment, setActiveCallAppointment] = useState<any>(null);
  const [videoCallRoomId, setVideoCallRoomId] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<{ sender: "doctor" | "applicant"; name: string; text: string; time: string }[]>([]);

  const persistAppointmentStatus = async (appointmentId: string, status: string) => {
    if (!appointmentId) return;
    try {
      await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId, status }),
      });
      setAppointments((prev) => prev.map((a) => (a.appointmentId === appointmentId ? { ...a, status } : a)));
    } catch {
      /* local status still updates */
    }
  };

  const handleStartCall = async (apt?: any) => {
    const appointment = apt || appointments[0] || null;
    if (!appointment?.appointmentId) {
      warning("No appointment", "Wait for your doctor to schedule a consultation, then join from this tab.");
      return;
    }
    window.location.href = `/meet/${encodeURIComponent(appointment.roomId || appointment.appointmentId)}`;
  };

  const handleEndCall = () => {
    if (videoCallRoomId) {
      localStorage.removeItem(`fitmed_meeting:${videoCallRoomId}`);
    }
    if (activeCallAppointment?.appointmentId) {
      void persistAppointmentStatus(activeCallAppointment.appointmentId, "completed");
    }
    setIsCallActive(false);
    setActiveCallAppointment(null);
    setVideoCallRoomId("");
  };

  const [showIremboModal, setShowIremboModal] = useState(false);
  const [certToPay, setCertToPay] = useState<any | null>(null);
  const [paymentSuccessAlert, setPaymentSuccessAlert] = useState<string | null>(null);

  const [activeCerts, setActiveCerts] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [partnerClinics, setPartnerClinics] = useState<{ name: string; city: string; phone?: string; type?: string; status?: string }[]>([]);
  const [myReferrals, setMyReferrals] = useState<{ id: string; clinicName: string; reason: string; status?: string; date?: string; doctorName?: string }[]>([]);

  // Load profile, appointments, and certificates from MongoDB
  useEffect(() => {
    if (!session?.email) return;
    const email = session.email;
    setProfileData((prev) => ({
      ...prev,
      name: session.name || prev.name,
      email,
    }));

    async function loadData(live = false) {
      try {
        if (!live) {
          const meRes = await fetch(`/api/auth/me?email=${encodeURIComponent(email)}`, { signal: AbortSignal.timeout(8000) });
          const meData = await meRes.json();
          if (meData.success && meData.user) {
            const u = meData.user;
            setProfileData((prev) => ({
              ...prev,
              name: u.name || prev.name,
              email: u.email || email,
              phone: u.phone || prev.phone,
              nationalId: u.nationalId || prev.nationalId,
              applicantId: u.applicantId || prev.applicantId,
              dob: u.dateOfBirth || prev.dob,
              gender: u.gender || prev.gender,
              address: u.address || prev.address,
              avatarUrl: u.avatarUrl || prev.avatarUrl,
              nationalIdImageUrl: u.nationalIdImageUrl || prev.nationalIdImageUrl,
            }));
          }
        }
      } catch (err) {
        console.warn("Could not load profile:", err);
      }

      try {
        const aptRes = await fetch(`/api/appointments?applicantEmail=${encodeURIComponent(email)}`, { signal: AbortSignal.timeout(8000) });
        const aptData = await aptRes.json();
        if (aptData.success) {
          setAppointments(aptData.appointments || []);
          if (!live) {
            const params = new URLSearchParams(window.location.search);
            const room = params.get("room");
            if (room) {
              const match = (aptData.appointments || []).find(
                (a: any) => a.appointmentId === room || a.roomId === room
              );
              if (match) {
                goToTab("consultation");
                setTimeout(() => {
                  void handleStartCall(match);
                }, 300);
              }
            }
          }
        }
      } catch (err) {
        console.warn("Could not load appointments:", err);
      }

      try {
        const clinicRes = await fetch("/api/clinics", { signal: AbortSignal.timeout(8000) });
        const clinicData = await clinicRes.json();
        setPartnerClinics(clinicData.success ? clinicData.clinics || [] : []);
      } catch {
        setPartnerClinics([]);
      }

      try {
        const refRes = await fetch(`/api/referrals?applicantEmail=${encodeURIComponent(email)}`, { signal: AbortSignal.timeout(8000) });
        const refData = await refRes.json();
        setMyReferrals(refData.success ? refData.referrals || [] : []);
      } catch {
        setMyReferrals([]);
      }

      try {
        const certRes = await fetch(`/api/certificates?applicantEmail=${encodeURIComponent(email)}`, {
          cache: "no-store",
          signal: AbortSignal.timeout(8000),
        });
        const certData = await certRes.json();
        if (certData.success) {
          const cards = (certData.certificates || []).map((cert: any) => formatCertificateCard(cert));
          setActiveCerts(cards);
          setHistory(
            cards.map((cert: any) => ({
              id: cert.id,
              purpose: cert.purpose,
              date: cert.issueDate,
              doctor: cert.doctor,
              outcome: cert.statusLabel,
              status: cert.status,
            }))
          );
        }
      } catch (err) {
        console.warn("Could not load applicant certificates:", err);
      }
    }

    loadData(false);
    const stopLive = subscribeLiveRefresh(() => {
      void loadData(true);
    }, 5000);
    const reminderTick = setInterval(() => {
      void fetch("/api/meet/tick");
    }, 60 * 1000);
    return () => {
      stopLive();
      clearInterval(reminderTick);
    };
  }, [session?.email]);

  const handleWizardComplete = async (data: any) => {
    try {
      if (!profileData.nationalId) {
        error("Profile incomplete", "Add your National ID in Profile before applying.");
        return;
      }
      if (!isCloudinaryUrl(profileData.avatarUrl) || !isCloudinaryUrl(profileData.nationalIdImageUrl)) {
        error(
          "Photos required",
          "Your profile photo and National ID photo must be stored on Cloudinary before you can submit an application."
        );
        return;
      }
      const submissionData = {
        applicantEmail: profileData.email,
        applicantPhone: profileData.phone,
        candidateName: profileData.name,
        candidateIdNumber: profileData.nationalId,
        avatarUrl: profileData.avatarUrl,
        nationalIdImageUrl: profileData.nationalIdImageUrl,
        age: ageFromDateOfBirth(profileData.dob) ?? undefined,
        dateOfBirth: profileData.dob,
        gender: profileData.gender || "",
        purpose: data.purpose,
        jobType: data.jobType,
        height: data.height,
        weight: data.weight,
        bmi: data.bmi,
        vitals: data.vitals,
        redFlags: data.redFlags,
        symptoms: data.symptoms,
        history: data.history,
        functional: data.functional,
        additionalNotes: data.additionalNotes,
      };

      // Submit to API
      const res = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData),
      });

      const result = await res.json();

      if (result.success) {
        const cert = result.certificate;
        
        // Update local state with the saved certificate
        const newCert = {
          id: cert.certificateId,
          purpose: cert.purpose,
          doctor: cert.assignedDoctor,
          license: cert.assignedDoctorLicense || "—",
          issueDate: cert.appliedDate ? new Date(cert.appliedDate).toLocaleDateString() : "—",
          expiryDate: cert.expiresAt ? new Date(cert.expiresAt).toLocaleDateString() : "—",
          status: cert.status,
          statusLabel: "SUBMITTED - AWAITING DOCTOR REVIEW",
          paymentStatus: cert.paymentStatus,
          iremboRef: null,
          fee: "5,000 FRW",
          notes: cert.additionalNotes || "Your application was saved and is waiting for a doctor to review it.",
          qrUrl: cert.qrCodeUrl,
        };

        setActiveCerts((prev) => [newCert, ...prev]);

        const newEntry = {
          id: cert.certificateId,
          purpose: cert.purpose,
          date: "Just now",
          doctor: cert.assignedDoctor,
          outcome: "Awaiting Clinical Review",
          status: "Submitted",
        };

        setHistory((prev) => [newEntry, ...prev]);
        broadcastLiveRefresh();
        success("Application Submitted", `Your fitness certificate application for "${data.purpose}" is now in review.`);
        goToTab("certificates");
      } else {
        error("Submission Failed", result.error || "Failed to submit application");
      }
    } catch (err) {
      console.error("Wizard submission error:", err);
      error("Submission Error", "Failed to submit application. Please try again.");
    }
  };

  const markCertificatePaidLocal = (txRef: string) => {
    if (!certToPay) return;
    setActiveCerts((prev) =>
      prev.map((c) => (c.id === certToPay.id ? { ...c, status: "VERIFIED FIT", paymentStatus: "PAID", iremboRef: txRef } : c))
    );
    setHistory((prev) =>
      prev.map((h) => (h.id === certToPay.id ? { ...h, status: "Active (Paid)", outcome: "Fit for Activity" } : h))
    );
    setShowIremboModal(false);
    broadcastLiveRefresh();
    setPaymentSuccessAlert(
      `Payment of 5,000 FRW confirmed via IremboPay (${txRef}). Certificate ${certToPay.id} is now active.`
    );
    setTimeout(() => setPaymentSuccessAlert(null), 8000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profileSaveStatus === "saving") return;
    const fieldError = applicantRegistrationError({
      name: profileData.name,
      phone: compactPhone(profileData.phone),
      nationalId: profileData.nationalId,
    });
    if (fieldError) {
      error("Check your details", fieldError);
      return;
    }
    setProfileSaveStatus("saving");
    try {
      let avatarUrl = profileData.avatarUrl;
      if (avatarWebpResult) {
        const uploaded = await uploadToCloudinary(avatarWebpResult.file, "fitmed/applicants");
        if (uploaded.url) {
          avatarUrl = uploaded.url;
          setProfileData((prev) => ({ ...prev, avatarUrl }));
        }
      }
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: profileData.email || session?.email,
          name: profileData.name,
          phone: compactPhone(profileData.phone),
          nationalId: profileData.nationalId,
          dateOfBirth: profileData.dob,
          address: profileData.address,
          avatarUrl,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setProfileSaveStatus("idle");
        error("Profile not saved", data.error || "Could not update your record.");
        return;
      }
      setProfileSaveStatus("saved");
      setSavedSettingsAlert(true);
      setTimeout(() => {
        setSavedSettingsAlert(false);
        setProfileSaveStatus("idle");
      }, 2500);
      success("Profile saved", "Your details were stored in FitMed.");
    } catch {
      setProfileSaveStatus("idle");
      error("Profile not saved", "Network error while saving your profile.");
    }
  };

  if (sessionLoading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-sm text-slate-500">
        Loading your FitMed records…
      </div>
    );
  }

  return (
    <DashboardShell
      role="user"
      activeNav={activeTab}
      onNavChange={goToTab}
      userProfile={{
        name: profileData.name || session?.name || "Applicant",
        email: profileData.email || session?.email || "",
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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
                    {activeCerts[0]?.doctor || appointments[0]?.doctorName || "Not assigned yet"}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                    <Video className="w-3 h-3 text-sky-500" />
                    From your FitMed records
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
                            This certificate was approved by the doctor. Complete payment of <strong>5,000 FRW via IremboPay</strong> (MTN, Airtel, or card) to unlock high-res PDF download and official QR verification.
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
                  Connect with your assigned FitMed physician for identity verification, vital symptom discussion, and real-time clinical assessment.
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
              {FITMED_SERVICES.map((service) => {
                const Icon =
                  {
                    workplace: Briefcase,
                    school: GraduationCap,
                    sports: HeartPulse,
                    transport: Car,
                    food: Utensils,
                    travel: Plane,
                    construction: HardHat,
                  }[service.id] || Briefcase;
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
              dateOfBirth={profileData.dob}
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
              {appointments.length === 0 && (
                <div className="p-8 rounded-3xl border border-dashed border-slate-200 bg-white text-sm text-slate-500">
                  No scheduled appointments.
                </div>
              )}
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
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${meetingStatusClass(meetingLifecycleStatus(apt))}`}>
                        ● {meetingStatusLabel(meetingLifecycleStatus(apt))}
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
                      onClick={() => {
                        window.location.href = `/meet/${encodeURIComponent(apt.roomId || apt.appointmentId)}`;
                      }}
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

            {/* Scheduled appointments waiting room */}
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-[#0B2D5C] uppercase tracking-wider">Your Scheduled Consultations</h3>
              {appointments.length === 0 && (
                <div className="p-6 rounded-3xl border border-dashed border-slate-200 bg-white text-sm text-slate-500">
                  No scheduled appointments. After your doctor books a visit, it will appear here.
                </div>
              )}
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
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${meetingStatusClass(meetingLifecycleStatus(apt))}`}>
                        ● {meetingStatusLabel(meetingLifecycleStatus(apt))}
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
                  { step: "1", title: "Doctor opens the room", desc: "Your physician starts the live room. You both join the same encrypted session." },
                  { step: "2", title: "Start consultation", desc: "Click Start Consultation. Your camera appears as a small self-view; the doctor fills the main frame." },
                  { step: "3", title: "Talk and chat", desc: "Audio/video are peer-to-peer. Use in-call chat for vitals notes. Leave when the review is done." },
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
              {partnerClinics.length === 0 && (
                <div className="md:col-span-3 text-xs text-slate-400">No partner clinics have been added yet.</div>
              )}
              {partnerClinics.map((c) => (
                <div key={c.name} className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-[#12B8B0] flex items-center justify-center font-bold">
                    <Hospital className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-[#0B2D5C]">{c.name}</h4>
                  <div className="text-xs text-slate-500 space-y-1">
                    <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" />{c.city}</div>
                    {c.type ? <div>Type: <strong>{c.type}</strong></div> : null}
                    {c.phone ? <div>Contact: <strong>{c.phone}</strong></div> : null}
                    {c.status ? <div>{c.status}</div> : null}
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[#0B2D5C]">Your in-person referrals</h3>
              {myReferrals.length === 0 && (
                <p className="text-xs text-slate-400">No clinic referral has been issued for your account yet.</p>
              )}
              {myReferrals.map((r) => (
                <div key={r.id} className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
                  <div className="text-sm font-bold text-[#0B2D5C]">{r.clinicName}</div>
                  <div className="text-xs text-slate-600 mt-1">Reason: {r.reason}</div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {r.doctorName ? `Doctor: ${r.doctorName} · ` : ""}
                    {r.date || ""} · {r.status || "Pending"}
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
              <form onSubmit={handleSaveProfile} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-[#0B2D5C]">Your personal details</h3>
                    <p className="text-xs text-slate-500">Upload a clear photo of yourself. We resize it automatically so it loads quickly.</p>
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
                      <div className="text-xs font-bold text-[#0B2D5C]">Profile photo</div>
                      <div className="text-[11px] text-slate-500">Choose a recent photo that shows your face clearly.</div>
                      {avatarWebpResult && (
                        <div className="text-[10px] text-teal-700 font-bold mt-1 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200 inline-block">
                          Photo ready · smaller by {`${avatarWebpResult.reductionPercentage}%`}
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
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value.replace(/\d/g, "") })}
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
                    <label className="block text-slate-400 font-bold uppercase mb-1">Applicant ID</label>
                    <input
                      type="text"
                      value={profileData.applicantId || "Assigned after registration"}
                      disabled
                      className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-mono font-semibold text-slate-600"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold uppercase mb-1">National ID / Passport</label>
                    <input
                      type="text"
                      maxLength={16}
                      inputMode="numeric"
                      value={profileData.nationalId}
                      onChange={(e) => setProfileData({ ...profileData, nationalId: e.target.value.replace(/\D/g, "").slice(0, 16) })}
                      className="w-full p-3 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-[#12B8B0]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold uppercase mb-1">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+250788000000"
                      maxLength={13}
                      value={profileData.phone}
                      onChange={(e) => {
                        let next = e.target.value.replace(/[^\d+]/g, "");
                        if (next && !next.startsWith("+")) next = `+${next.replace(/\+/g, "")}`;
                        setProfileData({ ...profileData, phone: next.slice(0, 13) });
                      }}
                      className="w-full p-3 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-[#12B8B0]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold uppercase mb-1">Date of Birth</label>
                    <BrandDatePicker value={profileData.dob} onChange={(dob) => setProfileData({ ...profileData, dob })} preset="birth" />
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
                    disabled={profileSaveStatus === "saving"}
                    className={`px-6 py-3 rounded-xl font-black text-xs transition-colors flex items-center gap-2 disabled:cursor-wait ${
                      profileSaveStatus === "saving"
                        ? "bg-amber-400 text-[#0B2D5C]"
                        : profileSaveStatus === "saved"
                        ? "bg-emerald-600 text-white"
                        : "bg-[#12B8B0] hover:bg-[#1dd9d0] text-[#0B2D5C]"
                    }`}
                  >
                    {profileSaveStatus === "saving" && <Loader2 className="w-4 h-4 animate-spin" />}
                    {profileSaveStatus === "saved" && <Check className="w-4 h-4" />}
                    {profileSaveStatus === "saving"
                      ? "Saving changes…"
                      : profileSaveStatus === "saved"
                      ? "Saved"
                      : "Save Changes"}
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
                    onClick={async () => {
                      if (!currentPass || !newPass) {
                        warning("Missing details", "Enter your current password and a new password.");
                        return;
                      }
                      try {
                        const res = await fetch("/api/auth/password", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            email: profileData.email || session?.email,
                            currentPassword: currentPass,
                            newPassword: newPass,
                          }),
                        });
                        const data = await res.json();
                        if (!data.success) {
                          error("Password not changed", data.error || "Check your current password and try again.");
                          return;
                        }
                        success("Password updated", "Use your new password the next time you sign in.");
                        setCurrentPass("");
                        setNewPass("");
                      } catch {
                        error("Password not changed", "Could not reach the server.");
                      }
                    }}
                    className="px-6 py-2.5 rounded-xl bg-[#0B2D5C] text-white font-bold text-xs hover:bg-slate-800 transition-colors"
                  >
                    Update Password
                  </button>
                </div>

                <div className="pt-6 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50">
                    <div>
                      <div className="text-xs font-bold text-[#0B2D5C]">Extra sign-in protection</div>
                      <div className="text-[11px] text-slate-500">A second check by phone is not available yet.</div>
                    </div>
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold">
                      Coming soon
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
        <IremboPayCheckoutModal
          cert={certToPay}
          onClose={() => setShowIremboModal(false)}
          onPaid={markCertificatePaidLocal}
          onError={error}
        />
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
                ✓ Verified certificate
              </div>
              <h3 className="text-xl font-extrabold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>
                QR Certificate Code
              </h3>
              <p className="text-xs text-slate-500">Scan to open the official certificate page</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block w-[220px] h-[220px]">
              <CertificateQr
                value={publicVerifyUrl(selectedCert?.id)}
                label="Scan to open certificate"
              />
            </div>

            <div className="text-xs text-slate-500">
              Certificate ID: <strong className="text-slate-800">{selectedCert?.id || "—"}</strong>
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
              data={toOfficialCertificateData(selectedCert || {}, {
                candidateName: profileData.name,
                applicantImageUrl: selectedCert?.avatarUrl || profileData.avatarUrl,
                nationalId: profileData.nationalId,
                doctorName: selectedCert?.doctor,
                doctorLicense: selectedCert?.license,
              })}
              onClose={() => setShowOfficialCertModal(false)}
            />
          </div>
        </div>
      )}
      {isCallActive && videoCallRoomId && (
        <WebRTCVideoCall
          roomId={videoCallRoomId}
          userName={profileData.name}
          role="applicant"
          remoteName={activeCallAppointment?.doctorName || "FitMed Physician"}
          purpose={activeCallAppointment?.purpose || "Medical Fitness Consultation"}
          appointmentId={activeCallAppointment?.appointmentId || videoCallRoomId}
          variant="overlay"
          initialMessages={chatMessages}
          onCallEnd={handleEndCall}
        />
      )}
    </DashboardShell>
  );
}
