"use client";

/**
 * CertificateActionPanel
 * ──────────────────────
 * Primary status-action buttons for a certificate, shown on queue cards
 * and inside the selectedApplication detail modal.
 *
 * Actions exposed:
 *   ✅ Approve          → status: approved,                  decision: FIT | FIT_RESTRICTED
 *   ❌ Reject           → status: rejected,                  decision: NOT_FIT  (requires written reason)
 *   📹 Schedule Video   → opens inline mini-form, POSTs /api/appointments, also PATCHes status: video-scheduled
 *   🏥 Physical Check-up → status: physical-checkup,         decision: FURTHER_ASSESSMENT
 *   🔍 Specialist Ref.  → status: under-review,             decision: FURTHER_ASSESSMENT
 *
 * All actions that change the certificate call `onStatusChanged()` so the
 * parent can refresh its local state.
 */

import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Video,
  Stethoscope,
  SearchIcon,
  ChevronDown,
  Loader2,
} from "lucide-react";
import BrandDatePicker from "@/components/BrandDatePicker";
import BrandTimePicker from "@/components/BrandTimePicker";
import BrandSelect from "@/components/BrandSelect";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CertificateActionPanelProps {
  certificateId: string;
  candidateName: string;
  applicantEmail: string;
  applicantPhone?: string;
  purpose?: string;
  currentStatus?: string;
  currentDecision?: string;
  /** Doctor context — required for scheduling */
  doctorId?: string;
  doctorEmail?: string;
  doctorName?: string;
  doctorSpecialty?: string;
  /** Called after any successful status change so parent can refresh */
  onStatusChanged: (newStatus: string, newDecision?: string) => void;
  /** Called after a video appointment is created */
  onAppointmentCreated?: (appointment: any) => void;
  /** Extra class on the outer wrapper */
  className?: string;
  /** If true, render as compact icon-only bar suitable for the modal footer */
  compact?: boolean;
}

// ── Status colour helpers ─────────────────────────────────────────────────────

function statusPill(status: string) {
  const s = status.toLowerCase();
  if (s === "approved" || s === "valid" || s === "issued")
    return "bg-emerald-100 text-emerald-800 border-emerald-300";
  if (s === "rejected") return "bg-rose-100 text-rose-800 border-rose-300";
  if (s === "under-review") return "bg-amber-100 text-amber-800 border-amber-300";
  if (s === "video-scheduled" || s === "video appointment requested")
    return "bg-sky-100 text-sky-800 border-sky-300";
  if (s === "physical-checkup" || s === "physical check up requested")
    return "bg-orange-100 text-orange-800 border-orange-300";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CertificateActionPanel({
  certificateId,
  candidateName,
  applicantEmail,
  applicantPhone = "",
  purpose = "",
  currentStatus = "submitted",
  currentDecision = "",
  doctorId = "",
  doctorEmail = "",
  doctorName = "",
  doctorSpecialty = "",
  onStatusChanged,
  onAppointmentCreated,
  className = "",
  compact = false,
}: CertificateActionPanelProps) {
  // ── Local UI state ────────────────────────────────────────────────────────
  const [busy, setBusy] = useState<string | null>(null); // which action is in flight
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [videoDate, setVideoDate] = useState(new Date().toISOString().split("T")[0]);
  const [videoTime, setVideoTime] = useState("14:30");
  const [videoDuration, setVideoDuration] = useState(15);
  const [videoNotes, setVideoNotes] = useState("");
  const [showApproveOptions, setShowApproveOptions] = useState(false);
  const [approveRestrictions, setApproveRestrictions] = useState("");
  const [approveDecision, setApproveDecision] = useState<"FIT" | "FIT_RESTRICTED">("FIT");

  // ── Helper: PATCH certificate ─────────────────────────────────────────────
  async function patchCert(body: Record<string, unknown>) {
    const res = await fetch("/api/certificates", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ certificateId, ...body }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Update failed");
    }
    return res.json();
  }

  // ── Action: Approve ───────────────────────────────────────────────────────
  async function handleApprove() {
    setBusy("approve");
    try {
      await patchCert({
        status: "approved",
        decision: approveDecision,
        restrictions: approveRestrictions,
        decisionNotes: approveDecision === "FIT_RESTRICTED"
          ? `Approved with restrictions: ${approveRestrictions}`
          : "Medical fitness requirements met.",
      });
      setShowApproveOptions(false);
      onStatusChanged("approved", approveDecision);
    } finally {
      setBusy(null);
    }
  }

  // ── Action: Reject ────────────────────────────────────────────────────────
  async function handleReject() {
    if (!rejectReason.trim()) return;
    setBusy("reject");
    try {
      await patchCert({
        status: "rejected",
        decision: "NOT_FIT",
        decisionNotes: rejectReason,
      });
      setShowRejectForm(false);
      setRejectReason("");
      onStatusChanged("rejected", "NOT_FIT");
    } finally {
      setBusy(null);
    }
  }

  // ── Action: Schedule Video Consultation ───────────────────────────────────
  async function handleScheduleVideo(e: React.FormEvent) {
    e.preventDefault();
    setBusy("video");
    try {
      // 1. Create the appointment
      const aptRes = await fetch("/api/appointments", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicantName: candidateName,
          applicantEmail,
          applicantPhone,
          purpose,
          scheduledDate: videoDate,
          scheduledTime: videoTime,
          durationMinutes: videoDuration,
          notes: videoNotes,
          certificateDraftId: certificateId,
          doctorId,
          doctorEmail,
          doctorName,
          doctorSpecialty,
        }),
      });
      const aptData = await aptRes.json();
      if (!aptData.success) throw new Error(aptData.error || "Failed to schedule appointment");

      // 2. Update certificate status to show applicant a video is scheduled
      await patchCert({
        status: "video appointment requested",
        decisionNotes: `Video consultation scheduled for ${videoDate} at ${videoTime}. ${videoNotes}`.trim(),
      });

      if (onAppointmentCreated) onAppointmentCreated(aptData.appointment);
      setShowVideoForm(false);
      setVideoNotes("");
      onStatusChanged("video appointment requested");
    } finally {
      setBusy(null);
    }
  }

  // ── Action: Physical Check-up ────────────────────────────────────────────
  async function handlePhysicalCheckup() {
    setBusy("physical");
    try {
      await patchCert({
        status: "physical check up requested",
        decision: "PHYSICAL_CONSULTATION",
        decisionNotes:
          "An in-person physical examination is required at an accredited partner clinic before the certificate can be issued.",
      });
      onStatusChanged("physical check up requested", "PHYSICAL_CONSULTATION");
    } finally {
      setBusy(null);
    }
  }

  // ── Action: Specialist / Further Investigation ────────────────────────────
  async function handleSpecialist() {
    setBusy("specialist");
    try {
      await patchCert({
        status: "under-review",
        decision: "INVESTIGATION_SPECIALIST",
        decisionNotes:
          "Further specialist assessment or diagnostic laboratory investigation is required. Your application remains under clinical review.",
      });
      onStatusChanged("under-review", "INVESTIGATION_SPECIALIST");
    } finally {
      setBusy(null);
    }
  }

  // ── Status is already terminal — show read-only badge ────────────────────
  const isTerminal =
    ["approved", "valid", "issued", "rejected"].includes(currentStatus.toLowerCase()) &&
    currentStatus.toLowerCase() !== "submitted";

  // ── Render ─────────────────────────────────────────────────────────────────

  // Compact mode: just icon buttons with tooltips (for modal footer strip)
  if (compact && isTerminal) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold uppercase border ${statusPill(currentStatus)} ${className}`}
      >
        {currentStatus}
      </span>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* ── Current status badge ──────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Current status:</span>
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${statusPill(currentStatus)}`}>
          {currentStatus}
        </span>
        {currentDecision && currentDecision !== "PENDING" && (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border bg-slate-100 text-slate-700 border-slate-200">
            {currentDecision.replace(/_/g, " ")}
          </span>
        )}
      </div>

      {/* ── Primary action buttons ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">

        {/* Approve */}
        <div className="relative">
          <button
            type="button"
            disabled={!!busy || isTerminal}
            onClick={() => {
              setShowRejectForm(false);
              setShowVideoForm(false);
              setShowApproveOptions((o) => !o);
            }}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-[11px] transition-colors shadow-sm"
          >
            {busy === "approve" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            <span>Approve</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showApproveOptions ? "rotate-180" : ""}`} />
          </button>

          {showApproveOptions && (
            <div className="absolute top-full left-0 right-0 mt-1.5 z-30 bg-white rounded-2xl border border-slate-200 shadow-xl p-3 space-y-2 text-xs min-w-[220px]">
              <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Approval type</p>
              {(["FIT", "FIT_RESTRICTED"] as const).map((opt) => (
                <label key={opt} className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-colors ${approveDecision === opt ? "border-emerald-400 bg-emerald-50" : "border-slate-200 hover:bg-slate-50"}`}>
                  <input
                    type="radio"
                    name={`approve-${certificateId}`}
                    checked={approveDecision === opt}
                    onChange={() => setApproveDecision(opt)}
                    className="w-3.5 h-3.5 accent-emerald-600"
                  />
                  <span className="font-bold text-slate-700">
                    {opt === "FIT" ? "FIT — all criteria met" : "FIT with restrictions"}
                  </span>
                </label>
              ))}
              {approveDecision === "FIT_RESTRICTED" && (
                <textarea
                  value={approveRestrictions}
                  onChange={(e) => setApproveRestrictions(e.target.value)}
                  placeholder="State restrictions clearly, e.g. no heavy lifting, no driving…"
                  rows={2}
                  className="w-full p-2 rounded-xl border border-slate-200 text-xs resize-none focus:outline-none focus:border-emerald-400"
                  required
                />
              )}
              <button
                type="button"
                disabled={busy === "approve" || (approveDecision === "FIT_RESTRICTED" && !approveRestrictions.trim())}
                onClick={handleApprove}
                className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-extrabold text-[11px] flex items-center justify-center gap-1.5"
              >
                {busy === "approve" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Confirm Approval
              </button>
            </div>
          )}
        </div>

        {/* Reject */}
        <button
          type="button"
          disabled={!!busy || isTerminal}
          onClick={() => {
            setShowApproveOptions(false);
            setShowVideoForm(false);
            setShowRejectForm((o) => !o);
          }}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-[11px] transition-colors shadow-sm"
        >
          {busy === "reject" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
          <span>Reject</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${showRejectForm ? "rotate-180" : ""}`} />
        </button>

        {/* Schedule Video */}
        <button
          type="button"
          disabled={!!busy}
          onClick={() => {
            setShowApproveOptions(false);
            setShowRejectForm(false);
            setShowVideoForm((o) => !o);
          }}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-[11px] transition-colors shadow-sm"
        >
          {busy === "video" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Video className="w-3.5 h-3.5" />}
          <span>Schedule Video</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${showVideoForm ? "rotate-180" : ""}`} />
        </button>

        {/* Physical Check-up */}
        <button
          type="button"
          disabled={!!busy}
          onClick={handlePhysicalCheckup}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-[11px] transition-colors shadow-sm"
          title="Request in-person physical examination"
        >
          {busy === "physical" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Stethoscope className="w-3.5 h-3.5" />}
          <span>Physical Check-up</span>
        </button>
      </div>

      {/* Specialist referral — secondary, smaller */}
      {!isTerminal && (
        <button
          type="button"
          disabled={!!busy}
          onClick={handleSpecialist}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 text-slate-600 font-bold text-[11px] transition-colors"
        >
          {busy === "specialist" ? <Loader2 className="w-3 h-3 animate-spin" /> : <SearchIcon className="w-3 h-3 text-amber-500" />}
          Refer for specialist / further investigation
        </button>
      )}

      {/* ── Reject expand panel ─────────────────────────────────────────────── */}
      {showRejectForm && (
        <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 space-y-2 text-xs">
          <p className="font-extrabold text-rose-800 flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5" />
            Rejection reason <span className="text-rose-500">*</span>
          </p>
          <p className="text-rose-700 text-[11px]">
            This reason will be emailed to the applicant and saved on their certificate record.
          </p>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="State clearly why the certificate cannot be issued…"
            rows={3}
            className="w-full p-2.5 rounded-xl border border-rose-300 resize-none focus:outline-none focus:border-rose-500 bg-white text-slate-800"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!rejectReason.trim() || busy === "reject"}
              onClick={handleReject}
              className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-extrabold text-[11px] flex items-center justify-center gap-1.5"
            >
              {busy === "reject" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
              Confirm Rejection
            </button>
            <button
              type="button"
              onClick={() => { setShowRejectForm(false); setRejectReason(""); }}
              className="px-4 py-2 rounded-xl border border-rose-200 text-rose-700 font-bold text-[11px] hover:bg-rose-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Schedule video expand panel ──────────────────────────────────────── */}
      {showVideoForm && (
        <form onSubmit={handleScheduleVideo} className="p-3 rounded-2xl bg-sky-50 border border-sky-200 space-y-3 text-xs">
          <p className="font-extrabold text-sky-800 flex items-center gap-1.5">
            <Video className="w-3.5 h-3.5" />
            Schedule video consultation for <strong>{candidateName}</strong>
          </p>
          <p className="text-sky-700 text-[11px]">
            The applicant will receive an email with the meeting link, a 30-minute reminder, and a start notice.
          </p>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-extrabold uppercase text-slate-600 mb-1">Date</label>
              <BrandDatePicker preset="future" value={videoDate} onChange={setVideoDate} />
            </div>
            <div>
              <label className="block text-[10px] font-extrabold uppercase text-slate-600 mb-1">Time (GMT+2)</label>
              <BrandTimePicker value={videoTime} onChange={setVideoTime} />
            </div>
            <div>
              <label className="block text-[10px] font-extrabold uppercase text-slate-600 mb-1">Duration</label>
              <BrandSelect
                size="compact"
                value={String(videoDuration)}
                onChange={(v) => setVideoDuration(parseInt(v, 10))}
                options={[
                  { value: "15", label: "15 min" },
                  { value: "20", label: "20 min" },
                  { value: "30", label: "30 min" },
                  { value: "45", label: "45 min" },
                ]}
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-extrabold uppercase text-slate-600 mb-1">
              Clinical notes / preparation instructions (optional)
            </label>
            <textarea
              value={videoNotes}
              onChange={(e) => setVideoNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Bring your ID, have your medications list ready…"
              className="w-full p-2.5 rounded-xl border border-sky-200 resize-none focus:outline-none focus:border-sky-400 bg-white text-slate-800"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy === "video"}
              className="flex-1 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white font-extrabold text-[11px] flex items-center justify-center gap-1.5"
            >
              {busy === "video" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Video className="w-3.5 h-3.5" />}
              Confirm &amp; Dispatch Invitation
            </button>
            <button
              type="button"
              onClick={() => setShowVideoForm(false)}
              className="px-4 py-2 rounded-xl border border-sky-200 text-sky-700 font-bold text-[11px] hover:bg-sky-100"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
