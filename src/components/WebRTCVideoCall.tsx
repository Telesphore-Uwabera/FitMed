"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import {
  BadgeCheck,
  MessageSquare,
  Mic,
  MicOff,
  MonitorOff,
  MonitorUp,
  PhoneOff,
  Send,
  Shield,
  Video,
  VideoOff,
  Wifi,
  X,
} from "lucide-react";

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
  variant?: "overlay" | "embedded";
  initialMessages?: CallChatMessage[];
  onCallEnd?: () => void;
  onRemoteJoined?: () => void;
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
}: WebRTCVideoCallProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [callStatus, setCallStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [chatOpen, setChatOpen] = useState(true);
  const [chatMessage, setChatMessage] = useState("");
  const [messages, setMessages] = useState<CallChatMessage[]>(initialMessages);
  const [callDuration, setCallDuration] = useState(0);
  const [mediaError, setMediaError] = useState("");
  const [remoteMuted, setRemoteMuted] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);
  const makingOfferRef = useRef(false);
  const sharingRef = useRef(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const durationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const ICE_SERVERS: RTCConfiguration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const attachLocalTracks = (pc: RTCPeerConnection, stream: MediaStream) => {
    const existing = new Set(pc.getSenders().map((s) => s.track?.id));
    stream.getTracks().forEach((track) => {
      if (!existing.has(track.id)) pc.addTrack(track, stream);
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
      const stream = event.streams[0] || new MediaStream([event.track]);
      setRemoteStream(stream);
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
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
        setRemoteStream(null);
      }
    };

    if (localStreamRef.current) attachLocalTracks(pc, localStreamRef.current);
    return pc;
  }, [roomId, onRemoteJoined]);

  const startCall = useCallback(async () => {
    if (makingOfferRef.current || role !== "doctor") return;
    if (peerConnectionRef.current?.localDescription) return;
    const stream = localStreamRef.current;
    if (!stream || !socketRef.current) return;

    makingOfferRef.current = true;
    try {
      const pc = createPeerConnection();
      attachLocalTracks(pc, stream);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketRef.current.emit("offer", { roomId, offer });
    } finally {
      makingOfferRef.current = false;
    }
  }, [createPeerConnection, role, roomId]);

  const handleOffer = useCallback(
    async (offer: RTCSessionDescriptionInit) => {
      const stream = localStreamRef.current;
      const pc = createPeerConnection();
      if (stream) attachLocalTracks(pc, stream);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      await flushIce();
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socketRef.current?.emit("answer", { roomId, answer });
    },
    [createPeerConnection, roomId]
  );

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
        setMediaError("Camera or microphone permission was denied. Allow access to join the live room.");
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
        if (role === "doctor" && !peerConnectionRef.current) void startCall();
      });

      socket.on("offer", async ({ offer }: { offer: RTCSessionDescriptionInit }) => {
        await handleOffer(offer);
      });

      socket.on("answer", async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
        const pc = peerConnectionRef.current;
        if (pc && !pc.currentRemoteDescription) {
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
        setCallStatus("disconnected");
        peerConnectionRef.current?.close();
        peerConnectionRef.current = null;
      });

      socket.on("chat-message", (msg: CallChatMessage) => {
        setMessages((prev) => [...prev, msg]);
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
    // Start the room once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, role, userName]);

  useEffect(() => {
    if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream;
  }, [remoteStream]);

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
      /* live socket already delivered */
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

  const shellClass =
    variant === "overlay"
      ? "fixed inset-0 z-[90] bg-slate-950 flex flex-col"
      : "relative min-h-[640px] h-[min(78vh,820px)] rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 flex flex-col shadow-2xl";

  return (
    <div className={shellClass}>
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-slate-900/90 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-emerald-300">
              {callStatus === "connected" ? "Live" : "Signaling"} · {formatDuration(callDuration)}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-[#12B8B0]" />
            <span className="text-[11px] text-slate-400 font-medium">Encrypted WebRTC</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono truncate">
            {appointmentId || roomId}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-300 font-semibold hidden md:block truncate max-w-[240px]">{purpose}</span>
          <button
            onClick={() => setChatOpen((v) => !v)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              chatOpen ? "bg-[#12B8B0]/20 text-[#12B8B0] border border-[#12B8B0]/40" : "bg-slate-800 text-slate-300"
            }`}
            title="Toggle chat"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
          {variant === "overlay" && (
            <button onClick={endCall} className="w-9 h-9 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center" title="Close">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 relative flex items-center justify-center p-3 sm:p-5 min-w-0">
          <div className="relative w-full max-w-5xl aspect-video rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={`absolute inset-0 w-full h-full object-cover ${remoteStream ? "opacity-100" : "opacity-0"}`}
            />
            {!remoteStream && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900">
                <div className="w-16 h-16 relative flex items-center justify-center">
                  <span className="absolute inset-0 rounded-full border border-amber-300/70 animate-ping" />
                  <span className="absolute inset-3 rounded-full bg-amber-100/10 border border-amber-300/60 flex items-center justify-center">
                    <span className="w-3 h-3 rounded-full bg-[#12B8B0] animate-pulse" />
                  </span>
                </div>
                <p className="text-sm font-semibold text-white">
                  {mediaError || (role === "doctor" ? `Waiting for ${remoteName} to join` : `Connecting to ${remoteName}…`)}
                </p>
                <p className="text-[11px] text-slate-400 max-w-sm text-center">
                  Stay in this room. Audio and video start automatically when both sides are present.
                </p>
              </div>
            )}

            <div className="absolute top-4 left-4 flex items-center gap-2 bg-slate-900/80 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-slate-700">
              <span className={`w-2 h-2 rounded-full ${remoteStream ? "bg-emerald-400" : "bg-amber-400"}`} />
              <span className="text-xs font-bold text-white">{remoteName}</span>
              <BadgeCheck className="w-3.5 h-3.5 text-[#12B8B0]" />
              {remoteMuted && <MicOff className="w-3.5 h-3.5 text-rose-400" />}
            </div>
            <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-slate-700">
              <Wifi className={`w-3 h-3 ${remoteStream ? "text-emerald-400" : "text-slate-500"}`} />
              <span className={`text-[10px] font-bold ${remoteStream ? "text-emerald-400" : "text-slate-400"}`}>
                {remoteStream ? "HD" : "WAIT"}
              </span>
            </div>

            <div className="absolute bottom-4 right-4 w-36 sm:w-44 aspect-video rounded-2xl overflow-hidden border-2 border-[#12B8B0] shadow-2xl bg-slate-900">
              <video ref={localVideoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${isCameraOff ? "opacity-0" : "opacity-100"}`} />
              {isCameraOff && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                  <VideoOff className="w-5 h-5 text-slate-500" />
                  <span className="text-[9px] text-slate-500">Camera off</span>
                </div>
              )}
              {isMuted && (
                <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-lg bg-rose-600/90 flex items-center justify-center">
                  <MicOff className="w-3 h-3 text-white" />
                </div>
              )}
              <div className="absolute bottom-1 left-2 text-[9px] bg-black/60 px-1.5 py-0.5 rounded text-white font-bold">You</div>
            </div>

            {screenSharing && (
              <div className="absolute top-16 left-4 px-3 py-1.5 rounded-xl bg-[#12B8B0] text-[#0B2D5C] text-[10px] font-extrabold">
                Sharing screen
              </div>
            )}
          </div>

          <div className="absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-5 py-3 rounded-3xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/60 shadow-2xl">
            <button
              onClick={toggleMute}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center ${isMuted ? "bg-rose-600 text-white" : "bg-slate-700 text-white"}`}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <button
              onClick={toggleCamera}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center ${isCameraOff ? "bg-rose-600 text-white" : "bg-slate-700 text-white"}`}
              title={isCameraOff ? "Camera on" : "Camera off"}
            >
              {isCameraOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
            </button>
            <button
              onClick={() => void toggleScreenShare()}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center ${screenSharing ? "bg-[#12B8B0] text-[#0B2D5C]" : "bg-slate-700 text-white"}`}
              title="Share screen"
            >
              {screenSharing ? <MonitorOff className="w-4 h-4" /> : <MonitorUp className="w-4 h-4" />}
            </button>
            <div className="w-px h-8 bg-slate-600" />
            <button
              onClick={endCall}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold flex items-center gap-1.5"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              Leave
            </button>
          </div>
        </div>

        {chatOpen && (
          <div className="w-[min(100%,20rem)] flex-shrink-0 bg-slate-900 border-l border-slate-800 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#12B8B0]" />
                <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">In-call chat</h4>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-400/10 px-2 py-0.5 rounded-full">
                {messages.length} messages
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => (
                <div key={msg.id || i} className={`flex flex-col ${msg.sender === role ? "items-end" : "items-start"}`}>
                  <span className="text-[10px] text-slate-500 mb-1">
                    {msg.name} · {msg.time}
                  </span>
                  <div
                    className={`px-3 py-2 rounded-2xl text-xs max-w-[88%] leading-relaxed ${
                      msg.sender === role
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
            <div className="px-4 py-2 border-t border-slate-800">
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {chips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setChatMessage(chip)}
                    className="text-[9px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-2 py-1 rounded-lg flex-shrink-0 whitespace-nowrap"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
            <form onSubmit={sendChat} className="p-4 border-t border-slate-800 flex items-center gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Message…"
                className="flex-1 p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#12B8B0]"
              />
              <button type="submit" className="w-9 h-9 rounded-xl bg-[#12B8B0] text-[#0B2D5C] flex items-center justify-center">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
