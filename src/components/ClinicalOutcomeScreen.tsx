"use client";

import { ClinicalDecision } from "@/lib/clinicalEngine";
import {
  CheckCircle2,
  Clock,
  FlaskConical,
  AlertTriangle,
  ChevronRight,
  Phone,
  MapPin,
  ArrowLeft,
  FileCheck2,
  ShieldCheck,
} from "lucide-react";

interface Props {
  decision: ClinicalDecision;
  purpose: string;
  onProceed: () => void;
  onBack: () => void;
}

const OUTCOME_CONFIG = {
  A: {
    bg: "from-emerald-50 to-teal-50",
    border: "border-emerald-300",
    headerBg: "bg-gradient-to-r from-emerald-600 to-teal-600",
    badgeBg: "bg-emerald-100 text-emerald-800 border-emerald-300",
    icon: CheckCircle2,
    label: "OUTCOME A — ELIGIBLE FOR ELECTRONIC CERTIFICATION",
    actionLabel: "Confirm & Proceed to Doctor Review",
    actionClass: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200",
    backLabel: "Edit Answers",
    bullet: "✓",
    indicatorClass: "bg-emerald-500",
  },
  B: {
    bg: "from-amber-50 to-orange-50",
    border: "border-amber-300",
    headerBg: "bg-gradient-to-r from-amber-500 to-orange-500",
    badgeBg: "bg-amber-100 text-amber-800 border-amber-300",
    icon: Clock,
    label: "OUTCOME B — PHYSICAL ASSESSMENT REQUIRED",
    actionLabel: "Submit & Book Physical Consultation",
    actionClass: "bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-200",
    backLabel: "Review Answers",
    bullet: "!",
    indicatorClass: "bg-amber-500",
  },
  C: {
    bg: "from-orange-50 to-amber-50",
    border: "border-orange-300",
    headerBg: "bg-gradient-to-r from-orange-600 to-red-500",
    badgeBg: "bg-orange-100 text-orange-800 border-orange-300",
    icon: FlaskConical,
    label: "OUTCOME C — INVESTIGATION / SPECIALIST REQUIRED",
    actionLabel: "Submit & View Referral Instructions",
    actionClass: "bg-orange-600 hover:bg-orange-700 text-white shadow-orange-200",
    backLabel: "Review Answers",
    bullet: "◎",
    indicatorClass: "bg-orange-500",
  },
  D: {
    bg: "from-rose-50 to-red-50",
    border: "border-rose-400",
    headerBg: "bg-gradient-to-r from-rose-600 to-red-700",
    badgeBg: "bg-rose-100 text-rose-900 border-rose-300",
    icon: AlertTriangle,
    label: "OUTCOME D — URGENT MEDICAL CARE REQUIRED",
    actionLabel: "Acknowledge & View Emergency Information",
    actionClass: "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200",
    backLabel: "Go Back",
    bullet: "▲",
    indicatorClass: "bg-rose-600 animate-pulse",
  },
};

const STATUS_LABEL: Record<ClinicalDecision["outcome"], string> = {
  A: "Submitted for physician review",
  B: "Physical consultation required before certification",
  C: "Certification pending investigation results",
  D: "Certificate not available — urgent care directed",
};

export default function ClinicalOutcomeScreen({ decision, purpose, onProceed, onBack }: Props) {
  const cfg = OUTCOME_CONFIG[decision.outcome];
  const Icon = cfg.icon;

  return (
    <div className={`rounded-3xl border-2 ${cfg.border} bg-gradient-to-br ${cfg.bg} overflow-hidden shadow-xl`}>
      {/* ── Header Banner ── */}
      <div className={`${cfg.headerBg} px-6 py-5 text-white`}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center flex-shrink-0 shadow-inner">
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-extrabold uppercase tracking-widest opacity-75 mb-1">
              {cfg.label}
            </div>
            <h2 className="text-xl font-extrabold leading-tight">{decision.title}</h2>
          </div>
          <div className={`w-3 h-3 rounded-full ${cfg.indicatorClass} flex-shrink-0 mt-1`} />
        </div>
      </div>

      {/* ── Body ── */}
      <div className="p-6 space-y-5">
        {/* Message */}
        <div className="p-4 rounded-2xl bg-white/70 border border-white shadow-sm">
          <p className="text-sm text-slate-700 font-medium leading-relaxed">{decision.message}</p>
        </div>

        {/* Findings / Reasons */}
        <div className="space-y-2">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            {decision.outcome === "A" ? (
              <><ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Assessment Summary</>
            ) : (
              <><AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Clinical Findings Identified</>
            )}
          </div>
          <div className="space-y-1.5">
            {decision.reasons.map((reason, i) => (
              <div
                key={i}
                className={`flex items-start gap-2.5 text-xs font-semibold px-3 py-2.5 rounded-xl border ${cfg.badgeBg}`}
              >
                <span className="flex-shrink-0 font-black">{cfg.bullet}</span>
                <span>{reason}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Request Summary */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm text-xs space-y-2">
          <div className="font-extrabold text-[#0B2D5C] flex items-center gap-1.5">
            <FileCheck2 className="w-3.5 h-3.5 text-[#12B8B0]" />
            Certificate Request Summary
          </div>
          <div className="grid grid-cols-2 gap-y-1.5 text-slate-600">
            <span className="font-bold text-slate-400">Purpose:</span>
            <span className="font-semibold text-slate-800">{purpose}</span>
            <span className="font-bold text-slate-400">Assessment:</span>
            <span className="font-semibold text-slate-800">Completed</span>
            <span className="font-bold text-slate-400">Outcome:</span>
            <span className="font-semibold text-slate-800">
              Outcome {decision.outcome} — {STATUS_LABEL[decision.outcome]}
            </span>
          </div>
        </div>

        {/* Urgent Care Emergency Contacts — only for D */}
        {decision.outcome === "D" && (
          <div className="p-4 rounded-2xl bg-rose-100 border border-rose-300 space-y-2">
            <div className="flex items-center gap-2 text-xs font-extrabold text-rose-900">
              <Phone className="w-3.5 h-3.5" />
              Emergency Contacts — Rwanda
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              {[
                { label: "Emergency", number: "912" },
                { label: "Rwanda Police", number: "113" },
                { label: "MINISANTE", number: "+250 788 300 900" },
              ].map((c) => (
                <div key={c.label} className="bg-white rounded-xl p-2.5 border border-rose-200 text-center">
                  <div className="text-[10px] font-bold text-rose-500 uppercase">{c.label}</div>
                  <div className="text-lg font-extrabold text-rose-800 font-mono">{c.number}</div>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-2 text-[11px] text-rose-800">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-rose-500" />
              <span>
                Nearest emergency facilities: King Faisal Hospital (+250 788 303 602), CHUK (+250 788 307 800),
                Kigali University Teaching Hospital.
              </span>
            </div>
          </div>
        )}

        {/* Physical Consult info — B */}
        {decision.outcome === "B" && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
            <div className="font-extrabold flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> FitMed Physical Consultation
            </div>
            <p>
              A physical medical assessment is required before an electronic certificate can be issued.
              Your request will be flagged and a FitMed-affiliated physician will contact you to schedule
              an in-person or guided virtual assessment.
            </p>
          </div>
        )}

        {/* Investigation pending — C */}
        {decision.outcome === "C" && (
          <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 text-xs text-orange-900 space-y-1">
            <div className="font-extrabold flex items-center gap-1.5">
              <FlaskConical className="w-3.5 h-3.5" /> Investigation / Specialist Referral
            </div>
            <p>
              Your certification is pending until the required medical results or specialist assessment
              are available and reviewed by a FitMed physician. Upload your results when available
              through your applicant dashboard.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {cfg.backLabel}
          </button>

          <button
            onClick={onProceed}
            className={`flex-1 py-3 px-5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-lg ${cfg.actionClass}`}
          >
            <Icon className="w-4 h-4" />
            {cfg.actionLabel}
            <ChevronRight className="w-4 h-4 ml-1 opacity-70" />
          </button>
        </div>

        <p className="text-center text-[10px] text-slate-400 font-medium">
          AI screens · Clinical rules guide · Doctors decide — FitMed Clinical Framework v1.0
        </p>
      </div>
    </div>
  );
}
