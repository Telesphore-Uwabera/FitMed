"use client";

import { useState, useEffect } from "react";
import { X, AlertTriangle, CheckCircle2, SaveIcon } from "lucide-react";
import BrandSelect from "@/components/BrandSelect";
import BrandDatePicker from "@/components/BrandDatePicker";

export interface StructuredAssessmentData {
  // Section 1
  patientName: string;
  patientId: string;
  dateOfBirth: string;
  sex: string;
  consultationDate: string;
  doctorName: string;
  licenseNumber: string;
  certificatePurpose: string;
  occupation: string;
  employer: string;
  // Section 2
  redFlags: {
    chestPain: boolean;
    severeShortnessBreath: boolean;
    severePalpitations: boolean;
    fainting: boolean;
    weaknessNumbness: boolean;
    speechDifficulty: boolean;
    visionChange: boolean;
    seizure: boolean;
    confusion: boolean;
    severeHeadache: boolean;
    coughingBlood: boolean;
    severeAbdominalPain: boolean;
    significantBleeding: boolean;
    severeAllergicReaction: boolean;
    severeTrauma: boolean;
    otherSeriousSymptom: boolean;
  };
  redFlagAction: string;
  redFlagDetails: string;
  // Section 3
  knownConditions: string[];
  previousSurgery: string;
  currentMedications: string;
  allergies: string;
  smokingAlcoholHistory: string;
  // Section 4
  jobRequirements: string[];
  functionalAbility: string;
  functionalLimitation: string;
  // Section 5
  vitals: {
    bp: string;
    heartRate: string;
    respiratoryRate: string;
    spo2: string;
    temperature: string;
    weight: string;
    height: string;
    bmi: string;
  };
  // Section 6
  virtualExam: {
    mentation: {
      alert: boolean;
      oriented: boolean;
      speechClear: boolean;
      appearsWell: boolean;
      noRespiratoryDistress: boolean;
      abnormality: string;
    };
    hearing: {
      conversesNormally: boolean;
      hearsNormalVoice: boolean;
      hearingDifficulty: boolean;
      formalAssessmentRequired: boolean;
    };
    vision: {
      adequateVision: boolean;
      canReadScreen: boolean;
      usesGlasses: boolean;
      visualImpairment: boolean;
      formalAssessmentRequired: boolean;
    };
    neurological: {
      facialSymmetry: boolean;
      speechAppropriate: boolean;
      upperLimbSymmetry: boolean;
      canStandIndependently: boolean;
      canWalkSafely: boolean;
      gaitNormal: boolean;
      canPerformBalanceTask: boolean;
      abnormalityObserved: boolean;
      furtherAssessmentRequired: boolean;
    };
    otherSystems: {
      cardiorespiratory: string;
      skinGeneral: string;
      musculoskeletal: string;
      abdomen: string;
    };
  };
  // Section 7
  overallAssessment: string;
  clinicalImpression: string;
  // Section 8
  decision: "FIT" | "FIT_RESTRICTED" | "PHYSICAL_CONSULTATION" | "INVESTIGATION_SPECIALIST" | "URGENT_REFERRAL";
  decisionReason: string;
  restrictions: string;
  // Section 9
  doctorDeclaration: boolean;
  electronicSignature: string;
}

interface StructuredDoctorAssessmentFormProps {
  candidate: any;
  doctorName: string;
  doctorLicense: string;
  /** Pass existing structuredAssessment data to open in edit mode */
  initialData?: Partial<StructuredAssessmentData> | null;
  onComplete: (data: StructuredAssessmentData) => void;
  onClose: () => void;
}

const BLANK: StructuredAssessmentData = {
  patientName: "",
  patientId: "",
  dateOfBirth: "",
  sex: "Male",
  consultationDate: "",
  doctorName: "",
  licenseNumber: "",
  certificatePurpose: "",
  occupation: "",
  employer: "",
  redFlags: {
    chestPain: false, severeShortnessBreath: false, severePalpitations: false, fainting: false,
    weaknessNumbness: false, speechDifficulty: false, visionChange: false, seizure: false,
    confusion: false, severeHeadache: false, coughingBlood: false, severeAbdominalPain: false,
    significantBleeding: false, severeAllergicReaction: false, severeTrauma: false, otherSeriousSymptom: false,
  },
  redFlagAction: "",
  redFlagDetails: "",
  knownConditions: [],
  previousSurgery: "",
  currentMedications: "",
  allergies: "None known",
  smokingAlcoholHistory: "",
  jobRequirements: [],
  functionalAbility: "Yes",
  functionalLimitation: "",
  vitals: { bp: "", heartRate: "", respiratoryRate: "", spo2: "", temperature: "", weight: "", height: "", bmi: "" },
  virtualExam: {
    mentation: { alert: true, oriented: true, speechClear: true, appearsWell: true, noRespiratoryDistress: true, abnormality: "" },
    hearing: { conversesNormally: true, hearsNormalVoice: true, hearingDifficulty: false, formalAssessmentRequired: false },
    vision: { adequateVision: true, canReadScreen: true, usesGlasses: false, visualImpairment: false, formalAssessmentRequired: false },
    neurological: {
      facialSymmetry: true, speechAppropriate: true, upperLimbSymmetry: true, canStandIndependently: true,
      canWalkSafely: true, gaitNormal: true, canPerformBalanceTask: true, abnormalityObserved: false, furtherAssessmentRequired: false,
    },
    otherSystems: { cardiorespiratory: "No obvious distress", skinGeneral: "No obvious abnormality", musculoskeletal: "No obvious limitation", abdomen: "No obvious abnormality" },
  },
  overallAssessment: "No significant abnormality identified virtually",
  clinicalImpression: "",
  decision: "FIT",
  decisionReason: "",
  restrictions: "",
  doctorDeclaration: false,
  electronicSignature: "",
};

// Required fields and their human-readable labels (used for inline error display)
const REQUIRED_FIELDS: { key: string; label: string }[] = [
  { key: "patientName",         label: "Patient Name" },
  { key: "patientId",           label: "Patient ID / National ID" },
  { key: "dateOfBirth",         label: "Date of Birth" },
  { key: "certificatePurpose",  label: "Certificate Purpose" },
  { key: "occupation",          label: "Occupation" },
  { key: "vitals.bp",           label: "Blood Pressure" },
  { key: "vitals.heartRate",    label: "Heart Rate" },
  { key: "vitals.spo2",         label: "SpO₂" },
  { key: "clinicalImpression",  label: "Clinical Impression (Section 7)" },
  { key: "decisionReason",      label: "Reason for Decision (Section 8)" },
  { key: "electronicSignature", label: "Electronic Signature" },
  { key: "doctorDeclaration",   label: "Doctor Declaration (must be confirmed)" },
];

function getFieldValue(data: StructuredAssessmentData, key: string): unknown {
  if (key.includes(".")) {
    const [top, sub] = key.split(".");
    return (data as any)[top]?.[sub];
  }
  return (data as any)[key];
}

function Required() {
  return <span className="text-rose-500 ml-0.5">*</span>;
}

export default function StructuredDoctorAssessmentForm({
  candidate,
  doctorName,
  doctorLicense,
  initialData,
  onComplete,
  onClose,
}: StructuredDoctorAssessmentFormProps) {
  const isEditMode = Boolean(initialData);

  const [assessment, setAssessment] = useState<StructuredAssessmentData>(() => {
    const base: StructuredAssessmentData = {
      ...BLANK,
      patientName: candidate?.name || "",
      patientId: candidate?.nationalId || "",
      dateOfBirth: candidate?.dateOfBirth || "",
      sex: candidate?.gender || "Male",
      doctorName,
      licenseNumber: doctorLicense,
      certificatePurpose: candidate?.purpose || "",
      occupation: candidate?.jobType || "",
      vitals: {
        ...BLANK.vitals,
        bp: candidate?.vitals?.bp || "",
        heartRate: candidate?.vitals?.hr || "",
        spo2: candidate?.vitals?.spo2 || "",
        bmi: candidate?.bmi || "",
        weight: candidate?.weight || "",
        height: candidate?.height || "",
      },
    };
    if (initialData) {
      return {
        ...base,
        ...initialData,
        redFlags: { ...base.redFlags, ...(initialData.redFlags || {}) },
        vitals: { ...base.vitals, ...(initialData.vitals || {}) },
        virtualExam: {
          mentation: { ...base.virtualExam.mentation, ...(initialData.virtualExam?.mentation || {}) },
          hearing: { ...base.virtualExam.hearing, ...(initialData.virtualExam?.hearing || {}) },
          vision: { ...base.virtualExam.vision, ...(initialData.virtualExam?.vision || {}) },
          neurological: { ...base.virtualExam.neurological, ...(initialData.virtualExam?.neurological || {}) },
          otherSystems: { ...base.virtualExam.otherSystems, ...(initialData.virtualExam?.otherSystems || {}) },
        },
        knownConditions: initialData.knownConditions ?? base.knownConditions,
        jobRequirements: initialData.jobRequirements ?? base.jobRequirements,
        doctorDeclaration: initialData.doctorDeclaration ?? false,
      } as StructuredAssessmentData;
    }
    return base;
  });

  const [errors, setErrors] = useState<string[]>([]);

  const hasSignificantRedFlag = Object.values(assessment.redFlags).some(Boolean);

  useEffect(() => {
    setAssessment((prev) =>
      prev.consultationDate
        ? prev
        : { ...prev, consultationDate: new Date().toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) }
    );
  }, []);

  // Toggle a string in an array field (knownConditions / jobRequirements)
  const toggleArrayItem = (field: "knownConditions" | "jobRequirements", item: string) => {
    setAssessment((prev) => {
      const arr = prev[field];
      return {
        ...prev,
        [field]: arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item],
      };
    });
  };

  const validate = (): string[] => {
    const errs: string[] = [];
    for (const { key, label } of REQUIRED_FIELDS) {
      const val = getFieldValue(assessment, key);
      if (typeof val === "boolean") {
        if (!val) errs.push(label);
      } else if (!String(val ?? "").trim()) {
        errs.push(label);
      }
    }
    if (hasSignificantRedFlag && !assessment.redFlagAction) {
      errs.push("Red-flag Action (required when a red flag is selected)");
    }
    if (hasSignificantRedFlag && !assessment.redFlagDetails.trim()) {
      errs.push("Red-flag Details (required when a red flag is selected)");
    }
    return errs;
  };

  const handleSubmit = () => {
    const errs = validate();
    if (errs.length) {
      setErrors(errs);
      // Scroll to top of modal where errors are shown
      document.getElementById("assessment-form-top")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    setErrors([]);
    onComplete(assessment);
  };

  // Shared input class that highlights missing required fields after submit attempt
  const fieldCls = (key: string) => {
    const val = getFieldValue(assessment, key);
    const missing = errors.length > 0 && !String(val ?? "").trim();
    return `w-full p-2 rounded-lg border text-xs focus:outline-none focus:border-[#12B8B0] transition-colors ${missing ? "border-rose-400 bg-rose-50" : "border-slate-200"}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md overflow-y-auto animate-in fade-in">
      {/* Centering wrapper — pushes card to center but allows it to grow taller than viewport */}
      <div className="min-h-full flex items-start justify-center p-4 sm:p-6">
      <div
        id="assessment-form-top"
        className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl relative border border-slate-200 text-slate-800 flex flex-col my-auto"
        style={{ maxHeight: "calc(100vh - 3rem)" }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ── Fixed header (never scrolls) ─────────────────────────────── */}
        <div className="px-6 sm:px-8 pt-6 sm:pt-8 pb-4 flex-shrink-0 border-b border-slate-100">
        <div className="space-y-1 pr-8">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>
              FitMed – Doctor Medical Fitness Assessment Form
            </h2>
            {isEditMode && (
              <span className="px-2.5 py-0.5 rounded-full bg-sky-100 border border-sky-200 text-sky-800 text-[10px] font-extrabold uppercase">
                Edit Mode
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Structured clinical form for virtual certification consultation · Fields marked <span className="text-rose-500 font-bold">*</span> are required
          </p>
        </div>

        {/* Validation error summary */}
        {errors.length > 0 && (
          <div className="mt-3 p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 space-y-2">
            <p className="text-xs font-extrabold text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Please complete all required fields before submitting:
            </p>
            <ul className="list-disc list-inside text-xs text-rose-700 space-y-0.5">
              {errors.map((e) => <li key={e}>{e}</li>)}
            </ul>
          </div>
        )}
        </div>

        {/* ── Scrollable form body ──────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-5 space-y-6 min-h-0">

        {/* ── SECTION 1: Patient & Certificate Information ──────────────────── */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <h3 className="text-sm font-extrabold text-[#0B2D5C] uppercase tracking-wider">
            1. Patient &amp; Certificate Information
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-slate-600 font-bold mb-1">Patient Name<Required /></label>
              <input
                type="text"
                value={assessment.patientName}
                onChange={(e) => setAssessment({ ...assessment, patientName: e.target.value })}
                className={fieldCls("patientName")}
                placeholder="Full legal name"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">Patient ID / National ID<Required /></label>
              <input
                type="text"
                value={assessment.patientId}
                onChange={(e) => setAssessment({ ...assessment, patientId: e.target.value })}
                className={fieldCls("patientId")}
                placeholder="National ID number"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">Date of Birth<Required /></label>
              <BrandDatePicker
                preset="birth"
                value={assessment.dateOfBirth}
                onChange={(dateOfBirth) => setAssessment({ ...assessment, dateOfBirth })}
              />
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">Sex<Required /></label>
              <BrandSelect
                size="compact"
                value={assessment.sex}
                onChange={(sex) => setAssessment({ ...assessment, sex })}
                options={["Male", "Female"]}
              />
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">Consultation Date</label>
              <input
                type="text"
                value={assessment.consultationDate}
                disabled
                className="w-full p-2 rounded-lg border border-slate-200 bg-slate-100 text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">Doctor Name</label>
              <input
                type="text"
                value={assessment.doctorName}
                disabled
                className="w-full p-2 rounded-lg border border-slate-200 bg-slate-100 text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">License No.</label>
              <input
                type="text"
                value={assessment.licenseNumber}
                disabled
                className="w-full p-2 rounded-lg border border-slate-200 bg-slate-100 text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">Certificate Purpose<Required /></label>
              <input
                type="text"
                value={assessment.certificatePurpose}
                onChange={(e) => setAssessment({ ...assessment, certificatePurpose: e.target.value })}
                className={fieldCls("certificatePurpose")}
                placeholder="e.g. General employment fitness"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">Occupation<Required /></label>
              <input
                type="text"
                value={assessment.occupation}
                onChange={(e) => setAssessment({ ...assessment, occupation: e.target.value })}
                className={fieldCls("occupation")}
                placeholder="Job title / role"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">Employer / Organisation</label>
              <input
                type="text"
                value={assessment.employer}
                onChange={(e) => setAssessment({ ...assessment, employer: e.target.value })}
                className="w-full p-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#12B8B0]"
                placeholder="Employer name (optional)"
              />
            </div>
          </div>
        </div>

        {/* ── SECTION 2: Red-Flag Screening ────────────────────────────────── */}
        <div className={`p-4 rounded-2xl border-2 space-y-3 ${hasSignificantRedFlag ? "bg-rose-50 border-rose-300" : "bg-amber-50 border-amber-300"}`}>
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-5 h-5 ${hasSignificantRedFlag ? "text-rose-600" : "text-amber-600"}`} />
            <h3 className="text-sm font-extrabold text-[#0B2D5C] uppercase tracking-wider">
              2. Red-Flag Screening – MUST Be Completed
            </h3>
          </div>
          <p className="text-xs text-slate-600">Ask the patient directly. Tick all symptoms currently present.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            {(Object.entries({
              chestPain: "Chest pain/pressure",
              severeShortnessBreath: "Severe shortness of breath",
              severePalpitations: "Severe palpitations",
              fainting: "Fainting/near-fainting",
              weaknessNumbness: "New weakness/numbness",
              speechDifficulty: "Speech difficulty",
              visionChange: "Sudden vision change",
              seizure: "Seizure",
              confusion: "New confusion",
              severeHeadache: "Severe/sudden headache",
              coughingBlood: "Coughing blood",
              severeAbdominalPain: "Severe abdominal pain",
              significantBleeding: "Significant bleeding",
              severeAllergicReaction: "Severe allergic reaction",
              severeTrauma: "Severe trauma/injury",
              otherSeriousSymptom: "Other serious symptom",
            }) as [keyof typeof assessment.redFlags, string][]).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={assessment.redFlags[key]}
                  onChange={(e) => setAssessment({ ...assessment, redFlags: { ...assessment.redFlags, [key]: e.target.checked } })}
                  className="w-4 h-4 rounded accent-rose-600"
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
          {hasSignificantRedFlag && (
            <div className="p-3 rounded-xl bg-rose-100 border border-rose-300 space-y-2">
              <p className="text-xs font-bold text-rose-900">⚠ Significant red flag detected — certification locked</p>
              <div>
                <label className="block text-xs font-bold text-rose-800 mb-1">Action Required<Required /></label>
                <BrandSelect
                  size="compact"
                  placeholder="Select urgent action..."
                  value={assessment.redFlagAction}
                  onChange={(redFlagAction) => setAssessment({ ...assessment, redFlagAction })}
                  options={[
                    { value: "same-day-physical", label: "Same-day physical review" },
                    { value: "urgent-referral", label: "Urgent referral" },
                  ]}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-rose-800 mb-1">Red-flag details<Required /></label>
                <textarea
                  value={assessment.redFlagDetails}
                  onChange={(e) => setAssessment({ ...assessment, redFlagDetails: e.target.value })}
                  rows={2}
                  className="w-full p-2 rounded-lg border border-rose-300 text-xs resize-none focus:outline-none focus:border-rose-500"
                  placeholder="Describe the red flag and action taken..."
                />
              </div>
            </div>
          )}
        </div>

        {/* ── SECTION 3: Relevant Medical History ──────────────────────────── */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <h3 className="text-sm font-extrabold text-[#0B2D5C] uppercase tracking-wider">
            3. Relevant Medical History
          </h3>
          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-600 font-bold mb-2">Known conditions (tick all that apply):</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {["Hypertension", "Diabetes", "Heart disease", "Asthma/COPD", "Epilepsy", "Stroke/TIA", "Kidney disease", "Liver disease", "Psychiatric", "Musculoskeletal"].map((condition) => (
                  <label key={condition} className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-3 h-3 rounded accent-[#12B8B0]"
                      checked={assessment.knownConditions.includes(condition)}
                      onChange={() => toggleArrayItem("knownConditions", condition)}
                    />
                    <span>{condition}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">Previous surgery / hospitalization:</label>
              <textarea
                value={assessment.previousSurgery}
                onChange={(e) => setAssessment({ ...assessment, previousSurgery: e.target.value })}
                rows={2}
                placeholder="None / describe if applicable"
                className="w-full p-2 rounded-lg border border-slate-200 text-xs resize-none focus:outline-none focus:border-[#12B8B0]"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">Current medications:</label>
              <textarea
                value={assessment.currentMedications}
                onChange={(e) => setAssessment({ ...assessment, currentMedications: e.target.value })}
                rows={2}
                placeholder="None / list name and dose"
                className="w-full p-2 rounded-lg border border-slate-200 text-xs resize-none focus:outline-none focus:border-[#12B8B0]"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">Allergies:</label>
              <input
                type="text"
                value={assessment.allergies}
                onChange={(e) => setAssessment({ ...assessment, allergies: e.target.value })}
                className="w-full p-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#12B8B0]"
                placeholder="None known or specify..."
              />
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">Smoking / alcohol / substance history:</label>
              <textarea
                value={assessment.smokingAlcoholHistory}
                onChange={(e) => setAssessment({ ...assessment, smokingAlcoholHistory: e.target.value })}
                rows={2}
                placeholder="None / describe"
                className="w-full p-2 rounded-lg border border-slate-200 text-xs resize-none focus:outline-none focus:border-[#12B8B0]"
              />
            </div>
          </div>
        </div>

        {/* ── SECTION 4: Occupational & Functional Assessment ───────────────── */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <h3 className="text-sm font-extrabold text-[#0B2D5C] uppercase tracking-wider">
            4. Occupational &amp; Functional Assessment
          </h3>
          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-600 font-bold mb-2">Main job / activity requirements (tick all that apply):</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {["Heavy physical", "Lifting", "Standing/walking", "Driving", "Machinery", "Heights", "Hazardous", "High concentration"].map((req) => (
                  <label key={req} className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-3 h-3 rounded accent-[#12B8B0]"
                      checked={assessment.jobRequirements.includes(req)}
                      onChange={() => toggleArrayItem("jobRequirements", req)}
                    />
                    <span>{req}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">Patient reports ability to perform duties<Required />:</label>
              <div className="flex gap-4">
                {["Yes", "No", "With limitations"].map((option) => (
                  <label key={option} className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="functionalAbility"
                      value={option}
                      checked={assessment.functionalAbility === option}
                      onChange={(e) => setAssessment({ ...assessment, functionalAbility: e.target.value })}
                      className="w-3 h-3 accent-[#12B8B0]"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">Functional limitation (if any):</label>
              <textarea
                value={assessment.functionalLimitation}
                onChange={(e) => setAssessment({ ...assessment, functionalLimitation: e.target.value })}
                rows={2}
                placeholder="Describe any limitation or write 'None'"
                className="w-full p-2 rounded-lg border border-slate-200 text-xs resize-none focus:outline-none focus:border-[#12B8B0]"
              />
            </div>
          </div>
        </div>

        {/* ── SECTION 5: Vital Signs ─────────────────────────────────────────── */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <h3 className="text-sm font-extrabold text-[#0B2D5C] uppercase tracking-wider">
            5. Vital Signs / Measurements
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {([
              { key: "bp",              label: "Blood Pressure",    req: true,  placeholder: "e.g. 120/80 mmHg" },
              { key: "heartRate",       label: "Heart Rate",        req: true,  placeholder: "bpm" },
              { key: "respiratoryRate", label: "Respiratory Rate",  req: false, placeholder: "breaths/min" },
              { key: "spo2",            label: "SpO₂",              req: true,  placeholder: "%" },
              { key: "temperature",     label: "Temperature",       req: false, placeholder: "°C" },
              { key: "weight",          label: "Weight",            req: false, placeholder: "kg" },
              { key: "height",          label: "Height",            req: false, placeholder: "cm" },
              { key: "bmi",             label: "BMI",               req: false, placeholder: "auto or manual" },
            ] as { key: keyof typeof assessment.vitals; label: string; req: boolean; placeholder: string }[]).map(({ key, label, req, placeholder }) => (
              <div key={key}>
                <label className="block text-slate-600 font-bold mb-1">{label}{req && <Required />}</label>
                <input
                  type="text"
                  value={assessment.vitals[key]}
                  onChange={(e) => setAssessment({ ...assessment, vitals: { ...assessment.vitals, [key]: e.target.value } })}
                  placeholder={placeholder}
                  className={req ? fieldCls(`vitals.${key}`) : "w-full p-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#12B8B0]"}
                />
              </div>
            ))}
          </div>
        </div>

        {/* ── SECTION 6: Virtual Physical Examination ───────────────────────── */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
          <h3 className="text-sm font-extrabold text-[#0B2D5C] uppercase tracking-wider">
            6. Virtual Physical Examination
          </h3>
          <p className="text-xs text-slate-600 italic">
            Observe through video and guide patient-performed assessments. Record only what can reasonably be assessed virtually.
          </p>

          {/* A. Mentation */}
          <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-2">
            <h4 className="text-xs font-bold text-slate-700">A. MENTATION / GENERAL APPEARANCE</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              {([ "alert", "oriented", "speechClear", "appearsWell", "noRespiratoryDistress" ] as const).map((k) => (
                <label key={k} className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={assessment.virtualExam.mentation[k]}
                    onChange={(e) => setAssessment({ ...assessment, virtualExam: { ...assessment.virtualExam, mentation: { ...assessment.virtualExam.mentation, [k]: e.target.checked } } })}
                    className="w-3 h-3 rounded accent-[#12B8B0]"
                  />
                  <span className="capitalize">{k.replace(/([A-Z])/g, " $1").replace("no Respiratory Distress", "No respiratory distress")}</span>
                </label>
              ))}
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1 text-xs">Abnormality observed:</label>
              <input
                type="text"
                value={assessment.virtualExam.mentation.abnormality}
                onChange={(e) => setAssessment({ ...assessment, virtualExam: { ...assessment.virtualExam, mentation: { ...assessment.virtualExam.mentation, abnormality: e.target.value } } })}
                className="w-full p-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#12B8B0]"
                placeholder="None / describe if present"
              />
            </div>
          </div>

          {/* B. Hearing */}
          <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-2">
            <h4 className="text-xs font-bold text-slate-700">B. HEARING</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              {(["conversesNormally", "hearsNormalVoice", "hearingDifficulty", "formalAssessmentRequired"] as const).map((k) => (
                <label key={k} className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={assessment.virtualExam.hearing[k]}
                    onChange={(e) => setAssessment({ ...assessment, virtualExam: { ...assessment.virtualExam, hearing: { ...assessment.virtualExam.hearing, [k]: e.target.checked } } })}
                    className="w-3 h-3 rounded accent-[#12B8B0]"
                  />
                  <span className="capitalize">{k.replace(/([A-Z])/g, " $1")}</span>
                </label>
              ))}
            </div>
          </div>

          {/* C. Vision */}
          <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-2">
            <h4 className="text-xs font-bold text-slate-700">C. VISION</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              {(["adequateVision", "canReadScreen", "usesGlasses", "visualImpairment", "formalAssessmentRequired"] as const).map((k) => (
                <label key={k} className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={assessment.virtualExam.vision[k]}
                    onChange={(e) => setAssessment({ ...assessment, virtualExam: { ...assessment.virtualExam, vision: { ...assessment.virtualExam.vision, [k]: e.target.checked } } })}
                    className="w-3 h-3 rounded accent-[#12B8B0]"
                  />
                  <span className="capitalize">{k.replace(/([A-Z])/g, " $1")}</span>
                </label>
              ))}
            </div>
          </div>

          {/* D. Neurological */}
          <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-2">
            <h4 className="text-xs font-bold text-slate-700">D. NEUROLOGICAL / MOBILITY – PATIENT-PERFORMED</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              {(["facialSymmetry", "speechAppropriate", "upperLimbSymmetry", "canStandIndependently", "canWalkSafely", "gaitNormal", "canPerformBalanceTask", "abnormalityObserved", "furtherAssessmentRequired"] as const).map((k) => (
                <label key={k} className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={assessment.virtualExam.neurological[k]}
                    onChange={(e) => setAssessment({ ...assessment, virtualExam: { ...assessment.virtualExam, neurological: { ...assessment.virtualExam.neurological, [k]: e.target.checked } } })}
                    className="w-3 h-3 rounded accent-[#12B8B0]"
                  />
                  <span className="capitalize">{k.replace(/([A-Z])/g, " $1")}</span>
                </label>
              ))}
            </div>
          </div>

          {/* E. Other Systems */}
          <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-2">
            <h4 className="text-xs font-bold text-slate-700">E. OTHER SYSTEMS – VISUAL INSPECTION ONLY</h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {(["cardiorespiratory", "skinGeneral", "musculoskeletal", "abdomen"] as const).map((k) => (
                <div key={k}>
                  <label className="block text-slate-600 font-bold mb-1 capitalize">{k.replace(/([A-Z])/g, " $1")}:</label>
                  <input
                    type="text"
                    value={assessment.virtualExam.otherSystems[k]}
                    onChange={(e) => setAssessment({ ...assessment, virtualExam: { ...assessment.virtualExam, otherSystems: { ...assessment.virtualExam.otherSystems, [k]: e.target.value } } })}
                    className="w-full p-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#12B8B0]"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── SECTION 7: Clinical Assessment ───────────────────────────────── */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <h3 className="text-sm font-extrabold text-[#0B2D5C] uppercase tracking-wider">
            7. Doctor&apos;s Clinical Assessment
          </h3>
          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-600 font-bold mb-1">Overall assessment<Required /></label>
              <BrandSelect
                size="compact"
                value={assessment.overallAssessment}
                onChange={(overallAssessment) => setAssessment({ ...assessment, overallAssessment })}
                options={[
                  "No significant abnormality identified virtually",
                  "Abnormal finding requiring physical examination",
                  "Investigation required",
                  "Specialist assessment required",
                  "Urgent medical assessment required",
                ]}
              />
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">
                Clinical impression / relevant findings<Required />
              </label>
              <textarea
                value={assessment.clinicalImpression}
                onChange={(e) => setAssessment({ ...assessment, clinicalImpression: e.target.value })}
                rows={3}
                placeholder="Summarise your findings from this virtual consultation..."
                className={`${fieldCls("clinicalImpression")} resize-none`}
              />
            </div>
          </div>
        </div>

        {/* ── SECTION 8: Certification Decision ────────────────────────────── */}
        <div className={`p-4 rounded-2xl border-2 space-y-3 ${hasSignificantRedFlag ? "bg-rose-50 border-rose-300" : "bg-emerald-50 border-emerald-300"}`}>
          <h3 className="text-sm font-extrabold text-[#0B2D5C] uppercase tracking-wider">
            8. Certification Decision<Required />
          </h3>
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              {([
                { value: "FIT",                    label: "FIT — Requirements met; certificate may be issued" },
                { value: "FIT_RESTRICTED",         label: "FIT WITH RESTRICTIONS — Certificate issued with conditions" },
                { value: "PHYSICAL_CONSULTATION",  label: "PHYSICAL CONSULTATION REQUIRED" },
                { value: "INVESTIGATION_SPECIALIST", label: "INVESTIGATION / SPECIALIST REQUIRED" },
                { value: "URGENT_REFERRAL",        label: "URGENT MEDICAL REFERRAL" },
              ] as { value: StructuredAssessmentData["decision"]; label: string }[]).map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                    hasSignificantRedFlag && option.value === "FIT" ? "opacity-40 cursor-not-allowed" : "hover:bg-white"
                  } ${assessment.decision === option.value ? "border-[#12B8B0] bg-white shadow-sm" : hasSignificantRedFlag ? "border-rose-200" : "border-emerald-200"}`}
                >
                  <input
                    type="radio"
                    name="decision"
                    value={option.value}
                    checked={assessment.decision === option.value}
                    onChange={(e) => setAssessment({ ...assessment, decision: e.target.value as StructuredAssessmentData["decision"] })}
                    disabled={hasSignificantRedFlag && option.value === "FIT"}
                    className="w-4 h-4 mt-0.5 accent-[#12B8B0]"
                  />
                  <span className="text-slate-700 leading-tight">{option.label}</span>
                </label>
              ))}
            </div>
            {hasSignificantRedFlag && (
              <p className="text-xs font-bold text-rose-700">⚠ FIT decision locked due to significant red flag.</p>
            )}
            <div>
              <label className="block text-slate-600 font-bold mb-1">Reason for decision<Required /></label>
              <textarea
                value={assessment.decisionReason}
                onChange={(e) => setAssessment({ ...assessment, decisionReason: e.target.value })}
                rows={2}
                placeholder="Clinical justification for the selected decision..."
                className={`${fieldCls("decisionReason")} resize-none`}
              />
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">Restrictions / follow-up / referral instructions:</label>
              <textarea
                value={assessment.restrictions}
                onChange={(e) => setAssessment({ ...assessment, restrictions: e.target.value })}
                rows={2}
                placeholder="e.g. 'No heavy lifting', 'Follow up in 3 months', or 'None'"
                className="w-full p-2 rounded-lg border border-slate-200 text-xs resize-none focus:outline-none focus:border-[#12B8B0]"
              />
            </div>
          </div>
        </div>

        {/* ── SECTION 9: Doctor Declaration ────────────────────────────────── */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <h3 className="text-sm font-extrabold text-[#0B2D5C] uppercase tracking-wider">
            9. Doctor Declaration
          </h3>
          <p className="text-xs text-slate-600 italic">
            I confirm that I reviewed the patient&apos;s relevant history, actively screened for red flags, performed the appropriate virtual assessment within the limitations of telemedicine, and based the certification decision on the clinical information available at the time of this consultation.
          </p>
          <div className="space-y-3 text-xs">
            <label className={`flex items-center gap-2 cursor-pointer p-3 rounded-xl border-2 transition-colors ${assessment.doctorDeclaration ? "border-emerald-400 bg-emerald-50" : errors.length > 0 ? "border-rose-400 bg-rose-50" : "border-slate-200"}`}>
              <input
                type="checkbox"
                checked={assessment.doctorDeclaration}
                onChange={(e) => setAssessment({ ...assessment, doctorDeclaration: e.target.checked })}
                className="w-5 h-5 rounded accent-emerald-600"
              />
              <span className="font-bold text-slate-700">
                I confirm the above declaration<Required />
              </span>
              {assessment.doctorDeclaration && <CheckCircle2 className="w-4 h-4 text-emerald-600 ml-auto" />}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Electronic signature (full name)<Required /></label>
                <input
                  type="text"
                  value={assessment.electronicSignature}
                  onChange={(e) => setAssessment({ ...assessment, electronicSignature: e.target.value })}
                  placeholder="Type your full legal name"
                  className={fieldCls("electronicSignature")}
                />
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">Date / time:</label>
                <input
                  type="text"
                  value={assessment.consultationDate}
                  disabled
                  className="w-full p-2 rounded-lg border border-slate-200 bg-slate-100 text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Error summary repeat at bottom for long form */}
        {errors.length > 0 && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-300">
            <p className="text-xs font-bold text-rose-700">{errors.length} required field{errors.length > 1 ? "s" : ""} missing — scroll up to see the full list.</p>
          </div>
        )}
        </div>{/* end scrollable body */}

        {/* ── Fixed footer (never scrolls) ─────────────────────────────── */}
        <div className="flex-shrink-0 flex justify-end gap-3 px-6 sm:px-8 py-4 bg-white/95 backdrop-blur-sm border-t border-slate-100 rounded-b-3xl">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2.5 rounded-xl bg-[#12B8B0] hover:bg-[#1dd9d0] text-[#0B2D5C] text-xs font-extrabold flex items-center gap-2 transition-colors shadow-sm"
          >
            <SaveIcon className="w-4 h-4" />
            {isEditMode ? "Save Changes" : "Submit Assessment"}
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
