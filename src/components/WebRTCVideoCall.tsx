"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

interface WebRTCVideoCallProps {
  roomId: string;
  userName: string;
  onCallEnd?: () => void;
}

export default function WebRTCVideoCall({ roomId, userName, onCallEnd }: WebRTCVideoCallProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callStatus, setCallStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  const ICE_SERVERS = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  };

  useEffect(() => {
    const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000", {
      transports: ["websocket", "polling"],
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on("connect", () => {
      console.log("Connected to socket server");
      socket.emit("join-room", roomId);
    });

    socket.on("room-full", () => {
      alert("Room is full. Please try a different room.");
      onCallEnd?.();
    });

    socket.on("user-connected", async (userId: string) => {
      console.log("User connected:", userId);
      await startCall(userId);
    });

    socket.on("offer", async ({ offer, callerId }: { offer: RTCSessionDescriptionInit; callerId: string }) => {
      console.log("Received offer from:", callerId);
      await handleOffer(offer, callerId);
    });

    socket.on("answer", async ({ answer, calleeId }: { answer: RTCSessionDescriptionInit; calleeId: string }) => {
      console.log("Received answer from:", calleeId);
      await handleAnswer(answer);
    });

    socket.on("ice-candidate", async ({ candidate, senderId }: { candidate: RTCIceCandidateInit; senderId: string }) => {
      console.log("Received ICE candidate from:", senderId);
      await handleIceCandidate(candidate);
    });

    socket.on("user-disconnected", () => {
      console.log("User disconnected");
      setRemoteStream(null);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
      setCallStatus("disconnected");
    });

    socket.on("call-ready", () => {
      console.log("Call is ready to start");
    });

    return () => {
      socket.off("connect");
      socket.off("room-full");
      socket.off("user-connected");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("user-disconnected");
      socket.off("call-ready");
    };
  }, [socket, roomId, onCallEnd]);

  const startCall = async (remoteUserId: string) => {
    if (!socket) return;

    const peerConnection = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = peerConnection;

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          roomId,
          candidate: event.candidate,
        });
      }
    };

    peerConnection.ontrack = (event) => {
      console.log("Received remote track");
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
      setCallStatus("connected");
    };

    if (localStream) {
      localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
      });
    }

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    socket.emit("offer", {
      roomId,
      offer,
    });
  };

  const handleOffer = async (offer: RTCSessionDescriptionInit, callerId: string) => {
    const peerConnection = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = peerConnection;

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit("ice-candidate", {
          roomId,
          candidate: event.candidate,
        });
      }
    };

    peerConnection.ontrack = (event) => {
      console.log("Received remote track");
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
      setCallStatus("connected");
    };

    if (localStream) {
      localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
      });
    }

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    if (socket) {
      socket.emit("answer", {
        roomId,
        answer,
      });
    }
  };

  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    if (peerConnectionRef.current) {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    }
  };

  const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
    if (peerConnectionRef.current) {
      await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    }
  };

  const startLocalVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing media devices:", error);
      alert("Could not access camera and microphone. Please check permissions.");
    }
  };

  useEffect(() => {
    startLocalVideo();
    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, []);

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsCameraOff(!isCameraOff);
    }
  };

  const endCall = () => {
    if (socket) {
      socket.emit("leave-room", roomId);
    }
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    onCallEnd?.();
  };

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col">
      {/* Video Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        {/* Local Video */}
        <div className="relative bg-slate-900 rounded-2xl overflow-hidden">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg text-white text-xs font-semibold">
            {userName} (You)
          </div>
          {isMuted && (
            <div className="absolute top-4 right-4 bg-red-600 px-2 py-1 rounded text-white text-xs font-bold">
              Muted
            </div>
          )}
          {isCameraOff && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
              <div className="text-slate-400 text-sm">Camera Off</div>
            </div>
          )}
        </div>

        {/* Remote Video */}
        <div className="relative bg-slate-900 rounded-2xl overflow-hidden">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {!remoteStream && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
              <div className="text-center">
                <div className="text-slate-400 text-sm mb-2">
                  {callStatus === "connecting" ? "Connecting..." : "Waiting for remote user..."}
                </div>
                <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full mx-auto" />
              </div>
            </div>
          )}
          {remoteStream && (
            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg text-white text-xs font-semibold">
              Remote User
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-slate-900 border-t border-slate-800 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-4">
          <button
            onClick={toggleMute}
            className={`p-4 rounded-full transition-all ${
              isMuted
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-slate-700 text-white hover:bg-slate-600"
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMuted ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              )}
            </svg>
          </button>

          <button
            onClick={toggleCamera}
            className={`p-4 rounded-full transition-all ${
              isCameraOff
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-slate-700 text-white hover:bg-slate-600"
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isCameraOff ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              )}
            </svg>
          </button>

          <button
            onClick={endCall}
            className="p-4 rounded-full bg-red-600 text-white hover:bg-red-700 transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
