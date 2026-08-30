"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import {
  BadgeCheck,
  FlipHorizontal,
  Maximize2,
  MessageSquare,
  Mic,
  MicOff,
  Minimize2,
  MonitorOff,
  MonitorUp,
  Moon,
  PhoneOff,
  Send,
  Shield,
  Sun,
  SwitchCamera,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

export const FITMED_LIVE_ROOM = "ROOM-FM-9941";

export interface CallChatMessage {
  id?: string;
  sender: "doctor" | "applicant";
  name: string;
  text: string;
  time: string;
}

interface WebRTCVideoCallProps {
  roomId: string;
  userName: string;
  role?: "doctor" | "applicant";
  remoteName?: string;
  purpose?: string;
  appointmentId?: string;
  variant?: "overlay" | "embedded" | "floating";
  initialMessages?: CallChatMessage[];
  onCallEnd?: () => void;
  onRemoteJoined?: () => void;
  onMinimize?: () => void;
  onExpand?: () => void;
}

function socketUrl() {
  return process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turns:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
  iceCandidatePoolSize: 10,
};

export default function WebRTCVideoCall({
  roomId,
  userName,
  role = "applicant",
  remoteName = "Remote participant",
  purpose = "Medical fitness consultation",
  appointmentId,
  variant = "overlay",
  initialMessages = [],
  onCallEnd,
  onRemoteJoined,
  onMinimize,
  onExpand,
}: WebRTCVideoCallProps) {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === "dark";

  // ── State ──────────────────────────────────────────────────────────────────
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [callStatus, setCallStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [messages, setMessages] = useState<CallChatMessage[]>(initialMessages);
  const [unreadCount, setUnreadCount] = useState(0);
  const [callDuration, setCallDuration] = useState(0);
  const [mediaError, setMediaError] = useState("");
  const [remoteMuted, setRemoteMuted] = useState(false);
  const [localLevel, setLocalLevel] = useState(0);
  const [remoteLevel, setRemoteLevel] = useState(0);
  const [localSpeaking, setLocalSpeaking] = useState(false);
  const [remoteSpeaking, setRemoteSpeaking] = useState(false);
  // ── Device / tab switch ──────────────────────────────────────────────────
  // "idle" | "pending-new" | "takeover-request" | "evicted"
  const [deviceSwitchState, setDeviceSwitchState] = useState<"idle" | "pending-new" | "takeover-request" | "evicted">("idle");
  const [pendingNewSocketId, setPendingNewSocketId] = useState<string | null>(null);

  // ── Refs — NEVER stale, never in useCallback deps ─────────────────────────
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);
  const makingOfferRef = useRef(false);
  const sharingRef = useRef(false);
  const speakerMutedRef = useRef(false);  // ← ref shadow avoids stale closure
  const onRemoteJoinedRef = useRef(onRemoteJoined);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const durationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep refs in sync
  useEffect(() => { onRemoteJoinedRef.current = onRemoteJoined; }, [onRemoteJoined]);

  // ── Theme tokens — mirrors the site design system ─────────────────────────
  // Chat/controls panel uses real bg; video stage is always slate-900 for contrast
  const bg        = dark ? "bg-[#071422]"         : "bg-white";
  const bgCard    = dark ? "bg-[#0d1f35]/95"       : "bg-white/95";
  const bgMid     = dark ? "bg-[#122840]"          : "bg-slate-100";
  const border    = dark ? "border-[#1e3a5f]"      : "border-slate-200";
  const txt       = dark ? "text-white"            : "text-[#0B2D5C]";
  const txtSub    = dark ? "text-slate-400"         : "text-slate-500";
  const ctrlBg    = dark
    ? "bg-[#122840] hover:bg-[#1e3a5f]"
    : "bg-slate-100 hover:bg-slate-200";
  const ctrlTxt   = dark ? "text-white"            : "text-[#0B2D5C]";
  const inputBg   = dark
    ? "bg-[#122840] border-[#1e3a5f] text-white placeholder-slate-500"
    : "bg-slate-100 border-slate-300 text-[#0B2D5C] placeholder-slate-400";
  const chipBg    = dark
    ? "bg-[#122840] hover:bg-[#1e3a5f] text-slate-300 border border-[#1e3a5f]"
    : "bg-slate-100 hover:bg-slate-200 text-[#0B2D5C] border border-slate-200";
  const videoBg   = "bg-slate-900"; // video stage always dark for contrast
  const overlayBg = "bg-black/50";  // control overlays on top of video

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const attachLocalTracks = (pc: RTCPeerConnection, stream: MediaStream) => {
    const existingIds = new Set(pc.getSenders().map((s) => s.track?.id).filter(Boolean));
    stream.getTracks().forEach((track) => {
      if (!existingIds.has(track.id)) {
        try { pc.addTrack(track, stream); } catch (e) { console.warn("[addTrack]", e); }
      }
    });
  };

  const flushIce = async () => {
    const pc = peerConnectionRef.current;
    if (!pc?.remoteDescription) return;
    for (const c of pendingIceRef.current.splice(0)) {
      try { await pc.addIceCandidate(new RTCIceCandidate(c)); }
      catch (e) { console.warn("[ICE] skipped", e); }
    }
  };

  // ── Attach remote stream — PURE REFS, zero state deps ─────────────────────
  const attachRemoteStream = useCallback((stream: MediaStream) => {
    remoteStreamRef.current = stream;
    setRemoteStream(stream);
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = stream;
      remoteVideoRef.current.play().catch(() => {});
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = stream;
      remoteAudioRef.current.muted = speakerMutedRef.current; // ← ref, NOT state
      remoteAudioRef.current.play().catch(() => {});
    }
    setCallStatus("connected");
    onRemoteJoinedRef.current?.(); // ← ref, NOT prop
  }, []); // ← ZERO deps — will NEVER recreate

  // ── Create PeerConnection — ZERO state deps ────────────────────────────────
  const createPeerConnection = useCallback(() => {
    if (peerConnectionRef.current) return peerConnectionRef.current;

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    pc.onicecandidate = ({ candidate }) => {
      if (candidate && socketRef.current) {
        socketRef.current.emit("ice-candidate", { roomId, candidate });
      }
    };

    pc.ontrack = ({ streams, track }) => {
      const stream = (streams && streams[0]) || (() => {
        const s = remoteStreamRef.current ?? new MediaStream();
        s.addTrack(track);
        return s;
      })();
      attachRemoteStream(stream);
    };

    pc.onconnectionstatechange = () => {
      console.log("[PC]", pc.connectionState);
      if (pc.connectionState === "connected") {
        setCallStatus("connected");
        onRemoteJoinedRef.current?.();
      }
      if (pc.connectionState === "failed") {
        pc.restartIce();
        setCallStatus("disconnected");
      }
      if (pc.connectionState === "disconnected") setCallStatus("disconnected");
    };

    if (localStreamRef.current) attachLocalTracks(pc, localStreamRef.current);
    return pc;
  }, [roomId, attachRemoteStream]); // attachRemoteStream never changes

  // ── Doctor: send offer ─────────────────────────────────────────────────────
  const startCall = useCallback(async () => {
    if (role !== "doctor" || makingOfferRef.current) return;
    if (!localStreamRef.current || !socketRef.current) {
      setTimeout(() => void startCall(), 800);
      return;
    }
    makingOfferRef.current = true;
    try {
      const pc = createPeerConnection();
      attachLocalTracks(pc, localStreamRef.current);
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await pc.setLocalDescription(offer);
      socketRef.current.emit("offer", { roomId, offer });
      console.log("[WebRTC] Offer sent");
    } catch (e) {
      console.error("[startCall]", e);
    } finally {
      makingOfferRef.current = false;
    }
  }, [createPeerConnection, role, roomId]);

  // ── Applicant: handle incoming offer ──────────────────────────────────────
  const handleOffer = useCallback(async (offer: RTCSessionDescriptionInit) => {
    console.log("[WebRTC] Offer received");
    if (!localStreamRef.current) {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: true });
        localStreamRef.current = s;
        cameraStreamRef.current = s;
        setLocalStream(s);
        if (localVideoRef.current) localVideoRef.current.srcObject = s;
      } catch (e) { console.warn("[handleOffer] getUserMedia:", e); }
    }
    const pc = createPeerConnection();
    if (localStreamRef.current) attachLocalTracks(pc, localStreamRef.current);
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    await flushIce();
    const answer = await pc.createAnswer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
    await pc.setLocalDescription(answer);
    socketRef.current?.emit("answer", { roomId, answer });
    console.log("[WebRTC] Answer sent");
  }, [createPeerConnection, roomId]);

  // ── Flip front/back camera ─────────────────────────────────────────────────
  const toggleFlipCamera = async () => {
    const next = facingMode === "user" ? "environment" : "user";
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: next }, audio: true });
      const vt = s.getVideoTracks()[0];
      const sender = peerConnectionRef.current?.getSenders().find((s) => s.track?.kind === "video");
      if (sender && vt) await sender.replaceTrack(vt);
      localStreamRef.current?.getVideoTracks().forEach((t) => t.stop());
      localStreamRef.current = s;
      cameraStreamRef.current = s;
      setLocalStream(s);
      setFacingMode(next);
      if (localVideoRef.current) localVideoRef.current.srcObject = s;
    } catch (e) { console.warn("[flipCamera]", e); }
  };

  // ── Boot ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });
        if (cancelled) { s.getTracks().forEach((t) => t.stop()); return; }
        localStreamRef.current = s;
        cameraStreamRef.current = s;
        setLocalStream(s);
        if (localVideoRef.current) localVideoRef.current.srcObject = s;
      } catch (e) {
        console.error("[getUserMedia]", e);
        setMediaError("Camera/microphone access denied. Allow it in browser settings.");
      }

      const socket = io(socketUrl(), { transports: ["websocket", "polling"], reconnection: true, reconnectionAttempts: 10 });
      socketRef.current = socket;

      socket.on("connect", () => {
        socket.emit("join-room", { roomId, name: userName, role });
      });

      socket.on("room-full", () => setMediaError("This consultation room is full. Only doctor and applicant are allowed."));

      // ── Device/tab switch events ──────────────────────────────────────────
      // New tab/device is knocking — old session sees this
      socket.on("device-takeover-request", ({ newSocketId }: { newSocketId: string; name: string; role: string }) => {
        setPendingNewSocketId(newSocketId);
        setDeviceSwitchState("takeover-request");
      });

      // New tab waiting for old tab to respond
      socket.on("device-switch-pending", () => {
        setDeviceSwitchState("pending-new");
      });

      // New tab got the green light
      socket.on("device-switch-accepted", () => {
        setDeviceSwitchState("idle");
        setCallStatus("connecting");
      });

      // New tab was rejected
      socket.on("device-switch-rejected", ({ message }: { message: string }) => {
        setMediaError(message);
        setDeviceSwitchState("idle");
      });

      // Old tab got evicted after accepting
      socket.on("evicted", () => {
        setDeviceSwitchState("evicted");
        if (durationRef.current) clearInterval(durationRef.current);
      });

      socket.on("user-connected", () => { if (role === "doctor") void startCall(); });
      socket.on("call-ready", () => { if (role === "doctor") void startCall(); });

      socket.on("offer", async ({ offer }: { offer: RTCSessionDescriptionInit }) => {
        await handleOffer(offer);
      });

      socket.on("answer", async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
        const pc = peerConnectionRef.current;
        if (pc) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
            await flushIce();
          } catch (e) { console.error("[answer]", e); }
        }
      });

      socket.on("ice-candidate", async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
        const pc = peerConnectionRef.current;
        if (!pc?.remoteDescription) { pendingIceRef.current.push(candidate); return; }
        try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); }
        catch (e) { console.warn("[ice]", e); }
      });

      socket.on("user-disconnected", () => {
        remoteStreamRef.current = null;
        setRemoteStream(null);
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
        setCallStatus("disconnected");
        peerConnectionRef.current?.close();
        peerConnectionRef.current = null;
      });

      socket.on("chat-message", (msg: CallChatMessage) => {
        setMessages((p) => [...p, msg]);
        setChatOpen((open) => { if (!open) setUnreadCount((c) => c + 1); return open; });
      });

      socket.on("media-state", ({ muted }: { muted?: boolean }) => {
        if (typeof muted === "boolean") setRemoteMuted(muted);
      });
    };

    void boot();
    durationRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);

    return () => {
      cancelled = true;
      if (durationRef.current) clearInterval(durationRef.current);
      socketRef.current?.emit("leave-room", roomId);
      socketRef.current?.disconnect();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
      peerConnectionRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, role, userName]);

  // ── Sync streams → DOM ─────────────────────────────────────────────────────
  useEffect(() => {
    if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (remoteStream) {
      if (remoteVideoRef.current) { remoteVideoRef.current.srcObject = remoteStream; remoteVideoRef.current.play().catch(() => {}); }
      if (remoteAudioRef.current) { remoteAudioRef.current.srcObject = remoteStream; remoteAudioRef.current.muted = isSpeakerMuted; remoteAudioRef.current.play().catch(() => {}); }
    }
  }, [remoteStream, isSpeakerMuted]);

  // ── Voice analyser ─────────────────────────────────────────────────────────
  useEffect(() => {
    const listen = (stream: MediaStream | null, setLvl: (n: number) => void, setSpk: (v: boolean) => void) => {
      if (!stream?.getAudioTracks().length) { setLvl(0); setSpk(false); return; }
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const src = ctx.createMediaStreamSource(stream);
        const an = ctx.createAnalyser(); an.fftSize = 256;
        src.connect(an);
        const d = new Uint8Array(an.frequencyBinCount);
        let raf = 0;
        const tick = () => { an.getByteFrequencyData(d); const avg = d.reduce((s, v) => s + v, 0) / d.length / 255; setLvl(avg); setSpk(avg > 0.06); raf = requestAnimationFrame(tick); };
        tick();
        return () => { cancelAnimationFrame(raf); void ctx.close(); };
      } catch { return () => {}; }
    };
    const sL = listen(localStream, setLocalLevel, setLocalSpeaking);
    const sR = listen(remoteStream, setRemoteLevel, setRemoteSpeaking);
    return () => { sL?.(); sR?.(); };
  }, [localStream, remoteStream]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // ── Controls ───────────────────────────────────────────────────────────────
  const toggleMute = () => {
    const next = !isMuted;
    localStreamRef.current?.getAudioTracks().forEach((t) => { t.enabled = !next; });
    setIsMuted(next);
    socketRef.current?.emit("media-state", { roomId, muted: next });
  };

  const toggleCamera = () => {
    const next = !isCameraOff;
    localStreamRef.current?.getVideoTracks().forEach((t) => { t.enabled = !next; });
    setIsCameraOff(next);
  };

  const toggleSpeaker = () => {
    const next = !isSpeakerMuted;
    speakerMutedRef.current = next; // keep ref in sync
    setIsSpeakerMuted(next);
    if (remoteVideoRef.current) remoteVideoRef.current.muted = next;
    if (remoteAudioRef.current) remoteAudioRef.current.muted = next;
  };

  const stopScreenShare = async () => {
    const pc = peerConnectionRef.current;
    const cam = cameraStreamRef.current;
    const sender = pc?.getSenders().find((s) => s.track?.kind === "video");
    const ct = cam?.getVideoTracks()[0];
    if (sender && ct) await sender.replaceTrack(ct);
    if (localVideoRef.current && cam) localVideoRef.current.srcObject = cam;
    localStreamRef.current = cam;
    setLocalStream(cam);
    sharingRef.current = false;
    setScreenSharing(false);
  };

  const toggleScreenShare = async () => {
    if (sharingRef.current) { await stopScreenShare(); return; }
    try {
      const d = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const dt = d.getVideoTracks()[0];
      const sender = peerConnectionRef.current?.getSenders().find((s) => s.track?.kind === "video");
      if (sender) await sender.replaceTrack(dt);
      if (localVideoRef.current) localVideoRef.current.srcObject = d;
      localStreamRef.current = d; setLocalStream(d);
      sharingRef.current = true; setScreenSharing(true);
      dt.onended = () => { void stopScreenShare(); };
    } catch { /* cancelled */ }
  };

  const sendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = chatMessage.trim();
    if (!text || callStatus !== "connected") return;
    const msg: CallChatMessage = { id: `${Date.now()}`, sender: role, name: userName, text, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    setMessages((p) => [...p, msg]);
    setChatMessage("");
    socketRef.current?.emit("chat-message", { ...msg, roomId });
    try {
      await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ senderName: userName, senderRole: role, messageText: text, consultationId: roomId }) });
    } catch { /* socket delivered */ }
  };

  const endCall = () => {
    socketRef.current?.emit("leave-room", roomId);
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
    peerConnectionRef.current?.close();
    onCallEnd?.();
  };

  const chips = role === "doctor"
    ? ["No chest pain?", "Full neck rotation?", "Vitals look optimal."]
    : ["BP 118/78 normal", "No symptoms", "Ready"];

  const floating = variant === "floating";
  const voiceActive = !isMuted && localSpeaking;
  const bothConnected = callStatus === "connected";

  const VoiceBars = ({ level, active, light }: { level: number; active: boolean; light?: boolean }) => (
    <span className="flex items-end gap-0.5 h-3.5">
      {[0.45, 1, 0.7, 1.15, 0.55].map((w, i) => (
        <span key={i} className={`w-[2.5px] rounded-full ${active ? "bg-[#12B8B0]" : light ? "bg-gray-400" : "bg-white/40"}`}
          style={{ height: active ? `${Math.max(3, Math.min(14, 3 + level * 20 * w))}px` : "3px", transition: "height 80ms linear" }}
        />
      ))}
    </span>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // FLOATING / MINIMIZED VARIANT (Google Meet PiP style)
  // ══════════════════════════════════════════════════════════════════════════
  if (floating) {
    return (
      <div className={`relative w-full h-full rounded-3xl overflow-hidden shadow-2xl border ${dark ? "border-[#1e3a5f]" : "border-slate-200"} ${bg} flex flex-col select-none`}>
        {/* Hidden audio */}
        <audio ref={remoteAudioRef} autoPlay playsInline />

        {/* Device switch overlays */}
        {deviceSwitchState === "evicted" && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4 text-center gap-3 rounded-3xl">
            <span className="text-2xl">📱</span>
            <p className="text-white text-xs font-bold">You joined from another device.</p>
            <p className="text-white/60 text-[10px]">This session has ended here.</p>
          </div>
        )}
        {deviceSwitchState === "pending-new" && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4 text-center gap-3 rounded-3xl">
            <div className="w-8 h-8 border-2 border-[#12B8B0] border-t-transparent rounded-full animate-spin" />
            <p className="text-white text-xs font-bold">Waiting for previous session to accept…</p>
          </div>
        )}
        {deviceSwitchState === "takeover-request" && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4 text-center gap-3 rounded-3xl">
            <span className="text-2xl">⚠️</span>
            <p className="text-white text-xs font-bold leading-snug">You're joining from a new device.<br/>Switch to it?</p>
            <div className="flex gap-2">
              <button onClick={() => { socketRef.current?.emit("device-takeover-accept", { newSocketId: pendingNewSocketId }); setDeviceSwitchState("idle"); }}
                className="px-3 py-1.5 rounded-lg bg-[#12B8B0] text-[#0B2D5C] text-[11px] font-black">Accept</button>
              <button onClick={() => { socketRef.current?.emit("device-takeover-reject", { newSocketId: pendingNewSocketId }); setDeviceSwitchState("idle"); setPendingNewSocketId(null); }}
                className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-[11px] font-black">Decline</button>
            </div>
          </div>
        )}

        {/* Top bar */}
        <div className={`flex items-center justify-between px-3 py-2 ${bg} border-b ${border}`}>
          <div className="flex items-center gap-2 min-w-0">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${bothConnected ? "bg-emerald-400 animate-pulse" : callStatus === "disconnected" ? "bg-rose-500" : "bg-amber-400 animate-pulse"}`} />
            <span className={`text-xs font-bold truncate ${txt}`}>{remoteName}</span>
            <BadgeCheck className="w-3 h-3 text-[#12B8B0] flex-shrink-0" />
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className={`text-[10px] font-mono ${txtSub}`}>{formatDuration(callDuration)}</span>
            {onExpand && (
              <button onClick={onExpand} title="Expand to full room"
                className={`ml-1 w-7 h-7 rounded-xl flex items-center justify-center ${ctrlBg} ${ctrlTxt} transition-all`}>
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Video stage */}
        <div className="relative flex-1 bg-slate-950 overflow-hidden min-h-0">
          {/* Remote video */}
          <video ref={remoteVideoRef} autoPlay playsInline
            className={`absolute inset-0 w-full h-full object-cover transition-opacity ${remoteStream ? "opacity-100" : "opacity-0"}`} />

          {/* Waiting state */}
          {!remoteStream && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center p-3">
              <div className="w-10 h-10 relative flex items-center justify-center flex-shrink-0">
                <span className="absolute inset-0 rounded-full border border-[#12B8B0]/40 animate-ping" />
                <span className="w-4 h-4 rounded-full bg-[#12B8B0] animate-pulse" />
              </div>
              <p className="text-[11px] text-white/80 font-semibold leading-snug">
                {callStatus === "disconnected" ? `${remoteName} left` : "Waiting…"}
              </p>
            </div>
          )}

          {/* Local PiP */}
          <div className="absolute bottom-2 right-2 w-20 aspect-video rounded-xl overflow-hidden border border-white/20 shadow-lg bg-slate-900">
            <video ref={localVideoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${isCameraOff ? "opacity-0" : "opacity-100"}`} />
            {isCameraOff && <div className="absolute inset-0 flex items-center justify-center"><VideoOff className="w-4 h-4 text-white/60" /></div>}
            <div className="absolute bottom-0.5 left-1 text-[8px] text-white/80 font-bold">You</div>
          </div>
        </div>

        {/* Control bar */}
        <div className={`flex items-center justify-center gap-2 px-3 py-2.5 ${bg} border-t ${border}`}>
          <button onClick={toggleMute}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${isMuted ? "bg-rose-600 text-white" : voiceActive ? "bg-[#12B8B0] text-[#0B2D5C]" : `${ctrlBg} ${ctrlTxt}`}`}
            title={isMuted ? "Unmute" : "Mute"}>
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <button onClick={toggleCamera}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${isCameraOff ? "bg-rose-600 text-white" : `${ctrlBg} ${ctrlTxt}`}`}
            title={isCameraOff ? "Camera On" : "Camera Off"}>
            {isCameraOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
          </button>
          <button onClick={() => void toggleScreenShare()}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${screenSharing ? "bg-[#12B8B0] text-[#0B2D5C]" : `${ctrlBg} ${ctrlTxt}`}`}
            title={screenSharing ? "Stop share" : "Share screen"}>
            {screenSharing ? <MonitorOff className="w-4 h-4" /> : <MonitorUp className="w-4 h-4" />}
          </button>
          <button onClick={() => { setChatOpen((v) => !v); setUnreadCount(0); }}
            className={`w-9 h-9 rounded-full flex items-center justify-center relative transition-all ${chatOpen ? "bg-[#12B8B0] text-[#0B2D5C]" : `${ctrlBg} ${ctrlTxt}`}`}
            title="Messages">
            <MessageSquare className="w-4 h-4" />
            {unreadCount > 0 && !chatOpen && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-[9px] font-black text-slate-950 flex items-center justify-center animate-bounce">{unreadCount}</span>
            )}
          </button>
          <button onClick={endCall}
            className="px-3 h-9 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] flex items-center gap-1.5 transition-all"
            title="Leave">
            <PhoneOff className="w-3.5 h-3.5" />
            <span>Leave</span>
          </button>
        </div>

        {/* Floating chat for minimized */}
        {chatOpen && (
          <div className={`absolute inset-x-0 bottom-14 top-12 ${dark ? "bg-slate-900/97" : "bg-white/97"} flex flex-col border-t ${border}`}>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {!bothConnected && <p className={`text-[10px] ${txtSub} text-center py-2`}>Chat available once connected.</p>}
              {messages.map((m, i) => (
                <div key={m.id || i} className={`flex flex-col ${m.sender === role ? "items-end" : "items-start"}`}>
                  <span className={`text-[9px] ${txtSub} mb-0.5`}>{m.name}</span>
                  <div className={`px-2.5 py-1.5 rounded-xl text-[11px] max-w-[90%] ${m.sender === role ? "bg-[#12B8B0] text-[#0B2D5C] font-bold rounded-br-none" : `${bgMid} ${txt} rounded-bl-none`}`}>{m.text}</div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={sendChat} className={`p-2 border-t ${border} flex gap-2`}>
              <input type="text" value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} placeholder={bothConnected ? "Message…" : "Waiting…"} disabled={!bothConnected}
                className={`flex-1 px-2.5 py-1.5 rounded-lg text-[11px] focus:outline-none focus:border-[#12B8B0] border ${inputBg} disabled:opacity-50`} />
              <button type="submit" disabled={!bothConnected} className="w-8 h-8 rounded-lg bg-[#12B8B0] text-[#0B2D5C] flex items-center justify-center disabled:opacity-40">
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // FULL SCREEN VARIANT (overlay / embedded) — Google Meet layout
  // ══════════════════════════════════════════════════════════════════════════
  const shellClass = variant === "overlay"
    ? `fixed inset-0 z-[90] flex flex-col overflow-hidden ${bg}`
    : `relative min-h-[580px] h-[min(85vh,860px)] w-full rounded-3xl overflow-hidden border ${border} ${bg} flex flex-col shadow-2xl`;

  return (
    <div className={shellClass}>
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* ── Device switch modal / overlay for full-screen ──────────── */}
      {deviceSwitchState === "evicted" && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-md p-6 text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-3xl border border-slate-700 shadow-xl">
            📱
          </div>
          <div className="space-y-1 max-w-sm">
            <h3 className="text-lg font-black text-white">Switched to Another Device</h3>
            <p className="text-xs text-slate-400">
              You transferred this consultation to another device or browser tab. This session has safely disconnected.
            </p>
          </div>
          <button
            onClick={endCall}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs transition-all shadow-md"
          >
            Close Consultation
          </button>
        </div>
      )}

      {deviceSwitchState === "pending-new" && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-md p-6 text-center gap-4">
          <div className="w-14 h-14 rounded-full border-4 border-[#12B8B0] border-t-transparent animate-spin" />
          <div className="space-y-1 max-w-sm">
            <h3 className="text-base font-bold text-white">Connecting from New Device</h3>
            <p className="text-xs text-slate-400">
              Your previous tab or device is still active. Please click <strong>Accept</strong> on that screen to switch to this device.
            </p>
          </div>
        </div>
      )}

      {deviceSwitchState === "takeover-request" && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md p-6 text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center text-3xl shadow-xl animate-pulse">
            ⚠️
          </div>
          <div className="space-y-1.5 max-w-sm">
            <h3 className="text-lg font-black text-white">Device Switch Requested</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Someone is connecting to this consultation using your account on another browser or device. Do you want to switch to the new device?
            </p>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={() => {
                socketRef.current?.emit("device-takeover-accept", { newSocketId: pendingNewSocketId });
                setDeviceSwitchState("idle");
              }}
              className="px-6 py-3 rounded-xl bg-[#12B8B0] hover:bg-[#1dd9d0] text-[#0B2D5C] text-xs font-black transition-all shadow-lg active:scale-95 flex items-center gap-2"
            >
              <span>Accept & Switch</span>
            </button>
            <button
              onClick={() => {
                socketRef.current?.emit("device-takeover-reject", { newSocketId: pendingNewSocketId });
                setDeviceSwitchState("idle");
                setPendingNewSocketId(null);
              }}
              className="px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-lg active:scale-95"
            >
              Keep This Device
            </button>
          </div>
        </div>
      )}

      {/* ── Floating Top Bar ─────────────────────────────────────── */}
      <div className="absolute top-0 inset-x-0 z-30 p-3 sm:p-5 flex items-start justify-between pointer-events-none">
        {/* Status pill */}
        <div className={`flex items-center gap-2 pointer-events-auto ${overlayBg} backdrop-blur-md px-3.5 py-2 rounded-full border border-white/10 shadow-lg`}>
          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${bothConnected ? "bg-emerald-400 animate-pulse" : callStatus === "disconnected" ? "bg-rose-500" : "bg-amber-400 animate-pulse"}`} />
          <span className="text-xs font-bold text-white truncate max-w-[130px] sm:max-w-xs">{remoteName}</span>
          <BadgeCheck className="w-3.5 h-3.5 text-[#12B8B0] flex-shrink-0" />
          <span className="text-[11px] text-white/60 font-mono pl-1 border-l border-white/20">{formatDuration(callDuration)}</span>
        </div>

        {/* Right: icon buttons */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {[
            { icon: isSpeakerMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />, onClick: toggleSpeaker, active: isSpeakerMuted, title: "Speaker" },
            { icon: <SwitchCamera className="w-4 h-4" />, onClick: () => void toggleFlipCamera(), title: "Flip Camera" },
            { icon: dark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-white" />, onClick: toggleTheme, title: "Toggle Theme" },
          ].map(({ icon, onClick, active, title }, i) => (
            <button key={i} onClick={onClick} title={title}
              className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 transition-all ${active ? "bg-rose-600 text-white" : `${overlayBg} hover:bg-black/60 text-white`}`}>
              {icon}
            </button>
          ))}

          <button onClick={() => { setChatOpen((v) => !v); setUnreadCount(0); }}
            className={`w-9 h-9 rounded-full flex items-center justify-center relative backdrop-blur-md border border-white/10 transition-all ${chatOpen ? "bg-[#12B8B0] text-[#0B2D5C]" : `${overlayBg} hover:bg-black/60 text-white`}`}
            title="Messages">
            <MessageSquare className="w-4 h-4" />
            {unreadCount > 0 && !chatOpen && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-emerald-500 text-[9px] font-black text-slate-950 flex items-center justify-center px-1 animate-bounce">{unreadCount}</span>
            )}
          </button>

          {onMinimize && (
            <button onClick={onMinimize} title="Minimize — keep working"
              className={`w-9 h-9 rounded-full ${overlayBg} hover:bg-black/60 text-white border border-white/10 backdrop-blur-md flex items-center justify-center`}>
              <Minimize2 className="w-4 h-4" />
            </button>
          )}

          {variant === "overlay" && (
            <button onClick={endCall} title="Close"
              className={`w-9 h-9 rounded-full ${overlayBg} hover:bg-rose-600 text-white border border-white/10 backdrop-blur-md flex items-center justify-center`}>
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Main Stage ────────────────────────────────────────────── */}
      <div className="relative flex-1 w-full min-h-0 overflow-hidden flex">
        {/* Remote video fills screen */}
        <div className={`relative flex-1 min-h-0 overflow-hidden flex items-center justify-center ${videoBg}`}>
          <video ref={remoteVideoRef} autoPlay playsInline
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${remoteStream ? "opacity-100" : "opacity-0"}`} />

          {/* Waiting overlay */}
          {!remoteStream && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 z-10 p-6 text-center">
              <div className="w-20 h-20 relative flex items-center justify-center">
                <span className="absolute inset-0 rounded-full border-2 border-[#12B8B0]/40 animate-ping" />
                <span className="absolute inset-3 rounded-full bg-[#12B8B0]/10 border border-[#12B8B0]/60 flex items-center justify-center">
                  <span className="w-5 h-5 rounded-full bg-[#12B8B0] animate-pulse" />
                </span>
              </div>
              <div className="space-y-2 max-w-xs">
                <p className="text-base font-bold text-white">
                  {mediaError || (callStatus === "disconnected" ? `${remoteName} left the room` : role === "doctor" ? `Waiting for ${remoteName} to connect` : `Connecting to ${remoteName}…`)}
                </p>
                {!mediaError && callStatus !== "disconnected" && (
                  <p className="text-xs text-slate-400">Stay in this room. Video and audio start automatically when both sides are present.</p>
                )}
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-slate-400">
                <Shield className="w-3.5 h-3.5 text-[#12B8B0]" />
                <span>Encrypted WebRTC · FitMed</span>
              </div>
            </div>
          )}

          {/* Remote speaking indicator */}
          <div className="absolute bottom-28 left-4 z-20 flex items-center gap-2">
            {remoteSpeaking && !remoteMuted && (
              <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-white text-xs">
                <span className="font-semibold">{remoteName}</span>
                <VoiceBars level={remoteLevel} active />
              </div>
            )}
            {remoteMuted && (
              <div className="flex items-center gap-1 bg-rose-600/80 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-xs font-bold">
                <MicOff className="w-3.5 h-3.5" />
                <span>Muted</span>
              </div>
            )}
          </div>

          {/* Local PiP */}
          <div className="absolute bottom-24 right-4 sm:bottom-28 sm:right-6 w-28 sm:w-40 aspect-[3/4] sm:aspect-video rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl bg-slate-900 z-20">
            <video ref={localVideoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${isCameraOff ? "opacity-0" : "opacity-100"}`} />
            {isCameraOff && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-slate-900 text-slate-400">
                <VideoOff className="w-5 h-5" />
                <span className="text-[9px] font-bold">Camera off</span>
              </div>
            )}
            {isMuted && <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-rose-600 flex items-center justify-center text-white"><MicOff className="w-3 h-3" /></div>}
            <button onClick={() => void toggleFlipCamera()}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center"
              title="Flip camera">
              <FlipHorizontal className="w-3.5 h-3.5" />
            </button>
            <div className="absolute bottom-1.5 left-2 flex items-center gap-1 text-[10px] bg-black/60 px-2 py-0.5 rounded-full text-white font-bold backdrop-blur-sm">
              <span>You</span>
              {!isMuted && <VoiceBars level={localLevel} active={voiceActive} />}
            </div>
          </div>

          {screenSharing && (
            <div className="absolute top-16 left-4 z-20 px-3 py-1 rounded-full bg-[#12B8B0] text-[#0B2D5C] text-[10px] font-black shadow-lg">Sharing screen</div>
          )}

          {/* ── Control Bar ───────────────────────────────────────── */}
          <div className={`absolute bottom-5 sm:bottom-7 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full backdrop-blur-2xl border border-white/15 shadow-2xl ${overlayBg}`}>
            <button onClick={toggleMute} title={isMuted ? "Unmute" : "Mute"}
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all ${isMuted ? "bg-rose-600 text-white shadow-rose-600/30 shadow-lg" : voiceActive ? "bg-[#12B8B0] text-[#0B2D5C]" : "bg-white/10 hover:bg-white/20 text-white"}`}>
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <button onClick={toggleCamera} title={isCameraOff ? "Camera On" : "Camera Off"}
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all ${isCameraOff ? "bg-rose-600 text-white shadow-rose-600/30 shadow-lg" : "bg-white/10 hover:bg-white/20 text-white"}`}>
              {isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>
            <button onClick={() => void toggleScreenShare()} title={screenSharing ? "Stop Share" : "Share Screen"}
              className={`hidden sm:flex w-12 h-12 rounded-full items-center justify-center transition-all ${screenSharing ? "bg-[#12B8B0] text-[#0B2D5C]" : "bg-white/10 hover:bg-white/20 text-white"}`}>
              {screenSharing ? <MonitorOff className="w-5 h-5" /> : <MonitorUp className="w-5 h-5" />}
            </button>
            <button onClick={() => { setChatOpen((v) => !v); setUnreadCount(0); }} title="Messages"
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center relative transition-all ${chatOpen ? "bg-[#12B8B0] text-[#0B2D5C]" : "bg-white/10 hover:bg-white/20 text-white"}`}>
              <MessageSquare className="w-5 h-5" />
              {unreadCount > 0 && !chatOpen && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-emerald-500 text-[9px] font-black text-slate-950 flex items-center justify-center px-1 animate-bounce">{unreadCount}</span>
              )}
            </button>
            <div className="w-px h-6 bg-white/20 mx-0.5" />
            <button onClick={endCall} title="Leave"
              className="px-4 sm:px-5 h-11 sm:h-12 rounded-full bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-600/40 transition-all">
              <PhoneOff className="w-4 h-4" />
              <span className="hidden sm:inline">Leave</span>
            </button>
          </div>
        </div>

        {/* ── Chat: Bottom sheet (mobile) / Sidebar (desktop) ────── */}
        {chatOpen && (
          <div className={`
            fixed inset-x-0 bottom-0 z-50 rounded-t-3xl max-h-[80vh] h-[480px] ${bgCard} border-t ${border} flex flex-col shadow-2xl
            md:relative md:inset-auto md:w-80 md:h-full md:max-h-none md:rounded-none md:border-t-0 md:border-l
          `}>
            <div className="md:hidden w-10 h-1 bg-slate-600 rounded-full mx-auto mt-3 mb-1" />
            <div className={`flex items-center justify-between px-4 py-3 border-b ${border}`}>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#12B8B0]" />
                <h4 className={`text-xs font-extrabold ${txt} uppercase tracking-wider`}>In-call messages</h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-400/10 px-2.5 py-0.5 rounded-full">{messages.length} msgs</span>
                <button onClick={() => setChatOpen(false)} className={`w-7 h-7 rounded-full ${bgMid} ${txtSub} hover:${txt} flex items-center justify-center`}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {!bothConnected && (
                <div className={`text-center py-4 px-3 rounded-xl ${bgMid} text-xs ${txtSub}`}>
                  💬 Chat available once both participants are connected.
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={msg.id || i} className={`flex flex-col ${msg.sender === role ? "items-end" : "items-start"}`}>
                  <span className={`text-[10px] ${txtSub} mb-1`}>{msg.name} · {msg.time}</span>
                  <div className={`px-3.5 py-2.5 rounded-2xl text-xs max-w-[85%] leading-relaxed ${msg.sender === role ? "bg-[#12B8B0] text-[#0B2D5C] font-bold rounded-br-none" : `${bgMid} ${txt} rounded-bl-none`}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className={`px-4 py-2 border-t ${border}`}>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {chips.map((chip) => (
                  <button key={chip} type="button" onClick={() => bothConnected && setChatMessage(chip)} disabled={!bothConnected}
                    className={`text-[10px] font-semibold ${chipBg} px-2.5 py-1 rounded-full flex-shrink-0 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed`}>
                    {chip}
                  </button>
                ))}
              </div>
            </div>
            <form onSubmit={sendChat} className={`p-3 sm:p-4 border-t ${border} flex items-center gap-2`}>
              <input type="text" value={chatMessage} onChange={(e) => setChatMessage(e.target.value)}
                placeholder={bothConnected ? "Send a message…" : "Waiting for connection…"} disabled={!bothConnected}
                className={`flex-1 p-2.5 rounded-xl ${inputBg} text-xs focus:outline-none focus:border-[#12B8B0] border disabled:opacity-50 disabled:cursor-not-allowed`} />
              <button type="submit" disabled={!bothConnected}
                className="w-10 h-10 rounded-xl bg-[#12B8B0] hover:bg-[#1dd9d0] text-[#0B2D5C] flex items-center justify-center font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
