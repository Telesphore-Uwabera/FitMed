"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import {
  BadgeCheck,
  ChevronDown,
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

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [callStatus, setCallStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);

  // Chat state (default closed on mobile to prevent squeezing the video screen)
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

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);
  const makingOfferRef = useRef(false);
  const sharingRef = useRef(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const durationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Theme-derived colour tokens ────────────────────────────────────────────
  const bg = dark ? "bg-slate-950" : "bg-slate-900";
  const bgCard = dark ? "bg-slate-900" : "bg-slate-900/90";
  const border = dark ? "border-slate-800" : "border-slate-700/60";
  const txt = "text-white";
  const txtSub = "text-slate-400";
  const chipBg = dark
    ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
    : "bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700";

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

  const attachLocalTracks = (pc: RTCPeerConnection, stream: MediaStream) => {
    const existingTracks = new Set(pc.getSenders().map((s) => s.track?.id).filter(Boolean));
    stream.getTracks().forEach((track) => {
      if (!existingTracks.has(track.id)) {
        try {
          pc.addTrack(track, stream);
        } catch (e) {
          console.warn("Could not add track:", e);
        }
      }
    });
  };

  const flushIce = async () => {
    const pc = peerConnectionRef.current;
    if (!pc?.remoteDescription) return;
    const queued = pendingIceRef.current.splice(0);
    for (const candidate of queued) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn("ICE candidate skipped", err);
      }
    }
  };

  const createPeerConnection = useCallback(() => {
    if (peerConnectionRef.current) return peerConnectionRef.current;

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit("ice-candidate", { roomId, candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      let stream = remoteStream;
      if (event.streams && event.streams[0]) {
        stream = event.streams[0];
      } else {
        if (!stream) stream = new MediaStream();
        stream.addTrack(event.track);
      }
      setRemoteStream(stream);

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
        remoteVideoRef.current.play().catch(() => {});
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = stream;
        remoteAudioRef.current.play().catch(() => {});
      }

      setCallStatus("connected");
      onRemoteJoined?.();
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        setCallStatus("connected");
        onRemoteJoined?.();
      }
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        setCallStatus("disconnected");
      }
    };

    if (localStreamRef.current) {
      attachLocalTracks(pc, localStreamRef.current);
    }
    return pc;
  }, [roomId, onRemoteJoined, remoteStream]);

  const startCall = useCallback(async () => {
    if (makingOfferRef.current || role !== "doctor") return;

    if (!localStreamRef.current || !socketRef.current) {
      setTimeout(() => void startCall(), 1200);
      return;
    }

    const stream = localStreamRef.current;
    makingOfferRef.current = true;
    try {
      const pc = createPeerConnection();
      attachLocalTracks(pc, stream);
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(offer);
      socketRef.current.emit("offer", { roomId, offer });
    } catch (err) {
      console.error("[WebRTC] startCall failed:", err);
    } finally {
      makingOfferRef.current = false;
    }
  }, [createPeerConnection, role, roomId]);

  const handleOffer = useCallback(
    async (offer: RTCSessionDescriptionInit) => {
      let stream = localStreamRef.current;
      if (!stream) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: true,
          });
          localStreamRef.current = stream;
          cameraStreamRef.current = stream;
          setLocalStream(stream);
          if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        } catch (err) {
          console.warn("Could not get user media in handleOffer:", err);
        }
      }

      const pc = createPeerConnection();
      if (stream) attachLocalTracks(pc, stream);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      await flushIce();
      const answer = await pc.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(answer);
      socketRef.current?.emit("answer", { roomId, answer });
    },
    [createPeerConnection, roomId]
  );

  // ── Switch Front / Back Camera (Google Meet feature) ──────────────────────
  const toggleFlipCamera = async () => {
    const nextMode = facingMode === "user" ? "environment" : "user";
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: nextMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      const newVideoTrack = newStream.getVideoTracks()[0];
      const pc = peerConnectionRef.current;
      if (pc) {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender && newVideoTrack) {
          await sender.replaceTrack(newVideoTrack);
        }
      }
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach((t) => t.stop());
      }
      localStreamRef.current = newStream;
      cameraStreamRef.current = newStream;
      setLocalStream(newStream);
      setFacingMode(nextMode);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.warn("Could not switch camera:", err);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        cameraStreamRef.current = stream;
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      } catch (error) {
        console.error("Error accessing media devices:", error);
        setMediaError("Camera or microphone permission was denied. Allow access in your browser settings to join.");
      }

      const socket = io(socketUrl(), {
        transports: ["websocket", "polling"],
        autoConnect: true,
      });
      socketRef.current = socket;

      socket.on("connect", () => {
        socket.emit("join-room", { roomId, name: userName, role });
      });

      socket.on("room-full", () => {
        setMediaError("This consultation room is already full.");
      });

      socket.on("user-connected", () => {
        if (role === "doctor") void startCall();
      });

      socket.on("call-ready", () => {
        if (role === "doctor") void startCall();
      });

      socket.on("offer", async ({ offer }: { offer: RTCSessionDescriptionInit }) => {
        await handleOffer(offer);
      });

      socket.on("answer", async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
        const pc = peerConnectionRef.current;
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          await flushIce();
        }
      });

      socket.on("ice-candidate", async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
        const pc = peerConnectionRef.current;
        if (!pc?.remoteDescription) {
          pendingIceRef.current.push(candidate);
          return;
        }
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn("ICE candidate error", err);
        }
      });

      socket.on("user-disconnected", () => {
        setRemoteStream(null);
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
        setCallStatus("disconnected");
        peerConnectionRef.current?.close();
        peerConnectionRef.current = null;
      });

      socket.on("chat-message", (msg: CallChatMessage) => {
        setMessages((prev) => [...prev, msg]);
        if (!chatOpen) {
          setUnreadCount((c) => c + 1);
        }
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

  useEffect(() => {
    if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(() => {});
    }
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.play().catch(() => {});
    }
  }, [remoteStream]);

  useEffect(() => {
    const listen = (stream: MediaStream | null, setLevel: (n: number) => void, setSpeaking: (v: boolean) => void) => {
      if (!stream?.getAudioTracks().length) {
        setLevel(0);
        setSpeaking(false);
        return;
      }
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);
        let raf = 0;
        const tick = () => {
          if (ctx.state === "suspended") void ctx.resume();
          analyser.getByteFrequencyData(data);
          const avg = data.reduce((sum, value) => sum + value, 0) / data.length / 255;
          setLevel(avg);
          setSpeaking(avg > 0.06);
          raf = requestAnimationFrame(tick);
        };
        tick();
        return () => {
          cancelAnimationFrame(raf);
          void ctx.close();
        };
      } catch {
        return () => {};
      }
    };
    const stopLocal = listen(localStream, setLocalLevel, setLocalSpeaking);
    const stopRemote = listen(remoteStream, setRemoteLevel, setRemoteSpeaking);
    return () => {
      stopLocal?.();
      stopRemote?.();
    };
  }, [localStream, remoteStream]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleMute = () => {
    const next = !isMuted;
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !next;
    });
    setIsMuted(next);
    socketRef.current?.emit("media-state", { roomId, muted: next, cameraOff: isCameraOff });
  };

  const toggleCamera = () => {
    const next = !isCameraOff;
    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = !next;
    });
    setIsCameraOff(next);
    socketRef.current?.emit("media-state", { roomId, muted: isMuted, cameraOff: next });
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
    if (sharingRef.current) {
      await stopScreenShare();
      return;
    }
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
      displayTrack.onended = () => {
        void stopScreenShare();
      };
    } catch {
      /* user cancelled share */
    }
  };

  const sendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = chatMessage.trim();
    if (!text) return;
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
        body: JSON.stringify({
          senderName: userName,
          senderRole: role,
          messageText: text,
          consultationId: roomId,
        }),
      });
    } catch {
      /* socket already delivered */
    }
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

  const shellClass =
    variant === "overlay"
      ? `fixed inset-0 z-[90] ${bg} flex flex-col overflow-hidden select-none`
      : floating
        ? `relative h-full min-h-[14rem] rounded-3xl overflow-hidden border ${border} ${bg} flex flex-col shadow-2xl select-none`
        : `relative min-h-[580px] h-[min(85vh,860px)] w-full rounded-3xl overflow-hidden border ${border} ${bg} flex flex-col shadow-2xl select-none`;

  const VoiceBars = ({ level, active }: { level: number; active: boolean }) => (
    <span className="flex items-end gap-0.5 h-3.5">
      {[0.45, 1, 0.7, 1.15, 0.55].map((weight, index) => (
        <span
          key={index}
          className={`w-[2.5px] rounded-full ${active ? "bg-[#12B8B0]" : "bg-white/40"}`}
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
      {/* Hidden dedicated audio track for 100% reliable sound playback on all devices */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* ── Top Header (Google Meet Style) ─────────────────────────── */}
      <div className="absolute top-0 inset-x-0 z-30 p-3 sm:p-5 flex items-center justify-between pointer-events-none">
        {/* Left: Participant & Room Info */}
        <div className="flex items-center gap-2 pointer-events-auto bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-white shadow-lg">
          <span className={`w-2.5 h-2.5 rounded-full ${callStatus === "connected" ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold truncate max-w-[130px] sm:max-w-[200px]">{remoteName}</span>
            <BadgeCheck className="w-3.5 h-3.5 text-[#12B8B0]" />
          </div>
          <span className="text-[11px] text-white/70 font-mono font-medium pl-1 border-l border-white/20">
            {formatDuration(callDuration)}
          </span>
        </div>

        {/* Right: Quick actions (Speaker, Camera flip, Theme, Chat toggle, Minimize) */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Speaker toggle */}
          <button
            onClick={toggleSpeaker}
            className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${
              isSpeakerMuted ? "bg-rose-600/90 text-white" : "bg-black/40 hover:bg-black/60 text-white border border-white/10"
            }`}
            title={isSpeakerMuted ? "Unmute Speaker" : "Mute Speaker"}
          >
            {isSpeakerMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Flip camera (front / back) */}
          <button
            onClick={() => void toggleFlipCamera()}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-black/40 hover:bg-black/60 text-white border border-white/10 backdrop-blur-md transition-all"
            title="Switch Camera (Front/Back)"
          >
            <SwitchCamera className="w-4 h-4" />
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-black/40 hover:bg-black/60 text-white border border-white/10 backdrop-blur-md transition-all"
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {dark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Chat toggle */}
          <button
            onClick={() => {
              setChatOpen((v) => !v);
              setUnreadCount(0);
            }}
            className={`w-9 h-9 rounded-full flex items-center justify-center relative backdrop-blur-md transition-all ${
              chatOpen ? "bg-[#12B8B0] text-[#0B2D5C]" : "bg-black/40 hover:bg-black/60 text-white border border-white/10"
            }`}
            title="Toggle In-Call Chat"
          >
            <MessageSquare className="w-4 h-4" />
            {unreadCount > 0 && !chatOpen && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-[9px] font-black text-slate-950 flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {onMinimize && !floating && (
            <button
              onClick={onMinimize}
              className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white border border-white/10 backdrop-blur-md flex items-center justify-center"
              title="Minimize meeting"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          )}

          {floating && onExpand && (
            <button
              onClick={onExpand}
              className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white border border-white/10 backdrop-blur-md flex items-center justify-center"
              title="Expand meeting"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}

          {variant === "overlay" && (
            <button
              onClick={endCall}
              className="w-9 h-9 rounded-full bg-black/40 hover:bg-rose-600 text-white border border-white/10 backdrop-blur-md flex items-center justify-center"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Main Stage (Google Meet Layout) ────────────────────────── */}
      <div className="relative flex-1 w-full h-full min-h-0 overflow-hidden flex">
        {/* Remote Video Container (Fills entire screen) */}
        <div className="relative flex-1 w-full h-full min-h-0 bg-slate-950 overflow-hidden flex items-center justify-center">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
              remoteStream ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* Waiting / Connecting Placeholder */}
          {!remoteStream && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 p-6 text-center z-10">
              <div className="w-20 h-20 relative flex items-center justify-center">
                <span className="absolute inset-0 rounded-full border-2 border-[#12B8B0]/40 animate-ping" />
                <span className="absolute inset-2 rounded-full bg-[#12B8B0]/10 border border-[#12B8B0]/60 flex items-center justify-center">
                  <span className="w-5 h-5 rounded-full bg-[#12B8B0] animate-pulse" />
                </span>
              </div>
              <div className="space-y-1.5 max-w-sm">
                <p className="text-base font-bold text-white">
                  {mediaError || (role === "doctor" ? `Waiting for ${remoteName} to connect` : `Connecting to Dr. ${remoteName}…`)}
                </p>
                <p className="text-xs text-slate-400">
                  Stay in this room. Video and high-definition audio start automatically when both sides are present.
                </p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-slate-300">
                <Shield className="w-3.5 h-3.5 text-[#12B8B0]" />
                <span>Encrypted Direct Medical WebRTC</span>
              </div>
            </div>
          )}

          {/* Remote audio indicators & state overlay */}
          <div className="absolute bottom-28 left-4 z-20 flex items-center gap-2">
            {remoteSpeaking && !remoteMuted && (
              <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-white text-xs">
                <span>{remoteName}</span>
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

          {/* ── Floating Local PiP Video (Google Meet Style) ────────── */}
          <div className="absolute bottom-24 right-4 sm:bottom-28 sm:right-6 w-28 sm:w-40 aspect-[3/4] sm:aspect-video rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl bg-slate-900 z-20 group">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isCameraOff ? "opacity-0" : "opacity-100"}`}
            />
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
            <button
              onClick={(e) => {
                e.stopPropagation();
                void toggleFlipCamera();
              }}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-sm opacity-80 hover:opacity-100 transition-opacity"
              title="Flip camera"
            >
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

          {/* ── Bottom Controls Pill (Google Meet Floating Bar) ──────── */}
          <div className="absolute bottom-5 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5 sm:gap-3.5 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full bg-slate-900/90 backdrop-blur-2xl border border-white/15 shadow-2xl">
            {/* Mic Toggle */}
            <button
              onClick={toggleMute}
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all ${
                isMuted
                  ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30"
                  : voiceActive
                    ? "bg-[#12B8B0] text-[#0B2D5C] font-bold"
                    : "bg-white/10 hover:bg-white/20 text-white"
              }`}
              title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Camera Toggle */}
            <button
              onClick={toggleCamera}
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all ${
                isCameraOff
                  ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30"
                  : "bg-white/10 hover:bg-white/20 text-white"
              }`}
              title={isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
            >
              {isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>

            {/* Screen Share (Desktop/Tablet) */}
            <button
              onClick={() => void toggleScreenShare()}
              className={`hidden sm:flex w-11 h-11 sm:w-12 sm:h-12 rounded-full items-center justify-center transition-all ${
                screenSharing ? "bg-[#12B8B0] text-[#0B2D5C]" : "bg-white/10 hover:bg-white/20 text-white"
              }`}
              title={screenSharing ? "Stop Sharing" : "Share Screen"}
            >
              {screenSharing ? <MonitorOff className="w-5 h-5" /> : <MonitorUp className="w-5 h-5" />}
            </button>

            {/* Mobile Chat Button */}
            <button
              onClick={() => {
                setChatOpen((v) => !v);
                setUnreadCount(0);
              }}
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center relative transition-all ${
                chatOpen ? "bg-[#12B8B0] text-[#0B2D5C]" : "bg-white/10 hover:bg-white/20 text-white"
              }`}
              title="Open Chat"
            >
              <MessageSquare className="w-5 h-5" />
              {unreadCount > 0 && !chatOpen && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-[9px] font-black text-slate-950 flex items-center justify-center animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            <div className="w-px h-6 bg-white/20 mx-0.5" />

            {/* End Call Button */}
            <button
              onClick={endCall}
              className="px-4 sm:px-5 h-11 sm:h-12 rounded-full bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-600/40 transition-all"
              title="Leave Call"
            >
              <PhoneOff className="w-4 h-4" />
              <span className="hidden sm:inline">Leave</span>
            </button>
          </div>
        </div>

        {/* ── Chat: Slide-Up Bottom Sheet on Mobile / Sidebar on Desktop ── */}
        {chatOpen && (
          <div
            className={`
              fixed inset-x-0 bottom-0 z-50 rounded-t-3xl max-h-[80vh] h-[480px] bg-slate-900/95 backdrop-blur-2xl border-t border-slate-700 flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300
              md:relative md:inset-auto md:w-80 md:h-full md:max-h-none md:rounded-none md:border-t-0 md:border-l md:animate-none
            `}
          >
            {/* Mobile drag handle */}
            <div className="md:hidden w-12 h-1.5 bg-slate-600 rounded-full mx-auto mt-3" />

            {/* Chat header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#12B8B0]" />
                <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">In-call messages</h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-400/10 px-2.5 py-0.5 rounded-full">
                  {messages.length} msgs
                </span>
                <button
                  onClick={() => setChatOpen(false)}
                  className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
                  title="Close chat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No messages yet. Send a message to {remoteName}.
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={msg.id || i} className={`flex flex-col ${msg.sender === role ? "items-end" : "items-start"}`}>
                  <span className="text-[10px] text-slate-400 mb-1">
                    {msg.name} · {msg.time}
                  </span>
                  <div
                    className={`px-3.5 py-2.5 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                      msg.sender === role
                        ? "bg-[#12B8B0] text-[#0B2D5C] font-bold rounded-br-none"
                        : "bg-slate-800 text-slate-200 rounded-bl-none"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Chips */}
            <div className="px-4 py-2 border-t border-slate-800">
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {chips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setChatMessage(chip)}
                    className={`text-[10px] font-semibold ${chipBg} px-2.5 py-1 rounded-full flex-shrink-0 whitespace-nowrap`}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Form */}
            <form onSubmit={sendChat} className="p-3 sm:p-4 border-t border-slate-800 flex items-center gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Send a message…"
                className="flex-1 p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#12B8B0]"
              />
              <button
                type="submit"
                className="w-10 h-10 rounded-xl bg-[#12B8B0] hover:bg-[#1dd9d0] text-[#0B2D5C] flex items-center justify-center font-bold"
                title="Send"
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
