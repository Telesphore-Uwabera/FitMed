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
  Wifi,
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

  // ── State ───────────────────────────────────────────────────────────────────
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
  const [peerCount, setPeerCount] = useState(0); // how many peers in room

  // ── Refs (never stale) ─────────────────────────────────────────────────────
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null); // ← ref, never stale
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);
  const makingOfferRef = useRef(false);
  const sharingRef = useRef(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const durationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Theme tokens ───────────────────────────────────────────────────────────
  const bg         = dark ? "bg-slate-950"   : "bg-gray-900";
  const bgCard     = dark ? "bg-slate-900"   : "bg-gray-800";
  const bgMid      = dark ? "bg-slate-800"   : "bg-gray-700";
  const border     = dark ? "border-slate-700" : "border-gray-700";
  const txt        = "text-white";
  const txtSub     = dark ? "text-slate-400" : "text-gray-400";
  const ctrlBg     = dark ? "bg-white/10 hover:bg-white/20" : "bg-white/15 hover:bg-white/25";
  const inputBg    = dark
    ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500"
    : "bg-gray-700 border-gray-600 text-white placeholder-gray-400";
  const chipBg     = dark
    ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
    : "bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600";

  // ── ICE / TURN servers ─────────────────────────────────────────────────────
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

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // ── Attach local tracks to peer connection ─────────────────────────────────
  const attachLocalTracks = (pc: RTCPeerConnection, stream: MediaStream) => {
    const existingIds = new Set(pc.getSenders().map((s) => s.track?.id).filter(Boolean));
    stream.getTracks().forEach((track) => {
      if (!existingIds.has(track.id)) {
        try { pc.addTrack(track, stream); } catch (e) {
          console.warn("[WebRTC] addTrack:", e);
        }
      }
    });
  };

  // ── Flush queued ICE candidates after remote description is set ────────────
  const flushIce = async () => {
    const pc = peerConnectionRef.current;
    if (!pc?.remoteDescription) return;
    const queued = pendingIceRef.current.splice(0);
    for (const c of queued) {
      try { await pc.addIceCandidate(new RTCIceCandidate(c)); }
      catch (e) { console.warn("[ICE] skipped", e); }
    }
  };

  // ── Attach remote stream to <video> and <audio> elements ──────────────────
  const attachRemoteStream = useCallback((stream: MediaStream) => {
    remoteStreamRef.current = stream;
    setRemoteStream(stream);

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = stream;
      remoteVideoRef.current.play().catch(() => {});
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = stream;
      remoteAudioRef.current.muted = isSpeakerMuted;
      remoteAudioRef.current.play().catch(() => {});
    }
    setCallStatus("connected");
    onRemoteJoined?.();
  }, [onRemoteJoined, isSpeakerMuted]);

  // ── Create / get peer connection (uses REFS, not state — never stale) ──────
  const createPeerConnection = useCallback(() => {
    if (peerConnectionRef.current) return peerConnectionRef.current;

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit("ice-candidate", { roomId, candidate: event.candidate });
      }
    };

    // ── KEY FIX: use remoteStreamRef (ref, not state) inside ontrack ──────────
    pc.ontrack = (event) => {
      let stream: MediaStream;

      if (event.streams && event.streams.length > 0) {
        // Preferred: use the stream that came with the track
        stream = event.streams[0];
      } else {
        // Fallback: build one manually
        stream = remoteStreamRef.current ?? new MediaStream();
        stream.addTrack(event.track);
      }

      attachRemoteStream(stream);
    };

    pc.onconnectionstatechange = () => {
      console.log("[WebRTC] connection state:", pc.connectionState);
      if (pc.connectionState === "connected") {
        setCallStatus("connected");
        onRemoteJoined?.();
      }
      if (pc.connectionState === "failed") {
        // Attempt ICE restart
        if (role === "doctor") {
          pc.restartIce();
        }
        setCallStatus("disconnected");
      }
      if (pc.connectionState === "disconnected") {
        setCallStatus("disconnected");
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("[ICE] state:", pc.iceConnectionState);
    };

    if (localStreamRef.current) {
      attachLocalTracks(pc, localStreamRef.current);
    }

    return pc;
  // IMPORTANT: no state variables in deps — only stable refs/callbacks
  }, [roomId, role, onRemoteJoined, attachRemoteStream]);

  // ── Doctor initiates the call ──────────────────────────────────────────────
  const startCall = useCallback(async () => {
    if (role !== "doctor") return;
    if (makingOfferRef.current) return;

    // Wait for local media & socket
    if (!localStreamRef.current || !socketRef.current) {
      setTimeout(() => void startCall(), 800);
      return;
    }

    makingOfferRef.current = true;
    try {
      const pc = createPeerConnection();
      attachLocalTracks(pc, localStreamRef.current);
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(offer);
      socketRef.current.emit("offer", { roomId, offer });
      console.log("[WebRTC] Offer sent");
    } catch (err) {
      console.error("[WebRTC] startCall failed:", err);
    } finally {
      makingOfferRef.current = false;
    }
  }, [createPeerConnection, role, roomId]);

  // ── Applicant handles incoming offer ──────────────────────────────────────
  const handleOffer = useCallback(async (offer: RTCSessionDescriptionInit) => {
    console.log("[WebRTC] Received offer");

    // Ensure local media is available before answering
    if (!localStreamRef.current) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });
        localStreamRef.current = stream;
        cameraStreamRef.current = stream;
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      } catch (err) {
        console.warn("[WebRTC] getUserMedia in handleOffer failed:", err);
      }
    }

    const pc = createPeerConnection();
    if (localStreamRef.current) attachLocalTracks(pc, localStreamRef.current);

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    await flushIce();

    const answer = await pc.createAnswer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    await pc.setLocalDescription(answer);
    socketRef.current?.emit("answer", { roomId, answer });
    console.log("[WebRTC] Answer sent");
  }, [createPeerConnection, roomId]);

  // ── Toggle front / back camera ─────────────────────────────────────────────
  const toggleFlipCamera = async () => {
    const nextMode = facingMode === "user" ? "environment" : "user";
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: nextMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      const newVideoTrack = newStream.getVideoTracks()[0];
      const pc = peerConnectionRef.current;
      if (pc && newVideoTrack) {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) await sender.replaceTrack(newVideoTrack);
      }
      localStreamRef.current?.getVideoTracks().forEach((t) => t.stop());
      localStreamRef.current = newStream;
      cameraStreamRef.current = newStream;
      setLocalStream(newStream);
      setFacingMode(nextMode);
      if (localVideoRef.current) localVideoRef.current.srcObject = newStream;
    } catch (err) {
      console.warn("[WebRTC] switchCamera:", err);
    }
  };

  // ── Boot: get media + connect socket ─────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      // 1. Acquire local media
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        localStreamRef.current = stream;
        cameraStreamRef.current = stream;
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      } catch (error) {
        console.error("[WebRTC] getUserMedia denied:", error);
        setMediaError("Camera or microphone access was denied. Please allow it in your browser settings.");
      }

      // 2. Connect signaling socket
      const socket = io(socketUrl(), {
        transports: ["websocket", "polling"],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 10,
      });
      socketRef.current = socket;

      socket.on("connect", () => {
        console.log("[Socket] connected:", socket.id);
        socket.emit("join-room", { roomId, name: userName, role });
      });

      socket.on("room-full", () => {
        setMediaError("This consultation room is already full.");
      });

      // Another peer joined → doctor initiates
      socket.on("user-connected", ({ name, role: remoteRole }: { name?: string; role?: string }) => {
        console.log("[Socket] user-connected:", name, remoteRole);
        setPeerCount((c) => c + 1);
        if (role === "doctor") void startCall();
      });

      // Both peers confirmed in room
      socket.on("call-ready", () => {
        console.log("[Socket] call-ready");
        if (role === "doctor") void startCall();
      });

      socket.on("offer", async ({ offer }: { offer: RTCSessionDescriptionInit }) => {
        await handleOffer(offer);
      });

      socket.on("answer", async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
        const pc = peerConnectionRef.current;
        if (pc) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
            await flushIce();
            console.log("[WebRTC] Remote description set (answer)");
          } catch (err) {
            console.error("[WebRTC] setRemoteDescription (answer):", err);
          }
        }
      });

      socket.on("ice-candidate", async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
        const pc = peerConnectionRef.current;
        if (!pc?.remoteDescription) {
          pendingIceRef.current.push(candidate);
          return;
        }
        try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); }
        catch (err) { console.warn("[ICE] addIceCandidate:", err); }
      });

      socket.on("user-disconnected", () => {
        console.log("[Socket] user-disconnected");
        setPeerCount((c) => Math.max(0, c - 1));
        remoteStreamRef.current = null;
        setRemoteStream(null);
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
        setCallStatus("disconnected");
        peerConnectionRef.current?.close();
        peerConnectionRef.current = null;
      });

      socket.on("chat-message", (msg: CallChatMessage) => {
        setMessages((prev) => [...prev, msg]);
        setChatOpen((open) => {
          if (!open) setUnreadCount((c) => c + 1);
          return open;
        });
      });

      socket.on("media-state", (state: { muted?: boolean }) => {
        if (typeof state.muted === "boolean") setRemoteMuted(state.muted);
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

  // ── Sync localStream → video element ─────────────────────────────────────
  useEffect(() => {
    if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  // ── Sync remoteStream → video + audio elements ────────────────────────────
  useEffect(() => {
    if (remoteStream) {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play().catch(() => {});
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
        remoteAudioRef.current.muted = isSpeakerMuted;
        remoteAudioRef.current.play().catch(() => {});
      }
    }
  }, [remoteStream, isSpeakerMuted]);

  // ── Voice-level analyser ───────────────────────────────────────────────────
  useEffect(() => {
    const listen = (
      stream: MediaStream | null,
      setLevel: (n: number) => void,
      setSpeaking: (v: boolean) => void
    ) => {
      if (!stream?.getAudioTracks().length) { setLevel(0); setSpeaking(false); return; }
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        src.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);
        let raf = 0;
        const tick = () => {
          if (ctx.state === "suspended") void ctx.resume();
          analyser.getByteFrequencyData(data);
          const avg = data.reduce((s, v) => s + v, 0) / data.length / 255;
          setLevel(avg);
          setSpeaking(avg > 0.06);
          raf = requestAnimationFrame(tick);
        };
        tick();
        return () => { cancelAnimationFrame(raf); void ctx.close(); };
      } catch { return () => {}; }
    };
    const stopL = listen(localStream, setLocalLevel, setLocalSpeaking);
    const stopR = listen(remoteStream, setRemoteLevel, setRemoteSpeaking);
    return () => { stopL?.(); stopR?.(); };
  }, [localStream, remoteStream]);

  // ── Auto-scroll chat ───────────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    setIsSpeakerMuted(next);
    if (remoteVideoRef.current) remoteVideoRef.current.muted = next;
    if (remoteAudioRef.current) remoteAudioRef.current.muted = next;
  };

  const stopScreenShare = async () => {
    const pc = peerConnectionRef.current;
    const camera = cameraStreamRef.current;
    const sender = pc?.getSenders().find((s) => s.track?.kind === "video");
    const camTrack = camera?.getVideoTracks()[0];
    if (sender && camTrack) await sender.replaceTrack(camTrack);
    if (localVideoRef.current && camera) localVideoRef.current.srcObject = camera;
    localStreamRef.current = camera;
    setLocalStream(camera);
    sharingRef.current = false;
    setScreenSharing(false);
  };

  const toggleScreenShare = async () => {
    if (sharingRef.current) { await stopScreenShare(); return; }
    try {
      const display = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const displayTrack = display.getVideoTracks()[0];
      const sender = peerConnectionRef.current?.getSenders().find((s) => s.track?.kind === "video");
      if (sender) await sender.replaceTrack(displayTrack);
      if (localVideoRef.current) localVideoRef.current.srcObject = display;
      localStreamRef.current = display;
      setLocalStream(display);
      sharingRef.current = true;
      setScreenSharing(true);
      displayTrack.onended = () => { void stopScreenShare(); };
    } catch { /* cancelled */ }
  };

  // ── Chat — only send when connected ───────────────────────────────────────
  const sendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = chatMessage.trim();
    if (!text || callStatus !== "connected") return;
    const msg: CallChatMessage = {
      id: `${Date.now()}`,
      sender: role,
      name: userName,
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, msg]);
    setChatMessage("");
    socketRef.current?.emit("chat-message", { ...msg, roomId });
    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderName: userName, senderRole: role, messageText: text, consultationId: roomId }),
      });
    } catch { /* socket already delivered */ }
  };

  const endCall = () => {
    socketRef.current?.emit("leave-room", roomId);
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
    peerConnectionRef.current?.close();
    onCallEnd?.();
  };

  const chips =
    role === "doctor"
      ? ["Please confirm you have no chest pain.", "Can you perform a full neck rotation?", "Vitals look optimal. Ready to sign."]
      : ["Vitals: BP 118/78", "No symptoms", "Ready"];

  const floating = variant === "floating";
  const voiceActive = !isMuted && localSpeaking;
  const bothConnected = callStatus === "connected";

  const shellClass =
    variant === "overlay"
      ? `fixed inset-0 z-[90] ${bg} flex flex-col overflow-hidden`
      : floating
        ? `relative h-full min-h-[14rem] rounded-3xl overflow-hidden border ${border} ${bg} flex flex-col shadow-2xl`
        : `relative min-h-[580px] h-[min(85vh,860px)] w-full rounded-3xl overflow-hidden border ${border} ${bg} flex flex-col shadow-2xl`;

  const VoiceBars = ({ level, active }: { level: number; active: boolean }) => (
    <span className="flex items-end gap-0.5 h-3.5">
      {[0.45, 1, 0.7, 1.15, 0.55].map((weight, i) => (
        <span
          key={i}
          className={`w-[2.5px] rounded-full ${active ? "bg-[#12B8B0]" : "bg-white/30"}`}
          style={{
            height: active ? `${Math.max(3, Math.min(14, 3 + level * 20 * weight))}px` : "3px",
            transition: "height 80ms linear",
          }}
        />
      ))}
    </span>
  );

  return (
    <div className={shellClass}>
      {/* Hidden dedicated audio output (fixes mobile audio) */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* ── Floating Top Bar ──────────────────────────────────────────── */}
      <div className="absolute top-0 inset-x-0 z-30 p-3 sm:p-5 flex items-start justify-between pointer-events-none">
        {/* Left: Status pill */}
        <div className="flex items-center gap-2 pointer-events-auto bg-black/50 backdrop-blur-md px-3.5 py-2 rounded-full border border-white/10 shadow-lg">
          <span className={`w-2.5 h-2.5 rounded-full ${
            bothConnected ? "bg-emerald-400 animate-pulse" :
            callStatus === "disconnected" ? "bg-rose-500" : "bg-amber-400 animate-pulse"
          }`} />
          <span className="text-xs font-bold text-white truncate max-w-[130px] sm:max-w-xs">{remoteName}</span>
          <BadgeCheck className="w-3.5 h-3.5 text-[#12B8B0] flex-shrink-0" />
          <span className="text-[11px] text-white/60 font-mono pl-1 border-l border-white/20 ml-1">
            {formatDuration(callDuration)}
          </span>
        </div>

        {/* Right: Icon buttons */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button onClick={toggleSpeaker}
            className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 transition-all ${
              isSpeakerMuted ? "bg-rose-600 text-white" : "bg-black/50 hover:bg-black/70 text-white"
            }`}
            title={isSpeakerMuted ? "Unmute Speaker" : "Mute Speaker"}>
            {isSpeakerMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button onClick={() => void toggleFlipCamera()}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-black/50 hover:bg-black/70 text-white border border-white/10 backdrop-blur-md transition-all"
            title="Switch Camera">
            <SwitchCamera className="w-4 h-4" />
          </button>

          <button onClick={toggleTheme}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-black/50 hover:bg-black/70 text-white border border-white/10 backdrop-blur-md transition-all"
            title={dark ? "Light mode" : "Dark mode"}>
            {dark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={() => { setChatOpen((v) => !v); setUnreadCount(0); }}
            className={`w-9 h-9 rounded-full flex items-center justify-center relative backdrop-blur-md border border-white/10 transition-all ${
              chatOpen ? "bg-[#12B8B0] text-[#0B2D5C]" : "bg-black/50 hover:bg-black/70 text-white"
            }`}
            title="In-call messages">
            <MessageSquare className="w-4 h-4" />
            {unreadCount > 0 && !chatOpen && (
              <span className="absolute -top-1 -right-1 w-4.5 h-4 rounded-full bg-emerald-500 text-[9px] font-black text-slate-950 flex items-center justify-center animate-bounce px-1">
                {unreadCount}
              </span>
            )}
          </button>

          {onMinimize && !floating && (
            <button onClick={onMinimize}
              className="w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white border border-white/10 backdrop-blur-md flex items-center justify-center"
              title="Minimize">
              <Minimize2 className="w-4 h-4" />
            </button>
          )}

          {floating && onExpand && (
            <button onClick={onExpand}
              className="w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white border border-white/10 backdrop-blur-md flex items-center justify-center"
              title="Expand">
              <Maximize2 className="w-4 h-4" />
            </button>
          )}

          {variant === "overlay" && (
            <button onClick={endCall}
              className="w-9 h-9 rounded-full bg-black/50 hover:bg-rose-600 text-white border border-white/10 backdrop-blur-md flex items-center justify-center"
              title="Close">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Main Stage ────────────────────────────────────────────────── */}
      <div className="relative flex-1 w-full min-h-0 overflow-hidden flex">
        {/* Remote Video (full screen) */}
        <div className={`relative flex-1 min-h-0 overflow-hidden flex items-center justify-center ${bg}`}>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
              remoteStream ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* Waiting / disconnected overlay */}
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
                  {mediaError ||
                    (callStatus === "disconnected"
                      ? `${remoteName} left the room`
                      : role === "doctor"
                        ? `Waiting for ${remoteName} to connect`
                        : `Connecting to Dr. ${remoteName}…`)}
                </p>
                {!mediaError && callStatus !== "disconnected" && (
                  <p className="text-xs text-slate-400">
                    Stay in this room. Video and audio start automatically when both sides are present.
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-slate-400">
                <Shield className="w-3.5 h-3.5 text-[#12B8B0]" />
                <span>Encrypted Direct Medical WebRTC</span>
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

          {/* Local PiP (Google Meet style) */}
          <div className="absolute bottom-24 right-4 sm:bottom-28 sm:right-6 w-28 sm:w-40 aspect-[3/4] sm:aspect-video rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl bg-slate-900 z-20">
            <video ref={localVideoRef} autoPlay playsInline muted
              className={`w-full h-full object-cover ${isCameraOff ? "opacity-0" : "opacity-100"}`} />
            {isCameraOff && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-slate-900 text-slate-400">
                <VideoOff className="w-5 h-5" />
                <span className="text-[9px] font-bold">Camera off</span>
              </div>
            )}
            {isMuted && (
              <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-rose-600 flex items-center justify-center text-white shadow">
                <MicOff className="w-3 h-3" />
              </div>
            )}
            <button onClick={(e) => { e.stopPropagation(); void toggleFlipCamera(); }}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-sm transition-opacity"
              title="Flip camera">
              <FlipHorizontal className="w-3.5 h-3.5" />
            </button>
            <div className="absolute bottom-1.5 left-2 flex items-center gap-1 text-[10px] bg-black/60 px-2 py-0.5 rounded-full text-white font-bold backdrop-blur-sm">
              <span>You</span>
              {!isMuted && <VoiceBars level={localLevel} active={voiceActive} />}
            </div>
          </div>

          {screenSharing && (
            <div className="absolute top-16 left-4 z-20 px-3 py-1 rounded-full bg-[#12B8B0] text-[#0B2D5C] text-[10px] font-black shadow-lg">
              Sharing screen
            </div>
          )}

          {/* ── Control Bar ──────────────────────────────────────────── */}
          <div className={`absolute bottom-5 sm:bottom-7 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5 sm:gap-3.5 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full backdrop-blur-2xl border border-white/15 shadow-2xl ${bgCard}/90`}>
            <button onClick={toggleMute}
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all ${
                isMuted ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30"
                : voiceActive ? "bg-[#12B8B0] text-[#0B2D5C]"
                : `${ctrlBg} text-white`
              }`}
              title={isMuted ? "Unmute" : "Mute"}>
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <button onClick={toggleCamera}
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all ${
                isCameraOff ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30" : `${ctrlBg} text-white`
              }`}
              title={isCameraOff ? "Turn on Camera" : "Turn off Camera"}>
              {isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>

            <button onClick={() => void toggleScreenShare()}
              className={`hidden sm:flex w-11 h-11 sm:w-12 sm:h-12 rounded-full items-center justify-center transition-all ${
                screenSharing ? "bg-[#12B8B0] text-[#0B2D5C]" : `${ctrlBg} text-white`
              }`}
              title={screenSharing ? "Stop sharing" : "Share screen"}>
              {screenSharing ? <MonitorOff className="w-5 h-5" /> : <MonitorUp className="w-5 h-5" />}
            </button>

            <button
              onClick={() => { setChatOpen((v) => !v); setUnreadCount(0); }}
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center relative transition-all ${
                chatOpen ? "bg-[#12B8B0] text-[#0B2D5C]" : `${ctrlBg} text-white`
              }`}
              title="Messages">
              <MessageSquare className="w-5 h-5" />
              {unreadCount > 0 && !chatOpen && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-emerald-500 text-[9px] font-black text-slate-950 flex items-center justify-center px-1 animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            <div className="w-px h-6 bg-white/20 mx-0.5" />

            <button onClick={endCall}
              className="px-4 sm:px-5 h-11 sm:h-12 rounded-full bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-600/40 transition-all">
              <PhoneOff className="w-4 h-4" />
              <span className="hidden sm:inline">Leave</span>
            </button>
          </div>
        </div>

        {/* ── Chat Panel: Bottom Sheet (mobile) / Sidebar (desktop) ─── */}
        {chatOpen && (
          <div className={`
            fixed inset-x-0 bottom-0 z-50 rounded-t-3xl max-h-[80vh] h-[480px] ${bgCard} border-t ${border} flex flex-col shadow-2xl
            md:relative md:inset-auto md:w-80 md:h-full md:max-h-none md:rounded-none md:border-t-0 md:border-l
          `}
          style={{ animation: "slideUp 0.25s ease" }}>
            {/* Mobile drag handle */}
            <div className="md:hidden w-10 h-1 bg-slate-600 rounded-full mx-auto mt-3 mb-1" />

            {/* Header */}
            <div className={`flex items-center justify-between px-4 py-3 border-b ${border}`}>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#12B8B0]" />
                <h4 className={`text-xs font-extrabold ${txt} uppercase tracking-wider`}>In-call messages</h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-400/10 px-2.5 py-0.5 rounded-full">
                  {messages.length} msgs
                </span>
                <button onClick={() => setChatOpen(false)}
                  className={`w-7 h-7 rounded-full ${bgMid} text-slate-400 hover:text-white flex items-center justify-center`}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {!bothConnected && (
                <div className={`text-center py-4 px-3 rounded-xl ${bgMid} text-xs ${txtSub}`}>
                  💬 Chat will be available once both participants are connected.
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={msg.id || i} className={`flex flex-col ${msg.sender === role ? "items-end" : "items-start"}`}>
                  <span className={`text-[10px] ${txtSub} mb-1`}>{msg.name} · {msg.time}</span>
                  <div className={`px-3.5 py-2.5 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                    msg.sender === role
                      ? "bg-[#12B8B0] text-[#0B2D5C] font-bold rounded-br-none"
                      : `${bgMid} ${txt} rounded-bl-none`
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Quick-reply chips */}
            <div className={`px-4 py-2 border-t ${border}`}>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {chips.map((chip) => (
                  <button key={chip} type="button"
                    onClick={() => bothConnected && setChatMessage(chip)}
                    disabled={!bothConnected}
                    className={`text-[10px] font-semibold ${chipBg} px-2.5 py-1 rounded-full flex-shrink-0 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed`}>
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <form onSubmit={sendChat} className={`p-3 sm:p-4 border-t ${border} flex items-center gap-2`}>
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder={bothConnected ? "Send a message…" : "Waiting for connection…"}
                disabled={!bothConnected}
                className={`flex-1 p-2.5 rounded-xl ${inputBg} text-xs focus:outline-none focus:border-[#12B8B0] border disabled:opacity-50 disabled:cursor-not-allowed`}
              />
              <button type="submit" disabled={!bothConnected}
                className="w-10 h-10 rounded-xl bg-[#12B8B0] hover:bg-[#1dd9d0] text-[#0B2D5C] flex items-center justify-center font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
