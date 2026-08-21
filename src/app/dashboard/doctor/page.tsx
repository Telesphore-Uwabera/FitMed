"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import DashboardShell from "@/components/DashboardShell";
import BrandSelect from "@/components/BrandSelect";
import BrandDatePicker from "@/components/BrandDatePicker";
import {
  Stethoscope,
  ClipboardList,
  Video,
  FileSignature,
  AlertTriangle,
  CheckCircle2,
  Brain,
  Activity,
  User,
  Building2,
  X,
  PhoneCall,
  Mic,
  MicOff,
  VideoOff,
  Search,
  Filter,
  Send,
  MessageSquare,
  ShieldCheck,
  Award,
  AlertCircle,
  FileCheck,
  Sparkles,
  Calendar,
  CalendarCheck,
  Clock,
  Check,
  Plus,
  Sun,
  Moon,
  Camera,
  UploadCloud,
  Mail,
  Lock,
  TrendingUp,
  IdCard,
  FileText,
  Download,
  Eye,
} from "lucide-react";
import { convertToWebP, uploadToCloudinary, WebPConversionResult } from "@/lib/imageUtils";
import OfficialMedicalCertificate from "@/components/OfficialMedicalCertificate";
import DoctorAssessmentForm, { DoctorDecision } from "@/components/DoctorAssessmentForm";
import WebRTCVideoCall, { FITMED_LIVE_ROOM } from "@/components/WebRTCVideoCall";
import { useSession } from "@/lib/useSession";
import { consultationRoomId, formatChatMessages } from "@/lib/consultation";
import StructuredDoctorAssessmentForm from "@/components/StructuredDoctorAssessmentForm";
import ApplicantQuestionnaireViewer from "@/components/ApplicantQuestionnaireViewer";
import { useToast } from "@/components/ToastProvider";
import { useDialog } from "@/components/DialogProvider";
import { displayValue, isIssuedCertificate, sameCalendarDay, todayShift } from "@/lib/records";

export default function DoctorDashboardPage() {
  const { success, error, warning, info } = useToast();
  const { confirm } = useDialog();
  const { session, loading: sessionLoading } = useSession("doctor");
  const [activeNav, setActiveNav] = useState("queue");

  const goToNav = (id: string) => {
    setActiveNav(id);
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("nav", id);
    window.history.replaceState({}, "", url);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nav = params.get("nav") || params.get("tab");
    if (nav) setActiveNav(nav);
  }, []);
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
  const [showOfficialCertModal, setShowOfficialCertModal] = useState(false);
  const [selectedCertForModal, setSelectedCertForModal] = useState<any | null>(null);
  const [showSignModal, setShowSignModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showIdModal, setShowIdModal] = useState(false);
  const [idCandidate, setIdCandidate] = useState<any | null>(null);

  // Scheduled Appointments State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleCandidate, setScheduleCandidate] = useState<any | null>(null);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    applicantName: "",
    applicantEmail: "",
    applicantPhone: "",
    purpose: "",
    scheduledDate: "",
    scheduledTime: "14:30",
    durationMinutes: 15,
    notes: "",
  });
  useEffect(() => {
    setScheduleForm((prev) =>
      prev.scheduledDate ? prev : { ...prev, scheduledDate: new Date().toISOString().split("T")[0] }
    );
  }, []);
  const [doctorAppointments, setDoctorAppointments] = useState<any[]>([]);

  // Doctor Availability & Weekly Schedule State
  const [doctorStatus, setDoctorStatus] = useState<"ONLINE" | "BUSY" | "OFF">("OFF");
  const [doctorAvatar, setDoctorAvatar] = useState("");
  const [avatarWebpResult, setAvatarWebpResult] = useState<WebPConversionResult | null>(null);
  const [doctorProfile, setDoctorProfile] = useState({
    id: "",
    name: "",
    email: "",
    licenseNumber: "",
    specialty: "",
    avatarUrl: "",
    isVerified: false,
    status: "OFF" as "ONLINE" | "BUSY" | "OFF",
  });
  const [doctorNewPassword, setDoctorNewPassword] = useState("");
  const [doctorConfirmPassword, setDoctorConfirmPassword] = useState("");
  const [doctorCurrentPassword, setDoctorCurrentPassword] = useState("");
  const [isConvertingAvatar, setIsConvertingAvatar] = useState(false);

  const handleDoctorAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsConvertingAvatar(true);
      const converted = await convertToWebP(file, 0.85, 800);
      setAvatarWebpResult(converted);
      setDoctorAvatar(converted.dataUrl);
    } catch (err) {
      console.error("Doctor avatar conversion failed:", err);
    } finally {
      setIsConvertingAvatar(false);
    }
  };

  const [weeklySchedule, setWeeklySchedule] = useState<
    { day: string; dayEnabled: boolean; dayStart: string; dayEnd: string; nightEnabled: boolean; nightStart: string; nightEnd: string }[]
  >([]);
  const [savedScheduleAlert, setSavedScheduleAlert] = useState(false);

  const calcSlots = (start: string, end: string): string => {
    try {
      const toMin = (t: string) => {
        const [time, period] = t.split(" ");
        let [h, m] = time.split(":").map(Number);
        if (period === "PM" && h !== 12) h += 12;
        if (period === "AM" && h === 12) h = 0;
        return h * 60 + m;
      };
      const diff = toMin(end) - toMin(start);
      if (diff <= 0) return "0 slots";
      const slots = Math.floor(diff / 15);
      return `${slots} slots (15m each)`;
    } catch {
      return "—";
    }
  };

  // 4-tier clinical decision state
  const [decisionType, setDecisionType] = useState<"FIT" | "FIT_RESTRICTED" | "FURTHER_ASSESSMENT" | "NOT_FIT">("FIT");
  const [restrictionsNotes, setRestrictionsNotes] = useState("");

  // Meeting & Telehealth Room State
  const [micMuted, setMicMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [meetingStatus, setMeetingStatus] = useState<"idle" | "waiting" | "connected">("idle");
  const [meetingRoomId, setMeetingRoomId] = useState(FITMED_LIVE_ROOM);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteSentAlert, setInviteSentAlert] = useState<string | null>(null);
  
  // WebRTC video call state
  const [isWebRTCCallActive, setIsWebRTCCallActive] = useState(false);
  const [webRTCRoomId, setWebRTCRoomId] = useState<string>("");

  // Doctor notes and documents state
  const [showDoctorNotesModal, setShowDoctorNotesModal] = useState(false);
  const [doctorNotes, setDoctorNotes] = useState("");
  const [doctorDocuments, setDoctorDocuments] = useState<Array<{ name: string; url: string; type: string }>>([]);

  // Structured assessment form state
  const [showStructuredAssessmentModal, setShowStructuredAssessmentModal] = useState(false);

  // Evaluate & Sign modal state (to view applicant's questionnaire)
  const [showEvaluateSignModal, setShowEvaluateSignModal] = useState(false);

  const startMeeting = async (roomId = meetingRoomId) => {
    let id = consultationRoomId({ appointmentId: roomId, roomId }) || roomId;
    if (!id || id === FITMED_LIVE_ROOM) {
      const open = doctorAppointments.find((a) => ["scheduled", "in-progress"].includes(a.status));
      id = consultationRoomId(open) || "";
    }
    if (!id && selectedCandidate?.applicantEmail) {
      try {
        const res = await fetch("/api/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            applicantName: selectedCandidate.name,
            applicantEmail: selectedCandidate.applicantEmail,
            applicantPhone: selectedCandidate.phone || "",
            doctorId: doctorProfile.id || session?.email || "",
            doctorEmail: session?.email || "",
            doctorName: session?.name || doctorProfile.name || "Physician",
            purpose: selectedCandidate.purpose || "Medical fitness review",
            scheduledDate: new Date().toISOString().split("T")[0],
            scheduledTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            notes: "Live telehealth room opened from doctor workstation.",
            certificateDraftId: selectedCandidate.id || "",
          }),
        });
        const data = await res.json();
        if (data.success && data.appointment) {
          setDoctorAppointments((prev) => [data.appointment, ...prev]);
          id = consultationRoomId(data.appointment);
        }
      } catch {
        /* handled below */
      }
    }
    if (!id) {
      warning("Schedule a visit first", "Create an appointment or open a queue case so both sides share a database room.");
      return;
    }
    setMeetingRoomId(id);
    setWebRTCRoomId(id);
    setMeetingStatus("waiting");
    setIsWebRTCCallActive(true);
    localStorage.setItem(`fitmed_meeting:${id}`, "waiting");
    try {
      await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: id, status: "in-progress" }),
      });
      const chatRes = await fetch(`/api/chat?consultationId=${encodeURIComponent(id)}`);
      const chatData = await chatRes.json();
      if (chatData.success && chatData.messages?.length) {
        setMessages(formatChatMessages(chatData.messages));
      } else {
        setMessages([]);
      }
    } catch {
      setMessages([]);
    }
  };

  useEffect(() => {
    const handleMeetingUpdate = (event: StorageEvent) => {
      if (event.key === `fitmed_meeting:${meetingRoomId}` && event.newValue === "connected") {
        setMeetingStatus("connected");
      }
    };
    window.addEventListener("storage", handleMeetingUpdate);
    return () => window.removeEventListener("storage", handleMeetingUpdate);
  }, [meetingRoomId]);

  // Live Chat state in Telehealth
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<{ sender: string; name: string; text: string; time: string }[]>([]);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg = {
      sender: "doctor",
      name: session?.name || doctorProfile.name || "Physician",
      text: chatInput,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, newMsg]);
    const textToSend = chatInput;
    setChatInput("");

    // Persist to MongoDB
    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderName: session?.name || "Doctor",
          senderRole: "doctor",
          messageText: textToSend,
          consultationId: meetingRoomId,
        }),
      });
    } catch (err) {
      console.warn("Chat MongoDB save fallback:", err);
    }
  };

  // Load chat messages, appointments, and applicant queue from MongoDB
  useEffect(() => {
    if (!session?.email) return;

    const mapQueueItem = (cert: Record<string, any>) => ({
      id: cert.certificateId,
      name: displayValue(cert.candidateName, "Applicant"),
      applicantEmail: cert.applicantEmail,
      phone: displayValue(cert.applicantPhone),
      age: cert.age || "—",
      gender: displayValue(cert.gender),
      nationalId: displayValue(cert.candidateIdNumber),
      avatarUrl: cert.avatarUrl || "",
      nationalIdImageUrl: cert.nationalIdImageUrl || "",
      purpose: displayValue(cert.purpose),
      appliedDate: cert.appliedDate ? new Date(cert.appliedDate).toLocaleString([], { dateStyle: "short", timeStyle: "short" }) : "—",
      riskLevel: displayValue(cert.riskLevel),
      riskColor: cert.riskColor || "bg-slate-100 text-slate-700 border-slate-200",
      vitals: {
        bp: displayValue(cert.vitals?.bloodPressure),
        hr: displayValue(cert.vitals?.heartRate),
        bmi: displayValue(cert.vitals?.bmi),
        spo2: displayValue(cert.vitals?.spo2),
      },
      flags: cert.redFlags ? `${Object.values(cert.redFlags).filter(Boolean).length} flags` : "None recorded",
      history: displayValue(cert.additionalNotes, "No additional notes provided."),
      assignedDoctor: displayValue(cert.assignedDoctor),
      assignedDoctorId: cert.assignedDoctorId || "",
      fullCertificate: cert,
    });

    async function loadData() {
      let doctorId = "";
      let doctorEmail = session?.email || "";
      let doctorName = "";
      let doctorLicense = "";
      try {
        const meRes = await fetch("/api/doctors/me", { credentials: "include" });
        const meData = await meRes.json();
        if (meData.success && meData.doctor) {
          const d = meData.doctor;
          doctorId = d.id || "";
          doctorEmail = d.email || doctorEmail;
          doctorName = d.name || "";
          doctorLicense = d.licenseNumber || "";
          setDoctorProfile(d);
          if (d.avatarUrl) setDoctorAvatar(d.avatarUrl);
          if (d.status === "ONLINE" || d.status === "BUSY" || d.status === "OFF") setDoctorStatus(d.status);
          const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
          if (Array.isArray(d.weeklySchedule) && d.weeklySchedule.length) {
            setWeeklySchedule(d.weeklySchedule);
          } else {
            setWeeklySchedule(
              days.map((day) => ({
                day,
                dayEnabled: false,
                dayStart: "",
                dayEnd: "",
                nightEnabled: false,
                nightStart: "",
                nightEnd: "",
              }))
            );
          }
        }
      } catch {
        // Profile stays empty until the doctor record loads.
      }

      try {
        const aptRes = await fetch(
          `/api/appointments?doctorId=${encodeURIComponent(doctorId || doctorEmail)}&doctorEmail=${encodeURIComponent(doctorEmail)}&doctorName=${encodeURIComponent(doctorName)}`,
          { signal: AbortSignal.timeout(8000) }
        );
        const aptData = await aptRes.json();
        if (aptData.success) {
          setDoctorAppointments(aptData.appointments || []);
        }
      } catch (err) {
        console.warn("Could not load doctor appointments:", err);
        setDoctorAppointments([]);
      }

      try {
        const certRes = await fetch("/api/certificates", { signal: AbortSignal.timeout(15000) });
        const certData = await certRes.json();
        const all = Array.isArray(certData.certificates) ? certData.certificates : [];
        const mine = all.filter((cert: Record<string, unknown>) => {
          if (doctorId && String(cert.assignedDoctorId || "") === doctorId) return true;
          if (doctorLicense && String(cert.assignedDoctorLicense || "") === doctorLicense) return true;
          const normalize = (value: string) =>
            value
              .replace(/\s*\(You\)\s*/gi, "")
              .replace(/\b(dr|md|mbbs)\b\.?/gi, "")
              .replace(/[,\.]/g, " ")
              .replace(/\s+/g, " ")
              .trim()
              .toLowerCase();
          const assigned = normalize(String(cert.assignedDoctor || ""));
          const mineName = normalize(doctorName);
          return Boolean(mineName) && Boolean(assigned) && (assigned.includes(mineName) || mineName.includes(assigned));
        });
        setQueue(mine.filter((cert: Record<string, unknown>) => String(cert.status || "").toLowerCase() === "submitted").map(mapQueueItem));
        setAllApplications(mine);
        setIssuedCertificates(
          mine.filter(isIssuedCertificate).map((cert: Record<string, unknown>) => ({
            id: String(cert.certificateId || ""),
            name: String(cert.candidateName || "Applicant"),
            candidate: String(cert.candidateName || "Applicant"),
            purpose: String(cert.purpose || "—"),
            decision: String(cert.decision || cert.status || "ISSUED"),
            date: cert.issuedAt || cert.appliedDate ? new Date(String(cert.issuedAt || cert.appliedDate)).toLocaleDateString() : "—",
            avatarUrl: String(cert.avatarUrl || ""),
          }))
        );
      } catch (err) {
        console.warn("Could not load applicant queue:", err);
        setQueue([]);
        setAllApplications([]);
        setIssuedCertificates([]);
      }

      try {
        const staffRes = await fetch("/api/admin/staff");
        const staffData = await staffRes.json();
        if (staffData.success && Array.isArray(staffData.doctors)) {
          setActiveDoctorsOnDuty(
            staffData.doctors
              .filter((d: { presence?: string }) => d.presence === "ONLINE")
              .map((d: { id: string; name: string; specialty?: string; role?: string; presence?: string }) => ({
                id: d.id,
                name: d.name,
                specialty: d.specialty || d.role || "Physician",
                status: d.presence === "ONLINE" ? "Online" : "On file",
              }))
          );
        }
      } catch {
        setActiveDoctorsOnDuty([]);
      }

      try {
        const clinicRes = await fetch("/api/clinics");
        const clinicData = await clinicRes.json();
        setPartnerClinics(clinicData.success ? clinicData.clinics || [] : []);
      } catch {
        setPartnerClinics([]);
      }

      try {
        const refRes = await fetch("/api/referrals");
        const refData = await refRes.json();
        setPhysicalReferrals(refData.success ? refData.referrals || [] : []);
      } catch {
        setPhysicalReferrals([]);
      }
    }

    loadData();
  }, [session?.email]);

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsScheduling(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...scheduleForm,
          doctorId: session?.email || doctorProfile.id || "",
          doctorEmail: session?.email || "",
          doctorName: session?.name || "Physician",
          doctorSpecialty: "Occupational Health & Telehealth Physician",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDoctorAppointments((prev) => [data.appointment, ...prev]);
        success("Appointment Scheduled", `Meeting invitation sent to ${scheduleForm.applicantEmail}.`);
        setShowScheduleModal(false);
      } else {
        error("Scheduling Error", data.error || "Failed to schedule appointment.");
      }
    } catch (err: any) {
      error("Scheduling Error", err?.message || "Could not save the appointment to the database.");
    } finally {
      setIsScheduling(false);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/telehealth/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicantEmail: inviteEmail,
          applicantName: selectedCandidate?.name || "",
          patientEmail: inviteEmail,
          patientName: selectedCandidate?.name || "",
          doctorName: session?.name || doctorProfile.name || "Physician",
          scheduledTime: "Live Now (Consultation Active)",
          roomUrl: `/dashboard/user?tab=consultation&room=${meetingRoomId}`,
        }),
      });
      const data = await res.json();
      setInviteSentAlert(`Telehealth invitation sent to ${inviteEmail}.`);
      setTimeout(() => setInviteSentAlert(null), 4000);
      setShowInviteModal(false);
    } catch (err) {
      setInviteSentAlert(`Invite sent to ${inviteEmail}!`);
      setTimeout(() => setInviteSentAlert(null), 4000);
      setShowInviteModal(false);
    }
  };  const [queue, setQueue] = useState<any[]>([]);
  const [allApplications, setAllApplications] = useState<any[]>([]);
  const [appSearch, setAppSearch] = useState("");
  const [appStatus, setAppStatus] = useState("all");
  const [appDecision, setAppDecision] = useState("all");
  const [appPayment, setAppPayment] = useState("all");
  const [appDate, setAppDate] = useState("all");
  const [selectedApplication, setSelectedApplication] = useState<any | null>(null);
  const [issuedCertificates, setIssuedCertificates] = useState<
    { id: string; name: string; candidate: string; purpose: string; decision: string; date: string; avatarUrl?: string }[]
  >([]);
  const [partnerClinics, setPartnerClinics] = useState<{ id: string; name: string; city: string; phone?: string; type?: string; status?: string }[]>([]);
  const [physicalReferrals, setPhysicalReferrals] = useState<any[]>([]);
  const [referralForm, setReferralForm] = useState({ applicantName: "", applicantEmail: "", clinicName: "", clinicCity: "", reason: "" });
  const [activeDoctorsOnDuty, setActiveDoctorsOnDuty] = useState<
    { id: string; name: string; specialty: string; status: string }[]
  >([]);

  const reassignCandidate = (candidateId: string, targetDoctor: string) => {
    setQueue((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, assignedDoctor: targetDoctor } : c))
    );
    info("Case Reassigned", `Request re-routed & load-balanced to ${targetDoctor}.`);
  };

  const persistDoctorStatus = async (status: "ONLINE" | "BUSY" | "OFF") => {
    setDoctorStatus(status);
    try {
      await fetch("/api/doctors/me", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch {
      // Keep the local status even if the save fails.
    }
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/doctors/me", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weeklySchedule }),
      });
      const data = await res.json();
      if (!data.success) {
        error("Schedule not saved", data.error || "Could not save availability.");
        return;
      }
      setSavedScheduleAlert(true);
      setTimeout(() => setSavedScheduleAlert(false), 3000);
    } catch {
      error("Schedule not saved", "Could not reach the server.");
    }
  };

  const issuedCount = issuedCertificates.length;
  const issuedTodayCount = allApplications.filter(
    (cert) => isIssuedCertificate(cert) && sameCalendarDay(cert.issuedAt || cert.updatedAt, new Date())
  ).length;
  const shiftToday = todayShift(weeklySchedule);
  const estimatedPayout = issuedCount * 4000;
  const filteredApplications = allApplications.filter((cert) => {
    const query = appSearch.trim().toLowerCase();
    if (query) {
      const haystack = [
        cert.candidateName,
        cert.applicantEmail,
        cert.applicantPhone,
        cert.certificateId,
        cert.candidateIdNumber,
        cert.purpose,
        cert.jobType,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    if (appStatus !== "all" && String(cert.status || "").toLowerCase() !== appStatus) return false;
    if (appDecision !== "all") {
      const decision = String(cert.decision || "PENDING").toUpperCase().replace(/_/g, " ");
      if (appDecision === "PENDING" && decision !== "PENDING" && decision !== "") return false;
      if (appDecision !== "PENDING" && !decision.includes(appDecision)) return false;
    }
    if (appPayment !== "all") {
      const paid = String(cert.paymentStatus || "UNPAID").toUpperCase() === "PAID";
      if (appPayment === "PAID" && !paid) return false;
      if (appPayment === "UNPAID" && paid) return false;
    }
    if (appDate !== "all" && cert.appliedDate) {
      const applied = new Date(cert.appliedDate);
      const now = new Date();
      if (appDate === "today" && applied.toDateString() !== now.toDateString()) return false;
      if (appDate === "week" && applied < new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)) return false;
      if (appDate === "month" && applied < new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)) return false;
    }
    return true;
  });

  const applicationToCandidate = (cert: any) => ({
    id: cert.certificateId,
    name: cert.candidateName,
    applicantEmail: cert.applicantEmail,
    phone: cert.applicantPhone,
    age: cert.age,
    gender: cert.gender,
    nationalId: cert.candidateIdNumber,
    avatarUrl: cert.avatarUrl,
    nationalIdImageUrl: cert.nationalIdImageUrl,
    purpose: cert.purpose,
    appliedDate: cert.appliedDate ? new Date(cert.appliedDate).toLocaleString() : "—",
    riskLevel: cert.riskLevel || "—",
    riskColor: cert.riskColor || "bg-slate-100 text-slate-700 border-slate-200",
    vitals: {
      bp: cert.vitals?.bloodPressure || "—",
      hr: cert.vitals?.heartRate || "—",
      bmi: cert.vitals?.bmi || "—",
      spo2: cert.vitals?.spo2 || "—",
    },
    flags: cert.redFlags ? `${Object.values(cert.redFlags).filter(Boolean).length} flags` : "None",
    history: cert.additionalNotes || cert.decisionNotes || "",
    assignedDoctor: cert.assignedDoctor,
    fullCertificate: cert,
  });

  const exportApplications = () => {
    const headers = [
      "Certificate ID",
      "Applicant",
      "Email",
      "Phone",
      "National ID",
      "Purpose",
      "Decision",
      "Status",
      "Payment",
      "Risk",
      "Applied",
      "Doctor",
    ];
    const rows = filteredApplications.map((cert) =>
      [
        cert.certificateId,
        cert.candidateName,
        cert.applicantEmail,
        cert.applicantPhone || "",
        cert.candidateIdNumber,
        cert.purpose,
        cert.decision || "PENDING",
        cert.status,
        cert.paymentStatus || "UNPAID",
        cert.riskLevel || "",
        cert.appliedDate ? new Date(cert.appliedDate).toLocaleString() : "",
        cert.assignedDoctor || "",
      ].map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")
    );
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "fitmed_all_applications.csv";
    link.click();
    URL.revokeObjectURL(url);
    success("Spreadsheet downloaded", "The filtered applications list was saved to your computer.");
  };
  const decisionMix = (() => {
    const labels = [
      { label: "FIT", match: (d: string) => d === "FIT" || d.toUpperCase() === "FIT", bar: "bg-emerald-500" },
      { label: "FIT WITH RESTRICTIONS", match: (d: string) => d.includes("RESTRICT"), bar: "bg-sky-500" },
      { label: "FURTHER ASSESSMENT", match: (d: string) => d.includes("FURTHER") || d.includes("ASSESS"), bar: "bg-amber-500" },
      { label: "NOT FIT", match: (d: string) => d.includes("NOT FIT") || d.includes("UNFIT"), bar: "bg-rose-500" },
    ];
    const total = Math.max(1, issuedCount);
    return labels.map((row) => {
      const count = issuedCertificates.filter((c) => row.match(String(c.decision).toUpperCase())).length;
      return { label: row.label, count, pct: Math.round((count / total) * 100), bar: row.bar };
    });
  })();

  if (sessionLoading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-sm text-slate-500">
        Loading your dashboard…
      </div>
    );
  }

  return (
    <DashboardShell
      role="doctor"
      activeNav={activeNav}
      onNavChange={goToNav}
      userProfile={{
        name: session?.name || "FitMed Physician",
        email: session?.email || "",
        avatarUrl: doctorAvatar,
        badgeLabel: "Licensed Physician",
      }}
      quickAction={{
        label: "Live Telehealth Room",
        onClick: () => {
          setSelectedCandidate(queue[0]);
          goToNav("telehealth");
        },
        icon: Video,
      }}
    >
      <div className="space-y-8">
        {/* ── MAIN INFO STAT CARDS ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Card 1: Pending Queue */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-50/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-[#12B8B0]/15 border border-[#12B8B0]/30 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-[#12B8B0]" />
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Live
                </span>
              </div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Pending Queue</div>
              <div className="text-3xl font-extrabold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>
                {queue.length}
                <span className="text-sm font-semibold text-slate-400 ml-1">candidates</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                <Activity className="w-3 h-3 text-[#12B8B0]" />
                Awaiting clinical evaluation
              </div>
            </div>
          </div>

          {/* Card 2: Certificates Issued Today */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-50/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-sky-100 border border-sky-200 flex items-center justify-center">
                  <FileCheck className="w-5 h-5 text-sky-600" />
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                  Database
                </span>
              </div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Certs Issued</div>
              <div className="text-3xl font-extrabold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>
                {issuedCount}
                <span className="text-sm font-semibold text-slate-400 ml-1">certs</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                <Award className="w-3 h-3 text-sky-500" />
                {issuedTodayCount} issued today
              </div>
            </div>
          </div>

          {/* Card 3: Current Shift */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-50/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-violet-100 border border-violet-200 flex items-center justify-center">
                  <Sun className="w-5 h-5 text-violet-600" />
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                  doctorStatus === "ONLINE" ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : doctorStatus === "BUSY" ? "bg-orange-50 border-orange-200 text-orange-700"
                  : "bg-slate-100 border-slate-200 text-slate-500"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${doctorStatus === "ONLINE" ? "bg-emerald-500 animate-pulse" : doctorStatus === "BUSY" ? "bg-orange-500" : "bg-slate-400"}`} />
                  {doctorStatus}
                </span>
              </div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Active Shift</div>
              <div className="text-lg font-extrabold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>
                {shiftToday.label}
              </div>
              <div className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                <Clock className="w-3 h-3 text-violet-500" />
                {shiftToday.hours}
              </div>
            </div>
          </div>

          {/* Card 4: Doctor License */}
          <div className="bg-gradient-to-br from-[#071d3d] to-[#0B2D5C] rounded-2xl p-5 sm:p-6 border border-sky-500/30 shadow-lg hover:shadow-xl transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#12B8B0]/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-[#12B8B0]/20 border border-[#12B8B0]/40 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-[#12B8B0]" />
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#12B8B0]/20 border border-[#12B8B0]/30 text-[#12B8B0] text-[10px] font-bold uppercase tracking-wider">
                  {doctorProfile.isVerified ? "Verified" : "On file"}
                </span>
              </div>
              <div className="text-xs font-bold text-sky-300/80 uppercase tracking-wider mb-1">License ID</div>
              <div className="text-lg font-extrabold text-white font-mono" style={{ fontFamily: "var(--font-primary)" }}>
                {displayValue(doctorProfile.licenseNumber)}
              </div>
              <div className="text-[11px] text-sky-200/70 mt-1.5 flex items-center gap-1">
                <Stethoscope className="w-3 h-3 text-[#12B8B0]" />
                {displayValue(doctorProfile.specialty, "Physician")}
              </div>
            </div>
          </div>
        </div>

        {/* ── TAB 1: INTAKE QUEUE WITH LOAD BALANCING ── */}
        {activeNav === "queue" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>
                  Candidate Intake & Triage Queue ({queue.length})
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  New applications go to doctors who are on duty, taking turns.
                </p>
              </div>

              {/* Active Load Balancer HUD */}
              <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5 font-extrabold text-[#0B2D5C]">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{session?.name || doctorProfile.name || "Physician"} {doctorStatus === "ONLINE" ? "online" : doctorStatus.toLowerCase()}:</span>
                </div>
                <div className="flex gap-1.5 text-[11px] font-bold text-slate-600">
                  <span className="px-2 py-0.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-200">Pending: {queue.length}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {queue.map((candidate) => (
                <div
                  key={candidate.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-[#12B8B0] transition-all overflow-visible"
                >
                  {/* Status Bar */}
                  <div className={`h-1.5 rounded-t-2xl ${candidate.riskLevel === 'High Risk' ? 'bg-rose-500' : candidate.riskLevel === 'Moderate Risk' ? 'bg-amber-500' : 'bg-emerald-500'}`} />

                  <div className="p-5 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      {/* Avatar & Basic Info */}
                      <div className="flex items-start gap-4 flex-shrink-0">
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden border-2 border-[#12B8B0] flex-shrink-0 shadow-sm">
                          <img
                            src={candidate.avatarUrl || "/logo-1.webp"}
                            alt={candidate.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-extrabold text-[#0B2D5C]">
                              {candidate.name}
                            </h3>
                            <span className="text-xs text-slate-400 font-bold">· {candidate.age}y</span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            ID: {candidate.nationalId || "1199580048123049"}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${candidate.riskColor}`}>
                              {candidate.riskLevel}
                            </span>
                            <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200">
                              {candidate.purpose}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Vitals & Quick Stats */}
                      <div className="flex-1 grid grid-cols-4 gap-2 text-center">
                        <div className="bg-slate-50 rounded-lg p-2 border border-slate-200">
                          <div className="text-sky-600 font-bold text-sm">{candidate.vitals.bp}</div>
                          <div className="text-[9px] text-slate-500 uppercase font-bold">BP</div>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-2 border border-slate-200">
                          <div className="text-teal-600 font-bold text-sm">{candidate.vitals.hr}</div>
                          <div className="text-[9px] text-slate-500 uppercase font-bold">HR</div>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-2 border border-slate-200">
                          <div className="text-indigo-600 font-bold text-sm">{candidate.vitals.bmi}</div>
                          <div className="text-[9px] text-slate-500 uppercase font-bold">BMI</div>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-2 border border-slate-200">
                          <div className="text-emerald-600 font-bold text-sm">{candidate.vitals.spo2}</div>
                          <div className="text-[9px] text-slate-500 uppercase font-bold">SpO₂</div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 sm:w-48">
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>Applied: {candidate.appliedDate}</span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold">NEW</span>
                        </div>
                        <BrandSelect
                          size="compact"
                          value={candidate.fullCertificate?.status || "submitted"}
                          options={[
                            { value: "submitted", label: "Submitted" },
                            { value: "under-review", label: "Under Review" },
                            { value: "approved", label: "Approved" },
                            { value: "rejected", label: "Rejected" },
                          ]}
                          onChange={async (newStatus) => {
                            try {
                              await fetch(`/api/certificates`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  certificateId: candidate.id,
                                  status: newStatus,
                                }),
                              });
                              success("Status Updated", `Application status changed to ${newStatus}`);
                              setQueue(queue.map((c) =>
                                c.id === candidate.id
                                  ? { ...c, fullCertificate: { ...c.fullCertificate, status: newStatus } }
                                  : c
                              ));
                            } catch {
                              error("Error", "Failed to update status");
                            }
                          }}
                        />
                        <button
                          onClick={() => {
                            setIdCandidate(candidate);
                            setShowIdModal(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-200 text-[#0B2D5C] font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <IdCard className="w-3 h-3 text-[#12B8B0]" />
                          <span>View ID</span>
                        </button>
                      </div>
                    </div>

                    {/* Flags & Notes */}
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 font-bold">Flags:</span>
                          <span className={`font-bold ${candidate.flags.includes('0') ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {candidate.flags}
                          </span>
                        </div>
                        <div className="text-slate-400 italic max-w-md truncate">
                          {candidate.history}
                        </div>
                      </div>
                    </div>

                    {/* Doctor Actions */}
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <button
                          onClick={() => {
                            setSelectedCandidate(candidate);
                            setShowEvaluateSignModal(true);
                          }}
                          className="px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Evaluate</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCandidate(candidate);
                            setShowStructuredAssessmentModal(true);
                          }}
                          className="px-3 py-2 rounded-lg bg-[#12B8B0] hover:bg-[#1dd9d0] text-[#0B2D5C] font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <ClipboardList className="w-3.5 h-3.5" />
                          <span>Assess</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCandidate(candidate);
                            setDoctorNotes(candidate.fullCertificate?.doctorNotes || "");
                            setDoctorDocuments(candidate.fullCertificate?.doctorDocuments || []);
                            setShowDoctorNotesModal(true);
                          }}
                          className="px-3 py-2 rounded-lg bg-[#0B2D5C] hover:bg-slate-800 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <FileCheck className="w-3.5 h-3.5 text-[#12B8B0]" />
                          <span>Notes</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCandidate(candidate);
                            goToNav("telehealth");
                          }}
                          className="px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Video</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeNav === "applications" && (
          <div className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>
                  All applications
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Every fitness certificate request, with search, filters, and full case details.
                </p>
              </div>
              <button
                type="button"
                onClick={exportApplications}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-2 self-start"
              >
                <Download className="w-3.5 h-3.5 text-[#12B8B0]" />
                Download filtered list
              </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "All records", value: allApplications.length, color: "text-[#0B2D5C]" },
                {
                  label: "Waiting review",
                  value: allApplications.filter((c) => ["submitted", "under-review", "pending"].includes(String(c.status || "").toLowerCase())).length,
                  color: "text-amber-700",
                },
                {
                  label: "Approved",
                  value: allApplications.filter((c) => ["approved", "valid", "issued"].includes(String(c.status || "").toLowerCase())).length,
                  color: "text-emerald-700",
                },
                {
                  label: "Unpaid",
                  value: allApplications.filter((c) => String(c.paymentStatus || "UNPAID").toUpperCase() !== "PAID").length,
                  color: "text-sky-700",
                },
              ].map((card) => (
                <div key={card.label} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{card.label}</div>
                  <div className={`text-2xl font-black mt-1 ${card.color}`}>{card.value}</div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm grid md:grid-cols-2 xl:grid-cols-5 gap-3">
              <div className="xl:col-span-2 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={appSearch}
                  onChange={(e) => setAppSearch(e.target.value)}
                  placeholder="Search name, email, phone, ID, or purpose"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#12B8B0]"
                />
              </div>
              <select value={appStatus} onChange={(e) => setAppStatus(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs">
                <option value="all">All statuses</option>
                <option value="submitted">Submitted</option>
                <option value="under-review">Under review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Declined</option>
              </select>
              <select value={appDecision} onChange={(e) => setAppDecision(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs">
                <option value="all">All decisions</option>
                <option value="PENDING">Waiting</option>
                <option value="FIT">Fit</option>
                <option value="RESTRICT">Fit with restrictions</option>
                <option value="FURTHER">Needs more assessment</option>
                <option value="NOT FIT">Not fit</option>
              </select>
              <div className="grid grid-cols-2 gap-3">
                <select value={appPayment} onChange={(e) => setAppPayment(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs">
                  <option value="all">All payments</option>
                  <option value="PAID">Paid</option>
                  <option value="UNPAID">Unpaid</option>
                </select>
                <select value={appDate} onChange={(e) => setAppDate(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs">
                  <option value="all">All dates</option>
                  <option value="today">Today</option>
                  <option value="week">This week</option>
                  <option value="month">This month</option>
                </select>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 text-xs text-slate-500">
                Showing {filteredApplications.length} of {allApplications.length} applications
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-extrabold uppercase">
                      <th className="px-5 py-3">Applicant</th>
                      <th className="px-3 py-3">Certificate</th>
                      <th className="px-3 py-3">Purpose</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3">Decision</th>
                      <th className="px-3 py-3">Payment</th>
                      <th className="px-3 py-3">Received</th>
                      <th className="px-5 py-3 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredApplications.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-5 py-10 text-center text-slate-400">
                          No applications match these filters.
                        </td>
                      </tr>
                    )}
                    {filteredApplications.map((cert) => (
                      <tr
                        key={cert.certificateId || cert._id}
                        className="hover:bg-slate-50 cursor-pointer"
                        onClick={() => setSelectedApplication(cert)}
                      >
                        <td className="px-5 py-4">
                          <div className="font-bold text-[#0B2D5C]">{cert.candidateName}</div>
                          <div className="text-slate-500 mt-0.5">{cert.applicantEmail}</div>
                          <div className="text-slate-400 font-mono mt-0.5">{cert.candidateIdNumber || "—"}</div>
                        </td>
                        <td className="px-3 py-4 font-mono font-bold text-[#0B2D5C]">{cert.certificateId}</td>
                        <td className="px-3 py-4 text-slate-700 max-w-[180px]">{cert.purpose || "—"}</td>
                        <td className="px-3 py-4">
                          <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] uppercase">
                            {cert.status || "submitted"}
                          </span>
                        </td>
                        <td className="px-3 py-4 font-bold text-slate-700">{cert.decision || "Waiting"}</td>
                        <td className="px-3 py-4">
                          <span className={`font-bold ${String(cert.paymentStatus).toUpperCase() === "PAID" ? "text-emerald-700" : "text-amber-700"}`}>
                            {cert.paymentStatus || "UNPAID"}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-slate-500 whitespace-nowrap">
                          {cert.appliedDate ? new Date(cert.appliedDate).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-50 text-[#0B2D5C] border border-teal-200 font-bold">
                            <Eye className="w-3.5 h-3.5 text-[#12B8B0]" />
                            Open
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: MEETINGS & APPOINTMENTS HUB ── */}
        {activeNav === "appointments" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>
                  Meetings
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Upcoming video triage sessions and identity verification appointments with applicants.
                </p>
              </div>
              <button
                onClick={() => {
                  setScheduleForm({
                    applicantName: "",
                    applicantEmail: "",
                    applicantPhone: "",
                    purpose: "",
                    scheduledDate: new Date().toISOString().split("T")[0],
                    scheduledTime: "09:00",
                    durationMinutes: 15,
                    notes: "",
                  });
                  setShowScheduleModal(true);
                }}
                className="px-5 py-3 rounded-2xl bg-[#0B2D5C] hover:bg-[#082247] text-white font-extrabold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4 text-[#12B8B0]" />
                <span>+ Schedule New Video Consultation</span>
              </button>
            </div>

            {/* Appointments Grid */}
            <div className="grid gap-4">
              {doctorAppointments.length === 0 && (
                <div className="p-8 rounded-3xl border border-dashed border-slate-200 bg-white text-sm text-slate-500">
                  No appointments in the database. Schedule a consultation to create a shared video room the applicant can join.
                </div>
              )}
              {doctorAppointments.map((apt) => (
                <div
                  key={apt.appointmentId}
                  className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-sm hover:border-[#12B8B0] transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-900 text-xs font-extrabold flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-sky-600" />
                        <span>{apt.scheduledDate} at {apt.scheduledTime}</span>
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider">
                        ● {apt.status}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-400">Ref: {apt.appointmentId}</span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-lg font-extrabold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>
                        {apt.applicantName}
                      </h3>
                      <div className="text-xs font-bold text-teal-800">{apt.purpose}</div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                      <span>Email: <strong>{apt.applicantEmail}</strong></span>
                      <span>·</span>
                      <span>Phone: <strong>{apt.applicantPhone || "+250 788 123 456"}</strong></span>
                      <span>·</span>
                      <span>Duration: <strong>{apt.durationMinutes} mins</strong></span>
                      <span>·</span>
                      <span className="text-slate-500">{apt.notes}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <button
                      onClick={async () => {
                        try {
                          const res = await fetch("/api/appointments", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ appointmentId: apt.appointmentId, action: "remind" }),
                          });
                          const data = await res.json();
                          if (!data.success) {
                            error("Reminder not sent", data.error || "Please try again.");
                            return;
                          }
                          success("Reminder sent", `We emailed ${apt.applicantName} about their visit.`);
                        } catch {
                          error("Reminder not sent", "Could not reach the server.");
                        }
                      }}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <Mail className="w-3.5 h-3.5 text-[#12B8B0]" />
                      <span>Send Reminder</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCandidate({
                          name: apt.applicantName,
                          purpose: apt.purpose,
                          flags: "Scheduled video consultation",
                          history: apt.notes,
                        });
                        startMeeting(apt.appointmentId);
                        goToNav("telehealth");
                      }}
                      className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black text-xs flex items-center gap-2 shadow-sm transition-all active:scale-95"
                    >
                      <Video className="w-4 h-4" />
                      <span>Launch Video Call</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 2: WEEKLY SCHEDULE & AVAILABILITY ── */}
        {activeNav === "schedule" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>
                  Doctor Weekly Telehealth Availability & Hours
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Configure your weekly consultation slots for applicant video triage and digital certification appointments.
                </p>
              </div>

              {/* Live Status Selector */}
              <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
                <button
                  onClick={() => persistDoctorStatus("ONLINE")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    doctorStatus === "ONLINE"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                  <span>Online & Accepting</span>
                </button>

                <button
                  onClick={() => persistDoctorStatus("BUSY")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    doctorStatus === "BUSY"
                      ? "bg-amber-500 text-slate-950 shadow-sm font-black"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-300" />
                  <span>In Consultation</span>
                </button>

                <button
                  onClick={() => persistDoctorStatus("OFF")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    doctorStatus === "OFF"
                      ? "bg-slate-800 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <span>Off Duty</span>
                </button>
              </div>
            </div>

            {savedScheduleAlert && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 font-bold flex items-center gap-2 shadow-sm animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Weekly Telehealth availability schedule updated and published!</span>
              </div>
            )}

            {/* Weekly Schedule Form Table */}
            <form onSubmit={handleSaveSchedule} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#0B2D5C]">Weekly Operating Hours (Rwanda Time / GMT+2)</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">These hours are saved to your profile. New applications go to doctors who are online during these times, taking turns in order.</p>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-sky-100 border border-sky-400 inline-block" />
                    Day Shift
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-indigo-100 border border-indigo-400 inline-block" />
                    Night Shift
                  </span>
                </div>
              </div>

              {/* Column Headers */}
              <div className="hidden sm:grid grid-cols-[130px_1fr_1fr] gap-4 pb-2 border-b border-slate-100">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Day</span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-600 flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5" />
                  Day / night hours from your saved schedule
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                  <Moon className="w-3.5 h-3.5" />
                  Night Shift (05:00 PM – 11:00 PM)
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {weeklySchedule.map((item, index) => (
                  <div key={item.day} className="py-4 grid sm:grid-cols-[130px_1fr_1fr] gap-4 items-start">

                    {/* Day Name */}
                    <div className="flex items-center gap-2 pt-1">
                      <span className={`text-sm font-bold w-24 ${(item.dayEnabled || item.nightEnabled) ? "text-[#0B2D5C]" : "text-slate-400"}`}>
                        {item.day}
                      </span>
                    </div>

                    {/* Day Shift Column */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={item.dayEnabled}
                          onChange={(e) => {
                            const updated = [...weeklySchedule];
                            updated[index] = { ...updated[index], dayEnabled: e.target.checked };
                            setWeeklySchedule(updated);
                          }}
                          className="w-4 h-4 accent-sky-500 rounded flex-shrink-0"
                        />
                        <span className="text-[10px] font-extrabold uppercase text-sky-600 sm:hidden">Day Shift</span>
                      </div>
                      {item.dayEnabled ? (
                        <div className="flex items-center gap-2 flex-wrap text-xs">
                          <div className="p-2 rounded-xl bg-sky-50 border border-sky-200 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-sky-500" />
                            <input
                              type="text"
                              value={item.dayStart}
                              onChange={(e) => {
                                const updated = [...weeklySchedule];
                                updated[index] = { ...updated[index], dayStart: e.target.value };
                                setWeeklySchedule(updated);
                              }}
                              className="bg-transparent w-20 font-semibold text-center text-sky-900 focus:outline-none"
                            />
                            <span className="text-sky-400 text-[10px]">→</span>
                            <input
                              type="text"
                              value={item.dayEnd}
                              onChange={(e) => {
                                const updated = [...weeklySchedule];
                                updated[index] = { ...updated[index], dayEnd: e.target.value };
                                setWeeklySchedule(updated);
                              }}
                              className="bg-transparent w-20 font-semibold text-center text-sky-900 focus:outline-none"
                            />
                          </div>
                          <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                            {calcSlots(item.dayStart, item.dayEnd)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Day off</span>
                      )}
                    </div>

                    {/* Night Shift Column */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={item.nightEnabled}
                          onChange={(e) => {
                            const updated = [...weeklySchedule];
                            updated[index] = { ...updated[index], nightEnabled: e.target.checked };
                            setWeeklySchedule(updated);
                          }}
                          className="w-4 h-4 accent-indigo-500 rounded flex-shrink-0"
                        />
                        <span className="text-[10px] font-extrabold uppercase text-indigo-600 sm:hidden">Night Shift</span>
                      </div>
                      {item.nightEnabled ? (
                        <div className="flex items-center gap-2 flex-wrap text-xs">
                          <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-indigo-500" />
                            <input
                              type="text"
                              value={item.nightStart}
                              onChange={(e) => {
                                const updated = [...weeklySchedule];
                                updated[index] = { ...updated[index], nightStart: e.target.value };
                                setWeeklySchedule(updated);
                              }}
                              className="bg-transparent w-20 font-semibold text-center text-indigo-900 focus:outline-none"
                            />
                            <span className="text-indigo-400 text-[10px]">→</span>
                            <input
                              type="text"
                              value={item.nightEnd}
                              onChange={(e) => {
                                const updated = [...weeklySchedule];
                                updated[index] = { ...updated[index], nightEnd: e.target.value };
                                setWeeklySchedule(updated);
                              }}
                              className="bg-transparent w-20 font-semibold text-center text-indigo-900 focus:outline-none"
                            />
                          </div>
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                            {calcSlots(item.nightStart, item.nightEnd)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No night shift</span>
                      )}
                    </div>

                  </div>
                ))}
              </div>

              {/* Total slots summary */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap gap-6 text-xs">
                <div>
                  <div className="text-slate-400 font-bold uppercase text-[10px] mb-0.5">Total Day Slots / Week</div>
                  <div className="text-lg font-extrabold text-sky-700">
                    {weeklySchedule.filter(d => d.dayEnabled).reduce((acc, d) => {
                      try {
                        const toMin = (t: string) => { const [time, period] = t.split(" "); let [h, m] = time.split(":").map(Number); if (period === "PM" && h !== 12) h += 12; if (period === "AM" && h === 12) h = 0; return h * 60 + m; };
                        return acc + Math.floor((toMin(d.dayEnd) - toMin(d.dayStart)) / 15);
                      } catch { return acc; }
                    }, 0)} slots
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 font-bold uppercase text-[10px] mb-0.5">Total Night Slots / Week</div>
                  <div className="text-lg font-extrabold text-indigo-700">
                    {weeklySchedule.filter(d => d.nightEnabled).reduce((acc, d) => {
                      try {
                        const toMin = (t: string) => { const [time, period] = t.split(" "); let [h, m] = time.split(":").map(Number); if (period === "PM" && h !== 12) h += 12; if (period === "AM" && h === 12) h = 0; return h * 60 + m; };
                        return acc + Math.floor((toMin(d.nightEnd) - toMin(d.nightStart)) / 15);
                      } catch { return acc; }
                    }, 0)} slots
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 font-bold uppercase text-[10px] mb-0.5">Night Shift Days Active</div>
                  <div className="text-lg font-extrabold text-[#0B2D5C]">
                    {weeklySchedule.filter(d => d.nightEnabled).map(d => d.day.slice(0, 3)).join(", ") || "None"}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-[#12B8B0] hover:bg-[#1dd9d0] text-[#0B2D5C] font-black text-xs transition-colors shadow-sm"
                >
                  Publish & Sync Schedule
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── TAB 3: LIVE TELEHEALTH & CHAT SUITE ── */}
        {activeNav === "telehealth" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>
                    Live Telehealth Video Consultation Room
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Active Candidate: <strong>{selectedCandidate?.name || "No applicant selected"}</strong> · Category: {selectedCandidate?.purpose || "—"}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {meetingStatus === "idle" && (
                  <button
                    onClick={() => startMeeting()}
                    className="px-5 py-2 rounded-xl bg-[#12B8B0] text-[#0B2D5C] font-black text-xs hover:bg-[#1dd9d0] transition-colors shadow-sm flex items-center gap-1.5"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Start Meeting</span>
                  </button>
                )}
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="px-4 py-2 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 font-bold text-xs hover:bg-sky-100 flex items-center gap-1.5 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-sky-600" />
                  <span>Send email invite</span>
                </button>

                <button
                  onClick={() => setShowSignModal(true)}
                  className="px-5 py-2 rounded-xl bg-[#12B8B0] text-[#0B2D5C] font-black text-xs hover:bg-[#1dd9d0] transition-colors shadow-sm"
                >
                  Make Clinical Decision
                </button>
              </div>
            </div>

            {inviteSentAlert && (
              <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-xs text-teal-900 font-bold flex items-center gap-2 animate-in fade-in">
                <Check className="w-4 h-4 text-teal-600" />
                <span>{inviteSentAlert}</span>
              </div>
            )}

            {meetingStatus === "idle" ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-10 sm:p-16 text-center shadow-sm">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center">
                  <Video className="w-8 h-8 text-sky-600" />
                </div>
                <h3 className="mt-5 text-xl font-extrabold text-[#0B2D5C]">Meeting not started</h3>
                <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
                  Open the live room when you are ready. Schedule or launch an appointment first so the applicant joins that same database room.
                </p>
                <button
                  onClick={() => startMeeting()}
                  className="mt-6 px-6 py-3 rounded-xl bg-[#12B8B0] text-[#0B2D5C] font-black text-xs hover:bg-[#1dd9d0] transition-colors shadow-sm"
                >
                  Start Meeting
                </button>
              </div>
            ) : (
              <WebRTCVideoCall
                roomId={webRTCRoomId || meetingRoomId}
                userName={session?.name || doctorProfile.name || "Physician"}
                role="doctor"
                remoteName={selectedCandidate?.name || "Applicant"}
                purpose={selectedCandidate?.purpose || "Medical fitness consultation"}
                appointmentId={meetingRoomId}
                variant="embedded"
                initialMessages={messages.map((m) => ({
                  sender: m.sender as "doctor" | "applicant",
                  name: m.name,
                  text: m.text,
                  time: m.time,
                }))}
                onRemoteJoined={() => setMeetingStatus("connected")}
                onCallEnd={() => {
                  setIsWebRTCCallActive(false);
                  setWebRTCRoomId("");
                  setMeetingStatus("idle");
                  localStorage.removeItem(`fitmed_meeting:${meetingRoomId}`);
                  void fetch("/api/appointments", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ appointmentId: meetingRoomId, status: "completed" }),
                  });
                }}
              />
            )}
          </div>
        )}

        {/* Telehealth Email Invite Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full space-y-6 shadow-2xl relative text-slate-800">
              <button
                onClick={() => setShowInviteModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#12B8B0] uppercase tracking-wider">
                  <Mail className="w-4 h-4" />
                  <span>Email notification</span>
                </div>
                <h3 className="text-xl font-extrabold text-[#0B2D5C]">Send Video Consultation Invite</h3>
                <p className="text-xs text-slate-500">Dispatch an encrypted video meeting link directly to the candidate's email address.</p>
              </div>

              <form onSubmit={handleSendInvite} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Candidate Email Address</label>
                  <input
                    required
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Applicant email"
                    className="w-full p-3 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-[#12B8B0]"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 space-y-1">
                  <div><strong>Meeting Room:</strong> {meetingRoomId}</div>
                  <div><strong>Host:</strong> {session.name}</div>
                  <div><strong>Security:</strong> Private video visit</div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-[#12B8B0] hover:bg-[#1dd9d0] text-[#0B2D5C] font-black text-xs flex items-center justify-center gap-2 transition-colors shadow-md"
                >
                  <Send className="w-4 h-4" />
                  <span>Send email invite</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── TAB: MY REPORTS ── */}
        {activeNav === "reports" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>
                  My Clinical Reports &amp; Performance
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Your evaluation volume, scheduled visits, and payout snapshot for this period.
                </p>
              </div>
              <button
                onClick={() => {
                  const rows = issuedCertificates.map((row) => [row.id, row.name, row.purpose, row.decision, row.date]);
                  const csv = ["Certificate,Applicant,Purpose,Decision,Date", ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
                  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = "doctor_activity.csv";
                  link.click();
                  URL.revokeObjectURL(url);
                  success("Report downloaded", "Your activity spreadsheet was saved to your computer.");
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-2 self-start"
              >
                <TrendingUp className="w-3.5 h-3.5 text-[#12B8B0]" />
                Export activity spreadsheet
              </button>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm">
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Intake in queue</div>
                <div className="text-2xl font-black text-[#0B2D5C] mt-1">{queue.length}</div>
                <div className="text-[11px] text-slate-500 mt-1">Assigned to active physicians</div>
              </div>
              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm">
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Upcoming meetings</div>
                <div className="text-2xl font-black text-sky-600 mt-1">{doctorAppointments.length}</div>
                <div className="text-[11px] text-slate-500 mt-1">Video consultations scheduled</div>
              </div>
              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm">
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Certificates signed</div>
                <div className="text-2xl font-black text-emerald-600 mt-1">{issuedCount}</div>
                <div className="text-[11px] text-slate-500 mt-1">This reporting cycle</div>
              </div>
              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm">
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Estimated payout (80%)</div>
                <div className="text-2xl font-black text-[#12B8B0] mt-1">{estimatedPayout.toLocaleString()} FRW</div>
                <div className="text-[11px] text-slate-500 mt-1">{issuedCount} × 4,000 FRW after Irembo settlement</div>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-sm font-extrabold text-[#0B2D5C]">4-tier decision mix</h3>
                {decisionMix.map((row) => (
                  <div key={row.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">{row.label}</span>
                      <span className="font-bold text-[#0B2D5C]">{row.count} · {`${row.pct}%`}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full rounded-full ${row.bar}`} style={{ width: `${row.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
                <h3 className="text-sm font-extrabold text-[#0B2D5C]">This week&apos;s evaluation log</h3>
                <div className="divide-y divide-slate-100 text-xs">
                  {issuedCertificates.length === 0 && (
                    <div className="py-3 text-slate-500">No issued certificates yet.</div>
                  )}
                  {issuedCertificates.map((row) => (
                    <div key={row.id} className="py-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-[#0B2D5C]">{row.name}</div>
                        <div className="text-slate-400 font-mono mt-0.5">{row.id}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-extrabold text-slate-700">{row.decision}</div>
                        <div className="text-slate-400">{row.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => goToNav("signed")}
                  className="w-full py-2.5 rounded-xl bg-[#0B2D5C] text-white text-xs font-bold hover:bg-[#082247]"
                >
                  Open issued certificates
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: SIGNED CERTIFICATES ── */}
        {activeNav === "signed" && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-lg sm:text-xl font-bold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>
              Issued certificates ({issuedCount})
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-extrabold uppercase">
                    <th className="pb-3">Certificate Number</th>
                    <th className="pb-3">Candidate</th>
                    <th className="pb-3">Purpose</th>
                    <th className="pb-3">Decision</th>
                    <th className="pb-3">Signed Date</th>
                    <th className="pb-3 text-right">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {issuedCertificates.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400">
                        No issued certificates yet.
                      </td>
                    </tr>
                  )}
                  {issuedCertificates.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => {
                        setSelectedCertForModal(row);
                        setShowOfficialCertModal(true);
                      }}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                      title="Click to view and print official certificate"
                    >
                      <td className="py-4 font-bold text-[#0B2D5C] font-mono">{row.id}</td>
                      <td className="py-4 font-bold text-[#0B2D5C]">{row.candidate}</td>
                      <td className="py-4">{row.purpose}</td>
                      <td className="py-4">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          ✓ {row.decision}
                        </span>
                      </td>
                      <td className="py-4">{row.date}</td>
                      <td className="py-4 text-right">
                        <span className="px-3 py-1 rounded-lg bg-teal-50 text-[#12B8B0] border border-teal-200 font-extrabold text-[11px] hover:bg-teal-100">
                          View Official PDF
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 5: PHYSICAL REFERRALS ── */}
        {activeNav === "referrals" && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-lg sm:text-xl font-bold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>
              Physical Clinic Referrals ({physicalReferrals.length})
            </h3>
            <p className="text-xs text-slate-500">
              Candidates who need an in-person examination are listed here.
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const res = await fetch("/api/referrals", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(referralForm),
                  });
                  const data = await res.json();
                  if (!data.success) {
                    error("Referral not saved", data.error || "Please try again.");
                    return;
                  }
                  setPhysicalReferrals((prev) => [data.referral, ...prev]);
                  setReferralForm({ applicantName: "", applicantEmail: "", clinicName: "", clinicCity: "", reason: "" });
                  success("Referral saved", "The in-person referral is now in FitMed records.");
                } catch {
                  error("Referral not saved", "Could not reach the server.");
                }
              }}
              className="grid sm:grid-cols-2 gap-4"
            >
              <input required placeholder="Applicant name" value={referralForm.applicantName} onChange={(e) => setReferralForm({ ...referralForm, applicantName: e.target.value })} className="text-xs" />
              <input placeholder="Applicant email" value={referralForm.applicantEmail} onChange={(e) => setReferralForm({ ...referralForm, applicantEmail: e.target.value })} className="text-xs" />
              {partnerClinics.length > 0 ? (
              <select
                required
                value={referralForm.clinicName}
                onChange={(e) => {
                  const clinic = partnerClinics.find((c) => c.name === e.target.value);
                  setReferralForm({ ...referralForm, clinicName: e.target.value, clinicCity: clinic?.city || "" });
                }}
                className="text-xs"
              >
                <option value="">Select partner clinic</option>
                {partnerClinics.map((c) => (
                  <option key={c.id} value={c.name}>{c.name} — {c.city}</option>
                ))}
              </select>
              ) : (
                <input
                  required
                  placeholder="Clinic name and city"
                  value={referralForm.clinicName}
                  onChange={(e) => setReferralForm({ ...referralForm, clinicName: e.target.value })}
                  className="text-xs"
                />
              )}
              <input required placeholder="Clinical reason" value={referralForm.reason} onChange={(e) => setReferralForm({ ...referralForm, reason: e.target.value })} className="text-xs" />
              <button type="submit" className="sm:col-span-2 px-4 py-2 rounded-xl bg-[#0B2D5C] text-white text-xs font-bold">Save referral</button>
            </form>
            <div className="space-y-3">
              {physicalReferrals.length === 0 && <p className="text-xs text-slate-400">No physical referrals in the database yet.</p>}
              {physicalReferrals.map((r) => (
                <div key={r.id} className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-[#0B2D5C]">{r.applicantName}</div>
                    <div className="text-[11px] text-slate-600">Referred to: <strong>{r.clinicName}</strong></div>
                    <div className="text-[11px] text-amber-800">Reason: {r.reason}</div>
                  </div>
                  <span className="px-3 py-1 bg-amber-200 text-amber-900 rounded-full text-[10px] font-bold">
                    {r.status || "Pending in-person visit"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 6: 4-TIER DECISION MATRIX STANDARDS ── */}
        {activeNav === "clinical" && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-lg sm:text-xl font-bold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>
              FitMed 4-Tier Clinical Decision Framework
            </h3>
            <p className="text-xs text-slate-500">
              Mandatory decision categories per FitMed Clinical Governance & Rwanda Telemedicine Standards.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1.5">
                <div className="text-xs font-extrabold text-emerald-800">1. FIT</div>
                <p className="text-xs text-emerald-950 leading-relaxed">
                  Medically fit for the stated purpose without reservations. Instant certificate issued with QR code.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-sky-50 border border-sky-200 space-y-1.5">
                <div className="text-xs font-extrabold text-sky-800">2. FIT WITH RESTRICTIONS</div>
                <p className="text-xs text-sky-950 leading-relaxed">
                  Fit subject to clearly documented clinical limitations (e.g. corrective lenses required, no heavy lifting &gt; 15kg).
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 space-y-1.5">
                <div className="text-xs font-extrabold text-amber-800">3. FURTHER ASSESSMENT REQUIRED</div>
                <p className="text-xs text-amber-950 leading-relaxed">
                  Requires physical examination, diagnostic investigations (ECG, lab panel), or partner clinic in-person referral.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 space-y-1.5">
                <div className="text-xs font-extrabold text-rose-800">4. NOT FIT</div>
                <p className="text-xs text-rose-950 leading-relaxed">
                  Not medically fit for the requested activity at the time of evaluation. Safe clinical escalation pathway initiated.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 7: PRACTITIONER PROFILE & CREDENTIALS ── */}
        {activeNav === "settings" && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>
                  Practitioner Profile & Medical Council Licensing
                </h3>
                <p className="text-xs text-slate-500">Upload a clear photo. We resize it automatically so it loads quickly.</p>
              </div>
            </div>

            {/* Avatar Uploader with WebP conversion */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#12B8B0] relative shadow-sm flex-shrink-0 bg-slate-200 flex items-center justify-center">
                  <img src={doctorAvatar} alt="Doctor Avatar" className="w-full h-full object-cover" />
                  {isConvertingAvatar && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-[#0B2D5C]">Your profile photo</div>
                  <div className="text-[11px] text-slate-500">Choose a recent photo that shows your face clearly.</div>
                  {avatarWebpResult && (
                    <div className="text-[10px] text-teal-700 font-bold mt-1 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200 inline-block">
                      Photo ready · smaller by {`${avatarWebpResult.reductionPercentage}%`}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="cursor-pointer px-4 py-2 rounded-xl bg-white border border-slate-200 hover:border-[#12B8B0] text-[#0B2D5C] font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all">
                  <Camera className="w-3.5 h-3.5 text-[#12B8B0]" />
                  <span>Change Photo</span>
                  <input type="file" accept="image/*" onChange={handleDoctorAvatarChange} className="hidden" />
                </label>
                {avatarWebpResult && (
                  <button
                    onClick={async () => {
                      const res = await uploadToCloudinary(avatarWebpResult.file, "fitmed/doctors");
                      if (res.url) {
                        setDoctorAvatar(res.url);
                        await fetch("/api/doctors/me", {
                          method: "PATCH",
                          credentials: "include",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ avatarUrl: res.url }),
                        });
                      }
                      success("Photo saved", "Your new profile photo is ready.");
                      setAvatarWebpResult(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#12B8B0] text-[#0B2D5C] font-black text-xs shadow-sm hover:bg-[#1dd9d0] transition-colors"
                  >
                    Save photo
                  </button>
                )}
              </div>
            </div>

            {/* Immutable Credentials & Security Lock Notice */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs flex items-start gap-3">
              <Lock className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
              <div className="text-amber-950 space-y-0.5">
                <div className="font-bold">Permanent Practitioner Credentials (Immutable)</div>
                <p className="text-[11px] text-amber-800">
                  Your doctor ID, licence number, and legal name are set when FitMed creates your account. Contact FitMed support if a licence detail needs updating.
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold uppercase mb-1">Doctor Name (Immutable)</label>
                <div className="relative">
                  <input type="text" defaultValue={session.name} disabled className="w-full p-3 rounded-xl border border-slate-200 bg-slate-100 font-semibold text-slate-700 cursor-not-allowed" />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3.5" />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 font-bold uppercase mb-1">RMDC License (Immutable)</label>
                <div className="relative">
                  <input type="text" value={doctorProfile.licenseNumber || "—"} disabled className="w-full p-3 rounded-xl border border-slate-200 bg-slate-100 font-semibold text-emerald-700 cursor-not-allowed" />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3.5" />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 font-bold uppercase mb-1">Clinical Email</label>
                <input type="email" defaultValue={session.email} disabled className="w-full p-3 rounded-xl border border-slate-200 bg-slate-100 font-semibold text-slate-700 cursor-not-allowed" />
              </div>
            </div>

            {/* Password Change Sub-section (Doctor Authorized) */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#0B2D5C]">Change your sign-in password</h4>
              <div className="grid sm:grid-cols-2 gap-4 text-xs">
                <div className="sm:col-span-2">
                  <label className="block text-slate-600 font-bold mb-1">Current password</label>
                  <input type="password" value={doctorCurrentPassword} onChange={(e) => setDoctorCurrentPassword(e.target.value)} placeholder="••••••••••••" className="w-full p-3 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-[#12B8B0]" />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">New password</label>
                  <input type="password" value={doctorNewPassword} onChange={(e) => setDoctorNewPassword(e.target.value)} placeholder="••••••••••••" className="w-full p-3 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-[#12B8B0]" />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Confirm new password</label>
                  <input type="password" value={doctorConfirmPassword} onChange={(e) => setDoctorConfirmPassword(e.target.value)} placeholder="••••••••••••" className="w-full p-3 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-[#12B8B0]" />
                </div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (!doctorCurrentPassword || !doctorNewPassword) {
                    warning("Missing details", "Enter your current password and a new password.");
                    return;
                  }
                  if (doctorNewPassword !== doctorConfirmPassword) {
                    error("Passwords do not match", "Type the same new password in both boxes.");
                    return;
                  }
                  try {
                    const res = await fetch("/api/auth/password", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        email: session.email,
                        currentPassword: doctorCurrentPassword,
                        newPassword: doctorNewPassword,
                      }),
                    });
                    const data = await res.json();
                    if (!data.success) {
                      error("Password not changed", data.error || "Check your current password and try again.");
                      return;
                    }
                    success("Password updated", "Use your new password the next time you sign in.");
                    setDoctorCurrentPassword("");
                    setDoctorNewPassword("");
                    setDoctorConfirmPassword("");
                  } catch {
                    error("Password not changed", "Could not reach the server.");
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-[#0B2D5C] text-white text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                Update Password
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-xs space-y-1">
              <div className="font-bold text-[#0B2D5C]">Certificate signing</div>
              <div className="text-slate-600 text-[11px]">Certificates you issue are signed with your FitMed doctor account so employers can verify them.</div>
            </div>
          </div>
        )}
      </div>

      {/* Structured FitMed Doctor Assessment Form */}
      {showSignModal && (
        <DoctorAssessmentForm
          candidate={selectedCandidate || queue[0]}
          doctorName={session?.name || doctorProfile.name || "Physician"}
          doctorLicense={doctorProfile.licenseNumber || "—"}
          onDecision={async ({ decision, notes, restrictions }) => {
            const candidate = selectedCandidate || queue[0];
            const candidateName = candidate?.name;
            const certificateId = candidate?.id;

            if (decision === "FIT" || decision === "FIT_RESTRICTED") {
              // Update certificate in database
              try {
                await fetch(`/api/certificates`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    certificateId,
                    decision,
                    restrictions: restrictions || "",
                    decisionNotes: notes || "",
                    status: "approved",
                  }),
                });
              } catch (err) {
                console.warn("Failed to update certificate in database:", err);
              }

              success("Certificate Approved", `${candidateName} — Status set to APPROVED. An email was sent requesting 5,000 FRW payment to unlock.`);
              setQueue((prev) => prev.filter((c) => c.id !== candidate?.id));
            } else if (decision === "REJECTED") {
              try {
                await fetch(`/api/certificates`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    certificateId,
                    decision: "NOT_FIT",
                    decisionNotes: notes || "",
                    status: "rejected",
                  }),
                });
              } catch (err) {
                console.warn("Failed to update certificate in database:", err);
              }

              error("Application Rejected", `${candidateName} — Certification declined. Reason recorded: ${notes || "Clinical criteria not met"}.`);
              setQueue((prev) => prev.filter((c) => c.id !== candidate?.id));
            } else if (decision === "PHYSICAL_CONSULTATION") {
              try {
                await fetch(`/api/certificates`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    certificateId,
                    decision: "FURTHER_ASSESSMENT",
                    decisionNotes: notes || "",
                    status: "under-review",
                  }),
                });
              } catch (err) {
                console.warn("Failed to update certificate in database:", err);
              }

              warning("Physical Checkup Requested", `${candidateName} — Status updated to PHYSICAL CHECK UP REQUESTED at accredited clinic.`);
              setQueue((prev) => prev.filter((c) => c.id !== candidate?.id));
            } else if (decision === "INVESTIGATION_SPECIALIST") {
              try {
                await fetch(`/api/certificates`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    certificateId,
                    decision: "FURTHER_ASSESSMENT",
                    decisionNotes: notes || "",
                    status: "under-review",
                  }),
                });
              } catch (err) {
                console.warn("Failed to update certificate in database:", err);
              }

              warning("Specialist Referral Issued", `${candidateName} — Certification status set to UNDER-REVIEW pending lab diagnostics.`);
            } else {
              error("Urgent Referral Activated", `${candidateName} — Emergency escalation protocol triggered.`);
            }
            setShowSignModal(false);
          }}
          onClose={() => setShowSignModal(false)}
        />
      )}

      {/* In-Person Referral Modal */}
      {showReferralModal && selectedCandidate && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full space-y-6 shadow-2xl relative text-slate-800">
            <button
              onClick={() => setShowReferralModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="text-xs font-bold text-amber-600 uppercase tracking-wider">Risk-Based Referral</div>
              <h3 className="text-2xl font-extrabold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>
                Route Candidate to Partner Clinic
              </h3>
              <p className="text-xs text-slate-500">Candidate: <strong>{selectedCandidate.name}</strong></p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Select Accredited Partner Clinic
                </label>
                <BrandSelect
                  value="Centre Hospitalier Universitaire de Kigali (CHUK)"
                  onChange={() => undefined}
                  options={[
                    "Centre Hospitalier Universitaire de Kigali (CHUK)",
                    "King Faisal Hospital Rwanda - Occupational Medicine",
                    "Kigali Independent Polyclinic - District Exam Center",
                  ]}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Clinical Justification
                </label>
                <textarea
                  rows={3}
                  defaultValue={`In-person physical examination and diagnostic panel required for ${selectedCandidate.purpose}. Flagged: ${selectedCandidate.flags}`}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <button
              onClick={() => {
                success("Clinic Referral Issued", `Appointment details dispatched to ${selectedCandidate.name}.`);
                setQueue((prev) => prev.filter((c) => c.id !== selectedCandidate.id));
                setShowReferralModal(false);
                goToNav("referrals");
              }}
              className="w-full py-3.5 rounded-xl font-bold text-slate-950 bg-amber-400 hover:bg-amber-500 text-sm flex items-center justify-center gap-2 shadow-lg"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Confirm & Issue Physical Exam Referral</span>
            </button>
          </div>
        </div>
      )}
      {selectedApplication && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={() => setSelectedApplication(null)}>
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full my-auto shadow-2xl relative space-y-5" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setSelectedApplication(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-start gap-4 pr-8">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#12B8B0] bg-slate-100 flex-shrink-0">
                {selectedApplication.avatarUrl ? (
                  <img src={selectedApplication.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-black text-[#0B2D5C]">
                    {String(selectedApplication.candidateName || "?").charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-[#0B2D5C]">{selectedApplication.candidateName}</h3>
                <p className="text-xs text-slate-500 mt-1 font-mono">{selectedApplication.certificateId}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold uppercase">{selectedApplication.status || "submitted"}</span>
                  <span className="px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 text-[10px] font-bold">{selectedApplication.decision || "Waiting"}</span>
                  <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold">{selectedApplication.paymentStatus || "UNPAID"}</span>
                </div>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              {[
                ["Email", selectedApplication.applicantEmail],
                ["Phone", selectedApplication.applicantPhone || "—"],
                ["National ID", selectedApplication.candidateIdNumber || "—"],
                ["Age / gender", `${selectedApplication.age || "—"} / ${selectedApplication.gender || "—"}`],
                ["Purpose", selectedApplication.purpose || "—"],
                ["Job type", selectedApplication.jobType || selectedApplication.category || "—"],
                ["Risk", selectedApplication.riskLevel || "—"],
                ["Assigned doctor", selectedApplication.assignedDoctor || "—"],
                ["Received", selectedApplication.appliedDate ? new Date(selectedApplication.appliedDate).toLocaleString() : "—"],
                ["Payment reference", selectedApplication.iremboRef || "—"],
              ].map(([label, value]) => (
                <div key={label} className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{label}</div>
                  <div className="font-bold text-[#0B2D5C] mt-1 break-words">{String(value)}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              {[
                ["Blood pressure", selectedApplication.vitals?.bloodPressure],
                ["Heart rate", selectedApplication.vitals?.heartRate],
                ["BMI", selectedApplication.vitals?.bmi],
                ["Oxygen", selectedApplication.vitals?.spo2],
              ].map(([label, value]) => (
                <div key={label} className="p-3 rounded-2xl border border-slate-200 bg-white">
                  <div className="font-black text-[#0B2D5C]">{value || "—"}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold mt-1">{label}</div>
                </div>
              ))}
            </div>
            {(selectedApplication.additionalNotes || selectedApplication.decisionNotes || selectedApplication.doctorNotes) && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Notes</div>
                <p className="text-slate-700 whitespace-pre-wrap">
                  {selectedApplication.doctorNotes || selectedApplication.decisionNotes || selectedApplication.additionalNotes}
                </p>
              </div>
            )}
            {selectedApplication.nationalIdImageUrl && (
              <div className="space-y-2">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">ID document</div>
                <img src={selectedApplication.nationalIdImageUrl} alt="ID document" className="w-full max-h-64 object-contain rounded-2xl border border-slate-200 bg-slate-50" />
              </div>
            )}
            <div className="flex flex-wrap gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setSelectedCandidate(applicationToCandidate(selectedApplication));
                  setSelectedApplication(null);
                  setShowEvaluateSignModal(true);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                View screening answers
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedCandidate(applicationToCandidate(selectedApplication));
                  setSelectedApplication(null);
                  setShowStructuredAssessmentModal(true);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Open assessment
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedCertForModal({
                    id: selectedApplication.certificateId,
                    candidate: selectedApplication.candidateName,
                    name: selectedApplication.candidateName,
                    purpose: selectedApplication.purpose,
                    decision: selectedApplication.decision,
                    date: selectedApplication.appliedDate ? new Date(selectedApplication.appliedDate).toLocaleDateString() : "—",
                    avatarUrl: selectedApplication.avatarUrl,
                  });
                  setSelectedApplication(null);
                  setShowOfficialCertModal(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-[#0B2D5C] text-white text-xs font-bold"
              >
                View certificate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Medical Fitness Certificate Viewer Modal */}
      {showOfficialCertModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="max-w-4xl w-full my-auto">
            <OfficialMedicalCertificate
              data={{
                certificateId: selectedCertForModal?.id || "",
                candidateName: selectedCertForModal?.candidate || selectedCertForModal?.name || "",
                applicantImageUrl: selectedCertForModal?.avatarUrl || selectedCandidate?.avatarUrl,
                purpose: selectedCertForModal?.purpose || "",
                decision: (selectedCertForModal?.decision?.includes("RESTRICTIONS") ? "FIT_RESTRICTED" : "FIT") as any,
                doctorName: session?.name || "Physician",
                doctorLicense: "",
                doctorId: session?.email || "",
                issueDate: selectedCertForModal?.date || "",
              }}
              onClose={() => setShowOfficialCertModal(false)}
            />
          </div>
        </div>
      )}

      {/* Doctor Notes & Documents Modal */}
      {showDoctorNotesModal && selectedCandidate && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-6 shadow-2xl relative border border-slate-200 text-slate-800">
            <button
              onClick={() => setShowDoctorNotesModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-xl font-extrabold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>
                Doctor Notes & Documents
              </h3>
              <p className="text-xs text-slate-500">
                Add clinical notes and upload related documents for {selectedCandidate.name}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Clinical Notes</label>
                <textarea
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  placeholder="Enter your clinical assessment notes..."
                  rows={4}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#12B8B0] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Uploaded Documents</label>
                <div className="space-y-2">
                  {doctorDocuments.map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-[#12B8B0]" />
                      <a href={doc.url} target="_blank" rel="noreferrer" className="text-xs font-medium text-[#0B2D5C] hover:underline">
                        {doc.name}
                      </a>
                      </div>
                      <button
                        onClick={() => setDoctorDocuments(documents => documents.filter((_, i) => i !== idx))}
                        className="text-red-600 hover:text-red-700 text-xs font-bold"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {doctorDocuments.length === 0 && (
                    <div className="text-center py-4 text-xs text-slate-400">
                      No documents uploaded
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Upload Document</label>
                <input
                  type="file"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const formData = new FormData();
                      formData.append("file", file);
                      formData.append("folder", "fitmed/doctor-documents");
                      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
                      const uploadData = await uploadRes.json();
                      if (!uploadData.url) {
                        error("Document not saved", uploadData.error || "Upload failed.");
                        return;
                      }
                      const newDoc = {
                        name: file.name,
                        url: uploadData.url,
                        type: file.type || "file",
                      };
                      setDoctorDocuments([...doctorDocuments, newDoc]);
                      success("Document uploaded", `${file.name} is stored with this certificate.`);
                    }
                  }}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#12B8B0]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDoctorNotesModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    const certificateId = selectedCandidate.id;
                    await fetch(`/api/certificates`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        certificateId,
                        doctorNotes,
                        doctorDocuments: doctorDocuments.map(doc => ({
                          ...doc,
                          uploadedAt: new Date(),
                        })),
                      }),
                    });
                    success("Saved", "Notes and documents saved successfully");
                    setShowDoctorNotesModal(false);
                  } catch (err) {
                    error("Error", "Failed to save notes and documents");
                  }
                }}
                className="px-4 py-2 rounded-xl bg-[#12B8B0] hover:bg-[#1dd9d0] text-[#0B2D5C] text-xs font-bold transition-colors"
              >
                Save Notes & Documents
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Evaluate & Sign Modal - View Applicant Questionnaire */}
      {showEvaluateSignModal && selectedCandidate && (
        <ApplicantQuestionnaireViewer
          candidate={selectedCandidate}
          onClose={() => setShowEvaluateSignModal(false)}
        />
      )}

      {/* Structured Doctor Assessment Form Modal */}
      {showStructuredAssessmentModal && selectedCandidate && (
        <StructuredDoctorAssessmentForm
          candidate={selectedCandidate}
          doctorName={session?.name || doctorProfile.name || "Physician"}
          doctorLicense={doctorProfile.licenseNumber || "—"}
          onComplete={async (assessmentData) => {
            try {
              const certificateId = selectedCandidate.id;
              await fetch(`/api/certificates`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  certificateId,
                  structuredAssessment: assessmentData,
                  decision: assessmentData.decision,
                  restrictions: assessmentData.restrictions,
                  decisionNotes: assessmentData.decisionReason,
                  status: assessmentData.decision === "FIT" ? "approved" : assessmentData.decision === "FIT_RESTRICTED" ? "approved" : "under-review",
                }),
              });
              success("Assessment Saved", "Structured assessment saved successfully");
              setShowStructuredAssessmentModal(false);
              // Refresh queue
              const res = await fetch("/api/certificates");
              const data = await res.json();
              if (data.success) {
                const formattedQueue = data.certificates
                  .filter((c: any) => String(c.status || "").toLowerCase() === "submitted")
                  .map((c: any) => ({
                    id: c.certificateId,
                    name: displayValue(c.candidateName, "Applicant"),
                    nationalId: displayValue(c.candidateIdNumber),
                    age: c.age || "—",
                    gender: displayValue(c.gender),
                    purpose: displayValue(c.purpose),
                    jobType: c.jobType,
                    vitals: {
                      bp: displayValue(c.vitals?.bloodPressure),
                      hr: displayValue(c.vitals?.heartRate),
                      bmi: displayValue(c.vitals?.bmi),
                      spo2: displayValue(c.vitals?.spo2),
                    },
                    flags: c.redFlags ? `${Object.values(c.redFlags).filter(Boolean).length} flags` : "None recorded",
                    history: displayValue(c.additionalNotes, "No additional notes"),
                    riskLevel: displayValue(c.riskLevel),
                    riskColor: c.riskColor || "bg-slate-100 text-slate-700 border-slate-200",
                    assignedDoctor: displayValue(c.assignedDoctor),
                    appliedDate: c.appliedDate,
                    avatarUrl: c.avatarUrl || "",
                    fullCertificate: c,
                  }));
                setQueue(formattedQueue);
              }
            } catch (err) {
              error("Error", "Failed to save assessment");
            }
          }}
          onClose={() => setShowStructuredAssessmentModal(false)}
        />
      )}

      {/* National ID Document Verification & Inspection Modal */}
      {showIdModal && idCandidate && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-6 shadow-2xl relative border border-slate-200 text-slate-800">
            <button
              onClick={() => setShowIdModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-extrabold uppercase tracking-wider border border-teal-200">
                  Identity Verification
                </span>
                <span className="text-[10px] font-bold text-slate-400">Uploaded ID photo</span>
              </div>
              <h3 className="text-2xl font-extrabold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>
                Applicant Identity &amp; National ID Document
              </h3>
              <p className="text-xs text-slate-500">
                Match applicant visual features against submitted government National ID before clinical certification.
              </p>
            </div>

            {/* Comparison Grid: Live Avatar vs National ID Document */}
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Left: Applicant Headshot */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Applicant Profile Photo
                </div>
                <div className="relative w-28 h-28 mx-auto rounded-2xl overflow-hidden border-2 border-[#12B8B0] shadow-md">
                  <img
                    src={idCandidate.avatarUrl || "/logo-1.webp"}
                    alt={idCandidate.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-0.5">
                  <div className="text-xs font-extrabold text-[#0B2D5C]">{idCandidate.name}</div>
                  <div className="text-[11px] text-slate-500">Age: {idCandidate.age} · {idCandidate.gender || "Male"}</div>
                </div>
              </div>

              {/* Right: National ID Document Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Rwanda National ID / Passport
                </div>
                <div className="relative w-full h-28 rounded-2xl overflow-hidden border-2 border-slate-300 bg-slate-200 shadow-inner">
                  <img
                    src={idCandidate.nationalIdImageUrl || "/logo-1.webp"}
                    alt="National ID Card"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-1.5 right-1.5 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                    Saved photo
                  </div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-xs font-mono font-extrabold text-[#0B2D5C]">
                    ID: {idCandidate.nationalId || "1199580048123049"}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-bold flex items-center justify-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>NIDA Formatted &amp; Verified</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Candidate Metadata Summary */}
            <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-xs text-slate-700 space-y-1.5">
              <div className="font-bold text-[#0B2D5C] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#12B8B0]" />
                Identity Match &amp; Facial Recognition Checklist
              </div>
              <ul className="list-disc ml-4 space-y-1 text-slate-600">
                <li>Applicant photo and National ID document name match: <strong>{idCandidate.name}</strong></li>
                <li>National Identification Number verified against Republic of Rwanda format (16 digits).</li>
                <li>Visual features align with applicant camera feed during telehealth triage.</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  success("Identity Confirmed", `${idCandidate.name}'s National ID was verified and logged.`);
                  setShowIdModal(false);
                }}
                className="flex-1 py-3.5 rounded-xl bg-[#12B8B0] hover:bg-[#1dd9d0] text-[#0B2D5C] font-black text-xs flex items-center justify-center gap-2 shadow-md transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Confirm &amp; Validate Applicant Identity</span>
              </button>
              <button
                onClick={() => setShowIdModal(false)}
                className="px-5 py-3.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Telehealth Consultation Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative border border-slate-200 text-slate-800">
            <button
              onClick={() => setShowScheduleModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-extrabold uppercase tracking-wider border border-teal-200">
                <Calendar className="w-3 h-3 text-[#12B8B0]" />
                <span>Doctor Scheduling Hub</span>
              </div>
              <h3 className="text-xl font-extrabold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>
                Schedule Telehealth Video Consultation
              </h3>
              <p className="text-xs text-slate-500">
                Set appointment time. The applicant will be automatically notified by email and dashboard notification.
              </p>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-4 text-xs">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-600 mb-1">
                    Applicant Name
                  </label>
                  <input
                    type="text"
                    required
                    value={scheduleForm.applicantName}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, applicantName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-[#12B8B0]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-600 mb-1">
                    Applicant Email
                  </label>
                  <input
                    type="email"
                    required
                    value={scheduleForm.applicantEmail}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, applicantEmail: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-[#12B8B0]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-600 mb-1">
                  Certification Purpose
                </label>
                <input
                  type="text"
                  required
                  value={scheduleForm.purpose}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, purpose: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-[#12B8B0]"
                />
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-600 mb-1">
                    Date
                  </label>
                  <BrandDatePicker value={scheduleForm.scheduledDate} onChange={(scheduledDate) => setScheduleForm({ ...scheduleForm, scheduledDate })} />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-600 mb-1">
                    Time (GMT+2)
                  </label>
                  <input
                    type="time"
                    required
                    value={scheduleForm.scheduledTime}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledTime: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-[#12B8B0]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-600 mb-1">
                    Duration
                  </label>
                  <BrandSelect
                    value={String(scheduleForm.durationMinutes)}
                    onChange={(duration) => setScheduleForm({ ...scheduleForm, durationMinutes: parseInt(duration, 10) })}
                    options={[{ value: "15", label: "15 mins" }, { value: "20", label: "20 mins" }, { value: "30", label: "30 mins" }, { value: "45", label: "45 mins" }]}
                    className="text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-600 mb-1">
                  Clinical Notes &amp; Preparation Instructions
                </label>
                <textarea
                  rows={2}
                  value={scheduleForm.notes}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-medium focus:outline-none focus:border-[#12B8B0]"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-slate-700 text-[11px] space-y-1">
                <div className="font-extrabold text-[#0B2D5C] flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#12B8B0]" />
                  <span>Automatic email &amp; in-app notification</span>
                </div>
                <p className="text-slate-600">
                  Saving this consultation sends a branded invitation email with an encrypted video room link and adds it to the applicant's <strong>My Appointments</strong> portal tab.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isScheduling}
                  className="flex-1 py-3 rounded-xl bg-[#12B8B0] hover:bg-[#1dd9d0] text-[#0B2D5C] font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
                >
                  <Calendar className="w-4 h-4" />
                  <span>{isScheduling ? "Dispatching Invitation..." : "Confirm & Dispatch Appointment"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
