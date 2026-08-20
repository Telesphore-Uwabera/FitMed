"use client";

import { useState, useEffect } from "react";
import {
  AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, FileSignature,
  ShieldAlert, Stethoscope, Activity, ClipboardList, Eye, Ear,
  Brain, Bone, Leaf, Wind, Heart, Thermometer, Ruler, Scale,
  User, Building, Calendar, Phone, FlaskConical, X, Check,
  AlertCircle, Lock, ShieldCheck,
} from "lucide-react";
import BrandSelect from "@/components/BrandSelect";
import BrandDatePicker from "@/components/BrandDatePicker";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type DoctorDecision =
  | "FIT"
  | "FIT_RESTRICTED"
  | "PHYSICAL_CONSULTATION"
  | "INVESTIGATION_SPECIALIST"
  | "REJECTED"
  | "URGENT_REFERRAL";

interface DoctorAssessmentFormProps {
  candidate: {
    id: string;
    name: string;
    age?: number;
    purpose: string;
    vitals?: { bp: string; hr: string; bmi: string; spo2: string };
    history?: string;
    flags?: string;
  };
  doctorName: string;
  doctorLicense: string;
  onDecision: (data: { decision: DoctorDecision; notes: string; restrictions: string }) => void;
  onClose: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Section Wrapper
// ─────────────────────────────────────────────────────────────────────────────

function Section({
  title, icon: Icon, children, danger = false, locked = false,
}: {
  title: string; icon: React.ElementType; children: React.ReactNode;
  danger?: boolean; locked?: boolean;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className={`rounded-2xl border overflow-hidden ${danger ? "border-rose-200 bg-rose-50/30" : "border-slate-200 bg-white"}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between px-5 py-3.5 text-left transition-colors ${
          danger ? "bg-rose-50 hover:bg-rose-100" : "bg-slate-50 hover:bg-slate-100"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Icon className={`w-4 h-4 ${danger ? "text-rose-600" : "text-[#12B8B0]"}`} />
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#0B2D5C]">{title}</span>
          {locked && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-rose-100 text-rose-700 border border-rose-200 rounded text-[10px] font-bold">
              <Lock className="w-2.5 h-2.5" /> LOCKED
            </span>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {open && <div className="px-5 py-4 space-y-3">{children}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Yes/No Row (doctor version)
// ─────────────────────────────────────────────────────────────────────────────

function DoctorYesNo({
  label, value, onChange,
}: {
  label: string; value: boolean | undefined; onChange: (v: boolean) => void;
}) {
  return (
    <div className="py-2.5 flex items-center justify-between gap-4 border-b border-slate-100 last:border-0">
      <span className={`text-xs font-semibold leading-snug flex-1 ${value === true ? "text-rose-800 font-bold" : "text-slate-700"}`}>
        {value === true && <AlertTriangle className="w-3 h-3 text-rose-500 inline mr-1" />}
        {label}
      </span>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${value === true ? "bg-rose-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${value === false ? "bg-[#12B8B0] text-[#0B2D5C] font-black" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
        >
          No
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Vitals Row
// ─────────────────────────────────────────────────────────────────────────────

function VitalRow({
  label, unit, value, onChange, repeat, onRepeatChange, comment, onCommentChange,
}: {
  label: string; unit: string; value: string; onChange: (v: string) => void;
  repeat: string; onRepeatChange: (v: string) => void;
  comment: string; onCommentChange: (v: string) => void;
}) {
  return (
    <tr className="border-b border-slate-100">
      <td className="py-2 pr-3 text-xs font-bold text-slate-700 whitespace-nowrap">{label} <span className="font-normal text-slate-400">({unit})</span></td>
      <td className="py-2 pr-2">
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="—"
          className="w-full p-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#12B8B0] font-semibold" />
      </td>
      <td className="py-2 pr-2">
        <input value={repeat} onChange={(e) => onRepeatChange(e.target.value)} placeholder="—"
          className="w-full p-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#12B8B0] font-semibold" />
      </td>
      <td className="py-2">
        <input value={comment} onChange={(e) => onCommentChange(e.target.value)} placeholder="Doctor comment"
          className="w-full p-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#12B8B0]" />
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Exam Finding Row
// ─────────────────────────────────────────────────────────────────────────────

function ExamFinding({
  system, options, value, onChange,
}: {
  system: string; options: string[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="py-2 border-b border-slate-100 last:border-0">
      <div className="text-[11px] font-bold text-slate-600 mb-1.5">{system}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
              value === opt
                ? "bg-[#0B2D5C] text-white border-[#0B2D5C]"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default function DoctorAssessmentForm({
  candidate, doctorName, doctorLicense, onDecision, onClose,
}: DoctorAssessmentFormProps) {
  // ── Section 1: Patient Info ────────────────────────────────────────────
  const [patientDob, setPatientDob] = useState("");
  const [patientSex, setPatientSex] = useState("Male");
  const [employer, setEmployer] = useState("");
  const [consultDate, setConsultDate] = useState("");
  useEffect(() => {
    setConsultDate(
      new Date().toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })
    );
  }, []);

  // ── Section 2: Red-Flag Screening ─────────────────────────────────────
  const [drRedFlags, setDrRedFlags] = useState<Record<string, boolean>>({});
  const redFlagItems = [
    { key: "rf_chest", label: "Chest pain or pressure" },
    { key: "rf_sob", label: "Severe shortness of breath" },
    { key: "rf_palpitations", label: "Severe palpitations" },
    { key: "rf_syncope", label: "Fainting or near-fainting" },
    { key: "rf_weakness", label: "New weakness or numbness" },
    { key: "rf_speech", label: "Speech difficulty" },
    { key: "rf_vision", label: "Sudden vision change" },
    { key: "rf_seizure", label: "Seizure" },
    { key: "rf_confusion", label: "New confusion" },
    { key: "rf_headache", label: "Severe / sudden headache" },
    { key: "rf_coughblood", label: "Coughing blood" },
    { key: "rf_abdopain", label: "Severe abdominal pain" },
    { key: "rf_bleeding", label: "Significant bleeding" },
    { key: "rf_anaphylaxis", label: "Severe allergic reaction" },
    { key: "rf_trauma", label: "Severe trauma / injury" },
    { key: "rf_other", label: "Other serious / emergency symptom" },
  ];
  const positiveRedFlags = Object.entries(drRedFlags).filter(([, v]) => v === true);
  const certLocked = positiveRedFlags.length > 0;

  // ── Section 3: Medical History ─────────────────────────────────────────
  const [medHistory, setMedHistory] = useState<Record<string, boolean>>({});
  const [medications, setMedications] = useState("");
  const [allergies, setAllergies] = useState("");
  const [smoking, setSmoking] = useState("Non-smoker");
  const [alcohol, setAlcohol] = useState("None / social");
  const medHistoryItems = [
    { key: "htn", label: "Hypertension" },
    { key: "dm", label: "Diabetes mellitus" },
    { key: "heart", label: "Heart disease / IHD" },
    { key: "arrhythmia", label: "Arrhythmia" },
    { key: "asthma", label: "Asthma" },
    { key: "copd", label: "COPD" },
    { key: "epilepsy", label: "Epilepsy / seizure disorder" },
    { key: "stroke", label: "Stroke / TIA" },
    { key: "kidney", label: "Kidney disease" },
    { key: "liver", label: "Liver disease" },
    { key: "psychiatric", label: "Psychiatric condition" },
    { key: "msk", label: "Musculoskeletal disorder" },
    { key: "surgery", label: "Previous surgery (significant)" },
    { key: "hospitalization", label: "Previous hospitalization (recent)" },
    { key: "none", label: "No known conditions" },
  ];

  // ── Section 4: Occupational Assessment ─────────────────────────────────
  const [jobRequirements, setJobRequirements] = useState<Record<string, boolean>>({});
  const [canPerform, setCanPerform] = useState<"yes" | "no" | "limited" | "">("");
  const [funcLimitations, setFuncLimitations] = useState("");
  const jobReqItems = [
    { key: "heavy_physical", label: "Heavy physical activity" },
    { key: "lifting", label: "Lifting / manual handling" },
    { key: "standing", label: "Prolonged standing" },
    { key: "walking", label: "Walking" },
    { key: "driving", label: "Driving" },
    { key: "machinery", label: "Machinery operation" },
    { key: "heights", label: "Working at heights" },
    { key: "hazardous", label: "Hazardous environment" },
    { key: "concentration", label: "High concentration / alertness" },
  ];

  // ── Section 5: Vitals Table ─────────────────────────────────────────────
  const emptyVital = { value: "", repeat: "", comment: "" };
  const [doctorVitals, setDoctorVitals] = useState<Record<string, typeof emptyVital>>({
    bp: { ...emptyVital, value: candidate.vitals?.bp ?? "" },
    hr: { ...emptyVital, value: candidate.vitals?.hr ?? "" },
    rr: { ...emptyVital },
    spo2: { ...emptyVital, value: candidate.vitals?.spo2 ?? "" },
    temp: { ...emptyVital },
    weight: { ...emptyVital },
    height: { ...emptyVital },
    bmi: { ...emptyVital, value: candidate.vitals?.bmi ?? "" },
  });
  const updateVital = (key: string, field: keyof typeof emptyVital, val: string) =>
    setDoctorVitals((p) => ({ ...p, [key]: { ...p[key], [field]: val } }));

  // ── Section 6: Virtual Exam ─────────────────────────────────────────────
  const [examFindings, setExamFindings] = useState<Record<string, string>>({});
  const examSections = [
    { system: "Mentation / General Appearance", options: ["Alert, oriented, appears well", "Appears unwell", "Confused", "Unable to assess", "Other"] },
    { system: "Speech", options: ["Normal speech", "Slurred / difficulty", "Not assessable"] },
    { system: "Hearing", options: ["Converses normally", "Apparent difficulty", "Formal assessment needed"] },
    { system: "Vision", options: ["Reports adequate vision", "Impairment suspected", "Uses glasses/contacts", "Formal assessment needed"] },
    { system: "Facial Symmetry", options: ["Symmetrical", "Asymmetry noted", "Not clearly assessable"] },
    { system: "Upper Limb Movement", options: ["Normal symmetrical", "Asymmetry / weakness", "Not assessable"] },
    { system: "Gait / Mobility", options: ["Walks safely on camera", "Unsteady / abnormal gait", "Balance issue noted", "Not assessed"] },
    { system: "Cardiorespiratory (visual)", options: ["No obvious distress", "Respiratory distress noted", "Abnormal breathing observed"] },
    { system: "Skin / General (visual)", options: ["No obvious abnormality", "Rash / lesion noted", "Jaundice / cyanosis", "Other"] },
    { system: "Musculoskeletal (visual)", options: ["No obvious limitation", "Deformity / limited movement", "Visible pain on movement"] },
    { system: "Abdomen (visual inspection)", options: ["No obvious abnormality", "Visible distension", "Other visible finding"] },
  ];

  // ── Section 7: Clinical Assessment ─────────────────────────────────────
  const [clinicalImpression, setClinicalImpression] = useState<
    "No significant abnormality" | "Abnormal — physical exam required" |
    "Investigation required" | "Specialist assessment required" | "Urgent assessment required" | ""
  >("");
  const [clinicalNotes, setClinicalNotes] = useState("");

  // ── Section 8: Decision & Declaration ──────────────────────────────────
  const [finalDecision, setFinalDecision] = useState<DoctorDecision | "">("");
  const [decisionNotes, setDecisionNotes] = useState("");
  const [restrictions, setRestrictions] = useState("");
  const [declared, setDeclared] = useState(false);

  const canSubmit =
    !certLocked &&
    finalDecision !== "" &&
    declared &&
    clinicalImpression !== "";

  const handleSubmit = () => {
    if (!canSubmit) return;
    onDecision({ decision: finalDecision as DoctorDecision, notes: decisionNotes, restrictions });
  };

  const DECISION_OPTIONS: { value: DoctorDecision; label: string; desc: string; color: string; disabled?: boolean }[] = [
    { value: "FIT", label: "FIT", desc: "Requirements met — issue electronic certificate", color: "border-emerald-400 bg-emerald-50", disabled: certLocked },
    { value: "FIT_RESTRICTED", label: "FIT WITH RESTRICTIONS", desc: "Certificate issued with stated restrictions", color: "border-sky-400 bg-sky-50", disabled: certLocked },
    { value: "PHYSICAL_CONSULTATION", label: "PHYSICAL CONSULTATION REQUIRED", desc: "Do not issue — in-person assessment required", color: "border-amber-400 bg-amber-50" },
    { value: "INVESTIGATION_SPECIALIST", label: "INVESTIGATION / SPECIALIST REQUIRED", desc: "Certification pending results or specialist review", color: "border-orange-400 bg-orange-50" },
    { value: "REJECTED", label: "REJECTED (DECLINED WITH REASON)", desc: "Do not issue — applicant fails medical fitness criteria", color: "border-rose-400 bg-rose-50" },
    { value: "URGENT_REFERRAL", label: "URGENT MEDICAL REFERRAL", desc: "Do not issue — patient requires urgent care", color: "border-rose-500 bg-rose-50" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-6 px-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl border border-slate-200 overflow-hidden">

        {/* ── Modal Header ── */}
        <div className="bg-gradient-to-r from-[#082247] to-[#0B2D5C] px-6 py-4 text-white flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#12B8B0]/20 border border-[#12B8B0]/30 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-[#12B8B0]" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-sky-300/80">FitMed Virtual Clinical Assessment</div>
              <div className="text-base font-extrabold">{candidate.name} · {candidate.purpose}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {certLocked && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-extrabold">
                <Lock className="w-3.5 h-3.5" /> CERT LOCKED
              </span>
            )}
            <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Certification Lock Warning ── */}
        {certLocked && (
          <div className="px-6 py-3 bg-rose-50 border-b border-rose-200 flex items-start gap-2 text-xs text-rose-800">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Certification Locked (§24 Rule 2):</strong> A significant red flag has been identified.
              Electronic certificate generation is blocked. Certification options FIT and FIT WITH RESTRICTIONS are disabled.
              Document the red flag findings and select the appropriate urgent or physical referral pathway.
            </div>
          </div>
        )}

        {/* ── Form Body ── */}
        <div className="p-6 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">

          {/* Notice: Limited virtual exam */}
          <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-xs text-sky-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-sky-500 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Virtual Examination Notice (§24 Rule 3):</strong> This assessment is conducted via telemedicine.
              Physical examination is limited to observational assessment and simple patient-performed tests on camera.
              Any condition that cannot be safely assessed virtually should trigger physical examination.
            </span>
          </div>

          {/* Section 1: Patient Info */}
          <Section title="Patient Information" icon={User}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Patient Name</label>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 font-semibold text-slate-800">{candidate.name}</div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Date of Birth</label>
                <BrandDatePicker value={patientDob} onChange={setPatientDob} />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Sex</label>
                <BrandSelect value={patientSex} onChange={setPatientSex} options={["Male", "Female", "Other"]} className="text-xs" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Employer / Organisation</label>
                <input value={employer} onChange={(e) => setEmployer(e.target.value)} placeholder="e.g. Rwanda Energy Group"
                  className="w-full p-2 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#12B8B0]" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Certificate Purpose</label>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 font-semibold text-slate-800">{candidate.purpose}</div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Consultation Date/Time</label>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 font-semibold text-slate-800 text-[11px]">{consultDate}</div>
              </div>
            </div>
          </Section>

          {/* Section 2: Doctor Red-Flag Screening */}
          <Section title="Doctor Red-Flag Screening (§12)" icon={ShieldAlert} danger>
            <p className="text-[11px] text-rose-700 font-medium mb-2">
              Directly ask the patient about the following. A positive significant red flag locks certification and requires urgent referral.
            </p>
            <div>
              {redFlagItems.map((item) => (
                <DoctorYesNo
                  key={item.key}
                  label={item.label}
                  value={drRedFlags[item.key]}
                  onChange={(v) => setDrRedFlags((p) => ({ ...p, [item.key]: v }))}
                />
              ))}
            </div>
            {positiveRedFlags.length > 0 && (
              <div className="mt-3 p-3 rounded-xl bg-rose-600 text-white text-xs font-bold flex items-start gap-2">
                <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  Certification locked. Red flags identified: {positiveRedFlags.map(([k]) => redFlagItems.find((i) => i.key === k)?.label).join(", ")}.
                  Document details and action taken in clinical notes.
                </div>
              </div>
            )}
          </Section>

          {/* Section 3: Medical History */}
          <Section title="Relevant Medical History (§13)" icon={Heart}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mb-3">
              {medHistoryItems.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setMedHistory((p) => ({ ...p, [item.key]: !p[item.key] }))}
                  className={`px-3 py-2 rounded-xl text-[11px] font-semibold text-left border transition-all ${
                    medHistory[item.key] ? "bg-[#0B2D5C] text-white border-[#0B2D5C]" : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                  }`}
                >
                  {medHistory[item.key] && <Check className="w-3 h-3 inline mr-1" />}
                  {item.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mt-2 border-t border-slate-100 pt-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Current Medications</label>
                <textarea rows={2} value={medications} onChange={(e) => setMedications(e.target.value)}
                  placeholder="List current medications..."
                  className="w-full p-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#12B8B0] resize-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Known Allergies</label>
                <textarea rows={2} value={allergies} onChange={(e) => setAllergies(e.target.value)}
                  placeholder="Drug / food allergies..."
                  className="w-full p-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#12B8B0] resize-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Smoking</label>
                <BrandSelect value={smoking} onChange={setSmoking} options={["Non-smoker", "Ex-smoker", "Current smoker"]} className="text-xs" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Alcohol / Substance Use</label>
                <BrandSelect value={alcohol} onChange={setAlcohol} options={["None / social", "Moderate", "Heavy use reported", "Substance use reported"]} className="text-xs" />
              </div>
            </div>
          </Section>

          {/* Section 4: Occupational / Functional Assessment */}
          <Section title="Occupational & Functional Assessment (§14)" icon={Bone}>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2">Job / Activity Requirements (select all that apply)</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {jobReqItems.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setJobRequirements((p) => ({ ...p, [item.key]: !p[item.key] }))}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-all ${
                      jobRequirements[item.key] ? "bg-[#0B2D5C] text-white border-[#0B2D5C]" : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {jobRequirements[item.key] && <Check className="w-3 h-3 inline mr-1" />}
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-slate-100 pt-3 space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Can patient safely perform required duties?</label>
                <div className="flex gap-2">
                  {(["yes", "no", "limited"] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setCanPerform(opt)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                        canPerform === opt
                          ? opt === "yes" ? "bg-emerald-600 text-white border-emerald-600"
                            : opt === "no" ? "bg-rose-600 text-white border-rose-600"
                            : "bg-amber-500 text-slate-950 border-amber-500"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      {opt === "yes" ? "Yes" : opt === "no" ? "No" : "With Limitations"}
                    </button>
                  ))}
                </div>
              </div>
              {(canPerform === "no" || canPerform === "limited") && (
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Document Functional Limitations</label>
                  <textarea rows={2} value={funcLimitations} onChange={(e) => setFuncLimitations(e.target.value)}
                    placeholder="Describe functional limitations..."
                    className="w-full p-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#12B8B0] resize-none" />
                </div>
              )}
            </div>
          </Section>

          {/* Section 5: Vital Signs */}
          <Section title="Vital Signs & Measurements (§15)" icon={Activity}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 pr-3 font-bold text-slate-500 text-[10px] uppercase">Measurement</th>
                    <th className="text-left py-2 pr-2 font-bold text-slate-500 text-[10px] uppercase">Value</th>
                    <th className="text-left py-2 pr-2 font-bold text-slate-500 text-[10px] uppercase">Repeat / Confirm</th>
                    <th className="text-left py-2 font-bold text-slate-500 text-[10px] uppercase">Doctor Comment</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { key: "bp", label: "Blood Pressure", unit: "mmHg" },
                    { key: "hr", label: "Heart Rate", unit: "bpm" },
                    { key: "rr", label: "Respiratory Rate", unit: "breaths/min" },
                    { key: "spo2", label: "SpO₂", unit: "%" },
                    { key: "temp", label: "Temperature", unit: "°C" },
                    { key: "weight", label: "Weight", unit: "kg" },
                    { key: "height", label: "Height", unit: "cm" },
                    { key: "bmi", label: "BMI", unit: "kg/m²" },
                  ].map(({ key, label, unit }) => (
                    <VitalRow
                      key={key}
                      label={label}
                      unit={unit}
                      value={doctorVitals[key]?.value ?? ""}
                      onChange={(v) => updateVital(key, "value", v)}
                      repeat={doctorVitals[key]?.repeat ?? ""}
                      onRepeatChange={(v) => updateVital(key, "repeat", v)}
                      comment={doctorVitals[key]?.comment ?? ""}
                      onCommentChange={(v) => updateVital(key, "comment", v)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* Section 6: Virtual Physical Examination */}
          <Section title="Virtual Physical Examination (§16–§20)" icon={Eye}>
            <p className="text-[11px] text-slate-500 mb-3">
              Record only findings assessable through telemedicine (observational + guided patient-performed tests on camera).
            </p>
            {examSections.map((s) => (
              <ExamFinding
                key={s.system}
                system={s.system}
                options={s.options}
                value={examFindings[s.system] ?? ""}
                onChange={(v) => setExamFindings((p) => ({ ...p, [s.system]: v }))}
              />
            ))}
          </Section>

          {/* Section 7: Clinical Assessment */}
          <Section title="Doctor's Clinical Assessment (§21)" icon={Brain}>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2">Overall Clinical Assessment</label>
                <div className="space-y-1.5">
                  {[
                    "No significant abnormality identified virtually",
                    "Abnormal finding requiring physical examination",
                    "Investigation required",
                    "Specialist assessment required",
                    "Urgent medical assessment required",
                  ].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setClinicalImpression(opt as typeof clinicalImpression)}
                      className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                        clinicalImpression === opt ? "bg-[#0B2D5C] text-white border-[#0B2D5C]" : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      {clinicalImpression === opt && <Check className="w-3.5 h-3.5 inline mr-2" />}
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Clinical Impression & Relevant Findings</label>
                <textarea rows={3} value={clinicalNotes} onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="Document clinical impression, relevant findings, and reason for decision..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#12B8B0] resize-none" />
              </div>
            </div>
          </Section>

          {/* Section 8: Certification Decision */}
          <Section title="Certification Decision (§22)" icon={FileSignature}>
            <div className="space-y-3">
              <div className="space-y-2">
                {DECISION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={opt.disabled}
                    onClick={() => !opt.disabled && setFinalDecision(opt.value)}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                      opt.disabled
                        ? "opacity-40 cursor-not-allowed bg-slate-50 border-slate-200"
                        : finalDecision === opt.value
                        ? opt.color + " border-current shadow-sm"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {finalDecision === opt.value ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-300 flex-shrink-0" />}
                      <div>
                        <div className="text-xs font-extrabold text-[#0B2D5C]">{opt.label}</div>
                        <div className="text-[11px] text-slate-500 font-medium">{opt.desc}</div>
                      </div>
                      {opt.disabled && <Lock className="w-3.5 h-3.5 text-slate-400 ml-auto" />}
                    </div>
                  </button>
                ))}
              </div>

              {(finalDecision === "FIT_RESTRICTED") && (
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">State Restrictions Clearly</label>
                  <textarea rows={2} value={restrictions} onChange={(e) => setRestrictions(e.target.value)}
                    placeholder="e.g. Restricted to sedentary work only. No driving. No working at heights."
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#12B8B0] resize-none" />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Decision Reason / Follow-up / Referral Details</label>
                <textarea rows={3} value={decisionNotes} onChange={(e) => setDecisionNotes(e.target.value)}
                  placeholder="Document reason for decision, required follow-up, and any referral details..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#12B8B0] resize-none" />
              </div>
            </div>
          </Section>

          {/* Section 9: Doctor Declaration */}
          <Section title="Doctor Declaration (§23)" icon={ShieldCheck}>
            <div className="space-y-3 text-xs text-slate-700">
              <div className="p-4 rounded-2xl bg-[#edf6f6] border border-teal-200 space-y-1.5 leading-relaxed">
                <p>I, <strong>{doctorName}</strong> (License: <strong>{doctorLicense}</strong>), confirm that I have:</p>
                <ul className="list-disc ml-4 space-y-1 text-slate-600">
                  <li>Reviewed the applicant's relevant medical history</li>
                  <li>Actively screened for red-flag and danger signs</li>
                  <li>Performed the appropriate virtual assessment within the limitations of telemedicine</li>
                  <li>Based the certification decision on the clinical information available at the time of this consultation</li>
                </ul>
                <p className="text-slate-500 italic text-[11px]">
                  I understand that this virtual assessment is limited to observational findings and guided patient-performed tests,
                  and that conditions not safely assessable virtually have been referred for physical examination.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="declaration_check"
                  checked={declared}
                  onChange={(e) => setDeclared(e.target.checked)}
                  className="w-4 h-4 accent-[#12B8B0] mt-0.5 flex-shrink-0 rounded"
                />
                <label htmlFor="declaration_check" className="text-xs font-semibold text-slate-700 cursor-pointer leading-relaxed">
                  I confirm the above declaration and electronically sign this assessment as <strong>{doctorName}</strong>,
                  License <strong>{doctorLicense}</strong>, on <strong>{consultDate}</strong>.
                </label>
              </div>
            </div>
          </Section>
        </div>

        {/* ── Footer Actions ── */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-4 sticky bottom-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            {!canSubmit && (
              <span className="text-[11px] text-slate-400 font-medium">
                {certLocked ? "🔒 Cert locked — red flag present" :
                  !clinicalImpression ? "Select clinical assessment" :
                  !finalDecision ? "Select certification decision" :
                  !declared ? "Confirm declaration" : ""}
              </span>
            )}
            <button
              type="button"
              disabled={!canSubmit}
              onClick={handleSubmit}
              className={`px-7 py-3 rounded-xl font-black text-xs flex items-center gap-2 transition-all shadow-md ${
                canSubmit
                  ? "bg-[#12B8B0] hover:bg-[#1dd9d0] text-[#0B2D5C]"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              <FileSignature className="w-4 h-4" />
              Submit Clinical Decision
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
