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
} from "lucide-react";
import { convertToWebP, uploadToCloudinary, formatBytes, WebPConversionResult } from "@/lib/imageUtils";
import OfficialMedicalCertificate from "@/components/OfficialMedicalCertificate";
import DoctorAssessmentForm, { DoctorDecision } from "@/components/DoctorAssessmentForm";
import { useToast } from "@/components/ToastProvider";
import { useDialog } from "@/components/DialogProvider";

export default function DoctorDashboardPage() {
  const { success, error, warning, info } = useToast();
  const { confirm } = useDialog();
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
    applicantName: "Telesphore Uwabera",
    applicantEmail: "telesphore91073@gmail.com",
    applicantPhone: "+250 788 123 456",
    purpose: "Workplace & Office Fitness Certification",
    scheduledDate: new Date().toISOString().split("T")[0],
    scheduledTime: "14:30",
    durationMinutes: 15,
    notes: "Follow-up clinical video consultation and vital review.",
  });
  const [doctorAppointments, setDoctorAppointments] = useState<any[]>([
    {
      appointmentId: "APT-2026-891",
      applicantName: "Telesphore Uwabera",
      applicantEmail: "telesphore91073@gmail.com",
      applicantPhone: "+250 788 123 456",
      purpose: "Workplace & Office Fitness Certification",
      scheduledDate: "Today",
      scheduledTime: "14:30",
      durationMinutes: 15,
      status: "scheduled",
      roomUrl: "/dashboard/doctor?nav=telehealth",
      notes: "Routine medical clearance and identity verification.",
    },
    {
      appointmentId: "APT-2026-904",
      applicantName: "Jean-Paul Habimana",
      applicantEmail: "jp.habimana@gmail.com",
      applicantPhone: "+250 788 456 789",
      purpose: "Commercial Driver & Transport License",
      scheduledDate: "Tomorrow",
      scheduledTime: "10:00",
      durationMinutes: 20,
      status: "scheduled",
      roomUrl: "/dashboard/doctor?nav=telehealth",
      notes: "Vision, reflex, and blood pressure screening review.",
    },
  ]);

  // Doctor Availability & Weekly Schedule State
  const [doctorStatus, setDoctorStatus] = useState<"ONLINE" | "BUSY" | "OFF">("ONLINE");
  const [doctorAvatar, setDoctorAvatar] = useState("https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&q=80&auto=format&fit=crop");
  const [avatarWebpResult, setAvatarWebpResult] = useState<WebPConversionResult | null>(null);
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

  const [weeklySchedule, setWeeklySchedule] = useState([
    { day: "Monday",    dayEnabled: true,  dayStart: "08:00 AM", dayEnd: "05:00 PM", nightEnabled: false, nightStart: "05:00 PM", nightEnd: "11:00 PM" },
    { day: "Tuesday",   dayEnabled: true,  dayStart: "08:00 AM", dayEnd: "05:00 PM", nightEnabled: false, nightStart: "05:00 PM", nightEnd: "11:00 PM" },
    { day: "Wednesday", dayEnabled: true,  dayStart: "08:00 AM", dayEnd: "05:00 PM", nightEnabled: true,  nightStart: "05:00 PM", nightEnd: "11:00 PM" },
    { day: "Thursday",  dayEnabled: true,  dayStart: "08:00 AM", dayEnd: "05:00 PM", nightEnabled: false, nightStart: "05:00 PM", nightEnd: "11:00 PM" },
    { day: "Friday",    dayEnabled: true,  dayStart: "08:00 AM", dayEnd: "05:00 PM", nightEnabled: true,  nightStart: "05:00 PM", nightEnd: "11:00 PM" },
    { day: "Saturday",  dayEnabled: true,  dayStart: "08:00 AM", dayEnd: "05:00 PM", nightEnabled: false, nightStart: "05:00 PM", nightEnd: "11:00 PM" },
    { day: "Sunday",    dayEnabled: false, dayStart: "08:00 AM", dayEnd: "05:00 PM", nightEnabled: false, nightStart: "05:00 PM", nightEnd: "11:00 PM" },
  ]);
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
  const [meetingRoomId, setMeetingRoomId] = useState("ROOM-FM-9941");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("telesphore91073@gmail.com");
  const [inviteSentAlert, setInviteSentAlert] = useState<string | null>(null);

  const startMeeting = (roomId = meetingRoomId) => {
    setMeetingRoomId(roomId);
    setMeetingStatus("waiting");
    localStorage.setItem(`fitmed_meeting:${roomId}`, "waiting");
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
  const [messages, setMessages] = useState([
    {
      sender: "doctor",
      name: "Dr. Telesphore Uwabera, MD",
      text: "Hello Telesphore! I'm reviewing your questionnaire for the workplace fitness certificate. How are you feeling today?",
      time: "10:15 AM",
    },
    {
      sender: "applicant",
      name: "Telesphore",
      text: "Good morning Doctor. Feeling great, ready for the assessment.",
      time: "10:16 AM",
    },
    {
      sender: "doctor",
      name: "Dr. Telesphore Uwabera, MD",
      text: "Excellent. Your blood pressure (118/78) and SpO2 (98%) are well within standard ranges. Let's do a quick visual check.",
      time: "10:16 AM",
    },
  ]);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg = {
      sender: "doctor",
      name: "Dr. Telesphore Uwabera, MD",
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
          senderName: "Dr. Telesphore Uwabera, MD",
          senderRole: "doctor",
          messageText: textToSend,
          consultationId: "ROOM-FM-9941",
        }),
      });
    } catch (err) {
      console.warn("Chat MongoDB save fallback:", err);
    }
  };

  // Load chat messages and appointments from MongoDB
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
          setMessages(formatted);
        }
      } catch (err) {
        console.warn("Could not load initial doctor chat:", err);
      }

      try {
        const aptRes = await fetch("/api/appointments?doctorId=DOC-RW-4091", { signal: AbortSignal.timeout(8000) });
        const aptData = await aptRes.json();
        if (aptData.success && aptData.appointments?.length > 0) {
          setDoctorAppointments(aptData.appointments);
        }
      } catch (err) {
        console.warn("Could not load doctor appointments:", err);
      }
    }

    loadData();
  }, []);

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsScheduling(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...scheduleForm,
          doctorId: "DOC-RW-4091",
          doctorName: "Dr. Telesphore Uwabera, MD",
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
      const newApt = {
        appointmentId: `APT-${Date.now().toString().slice(-6)}`,
        ...scheduleForm,
        status: "scheduled",
        roomUrl: "/dashboard/doctor?nav=telehealth",
      };
      setDoctorAppointments((prev) => [newApt, ...prev]);
      success("Appointment Scheduled", `Consultation confirmed for ${scheduleForm.applicantName}.`);
      setShowScheduleModal(false);
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
          applicantName: selectedCandidate?.name || "Telesphore",
          patientEmail: inviteEmail,
          patientName: selectedCandidate?.name || "Telesphore",
          doctorName: "Dr. Telesphore Uwabera, MD",
          scheduledTime: "Live Now (Consultation Active)",
          roomUrl: "https://fitmed.netlify.app/dashboard/user",
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
  };  const [queue, setQueue] = useState([
    {
      id: "CAN-9941",
      name: "Telesphore (Candidate)",
      age: 29,
      gender: "Male",
      nationalId: "1199580048123049",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80&auto=format&fit=crop",
      nationalIdImageUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80&auto=format&fit=crop",
      purpose: "Workplace & Office Fitness",
      appliedDate: "Today, 10:14 AM",
      riskLevel: "Low Risk",
      riskColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
      vitals: { bp: "118/78", hr: "72 bpm", bmi: "23.4", spo2: "98%" },
      flags: "0 Red Flags",
      history: "No chronic conditions. Non-smoker. Regular physical activity.",
      assignedDoctor: "Dr. Telesphore Uwabera (You)",
      assignedDoctorId: "DOC-RW-4091",
    },
    {
      id: "CAN-9942",
      name: "Claudine Uwamahoro",
      age: 34,
      gender: "Female",
      nationalId: "1199200012340001",
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80&auto=format&fit=crop",
      nationalIdImageUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80&auto=format&fit=crop",
      purpose: "Transport & Commercial Driver",
      appliedDate: "Today, 11:30 AM",
      riskLevel: "Moderate Risk",
      riskColor: "bg-amber-100 text-amber-800 border-amber-300",
      vitals: { bp: "138/88", hr: "84 bpm", bmi: "26.8", spo2: "97%" },
      flags: "1 Warning: Borderline BP",
      history: "Family history of hypertension. Requested driver clearance.",
      assignedDoctor: "Dr. Amina Nshimiyimana",
      assignedDoctorId: "DOC-RW-3382",
    },
    {
      id: "CAN-9943",
      name: "Eric Ndayishimiye",
      age: 41,
      gender: "Male",
      nationalId: "1198500023451002",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80&auto=format&fit=crop",
      nationalIdImageUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80&auto=format&fit=crop",
      purpose: "Construction & Heights Fitness",
      appliedDate: "Today, 01:15 PM",
      riskLevel: "Elevated Risk",
      riskColor: "bg-rose-100 text-rose-800 border-rose-300",
      vitals: { bp: "145/92", hr: "91 bpm", bmi: "29.1", spo2: "95%" },
      flags: "2 Red Flags: High BP & Dizziness",
      history: "Reports occasional vertigo working at height. Physical exam required.",
      assignedDoctor: "Dr. Telesphore Uwabera (You)",
      assignedDoctorId: "DOC-RW-4091",
    },
  ]);

  const [activeDoctorsOnDuty] = useState([
    { id: "DOC-RW-4091", name: "Dr. Telesphore Uwabera (You)", specialty: "Occupational Health", status: "Online" },
    { id: "DOC-RW-3382", name: "Dr. Amina Nshimiyimana", specialty: "Telehealth Specialist", status: "Online" },
    { id: "DOC-RW-2910", name: "Dr. Patrick Uwase", specialty: "Risk Stratification Lead", status: "Online" },
  ]);

  const reassignCandidate = (candidateId: string, targetDoctor: string) => {
    setQueue((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, assignedDoctor: targetDoctor } : c))
    );
    info("Case Reassigned", `Request re-routed & load-balanced to ${targetDoctor}.`);
  };

  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedScheduleAlert(true);
    setTimeout(() => setSavedScheduleAlert(false), 3000);
  };

  return (
    <DashboardShell
      role="doctor"
      activeNav={activeNav}
      onNavChange={goToNav}
      userProfile={{
        name: "Dr. Telesphore Uwabera",
        email: "uwaberatelesphore@gmail.com",
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
                  <TrendingUp className="w-2.5 h-2.5" />
                  Today
                </span>
              </div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Certs Issued</div>
              <div className="text-3xl font-extrabold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>
                14
                <span className="text-sm font-semibold text-slate-400 ml-1">certs</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                <Award className="w-3 h-3 text-sky-500" />
                +3 from yesterday
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
                Day Shift
              </div>
              <div className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                <Clock className="w-3 h-3 text-violet-500" />
                08:00 AM – 05:00 PM
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
                  Verified
                </span>
              </div>
              <div className="text-xs font-bold text-sky-300/80 uppercase tracking-wider mb-1">License ID</div>
              <div className="text-lg font-extrabold text-white font-mono" style={{ fontFamily: "var(--font-primary)" }}>
                RW-MMC-4091
              </div>
              <div className="text-[11px] text-sky-200/70 mt-1.5 flex items-center gap-1">
                <Stethoscope className="w-3 h-3 text-[#12B8B0]" />
                Occupational Health · MD
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
                  Intelligent round-robin request dispatching distributed among active on-duty physicians.
                </p>
              </div>

              {/* Active Load Balancer HUD */}
              <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5 font-extrabold text-[#0B2D5C]">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>3 Physicians Online:</span>
                </div>
                <div className="flex gap-1.5 text-[11px] font-bold text-slate-600">
                  <span className="px-2 py-0.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-200">Dr. Telesphore (2)</span>
                  <span className="px-2 py-0.5 rounded-lg bg-sky-50 text-sky-800 border border-sky-200">Dr. Amina (1)</span>
                  <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700">Dr. Patrick (0)</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {queue.map((candidate) => (
                <div
                  key={candidate.id}
                  className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4 hover:border-[#12B8B0] transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-[#12B8B0] flex-shrink-0">
                        <img
                          src={candidate.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80&auto=format&fit=crop"}
                          alt={candidate.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-extrabold text-[#0B2D5C]">
                            {candidate.name}
                          </h3>
                          <span className="text-xs text-slate-400 font-bold">Age: {candidate.age}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${candidate.riskColor}`}>
                            {candidate.riskLevel}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="font-mono font-bold text-slate-600">ID: {candidate.nationalId || "1199580048123049"}</span>
                          <span>·</span>
                          <span>{candidate.purpose}</span>
                        </div>
                      </div>

                      {/* Load Balancing Assignment Chip */}
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#0B2D5C] text-[#12B8B0] border border-[#12B8B0]/30 flex items-center gap-1">
                        <Stethoscope className="w-3 h-3" />
                        <span>{candidate.assignedDoctor}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setIdCandidate(candidate);
                          setShowIdModal(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-[#0B2D5C] dark:bg-teal-400/10 dark:hover:bg-teal-400/20 dark:border-teal-400/30 dark:text-slate-100 font-bold text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <IdCard className="w-3.5 h-3.5 text-[#12B8B0]" />
                        <span>Inspect National ID</span>
                      </button>

                      <BrandSelect
                        value={candidate.assignedDoctor}
                        onChange={(doctor) => reassignCandidate(candidate.id, doctor)}
                        options={activeDoctorsOnDuty.map((doc) => ({ value: doc.name, label: `Route to ${doc.name}` }))}
                        className="text-[11px]"
                      />
                      <span className="text-xs font-bold text-slate-400 font-mono">{candidate.appliedDate}</span>
                    </div>
                  </div>

                  {/* Clinical Summary & Vitals */}
                  <div className="grid md:grid-cols-3 gap-4 text-xs">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="font-bold text-slate-700 flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-sky-600" />
                        Captured Vitals
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-center font-bold">
                        <div className="bg-white p-2 rounded-lg border border-slate-200">
                          <div className="text-sky-600">{candidate.vitals.bp}</div>
                          <div className="text-[10px] text-slate-400">BP</div>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-slate-200">
                          <div className="text-teal-600">{candidate.vitals.hr}</div>
                          <div className="text-[10px] text-slate-400">HR</div>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-slate-200">
                          <div className="text-indigo-600">{candidate.vitals.bmi}</div>
                          <div className="text-[10px] text-slate-400">BMI</div>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-slate-200">
                          <div className="text-emerald-600">{candidate.vitals.spo2}</div>
                          <div className="text-[10px] text-slate-400">SpO₂</div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="font-bold text-slate-700 flex items-center gap-1.5">
                        <Brain className="w-4 h-4 text-indigo-600" />
                        AI Triage & Clinical Notes
                      </div>
                      <div className="text-slate-600 leading-relaxed">
                        <strong className="text-slate-800">{candidate.flags}</strong>
                      </div>
                      <div className="text-[11px] text-slate-500 italic">
                        {candidate.history}
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 flex flex-col justify-between">
                      <div className="font-bold text-slate-700 flex items-center gap-1.5">
                        <ClipboardList className="w-4 h-4 text-teal-600" />
                        Doctor Actions
                      </div>

                      <div className="space-y-2">
                        <button
                          onClick={() => {
                            setSelectedCandidate(candidate);
                            goToNav("telehealth");
                          }}
                          className="w-full py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
                        >
                          <Video className="w-4 h-4" />
                          <span>Start Telehealth Video &amp; Chat</span>
                        </button>

                        <button
                          onClick={() => {
                            setScheduleCandidate(candidate);
                            setScheduleForm({
                              applicantName: candidate.name,
                              applicantEmail: `${candidate.name.toLowerCase().replace(/\s+/g, ".")}@gmail.com`,
                              applicantPhone: "+250 788 123 456",
                              purpose: candidate.purpose,
                              scheduledDate: new Date().toISOString().split("T")[0],
                              scheduledTime: "15:00",
                              durationMinutes: 15,
                              notes: `Telehealth clinical review for ${candidate.purpose}. Flagged: ${candidate.flags}`,
                            });
                            setShowScheduleModal(true);
                          }}
                          className="w-full py-2 px-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Calendar className="w-3.5 h-3.5 text-[#12B8B0]" />
                          <span>Schedule Video Appointment</span>
                        </button>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => {
                              setSelectedCandidate(candidate);
                              setShowSignModal(true);
                            }}
                            className="py-2.5 px-3 rounded-xl bg-[#12B8B0] hover:bg-[#1dd9d0] text-[#0B2D5C] font-black text-xs flex items-center justify-center gap-1 transition-colors"
                          >
                            <FileSignature className="w-3.5 h-3.5" />
                            <span>Evaluate & Sign</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedCandidate(candidate);
                              setShowReferralModal(true);
                            }}
                            className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1 transition-colors"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Refer Clinic</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
                    applicantName: "Telesphore Uwabera",
                    applicantEmail: "telesphore91073@gmail.com",
                    applicantPhone: "+250 788 123 456",
                    purpose: "Workplace & Office Fitness Certification",
                    scheduledDate: new Date().toISOString().split("T")[0],
                    scheduledTime: "16:00",
                    durationMinutes: 15,
                    notes: "Telehealth clinical review and vital symptom check.",
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
                      onClick={() => {
                        info("Reminder Dispatched", `Notification reminder email sent to ${apt.applicantEmail}.`);
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
                  onClick={() => setDoctorStatus("ONLINE")}
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
                  onClick={() => setDoctorStatus("BUSY")}
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
                  onClick={() => setDoctorStatus("OFF")}
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
                  Day Shift (08:00 AM – 05:00 PM)
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
                  Active Candidate: <strong>{selectedCandidate?.name || "Telesphore (Candidate)"}</strong> · Category: {selectedCandidate?.purpose || "Workplace & Office Fitness"}
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
                  Confirm the applicant and start the meeting when you are ready. The video feeds and meeting controls will appear after the session begins.
                </p>
                <button
                  onClick={() => startMeeting()}
                  className="mt-6 px-6 py-3 rounded-xl bg-[#12B8B0] text-[#0B2D5C] font-black text-xs hover:bg-[#1dd9d0] transition-colors shadow-sm"
                >
                  Start Meeting
                </button>
              </div>
            ) : meetingStatus === "waiting" ? (
              <div className="rounded-3xl border border-amber-200 bg-white p-10 sm:p-16 text-center shadow-sm relative overflow-hidden">
                <div className="mx-auto w-24 h-24 relative flex items-center justify-center" aria-label="Signaling for applicant">
                  <span className="absolute inset-1 rounded-full border border-amber-300/70 animate-ping" />
                  <span className="absolute inset-4 rounded-full border-2 border-amber-300/80 animate-[ping_2s_ease-out_infinite]" />
                  <span className="absolute inset-7 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center">
                    <span className="w-3.5 h-3.5 rounded-full bg-amber-500 animate-pulse" />
                  </span>
                </div>
                <h3 className="mt-5 text-xl font-extrabold text-[#0B2D5C]">Waiting for the applicant to join</h3>
                <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
                  The meeting is open and signaling. Keep this room available while {selectedCandidate?.name || "the applicant"} joins from their appointment.
                </p>
                <div className="mt-5 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-600">
                  Room: {meetingRoomId}
                </div>
              </div>
            ) : (
            <div className="grid lg:grid-cols-12 gap-6">
              {/* Left Column: Live Video Feed & WebRTC Meeting Controls */}
              <div className="lg:col-span-8 bg-slate-950 rounded-3xl p-6 text-white space-y-4 shadow-2xl border border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-slate-200">HIPAA Encrypted Stream (1080p WebRTC)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#12B8B0] font-bold">
                    <span>Room: ROOM-FM-9941</span>
                    <span className="text-slate-500">|</span>
                    <span className="text-emerald-400">00:04:18</span>
                  </div>
                </div>

                <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
                  {!cameraOff ? (
                    <Image
                      src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1000&q=80&auto=format&fit=crop"
                      alt="Applicant Video Feed"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-2 text-slate-400">
                      <VideoOff className="w-12 h-12 text-slate-600" />
                      <span className="text-xs font-bold">Doctor Camera Paused</span>
                    </div>
                  )}

                  <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-2 shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Candidate: Telesphore</span>
                    <span className="text-[10px] text-slate-400 font-mono">(ID: 1199580048123049)</span>
                  </div>

                  {/* Vitals HUD on Video */}
                  <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl text-[11px] font-bold border border-white/10 flex items-center gap-3">
                    <span className="text-sky-400">BP: 118/78</span>
                    <span className="text-teal-400">HR: 72 bpm</span>
                    <span className="text-emerald-400">SpO₂: 98%</span>
                  </div>

                  {/* Doctor PiP Feed */}
                  <div className="absolute bottom-4 right-4 w-40 aspect-video rounded-2xl overflow-hidden border-2 border-[#12B8B0] shadow-2xl bg-slate-900">
                    <Image
                      src={doctorAvatar}
                      alt="Dr. Telesphore Uwabera"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute bottom-1.5 left-2 text-[9px] bg-black/70 px-2 py-0.5 rounded text-white font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Dr. Telesphore (Host)</span>
                    </div>
                  </div>
                </div>

                {/* Meeting Interactive Controls Bar */}
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setMicMuted(!micMuted)}
                      className={`p-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                        micMuted ? "bg-rose-600 text-white" : "bg-slate-800 text-white hover:bg-slate-700"
                      }`}
                      title={micMuted ? "Unmute Microphone" : "Mute Microphone"}
                    >
                      {micMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-emerald-400" />}
                      <span className="hidden sm:inline">{micMuted ? "Muted" : "Mute"}</span>
                    </button>

                    <button
                      onClick={() => setCameraOff(!cameraOff)}
                      className={`p-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                        cameraOff ? "bg-rose-600 text-white" : "bg-slate-800 text-white hover:bg-slate-700"
                      }`}
                      title={cameraOff ? "Turn Video On" : "Turn Video Off"}
                    >
                      {cameraOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4 text-sky-400" />}
                      <span className="hidden sm:inline">{cameraOff ? "Camera Off" : "Video"}</span>
                    </button>

                    <button
                      onClick={() => {
                        setScreenSharing(!screenSharing);
                        if (!screenSharing) info("Screen Sharing", "Presenting clinical guidelines to applicant.");
                        else info("Screen Share Ended", "Screen sharing session ended.");
                      }}
                      className={`p-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                        screenSharing ? "bg-indigo-600 text-white" : "bg-slate-800 text-white hover:bg-slate-700"
                      }`}
                    >
                      <Sparkles className="w-4 h-4 text-indigo-300" />
                      <span className="hidden sm:inline">{screenSharing ? "Sharing Screen" : "Share"}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => {
                        const ok = await confirm({
                          title: "End consultation",
                          message: "End this telehealth session and return to the intake queue?",
                          confirmLabel: "End session",
                          cancelLabel: "Stay in room",
                          variant: "danger",
                        });
                        if (ok) {
                          localStorage.removeItem(`fitmed_meeting:${meetingRoomId}`);
                          setMeetingStatus("idle");
                          goToNav("queue");
                        }
                      }}
                      className="px-4 py-2.5 rounded-xl bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5"
                    >
                      <PhoneCall className="w-3.5 h-3.5 rotate-135" />
                      <span>End Consultation</span>
                    </button>

                    <button
                      onClick={() => setShowSignModal(true)}
                      className="px-5 py-2.5 rounded-xl bg-[#12B8B0] hover:bg-[#1dd9d0] text-[#0B2D5C] font-black text-xs transition-colors flex items-center gap-1.5 shadow-md"
                    >
                      <FileSignature className="w-4 h-4" />
                      <span>Sign Certificate</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Doctor-Applicant Chat (MongoDB Synced) */}
              <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-md flex flex-col justify-between h-[560px]">
                <div className="space-y-3 flex-1 flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-[#12B8B0]" />
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#0B2D5C]">
                        Doctor-Applicant Chat (Saved to MongoDB)
                      </h4>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Live
                    </span>
                  </div>

                  {/* Quick Medical Prompts */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {[
                      "Please confirm you have no chest pain.",
                      "Can you perform a full neck rotation?",
                      "Vitals look optimal. Ready to sign.",
                    ].map((prompt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setChatInput(prompt)}
                        className="text-[10px] font-semibold bg-slate-50 hover:bg-teal-50 hover:text-teal-900 border border-slate-200 px-2.5 py-1 rounded-lg flex-shrink-0 transition-colors"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {messages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex flex-col ${
                          msg.sender === "doctor" ? "items-end" : "items-start"
                        }`}
                      >
                        <span className="text-[10px] text-slate-400 mb-0.5">{msg.name} · {msg.time}</span>
                        <div
                          className={`p-3 rounded-2xl text-xs max-w-[88%] leading-relaxed ${
                            msg.sender === "doctor"
                              ? "bg-[#0B2D5C] text-white rounded-br-none shadow-sm"
                              : "bg-teal-50 text-teal-950 font-semibold rounded-bl-none border border-teal-200"
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleSendChat} className="pt-3 border-t border-slate-100 flex items-center gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type clinical instruction..."
                    className="flex-1 p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#12B8B0]"
                  />
                  <button
                    type="submit"
                    className="p-2.5 rounded-xl bg-[#12B8B0] hover:bg-[#1dd9d0] text-[#0B2D5C] font-bold transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
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
                    placeholder="applicant@example.com"
                    className="w-full p-3 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-[#12B8B0]"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 space-y-1">
                  <div><strong>Meeting Room:</strong> ROOM-FM-9941</div>
                  <div><strong>Host:</strong> Dr. Telesphore Uwabera, MD</div>
                  <div><strong>Security:</strong> HIPAA Compliant WebRTC</div>
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
                  Your evaluation volume, decision mix, scheduled meetings, and payout snapshot for this period.
                </p>
              </div>
              <button
                onClick={() => {
                  info("Preparing report", "Building your physician activity export...");
                  setTimeout(() => success("Report exported", "doctor_activity_aug_2026.csv downloaded."), 900);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-2 self-start"
              >
                <TrendingUp className="w-3.5 h-3.5 text-[#12B8B0]" />
                Export activity CSV
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
                <div className="text-2xl font-black text-emerald-600 mt-1">14</div>
                <div className="text-[11px] text-slate-500 mt-1">This reporting cycle</div>
              </div>
              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm">
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Estimated payout (80%)</div>
                <div className="text-2xl font-black text-[#12B8B0] mt-1">56,000 FRW</div>
                <div className="text-[11px] text-slate-500 mt-1">14 × 4,000 FRW after Irembo settlement</div>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-sm font-extrabold text-[#0B2D5C]">4-tier decision mix</h3>
                {[
                  { label: "FIT", count: 9, pct: 64, bar: "bg-emerald-500" },
                  { label: "FIT WITH RESTRICTIONS", count: 3, pct: 21, bar: "bg-sky-500" },
                  { label: "FURTHER ASSESSMENT", count: 1, pct: 7, bar: "bg-amber-500" },
                  { label: "NOT FIT", count: 1, pct: 7, bar: "bg-rose-500" },
                ].map((row) => (
                  <div key={row.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">{row.label}</span>
                      <span className="font-bold text-[#0B2D5C]">{row.count} · {row.pct}%</span>
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
                  {[
                    { id: "FM-2024-88421", name: "Telesphore Uwabera", decision: "FIT", date: "18 Aug" },
                    { id: "FM-2024-88420", name: "Alphonse Rugira", decision: "FIT WITH RESTRICTIONS", date: "17 Aug" },
                    { id: "FM-2024-88419", name: "Diane Uwimana", decision: "FIT", date: "16 Aug" },
                    { id: "APT-2026-904", name: "Jean-Paul Habimana", decision: "SCHEDULED", date: "Tomorrow 10:00" },
                  ].map((row) => (
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
              Issued & Cryptographically Signed Certificates Repository (14)
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
                  {[
                    { id: "FM-2024-88421", candidate: "Telesphore Uwabera", purpose: "Workplace & Office Fitness", decision: "FIT", date: "18 Aug 2026" },
                    { id: "FM-2024-88420", candidate: "Alphonse Rugira", purpose: "Construction Site Clearance", decision: "FIT WITH RESTRICTIONS", date: "17 Aug 2026" },
                    { id: "FM-2024-88419", candidate: "Diane Uwimana", purpose: "University Admission", decision: "FIT", date: "16 Aug 2026" },
                  ].map((row) => (
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
              Physical Clinic Referrals Issued (4)
            </h3>
            <p className="text-xs text-slate-500">
              Candidates requiring auscultation, ECG, audiometry, or specialist clearance routed to partner facilities.
            </p>

            <div className="space-y-3">
              {[
                { name: "Eric Ndayishimiye", clinic: "CHUK - Physical Exam Unit", reason: "Height work vertigo & Stage 1 BP", date: "Today" },
                { name: "Jean Bosco Kamanzi", clinic: "King Faisal Hospital", reason: "Cardiovascular evaluation & stress test", date: "Yesterday" },
              ].map((r) => (
                <div key={r.name} className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-[#0B2D5C]">{r.name}</div>
                    <div className="text-[11px] text-slate-600">Referred to: <strong>{r.clinic}</strong></div>
                    <div className="text-[11px] text-amber-800">Reason: {r.reason}</div>
                  </div>
                  <span className="px-3 py-1 bg-amber-200 text-amber-900 rounded-full text-[10px] font-bold">
                    Pending In-Person Visit
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
                <p className="text-xs text-slate-500">Avatar images are auto-converted to WebP format before storage in Cloudinary.</p>
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
                  <div className="text-xs font-bold text-[#0B2D5C]">Physician Profile Photo (WebP)</div>
                  <div className="text-[11px] text-slate-500">Auto-compressed and uploaded to Cloudinary CDN</div>
                  {avatarWebpResult && (
                    <div className="text-[10px] text-teal-700 font-bold mt-1 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200 inline-block">
                      WebP: {formatBytes(avatarWebpResult.compressedSize)} (Saved {avatarWebpResult.reductionPercentage}%)
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
                      if (res.url) setDoctorAvatar(res.url);
                      success("Profile Photo Saved", "WebP image synced to Cloudinary & MongoDB.");
                      setAvatarWebpResult(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#12B8B0] text-[#0B2D5C] font-black text-xs shadow-sm hover:bg-[#1dd9d0] transition-colors"
                  >
                    Save & Sync
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
                  Doctor ID, MMC License, and Legal Practitioner Name are assigned permanently by the FitMed System Administrator during onboarding and cannot be altered by the doctor. To update clinical licenses, contact governance.
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold uppercase mb-1">Doctor Name (Immutable)</label>
                <div className="relative">
                  <input type="text" defaultValue="Dr. Telesphore Uwabera, MD" disabled className="w-full p-3 rounded-xl border border-slate-200 bg-slate-100 font-semibold text-slate-700 cursor-not-allowed" />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3.5" />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 font-bold uppercase mb-1">Doctor ID (Immutable)</label>
                <div className="relative">
                  <input type="text" defaultValue="DOC-RW-4091" disabled className="w-full p-3 rounded-xl border border-slate-200 bg-slate-100 font-mono font-bold text-slate-700 cursor-not-allowed" />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3.5" />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 font-bold uppercase mb-1">Medical Council License (Immutable)</label>
                <div className="relative">
                  <input type="text" defaultValue="RW-MMC-4091 (Verified Active)" disabled className="w-full p-3 rounded-xl border border-slate-200 bg-slate-100 font-semibold text-emerald-700 cursor-not-allowed" />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3.5" />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 font-bold uppercase mb-1">Clinical Email</label>
                <input type="email" defaultValue="uwaberatelesphore@gmail.com" disabled className="w-full p-3 rounded-xl border border-slate-200 bg-slate-100 font-semibold text-slate-700 cursor-not-allowed" />
              </div>
            </div>

            {/* Password Change Sub-section (Doctor Authorized) */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#0B2D5C]">Security & Sign-In Password</h4>
              <div className="grid sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">New Doctor Password</label>
                  <input type="password" placeholder="••••••••••••" className="w-full p-3 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-[#12B8B0]" />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Confirm New Password</label>
                  <input type="password" placeholder="••••••••••••" className="w-full p-3 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-[#12B8B0]" />
                </div>
              </div>
              <button
                type="button"
                onClick={() => success("Password Updated", "Your doctor sign-in credentials have been secured.")}
                className="px-5 py-2.5 rounded-xl bg-[#0B2D5C] text-white text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                Update Password
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-xs space-y-1">
              <div className="font-bold text-[#0B2D5C]">Cryptographic Digital Signature Key</div>
              <div className="text-slate-600 font-mono text-[11px]">KEY_HASH: e9b4c27f...44a10 (Verified by Rwanda Medical and Dental Council)</div>
            </div>
          </div>
        )}
      </div>

      {/* Structured FitMed Doctor Assessment Form */}
      {showSignModal && (
        <DoctorAssessmentForm
          candidate={selectedCandidate || queue[0]}
          doctorName="Dr. Telesphore Uwabera, MD"
          doctorLicense="RW-MMC-4091"
          onDecision={({ decision, notes, restrictions }) => {
            const candidate = selectedCandidate || queue[0];
            const candidateName = candidate?.name;
            if (decision === "FIT" || decision === "FIT_RESTRICTED") {
              success("Certificate Approved", `${candidateName} — Status set to APPROVED. An email was sent requesting 5,000 FRW payment to unlock.`);
              setQueue((prev) => prev.filter((c) => c.id !== candidate?.id));
            } else if (decision === "REJECTED") {
              error("Application Rejected", `${candidateName} — Certification declined. Reason recorded: ${notes || "Clinical criteria not met"}.`);
              setQueue((prev) => prev.filter((c) => c.id !== candidate?.id));
            } else if (decision === "PHYSICAL_CONSULTATION") {
              warning("Physical Checkup Requested", `${candidateName} — Status updated to PHYSICAL CHECK UP REQUESTED at accredited clinic.`);
              setQueue((prev) => prev.filter((c) => c.id !== candidate?.id));
            } else if (decision === "INVESTIGATION_SPECIALIST") {
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
      {/* Official Medical Fitness Certificate Viewer Modal */}
      {showOfficialCertModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="max-w-4xl w-full my-auto">
            <OfficialMedicalCertificate
              data={{
                certificateId: selectedCertForModal?.id || "FM-2024-88421",
                candidateName: selectedCertForModal?.candidate || "Telesphore Uwabera",
                applicantImageUrl: selectedCertForModal?.avatarUrl || selectedCandidate?.avatarUrl,
                purpose: selectedCertForModal?.purpose || "Workplace & Office Fitness",
                decision: (selectedCertForModal?.decision?.includes("RESTRICTIONS") ? "FIT_RESTRICTED" : "FIT") as any,
                doctorName: "Dr. Telesphore Uwabera, MD",
                doctorLicense: "RW-MMC-4091",
                doctorId: "DOC-RW-4091",
                issueDate: selectedCertForModal?.date || "18 Aug 2026",
              }}
              onClose={() => setShowOfficialCertModal(false)}
            />
          </div>
        </div>
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
                <span className="text-[10px] font-bold text-slate-400 font-mono">WebP Stored Document</span>
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
                    src={idCandidate.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80&auto=format&fit=crop"}
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
                    src={idCandidate.nationalIdImageUrl || "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80&auto=format&fit=crop"}
                    alt="National ID Card"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-1.5 right-1.5 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                    WebP 1080p
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
                  success("Identity Confirmed", `${idCandidate.name}'s National ID verified & logged by Dr. Telesphore Uwabera.`);
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
