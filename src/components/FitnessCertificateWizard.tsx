"use client";

import { useState, useEffect } from "react";
import {
  FileText, Ruler, AlertOctagon, Activity, Sparkles,
  Check, ChevronRight, ChevronLeft, AlertTriangle, ShieldAlert,
  Thermometer, Heart, Wind, Droplets, Scale, ArrowUp, Calendar,
} from "lucide-react";
import {
  runClinicalEngine,
  calculateBMI,
  bmiCategory,
  ageFromDateOfBirth,
  assessBloodPressure,
  assessPulse,
  assessSpO2,
  assessTemperature,
  WizardData,
  ClinicalDecision,
  RED_FLAG_DEFINITIONS,
} from "@/lib/clinicalEngine";
import ClinicalOutcomeScreen from "@/components/ClinicalOutcomeScreen";
import BrandSelect from "@/components/BrandSelect";
import { DEFAULT_FITMED_PURPOSE, FITMED_SERVICE_TITLES } from "@/lib/fitmedServices";

interface FitnessCertificateWizardProps {
  initialPurpose?: string;
  initialStep?: number;
  dateOfBirth?: string;
  onComplete: (data: WizardData & { outcome: ClinicalDecision; draftId: string }) => void;
  onCancel?: () => void;
}

const STEPS = [
  { num: 1, title: "Purpose",      desc: "Certificate type & job",       icon: FileText     },
  { num: 2, title: "Measurements", desc: "Height, weight & vitals",      icon: Ruler        },
  { num: 3, title: "Red Flags",    desc: "Danger sign screening",        icon: AlertOctagon },
  { num: 4, title: "Symptoms",     desc: "Health history & symptoms",    icon: Activity     },
  { num: 5, title: "Functional",   desc: "Daily ability & notes",        icon: Sparkles     },
];

const RED_FLAG_QUESTIONS: { key: string; label: string }[] = [
  { key: "chest_pain_severe",       label: "Any new or severe chest pain or pressure?" },
  { key: "severe_shortness_breath", label: "Any severe or sudden shortness of breath / breathing difficulty?" },
  { key: "coughing_blood",          label: "Coughing up blood?" },
  { key: "fainting",                label: "Any fainting or loss of consciousness?" },
  { key: "near_fainting",           label: "Any near-fainting episodes with accompanying symptoms?" },
  { key: "severe_palpitations",     label: "Severe palpitations with dizziness, chest pain, or fainting?" },
  { key: "sudden_weakness",         label: "Any sudden weakness or paralysis in a limb?" },
  { key: "facial_droop",            label: "Any facial drooping or difficulty speaking?" },
  { key: "new_confusion",           label: "Any sudden new confusion or altered consciousness?" },
  { key: "sudden_vision_loss",      label: "Sudden vision loss or significant visual change?" },
  { key: "seizure",                 label: "Any seizure or convulsion (new or recent)?" },
  { key: "sudden_severe_headache",  label: "Sudden severe or unusual headache (worst of life)?" },
  { key: "severe_abdominal_pain",   label: "Severe abdominal pain?" },
  { key: "vomiting_blood",          label: "Vomiting blood?" },
  { key: "gi_bleeding",             label: "Significant gastrointestinal / rectal bleeding?" },
  { key: "significant_bleeding",    label: "Significant or uncontrolled active bleeding?" },
  { key: "severe_allergic_reaction",label: "Severe allergic reaction / breathing difficulty with swelling?" },
  { key: "severe_dehydration",      label: "Severe dehydration, inability to retain liquids, or extreme weakness?" },
  { key: "serious_systemic_illness",label: "High fever with confusion, stiff neck, or severe drowsiness?" },
  { key: "severe_trauma",           label: "Severe trauma or significant injury in the past 4 weeks?" },
];

const SYMPTOM_QUESTIONS: { key: string; label: string }[] = [
  { key: "recurrent_chest_discomfort", label: "Any recurrent or unexplained chest discomfort?" },
  { key: "exertional_dyspnoea",        label: "Shortness of breath on physical exertion?" },
  { key: "recurrent_palpitations",     label: "Recurrent palpitations (not already answered above)?" },
  { key: "unexplained_dizziness",      label: "Any unexplained dizziness?" },
  { key: "previous_fainting",          label: "Any history of unexplained fainting (not already answered above)?" },
  { key: "new_headaches",              label: "New or changing recurrent headaches?" },
  { key: "seizure_history",            label: "Any history of seizures or epilepsy?" },
  { key: "persistent_cough",           label: "Persistent cough (more than 3 weeks)?" },
  { key: "persistent_wheeze",          label: "Persistent wheezing or poorly controlled asthma?" },
  { key: "significant_back_pain",      label: "Significant back pain affecting your ability to work?" },
  { key: "significant_joint_pain",     label: "Significant joint pain affecting movement or function?" },
  { key: "recent_fracture",            label: "Any recent fracture?" },
  { key: "recent_significant_injury",  label: "Any recent significant injury?" },
  { key: "persistent_fever",           label: "Persistent unexplained fever (more than 5 days)?" },
  { key: "persistent_fatigue",         label: "Persistent fatigue significantly affecting daily function?" },
  { key: "unexplained_weight_loss",    label: "Any unexplained significant weight loss?" },
  { key: "persistent_vomiting",        label: "Persistent vomiting?" },
  { key: "persistent_diarrhea",        label: "Persistent diarrhea?" },
  { key: "blood_urine",                label: "Blood in urine?" },
  { key: "blood_stool",                label: "Blood in stool?" },
];

const HISTORY_QUESTIONS: { key: string; label: string }[] = [
  { key: "chronic_illness",   label: "Any chronic illnesses? (Hypertension, Diabetes, Asthma, Heart disease, etc.)" },
  { key: "hospitalization",   label: "Any hospitalization in the last 3 months?" },
  { key: "surgery",           label: "Any surgery in the last 6 months?" },
  { key: "epilepsy_seizure",  label: "Any history of epilepsy or seizure disorder?" },
  { key: "psychiatric",       label: "Any psychiatric conditions?" },
  { key: "allergies",         label: "Any known allergies (drug or food)?" },
  { key: "medication",        label: "Currently using any regular or chronic medications?" },
  { key: "disability",        label: "Any disability or mobility limitations?" },
];

const FUNCTIONAL_QUESTIONS: { key: string; label: string; positiveIsYes: boolean }[] = [
  { key: "walk",     label: "Can you walk without difficulty?",              positiveIsYes: true  },
  { key: "stairs",   label: "Can you climb stairs?",                         positiveIsYes: true  },
  { key: "lift",     label: "Can you lift light objects without pain?",       positiveIsYes: true  },
  { key: "sleep",    label: "Do you sleep adequately?",                       positiveIsYes: true  },
  { key: "appetite", label: "Do you have a normal appetite?",                 positiveIsYes: true  },
];

function YesNoRow({
  label,
  value,
  onChange,
  danger = false,
}: {
  label: string;
  value: boolean | undefined;
  onChange: (v: boolean) => void;
  danger?: boolean;
}) {
  return (
    <div className={`py-3 flex items-center justify-between gap-4 ${danger && value === true ? "bg-rose-50 -mx-2 px-2 rounded-xl" : ""}`}>
      <span className={`text-xs font-semibold ${danger && value === true ? "text-rose-800" : "text-slate-700"} leading-snug`}>
        {danger && value === true && <AlertTriangle className="w-3 h-3 text-rose-500 inline mr-1" />}
        {label}
      </span>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            value === true
              ? danger ? "bg-rose-600 text-white shadow-sm" : "bg-[#0B2D5C] text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            value === false
              ? "bg-[#12B8B0] text-[#0B2D5C] font-black shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          No
        </button>
      </div>
    </div>
  );
}

function VitalInput({
  label, unit, value, onChange, placeholder, icon: Icon, referenceRange,
}: {
  label: string; unit: string; value: string; onChange: (v: string) => void;
  placeholder: string; icon: React.ElementType; referenceRange?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
          <Icon className="w-3 h-3 text-[#12B8B0]" /> {label} <span className="text-slate-400">({unit})</span>
        </label>
        {referenceRange && (
          <span className="text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded">
            {referenceRange}
          </span>
        )}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#12B8B0] focus:ring-1 focus:ring-[#12B8B0] bg-white dark:bg-slate-800 dark:border-slate-700"
      />
    </div>
  );
}

export default function FitnessCertificateWizard({
  initialPurpose,
  initialStep = 1,
  dateOfBirth,
  onComplete,
  onCancel,
}: FitnessCertificateWizardProps) {
  const [currentStep, setCurrentStep] = useState<number>(initialStep);
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(
    new Set(initialStep > 1 ? [1, initialStep] : [1])
  );
  const [outcomeResult, setOutcomeResult] = useState<ClinicalDecision | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1
  const [purpose, setPurpose] = useState(initialPurpose || DEFAULT_FITMED_PURPOSE);

  // Step 2: Measurements
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [bmi, setBmi] = useState("");
  const [vitals, setVitals] = useState({ temperature: "", bp: "", pulse: "", spo2: "" });
  const profileAge = ageFromDateOfBirth(dateOfBirth);
  const bpAssessment = assessBloodPressure(vitals.bp, profileAge);
  const pulseAssessment = assessPulse(vitals.pulse);
  const spo2Assessment = assessSpO2(vitals.spo2);
  const tempAssessment = assessTemperature(vitals.temperature);

  const hasAnyVitalsEntered = Boolean(vitals.bp || vitals.pulse || vitals.spo2 || vitals.temperature);

  // BMI auto-calculate
  useEffect(() => {
    const computed = calculateBMI(height, weight);
    setBmi(computed);
  }, [height, weight]);

  // Step 3: Red flags (all false by default)
  const [redFlags, setRedFlags] = useState<Record<string, boolean>>(
    Object.fromEntries(RED_FLAG_QUESTIONS.map((q) => [q.key, false]))
  );

  // Step 4: Symptoms + History
  const [symptoms, setSymptoms] = useState<Record<string, boolean>>(
    Object.fromEntries(SYMPTOM_QUESTIONS.map((q) => [q.key, false]))
  );
  const [history, setHistory] = useState<Record<string, boolean>>(
    Object.fromEntries(HISTORY_QUESTIONS.map((q) => [q.key, false]))
  );

  // Step 5: Functional
  const [functional, setFunctional] = useState<Record<string, boolean>>(
    Object.fromEntries(FUNCTIONAL_QUESTIONS.map((q) => [q.key, true]))
  );
  const [additionalNotes, setAdditionalNotes] = useState("");

  const [stepError, setStepError] = useState<string | null>(null);

  const activeRedFlagCount = Object.values(redFlags).filter(Boolean).length;
  // Critical functional NOs count
  const criticalNoCount = ["walk", "stairs", "lift"].filter((k) => functional[k] === false).length;

  const handleStepChange = (step: number) => {
    setStepError(null);
    setCurrentStep(step);
    setVisitedSteps((prev) => new Set([...prev, step]));
  };

  const handleNext = () => {
    setStepError(null);
    if (currentStep === 1) {
      if (!purpose.trim()) {
        setStepError("Please choose a certificate purpose before continuing.");
        return;
      }
    }
    if (currentStep === 2) {
      if (!height || !weight || parseFloat(height) <= 0 || parseFloat(weight) <= 0) {
        setStepError("Please provide valid Height (cm) and Weight (kg) before proceeding.");
        return;
      }
    }
    if (currentStep < 5) handleStepChange(currentStep + 1);
    else handleSubmit();
  };
  const handleBack = () => { setStepError(null); if (currentStep > 1) handleStepChange(currentStep - 1); };

  const handleSubmit = () => {
    setStepError(null);
    if (!height || !weight) {
      setStepError("Mandatory measurements missing. Please complete Height and Weight in Step 2.");
      handleStepChange(2);
      return;
    }
    setIsSubmitting(true);
    const data: WizardData = { purpose, jobType: purpose, height, weight, bmi, redFlags, symptoms, history, functional, vitals, additionalNotes };
    setTimeout(() => {
      const decision = runClinicalEngine(data);
      setOutcomeResult(decision);
      setIsSubmitting(false);
    }, 800);
  };

  const handleProceedFromOutcome = () => {
    if (!outcomeResult) return;
    const data: WizardData = { purpose, jobType: purpose, height, weight, bmi, redFlags, symptoms, history, functional, vitals, additionalNotes };
    const draftId = `FM-DRAFT-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Date.now().toString().slice(-6)}`;
    onComplete({ ...data, outcome: outcomeResult, draftId });
  };

  const progressPercent = Math.round((visitedSteps.size / 5) * 100);

  // ── Render Outcome Screen ────────────────────────────────────────────────
  if (outcomeResult) {
    return (
      <div className="p-4 sm:p-6">
        <ClinicalOutcomeScreen
          decision={outcomeResult}
          purpose={purpose}
          onProceed={handleProceedFromOutcome}
          onBack={() => setOutcomeResult(null)}
        />
      </div>
    );
  }

  // ── Render Wizard ────────────────────────────────────────────────────────
  return (
    <div className="bg-white dark:bg-[#12253d] rounded-3xl border-0 shadow-xl overflow-hidden">
      <div className="grid lg:grid-cols-12 min-h-[640px]">
        {/* ── LEFT SIDEBAR ── */}
        <div className="lg:col-span-4 bg-[#edf6f6] dark:bg-[#082247] text-[#0B2D5C] dark:text-white p-6 sm:p-8 flex flex-col justify-between border-r-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-60 h-60 bg-[#12B8B0]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-5 relative z-10">
            {/* Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">Progress</span>
                <span className="text-xs font-extrabold text-[#12B8B0]">{`${progressPercent}%`}</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#12B8B0] to-[#1dd9d0] transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-400 mt-1.5">{visitedSteps.size} of 5 sections visited</div>
            </div>

            {/* Steps list */}
            <div className="space-y-2 pt-1">
              {STEPS.map((s) => {
                const isCurrent = currentStep === s.num;
                const isVisited = visitedSteps.has(s.num) && !isCurrent;
                const isRedFlagStep = s.num === 3;
                const Icon = s.icon;
                return (
                  <button
                    key={s.num}
                    type="button"
                    onClick={() => handleStepChange(s.num)}
                    className={`w-full text-left p-3 rounded-2xl flex items-center justify-between transition-all border-0 ${
                      isCurrent
                        ? "bg-white dark:bg-white/15 shadow-md"
                        : "hover:bg-white/70 dark:hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                          isCurrent
                            ? "bg-[#12B8B0] text-[#0B2D5C] font-black shadow-md"
                            : isVisited
                            ? "bg-emerald-500/20 text-[#12B8B0] border-0"
                            : isRedFlagStep
                            ? "bg-rose-500/20 text-rose-500 dark:text-rose-400 border-0"
                            : "bg-white/80 dark:bg-white/10 text-slate-400"
                        }`}
                      >
                        {isVisited ? <Check className="w-4 h-4 text-[#12B8B0]" /> : <Icon className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className={`text-xs font-bold ${isCurrent ? "text-[#0B2D5C] dark:text-white" : "text-slate-600 dark:text-slate-300"} flex items-center gap-1.5`}>
                          {s.title}
                          {isRedFlagStep && activeRedFlagCount > 0 && (
                            <span className="px-1.5 py-0.5 bg-rose-500 text-white rounded text-[9px] font-extrabold">
                              {activeRedFlagCount}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">{s.desc}</div>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                        isCurrent
                          ? "bg-[#12B8B0] text-[#0B2D5C]"
                          : isVisited
                          ? "bg-[#12B8B0]/20 text-[#12B8B0]"
                          : "text-slate-600"
                      }`}
                    >
                      {isCurrent ? "ACTIVE" : isVisited ? "DONE" : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Red flag warning if any active */}
          {activeRedFlagCount > 0 && (
            <div className="mt-4 p-3 rounded-2xl bg-rose-500/20 border-0 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2 relative z-10">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong className="text-rose-300">{activeRedFlagCount} danger sign(s) flagged.</strong>{" "}
                Your assessment will be escalated for urgent review.
              </span>
            </div>
          )}

          <div className="pt-4 border-t border-white/10 text-[11px] text-slate-400 relative z-10">
            Navigate freely between sections — all answers auto-save.
          </div>
        </div>

        {/* ── RIGHT CONTENT AREA ── */}
        <div className="lg:col-span-8 p-6 sm:p-8 flex flex-col justify-between bg-white dark:bg-[#0c1c33]">
          <div className="space-y-5 flex-1">
            {/* Step Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <span className={`w-2.5 h-2.5 rounded-full ${currentStep === 3 ? "bg-rose-500" : "bg-[#12B8B0]"}`} />
                <span className="text-sm font-extrabold uppercase tracking-wider text-[#0B2D5C]">
                  {STEPS[currentStep - 1].title}
                </span>
                {currentStep === 3 && (
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded text-[10px] font-bold border border-rose-200 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" /> Mandatory
                  </span>
                )}
              </div>
              <span className="text-xs text-[#0B2D5C] font-bold bg-slate-100 px-3 py-1 rounded-full">
                Step {currentStep} of 5
              </span>
            </div>

            {/* Inline Error Notice */}
            {stepError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-500/15 border-0 text-xs text-rose-900 dark:text-rose-200 font-bold flex items-center gap-2 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{stepError}</span>
              </div>
            )}

            {/* ── STEP 1: PURPOSE ── */}
            {currentStep === 1 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <BrandSelect
                  label="Certificate Purpose"
                  value={purpose}
                  onChange={(v) => setPurpose(v)}
                  options={[...FITMED_SERVICE_TITLES]}
                />

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0e1c31] border-0 text-xs text-slate-600 dark:text-slate-300">
                  <div className="font-bold text-[#0B2D5C]">Fixed Clinical Assessment Rate</div>
                  <div className="mt-1">Standard Medical Fitness Clearance: <strong className="text-[#0B2D5C]">5,000 FRW</strong> (includes physician review, QR-verified digital certificate valid for 6 months).</div>
                </div>
              </div>
            )}

            {/* ── STEP 2: MEASUREMENTS ── */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B2D5C] mb-3">Applicant age</h4>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Age (from profile)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={
                        profileAge !== null
                          ? `${profileAge} years`
                          : "Add your date of birth in Profile"
                      }
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 text-slate-700"
                    />
                    {!dateOfBirth && (
                      <p className="mt-1.5 text-[11px] text-amber-700">
                        Blood pressure is classified using the age stored on your FitMed profile.
                      </p>
                    )}
                  </div>
                </div>

                {/* Height & Weight → BMI */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B2D5C] mb-3">Body Measurements</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1">
                        <ArrowUp className="w-3 h-3" /> Height (cm)
                      </label>
                      <input
                        type="number"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        placeholder="e.g. 170"
                        min="100" max="250"
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#12B8B0]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1">
                        <Scale className="w-3 h-3" /> Weight (kg)
                      </label>
                      <input
                        type="number"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        placeholder="e.g. 70"
                        min="20" max="300"
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#12B8B0]"
                      />
                    </div>
                  </div>
                  {/* BMI Display */}
                  {bmi && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-[#0e1c31] border-0 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-500">Calculated BMI:</span>
                      <span className={`text-lg font-extrabold ${bmiCategory(parseFloat(bmi)).color}`}>
                        {bmi} <span className="text-sm font-bold">{bmiCategory(parseFloat(bmi)).label}</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Vitals */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B2D5C]">Vital Signs</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Standard ranges: <strong>BP 100/60–140/90 mmHg</strong> · <strong>Pulse 60–100 bpm</strong> · <strong>SpO₂ 94–100%</strong> · <strong>Temp 36.0–37.5°C</strong>. Enter if available.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <VitalInput
                      label="Blood Pressure"
                      unit="mmHg"
                      value={vitals.bp}
                      onChange={(v) => setVitals((p) => ({ ...p, bp: v }))}
                      placeholder="e.g. 120/80"
                      referenceRange="100/60–140/90"
                      icon={Heart}
                    />
                    <VitalInput
                      label="Pulse"
                      unit="bpm"
                      value={vitals.pulse}
                      onChange={(v) => setVitals((p) => ({ ...p, pulse: v }))}
                      placeholder="e.g. 72"
                      referenceRange="60–100 bpm"
                      icon={Activity}
                    />
                    <VitalInput
                      label="SpO₂"
                      unit="%"
                      value={vitals.spo2}
                      onChange={(v) => setVitals((p) => ({ ...p, spo2: v }))}
                      placeholder="e.g. 98"
                      referenceRange="94–100%"
                      icon={Droplets}
                    />
                    <VitalInput
                      label="Temperature"
                      unit="°C"
                      value={vitals.temperature}
                      onChange={(v) => setVitals((p) => ({ ...p, temperature: v }))}
                      placeholder="e.g. 36.6"
                      referenceRange="36.0–37.5°C"
                      icon={Thermometer}
                    />
                  </div>

                  {hasAnyVitalsEntered && (
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0e1c31] border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                      <div className="font-bold text-slate-600 dark:text-slate-300 text-[11px] uppercase tracking-wider flex items-center justify-between">
                        <span>Vital Signs Clinical Screening</span>
                        <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold">Doctor Review Standard</span>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-2 text-xs">
                        {bpAssessment && (
                          <div className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-500">BP:</span>
                              <span className={`font-extrabold ${bpAssessment.color}`}>{vitals.bp} ({bpAssessment.label})</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">{bpAssessment.detail}</p>
                          </div>
                        )}
                        {pulseAssessment && (
                          <div className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-500">Pulse:</span>
                              <span className={`font-extrabold ${pulseAssessment.color}`}>{vitals.pulse} bpm ({pulseAssessment.label})</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">{pulseAssessment.detail}</p>
                          </div>
                        )}
                        {spo2Assessment && (
                          <div className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-500">SpO₂:</span>
                              <span className={`font-extrabold ${spo2Assessment.color}`}>{vitals.spo2}% ({spo2Assessment.label})</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">{spo2Assessment.detail}</p>
                          </div>
                        )}
                        {tempAssessment && (
                          <div className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-500">Temp:</span>
                              <span className={`font-extrabold ${tempAssessment.color}`}>{vitals.temperature}°C ({tempAssessment.label})</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">{tempAssessment.detail}</p>
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 italic pt-1 border-t border-slate-200 dark:border-white/10">
                        * Regardless of age, your evaluating doctor will make the final clinical decision according to the age registered and full medical profile.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── STEP 3: RED FLAGS ── */}
            {currentStep === 3 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/15 border-0 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-3">
                  <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>Mandatory Danger Sign Screening.</strong> Answer honestly about any of the following symptoms.
                    Answering <strong>YES</strong> will escalate your assessment for urgent review. FitMed cannot issue
                    an electronic certificate until a doctor has evaluated any identified danger sign.
                  </div>
                </div>

                {activeRedFlagCount > 0 && (
                  <div className="p-3 rounded-2xl bg-rose-600 text-white text-xs font-bold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {activeRedFlagCount} danger sign(s) flagged — your assessment will be escalated for urgent clinical review.
                  </div>
                )}

                <div className="divide-y divide-slate-100">
                  {RED_FLAG_QUESTIONS.map((q) => (
                    <YesNoRow
                      key={q.key}
                      label={q.label}
                      value={redFlags[q.key]}
                      onChange={(v) => setRedFlags((p) => ({ ...p, [q.key]: v }))}
                      danger
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── STEP 4: SYMPTOMS & HISTORY ── */}
            {currentStep === 4 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Current Symptoms */}
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#0B2D5C] mb-1">Current Symptoms</div>
                  <p className="text-[11px] text-slate-400 mb-3">Do you currently experience or have you recently experienced any of the following?</p>
                  <div className="divide-y divide-slate-100">
                    {SYMPTOM_QUESTIONS.map((q) => (
                      <YesNoRow key={q.key} label={q.label} value={symptoms[q.key]} onChange={(v) => setSymptoms((p) => ({ ...p, [q.key]: v }))} />
                    ))}
                  </div>
                </div>

                {/* Medical History */}
                <div className="pt-4 border-t border-slate-100">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#0B2D5C] mb-1">Medical History</div>
                  <p className="text-[11px] text-slate-400 mb-3">Past illnesses, treatments, and ongoing conditions.</p>
                  <div className="divide-y divide-slate-100">
                    {HISTORY_QUESTIONS.map((q) => (
                      <YesNoRow key={q.key} label={q.label} value={history[q.key]} onChange={(v) => setHistory((p) => ({ ...p, [q.key]: v }))} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 5: FUNCTIONAL ABILITY ── */}
            {currentStep === 5 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#0B2D5C] mb-1">Daily Functional Ability</div>
                  <p className="text-[11px] text-slate-400 mb-3">Assess your ability to perform daily activities relevant to your intended work or activity.</p>
                  
                  {criticalNoCount > 0 && (
                    <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-500/15 border-0 text-xs text-amber-900 dark:text-amber-200 font-semibold flex items-start gap-2.5 shadow-sm animate-in fade-in">
                      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-amber-950 font-bold">{criticalNoCount} Functional Limitation(s) Flagged (Answered 'No'):</strong>{" "}
                        Inability to perform essential physical tasks (walking, climbing stairs, or lifting) will route this application to <strong>Outcome B (In-Person Physical Examination)</strong>. Automated digital certification will be locked.
                      </div>
                    </div>
                  )}

                  <div className="divide-y divide-slate-100">
                    {FUNCTIONAL_QUESTIONS.map((q) => (
                      <YesNoRow
                        key={q.key}
                        label={q.label}
                        value={functional[q.key]}
                        onChange={(v) => setFunctional((p) => ({ ...p, [q.key]: v }))}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#0B2D5C]">
                    Additional Notes for the Doctor (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    placeholder="Any other relevant medical information, medications, or concerns you'd like the doctor to know..."
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#12B8B0] resize-none"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-[#edf6f6] dark:bg-[#0e1c31] border-0 text-xs text-[#0B2D5C] dark:text-slate-200">
                  <div className="font-bold mb-1">What happens next?</div>
                  <p className="text-slate-600 leading-relaxed">
                    After submission, FitMed's clinical decision engine will screen your answers.
                    Depending on the result, you will either proceed to electronic certification, be referred for a physical consultation, or directed to urgent care.
                    <strong> A licensed physician makes the final decision.</strong>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── FOOTER NAVIGATION ── */}
          <div className="flex items-center justify-between pt-5 mt-5 border-t border-slate-100">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-2.5 rounded-xl border-0 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/15 text-xs font-bold transition-all flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            ) : (
              <div />
            )}

            <span className="text-xs text-slate-400 font-bold">Step {currentStep} of 5</span>

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl bg-[#0B2D5C] hover:bg-[#071d3d] text-white font-extrabold text-xs transition-all shadow-md flex items-center gap-1.5"
              >
                Save &amp; Next
                <ChevronRight className="w-4 h-4 text-[#12B8B0]" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="px-7 py-3 rounded-xl bg-[#12B8B0] hover:bg-[#1dd9d0] disabled:opacity-60 text-[#0B2D5C] font-black text-xs transition-all shadow-lg flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-[#0B2D5C]/30 border-t-[#0B2D5C] animate-spin" />
                    Analysing...
                  </>
                ) : (
                  <>
                    <Wind className="w-4 h-4" />
                    Run Clinical Assessment
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
