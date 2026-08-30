"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, Video } from "lucide-react";
import WebRTCVideoCall from "@/components/WebRTCVideoCall";
import { formatCountdown } from "@/lib/meetingTime";

export default function MeetJoinClient({ roomId }: { roomId: string }) {
  const [payload, setPayload] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch(`/api/meet/${encodeURIComponent(roomId)}`);
        const data = await res.json();
        if (!active) return;
        if (!data.success) {
          setError(data.error || "This meeting link is not valid.");
          setPayload(null);
        } else {
          setError("");
          setPayload(data);
        }
      } catch {
        if (active) setError("Could not open this meeting. Check your connection and try again.");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    const timer = setInterval(load, 15000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [roomId]);

  if (loading && !payload) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 animate-pulse">
          Opening your FitMed meeting…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 p-6 text-sm text-rose-800 dark:text-rose-300">
        {error}
      </div>
    );
  }

  const apt = payload?.appointment;
  if (payload?.status === "waiting") {
    return (
      <div className="rounded-3xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-8 text-center space-y-3">
        <Clock className="w-10 h-10 text-amber-600 dark:text-amber-400 mx-auto" />
        <h1 className="text-xl font-extrabold text-[#0B2D5C] dark:text-white">It is not yet time for this meeting</h1>
        <p className="text-sm text-amber-950 dark:text-amber-200">
          Your video visit with <strong>{apt?.doctorName}</strong> is scheduled for{" "}
          <strong>
            {apt?.scheduledDate} at {apt?.scheduledTime}
          </strong>{" "}
          (Africa/Kigali).
        </p>
        <p className="text-sm font-bold text-[#0B2D5C] dark:text-[#12B8B0]">
          Please wait {formatCountdown(payload.minutesUntilStart)}. This page will open the room automatically when the time arrives.
        </p>
      </div>
    );
  }

  if (payload?.status === "ended" || payload?.status === "completed") {
    return (
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1f35] p-8 text-center space-y-2">
        <h1 className="text-xl font-extrabold text-[#0B2D5C] dark:text-white">
          {payload?.status === "completed" ? "This meeting is completed" : "This meeting has ended"}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">Ask your doctor to reschedule if you still need a visit.</p>
      </div>
    );
  }

  if (payload?.canJoin && apt) {
    return (
      <div className="w-full h-full min-h-[100dvh] sm:min-h-[580px] flex-1 flex flex-col overflow-hidden">
        <WebRTCVideoCall
          roomId={apt.roomId || apt.appointmentId}
          userName={apt.applicantName}
          role="applicant"
          remoteName={apt.doctorName}
          purpose={apt.purpose}
          appointmentId={apt.appointmentId}
          variant="embedded"
        />
      </div>
    );
  }

  return null;
}

export function MeetHeader() {
  return (
    <header className="bg-[#0B2D5C] py-5">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
        <Link href="/" className="relative block" style={{ width: 140, height: 48 }}>
          <Image src="/logo-4.webp" alt="FitMed" fill className="object-contain object-left" />
        </Link>
        <p className="text-xs text-[#12B8B0] font-bold">Secure video consultation</p>
      </div>
    </header>
  );
}
