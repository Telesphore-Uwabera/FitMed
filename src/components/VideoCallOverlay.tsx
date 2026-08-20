"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MonitorUp,
  MonitorOff,
  MessageSquare,
  Send,
  Minimize2,
  Maximize2,
  X,
  ChevronUp,
  ChevronDown,
  Users,
  BadgeCheck,
  Shield,
  Wifi,
} from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { useDialog } from "@/components/DialogProvider";

export interface ChatMessage {
  sender: "doctor" | "applicant";
  name: string;
  text: string;
  time: string;
}

export interface VideoCallParticipant {
  name: string;
  role: string;
  avatarUrl: string;
  isOnline?: boolean;
}

interface VideoCallOverlayProps {
  isOpen: boolean;
  onEnd: () => void;
  doctor: VideoCallParticipant;
  applicant: VideoCallParticipant;
  appointmentId?: string;
  purpose?: string;
  initialMessages?: ChatMessage[];
  onSendMessage?: (text: string) => void;
}

type CallView = "minimized" | "floating" | "fullscreen";

export default function VideoCallOverlay({
  isOpen,
  onEnd,
  doctor,
  applicant,
  appointmentId,
  purpose = "Medical Fitness Consultation",
  initialMessages = [],
  onSendMessage,
}: VideoCallOverlayProps) {
  const { success, warning, info } = useToast();
  const { confirm } = useDialog();
  const [view, setView] = useState<CallView>("fullscreen");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);
  const [chatMessage, setChatMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [callDuration, setCallDuration] = useState(0);
  const [showParticipants, setShowParticipants] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer
  useEffect(() => {
    if (isOpen) {
      timerRef.current = setInterval(() => {
        setCallDuration((d) => d + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    const now = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const newMsg: ChatMessage = {
      sender: "applicant",
      name: applicant.name,
      text: chatMessage,
      time: now,
    };
    setMessages((prev) => [...prev, newMsg]);
    const text = chatMessage;
    setChatMessage("");
    onSendMessage?.(text);

    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderName: applicant.name,
          senderRole: "applicant",
          messageText: text,
          consultationId: appointmentId || "ROOM-FM-9941",
        }),
      });
    } catch (_) {}
  };

  const handleEndCall = async () => {
    const ok = await confirm({
      title: "End consultation",
      message: `Leave the live session with ${doctor.name}? The call duration will be saved.`,
      confirmLabel: "End call",
      cancelLabel: "Stay in call",
      variant: "danger",
    });
    if (!ok) return;
    if (timerRef.current) clearInterval(timerRef.current);
    info("Consultation ended", `Session with ${doctor.name} saved. Duration: ${formatDuration(callDuration)}.`);
    onEnd();
  };

  if (!isOpen) return null;

  /* ── MINIMIZED BAR ── */
  if (view === "minimized") {
    return (
      <div
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-5 py-3 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/60 shadow-2xl shadow-black/40 animate-in slide-in-from-bottom-4 duration-300"
        style={{ minWidth: 340 }}
      >
        {/* Status dot */}
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-extrabold text-white truncate">{doctor.name}</p>
          <p className="text-[10px] text-slate-400 font-mono">{formatDuration(callDuration)} · Encrypted</p>
        </div>

        {/* Quick controls */}
        <button
          onClick={() => { setMicOn(!micOn); }}
          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${micOn ? "bg-slate-700 text-white" : "bg-rose-600 text-white"}`}
        >
          {micOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={() => { setCamOn(!camOn); }}
          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${camOn ? "bg-slate-700 text-white" : "bg-rose-600 text-white"}`}
        >
          {camOn ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
        </button>

        {/* End call */}
        <button
          onClick={handleEndCall}
          className="w-8 h-8 rounded-xl bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center transition-colors"
          title="End call"
        >
          <PhoneOff className="w-3.5 h-3.5" />
        </button>

        {/* Expand back */}
        <button
          onClick={() => setView("floating")}
          className="w-8 h-8 rounded-xl bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center transition-colors"
          title="Expand"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  /* ── FLOATING PIP MODE ── */
  if (view === "floating") {
    return (
      <div
        className="fixed bottom-6 right-6 z-[9999] w-80 rounded-3xl overflow-hidden bg-slate-950 border border-slate-700/60 shadow-2xl shadow-black/50 animate-in slide-in-from-bottom-4 duration-300"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold text-white truncate max-w-[120px]">{doctor.name}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-[#12B8B0] font-mono font-bold">{formatDuration(callDuration)}</span>
            <button
              onClick={() => setView("fullscreen")}
              className="w-6 h-6 rounded-lg bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center transition-colors"
              title="Expand to fullscreen"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
            <button
              onClick={() => setView("minimized")}
              className="w-6 h-6 rounded-lg bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center transition-colors"
              title="Minimize to bar"
            >
              <Minimize2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Doctor video */}
        <div className="relative aspect-video bg-slate-900">
          <Image
            src={doctor.avatarUrl}
            alt={doctor.name}
            fill
            className="object-cover"
          />
          {/* PiP self-view */}
          <div className="absolute bottom-2 right-2 w-16 aspect-video rounded-lg overflow-hidden border border-[#12B8B0] bg-slate-800">
            <Image
              src={applicant.avatarUrl}
              alt="You"
              fill
              className={`object-cover ${camOn ? "opacity-100" : "opacity-0"}`}
            />
            {!camOn && (
              <div className="absolute inset-0 flex items-center justify-center">
                <VideoOff className="w-3 h-3 text-slate-500" />
              </div>
            )}
          </div>
          <div className="absolute bottom-2 left-2 text-[9px] bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-white font-bold">
            {doctor.name}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setMicOn(!micOn); }}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 ${micOn ? "bg-slate-700 text-white" : "bg-rose-600 text-white"}`}
            >
              {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>
            <button
              onClick={() => { setCamOn(!camOn); }}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 ${camOn ? "bg-slate-700 text-white" : "bg-rose-600 text-white"}`}
            >
              {camOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            </button>
          </div>
          <button
            onClick={handleEndCall}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold flex items-center gap-1.5 transition-colors active:scale-95"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            End
          </button>
        </div>
      </div>
    );
  }

  /* ── FULLSCREEN / EXPANDED MODE ── */
  return (
    <div className="fixed inset-0 z-[9998] bg-slate-950 flex flex-col animate-in fade-in duration-200">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-900/80 backdrop-blur-sm border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-emerald-300">Live · {formatDuration(callDuration)}</span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-[#12B8B0]" />
            <span className="text-[11px] text-slate-400 font-medium">256-bit encrypted</span>
          </div>
          {appointmentId && (
            <span className="text-[10px] text-slate-500 font-mono">ID: {appointmentId}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-300 font-semibold hidden md:block truncate max-w-[240px]">{purpose}</span>
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
            title="Participants"
          >
            <Users className="w-4 h-4" />
          </button>
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${chatOpen ? "bg-[#12B8B0]/20 text-[#12B8B0] border border-[#12B8B0]/40" : "bg-slate-800 hover:bg-slate-700 text-slate-300"}`}
            title="Toggle chat"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView("floating")}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
            title="Pop out (continue in floating mode)"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView("minimized")}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
            title="Minimize to bar"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex min-h-0">
        {/* Video area */}
        <div className="flex-1 relative bg-slate-950 flex items-center justify-center p-4 sm:p-6 min-w-0">
          {/* Doctor main feed */}
          <div className="relative w-full max-w-4xl aspect-video rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
            <Image
              src={doctor.avatarUrl}
              alt={doctor.name}
              fill
              className="object-cover"
              priority
            />
            {/* Doctor name badge */}
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-slate-900/80 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-bold text-white">{doctor.name}</span>
              <BadgeCheck className="w-3.5 h-3.5 text-[#12B8B0]" />
            </div>

            {/* Connection quality */}
            <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-slate-700">
              <Wifi className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] text-emerald-400 font-bold">HD</span>
            </div>

            {/* Self PiP */}
            <div className="absolute bottom-4 right-4 w-40 aspect-video rounded-2xl overflow-hidden border-2 border-[#12B8B0] shadow-2xl bg-slate-900 group cursor-pointer">
              <Image
                src={applicant.avatarUrl}
                alt="You"
                fill
                className={`object-cover transition-opacity ${camOn ? "opacity-100" : "opacity-0"}`}
              />
              {!camOn && (
                <div className="absolute inset-0 flex items-center justify-center flex-col gap-1">
                  <VideoOff className="w-6 h-6 text-slate-600" />
                  <span className="text-[9px] text-slate-500">Camera off</span>
                </div>
              )}
              {!micOn && (
                <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-lg bg-rose-600/90 flex items-center justify-center">
                  <MicOff className="w-3 h-3 text-white" />
                </div>
              )}
              <div className="absolute bottom-1 left-2 text-[9px] bg-black/60 px-1.5 py-0.5 rounded text-white font-bold">
                You
              </div>
            </div>

            {/* Screen sharing banner */}
            {screenSharing && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
                <div className="text-center space-y-2">
                  <MonitorUp className="w-12 h-12 text-[#12B8B0] mx-auto animate-pulse" />
                  <p className="text-white font-bold text-sm">Sharing your screen</p>
                  <p className="text-slate-400 text-xs">Doctor can see your screen</p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom controls */}
          <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-3.5 rounded-3xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/60 shadow-2xl">
            {/* Mic */}
            <button
              onClick={() => {
                setMicOn(!micOn);
                if (micOn) warning("Muted", "Doctor cannot hear you.");
                else success("Unmuted", "Microphone is now live.");
              }}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all active:scale-90 ${
                micOn ? "bg-slate-700 hover:bg-slate-600 text-white" : "bg-rose-600 hover:bg-rose-700 text-white ring-2 ring-rose-400/50"
              }`}
              title={micOn ? "Mute" : "Unmute"}
            >
              {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>

            {/* Camera */}
            <button
              onClick={() => {
                setCamOn(!camOn);
                if (camOn) warning("Camera Off", "Doctor cannot see you.");
                else success("Camera On", "Your camera is active.");
              }}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all active:scale-90 ${
                camOn ? "bg-slate-700 hover:bg-slate-600 text-white" : "bg-rose-600 hover:bg-rose-700 text-white ring-2 ring-rose-400/50"
              }`}
              title={camOn ? "Turn off camera" : "Turn on camera"}
            >
              {camOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            </button>

            {/* Screen share */}
            <button
              onClick={() => {
                setScreenSharing(!screenSharing);
                if (!screenSharing) info("Screen Sharing", "You are now sharing your screen with the doctor.");
                else info("Screen Share Stopped", "You stopped sharing your screen.");
              }}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all active:scale-90 ${
                screenSharing ? "bg-[#12B8B0] text-[#0B2D5C]" : "bg-slate-700 hover:bg-slate-600 text-white"
              }`}
              title={screenSharing ? "Stop sharing" : "Share screen"}
            >
              {screenSharing ? <MonitorOff className="w-4 h-4" /> : <MonitorUp className="w-4 h-4" />}
            </button>

            {/* Divider */}
            <div className="w-px h-8 bg-slate-600" />

            {/* Show National ID */}
            <button
              onClick={() => success("ID Shown", "Your National ID is now visible to the doctor for verification.")}
              className="px-4 py-2.5 rounded-xl bg-teal-500/20 text-[#12B8B0] border border-[#12B8B0]/40 text-xs font-extrabold hover:bg-teal-500/30 transition-colors flex items-center gap-1.5"
            >
              <BadgeCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Show ID</span>
            </button>

            {/* End call */}
            <button
              onClick={handleEndCall}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold flex items-center gap-1.5 transition-colors active:scale-95 shadow-lg"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              <span>Leave</span>
            </button>
          </div>

          {/* Participants panel */}
          {showParticipants && (
            <div className="absolute top-4 left-4 w-60 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-2xl p-4 shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-extrabold text-white">Participants (2)</h4>
                <button onClick={() => setShowParticipants(false)}>
                  <X className="w-3.5 h-3.5 text-slate-400 hover:text-white transition-colors" />
                </button>
              </div>
              <div className="space-y-2.5">
                {[
                  { ...doctor, tag: "Host · Doctor" },
                  { ...applicant, tag: "You · Applicant" },
                ].map((p) => (
                  <div key={p.name} className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl overflow-hidden flex-shrink-0 relative bg-slate-800">
                      <Image src={p.avatarUrl} alt={p.name} fill className="object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-white truncate">{p.name}</p>
                      <p className="text-[10px] text-slate-400">{p.tag}</p>
                    </div>
                    <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Chat panel */}
        {chatOpen && (
          <div className="w-80 flex-shrink-0 bg-slate-900 border-l border-slate-800 flex flex-col animate-in slide-in-from-right-4 duration-200">
            {/* Chat header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#12B8B0]" />
                <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">In-Call Chat</h4>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-400/10 px-2 py-0.5 rounded-full">
                {messages.length} messages
              </span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${msg.sender === "applicant" ? "items-end" : "items-start"}`}
                >
                  <span className="text-[10px] text-slate-500 mb-1">
                    {msg.name} · {msg.time}
                  </span>
                  <div
                    className={`px-3 py-2 rounded-2xl text-xs max-w-[88%] leading-relaxed ${
                      msg.sender === "applicant"
                        ? "bg-[#12B8B0] text-[#0B2D5C] font-semibold rounded-br-none"
                        : "bg-slate-800 text-slate-200 rounded-bl-none"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Quick chips */}
            <div className="px-4 py-2 border-t border-slate-800">
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {["Vitals: BP 118/78", "No symptoms", "Ready"].map((chip, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setChatMessage(chip)}
                    className="text-[9px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-2 py-1 rounded-lg flex-shrink-0 transition-colors whitespace-nowrap"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Message input */}
            <form onSubmit={handleSend} className="p-4 border-t border-slate-800 flex items-center gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Message..."
                className="flex-1 p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#12B8B0] transition-colors"
              />
              <button
                type="submit"
                className="w-9 h-9 rounded-xl bg-[#12B8B0] hover:bg-[#1dd9d0] text-[#0B2D5C] flex items-center justify-center transition-colors flex-shrink-0 active:scale-90"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
