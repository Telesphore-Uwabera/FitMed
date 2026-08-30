/**
 * FitMed Clinical Decision Engine
 * Implements the 4-outcome pathway: A (Certify) → B (Physical) → C (Investigate) → D (Urgent)
 * AI screens. Clinical rules guide. Doctors decide.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface WizardData {
  purpose: string;
  jobType: string;
  height: string;         // cm
  weight: string;         // kg
  bmi: string;            // calculated
  redFlags: Record<string, boolean>;
  symptoms: Record<string, boolean>;
  history: Record<string, boolean>;
  functional: Record<string, boolean>;
  vitals: {
    temperature: string;  // °C
    bp: string;           // "120/80"
    pulse: string;        // bpm
    spo2: string;         // %
  };
  additionalNotes: string;
}

export type ClinicalOutcome = "A" | "B" | "C" | "D";

export interface ClinicalDecision {
  outcome: ClinicalOutcome;
  urgency: "certify" | "physical" | "investigation" | "urgent";
  title: string;
  message: string;
  reasons: string[];
  draftId?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Red-Flag Definitions (§4) — any positive → Outcome D (Urgent Care)
// ─────────────────────────────────────────────────────────────────────────────

export const RED_FLAG_DEFINITIONS: Record<string, string> = {
  chest_pain_severe:       "New or severe chest pain / pressure",
  severe_shortness_breath: "Severe or sudden shortness of breath / respiratory distress",
  coughing_blood:          "Coughing blood (haemoptysis)",
  fainting:                "Fainting or loss of consciousness",
  near_fainting:           "Near-fainting associated with concerning features",
  severe_palpitations:     "Severe palpitations with dizziness, chest pain, or fainting",
  sudden_weakness:         "Sudden weakness or paralysis in any limb",
  facial_droop:            "Facial droop or difficulty speaking",
  new_confusion:           "Sudden new confusion or altered consciousness",
  sudden_vision_loss:      "Sudden vision loss or significant vision change",
  seizure:                 "Seizure or convulsion",
  sudden_severe_headache:  "Sudden severe or unusual headache (worst of life)",
  severe_abdominal_pain:   "Severe abdominal pain",
  vomiting_blood:          "Vomiting blood",
  gi_bleeding:             "Significant gastrointestinal bleeding",
  significant_bleeding:    "Significant or uncontrolled bleeding",
  severe_allergic_reaction:"Severe allergic reaction (anaphylaxis)",
  severe_dehydration:      "Severe dehydration",
  serious_systemic_illness:"Serious systemic illness",
  severe_trauma:           "Severe trauma or significant recent injury",
};

// ─────────────────────────────────────────────────────────────────────────────
// Physical-Consultation Triggers (§5) — any positive → Outcome B
// ─────────────────────────────────────────────────────────────────────────────

export const PHYSICAL_CONSULT_TRIGGERS: Record<string, string> = {
  recurrent_chest_discomfort: "Recurrent or unexplained chest discomfort",
  exertional_dyspnoea:        "Shortness of breath on exertion",
  recurrent_palpitations:     "Recurrent palpitations",
  unexplained_dizziness:      "Unexplained dizziness",
  previous_fainting:          "Previous unexplained fainting episode",
  new_headaches:              "New or changing recurrent headaches",
  seizure_history:            "History of seizures requiring review",
  persistent_cough:           "Persistent cough",
  persistent_wheeze:          "Persistent wheezing or poorly controlled asthma",
  significant_back_pain:      "Significant back pain affecting function",
  significant_joint_pain:     "Significant joint pain affecting movement or work",
  recent_fracture:            "Recent fracture",
  recent_significant_injury:  "Recent significant injury",
  persistent_fever:           "Persistent unexplained fever",
  persistent_fatigue:         "Persistent fatigue affecting daily function",
  unexplained_weight_loss:    "Unexplained significant weight loss",
  persistent_vomiting:        "Persistent vomiting",
  persistent_diarrhea:        "Persistent diarrhea",
  blood_urine:                "Blood in urine",
  blood_stool:                "Blood in stool",
};

// ─────────────────────────────────────────────────────────────────────────────
// Vital Sign Parsers
// ─────────────────────────────────────────────────────────────────────────────

function parseBP(bp: string): { systolic: number; diastolic: number } | null {
  const clean = bp.replace(/\s/g, "");
  const match = clean.match(/^(\d+)\/(\d+)$/);
  if (!match) return null;
  return { systolic: parseInt(match[1]), diastolic: parseInt(match[2]) };
}

function parseNum(val: string): number | null {
  const n = parseFloat(val.replace(",", "."));
  return isNaN(n) ? null : n;
}

// ─────────────────────────────────────────────────────────────────────────────
// Vital Sign Checks (Standard ranges: BP 100/60-140/90, Pulse 60-100, SpO2 94-100%, Temp 36.0-37.5°C)
// ─────────────────────────────────────────────────────────────────────────────

/** Returns reasons for Outcome D from vitals (critical emergency thresholds) */
function checkVitalsUrgent(vitals: WizardData["vitals"]): string[] {
  const flags: string[] = [];

  const bp = parseBP(vitals.bp);
  if (bp) {
    if (bp.systolic >= 180 || bp.diastolic >= 110)
      flags.push(`Critically elevated blood pressure (${vitals.bp} mmHg — requires urgent assessment)`);
    if (bp.systolic < 80 || bp.diastolic < 50)
      flags.push(`Critically low blood pressure (${vitals.bp} mmHg — requires urgent assessment)`);
  }

  const pulse = parseNum(vitals.pulse);
  if (pulse !== null) {
    if (pulse >= 130) flags.push(`Severe tachycardia (Pulse: ${vitals.pulse} bpm)`);
    if (pulse <= 40)  flags.push(`Severe bradycardia (Pulse: ${vitals.pulse} bpm)`);
  }

  const spo2 = parseNum(vitals.spo2);
  if (spo2 !== null && spo2 <= 90)
    flags.push(`Critical oxygen saturation (SpO₂: ${vitals.spo2}% — urgent respiratory assessment required)`);

  const temp = parseNum(vitals.temperature);
  if (temp !== null) {
    if (temp >= 39.5) flags.push(`High fever (Temperature: ${vitals.temperature}°C)`);
    if (temp < 35.0)  flags.push(`Hypothermia (Temperature: ${vitals.temperature}°C)`);
  }

  return flags;
}

/** Returns reasons for Outcome B from vitals (concerning thresholds requiring doctor review) */
function checkVitalsConcerning(vitals: WizardData["vitals"]): string[] {
  const flags: string[] = [];

  const bp = parseBP(vitals.bp);
  if (bp) {
    // Normal is 100/60 to 140/90
    if ((bp.systolic > 140 && bp.systolic < 180) || (bp.diastolic > 90 && bp.diastolic < 110))
      flags.push(`Elevated blood pressure (${vitals.bp} mmHg) — doctor clinical review required (standard: 100/60–140/90 mmHg)`);
    if ((bp.systolic >= 80 && bp.systolic < 100) || (bp.diastolic >= 50 && bp.diastolic < 60))
      flags.push(`Low blood pressure (${vitals.bp} mmHg) — doctor clinical review required (standard: 100/60–140/90 mmHg)`);
  }

  const pulse = parseNum(vitals.pulse);
  if (pulse !== null) {
    // Normal is 60 to 100
    if (pulse > 100 && pulse < 130) flags.push(`Tachycardia (Pulse: ${vitals.pulse} bpm — standard: 60–100 bpm)`);
    if (pulse < 60 && pulse > 40)   flags.push(`Bradycardia (Pulse: ${vitals.pulse} bpm — standard: 60–100 bpm)`);
  }

  const spo2 = parseNum(vitals.spo2);
  if (spo2 !== null) {
    // Normal is 94 to 100
    if (spo2 > 90 && spo2 < 94)
      flags.push(`Reduced oxygen saturation (SpO₂: ${vitals.spo2}% — standard: 94–100%)`);
  }

  const temp = parseNum(vitals.temperature);
  if (temp !== null) {
    // Normal is 36.0 to 37.5
    if (temp > 37.5 && temp < 39.5)
      flags.push(`Elevated temperature / Fever (${vitals.temperature}°C — standard: 36.0–37.5°C)`);
    if (temp >= 35.0 && temp < 36.0)
      flags.push(`Low body temperature (${vitals.temperature}°C — standard: 36.0–37.5°C)`);
  }

  return flags;
}

// ─────────────────────────────────────────────────────────────────────────────
// Occupation-Specific Checks (§7)
// ─────────────────────────────────────────────────────────────────────────────

function checkOccupationSpecific(data: WizardData): string[] {
  const flags: string[] = [];
  const ctx = `${data.jobType} ${data.purpose}`.toLowerCase();

  const isDriving    = ctx.includes("driv") || ctx.includes("transport") || ctx.includes("logistics");
  const isHeights    = ctx.includes("height") || ctx.includes("scaffold") || ctx.includes("tower");
  const isMachinery  = ctx.includes("machin") || ctx.includes("construction") || ctx.includes("mining");
  const isAviation   = ctx.includes("aviat") || ctx.includes("maritime") || ctx.includes("security") || ctx.includes("armed");

  const hasSeizure   = data.history?.epilepsy_seizure === true;
  const hasFainting  = data.history?.syncope_fainting === true || data.symptoms?.previous_fainting === true;
  const hasVision    = data.symptoms?.visual_disturbances === true;
  const hasPsych     = data.history?.psychiatric === true;

  if (isDriving) {
    if (hasSeizure)  flags.push("Professional driving: seizure history requires specialist assessment before certification");
    if (hasFainting) flags.push("Professional driving: fainting history requires cardiovascular/neurological review");
    if (hasVision)   flags.push("Professional driving: visual disturbance requires formal vision assessment");
  }

  if (isHeights) {
    if (hasSeizure)  flags.push("Working at heights: seizure history is a specific contraindication — physical assessment required");
    if (hasFainting) flags.push("Working at heights: syncope/near-fainting requires cardiovascular assessment");
  }

  if (isMachinery) {
    if (hasSeizure)  flags.push("Heavy machinery operation: seizure history requires specialist review");
    if (hasPsych)    flags.push("Heavy machinery: psychiatric condition requires functional assessment for safe operation");
  }

  if (isAviation) {
    flags.push("Safety-critical occupation (aviation / maritime / armed): occupation-specific medical standards apply — physical assessment required");
  }

  return flags;
}

// ─────────────────────────────────────────────────────────────────────────────
// Investigation Triggers (§6, Outcome C)
// ─────────────────────────────────────────────────────────────────────────────

const INVESTIGATION_HISTORY_KEYS: Record<string, string> = {
  hospitalization: "Recent hospitalization (within 3 months) — clinical review required before certification",
  surgery:         "Recent surgery (within 6 months) — post-operative assessment required",
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Engine (§26)
// ─────────────────────────────────────────────────────────────────────────────

export function runClinicalEngine(data: WizardData): ClinicalDecision {

  // ── Step 4: Emergency Screening → Outcome D ──────────────────────────────
  const activeRedFlags = Object.entries(data.redFlags ?? {})
    .filter(([, v]) => v === true)
    .map(([k]) => RED_FLAG_DEFINITIONS[k] ?? k);

  const urgentVitals = checkVitalsUrgent(data.vitals);

  if (activeRedFlags.length > 0 || urgentVitals.length > 0) {
    return {
      outcome: "D",
      urgency: "urgent",
      title: "Urgent Medical Care Required",
      message:
        "Your responses include a potential medical warning sign. An urgent medical assessment is recommended. FitMed cannot issue an electronic fitness certificate at this time.",
      reasons: [...activeRedFlags, ...urgentVitals],
    };
  }

  // ── Step 6: Investigation / Specialist Screening → Outcome C ─────────────
  const investigationReasons = Object.entries(data.history ?? {})
    .filter(([k, v]) => v === true && INVESTIGATION_HISTORY_KEYS[k])
    .map(([k]) => INVESTIGATION_HISTORY_KEYS[k]);

  if (investigationReasons.length > 0) {
    return {
      outcome: "C",
      urgency: "investigation",
      title: "Additional Medical Assessment Required",
      message:
        "Additional medical assessment and/or investigation is required before a fitness certificate can be issued. Certification is pending until the required assessment or results are available.",
      reasons: investigationReasons,
    };
  }

  // ── Step 5: Physical Consultation Screening → Outcome B ──────────────────
  const consultSymptoms = Object.entries(data.symptoms ?? {})
    .filter(([k, v]) => v === true && PHYSICAL_CONSULT_TRIGGERS[k])
    .map(([k]) => PHYSICAL_CONSULT_TRIGGERS[k]);

  const concerningVitals = checkVitalsConcerning(data.vitals);
  const occupationFlags  = checkOccupationSpecific(data);

  // Functional limitation
  const functionalLimitations = Object.entries(data.functional ?? {})
    .filter(([k, v]) => v === false && ["walk", "stairs", "lift"].includes(k))
    .map(([k]) =>
      ({ walk: "Unable to walk without difficulty", stairs: "Unable to climb stairs", lift: "Unable to lift light objects without pain" }[k] ?? k)
    );

  // Poorly controlled or significant chronic conditions
  const concerningHistory: string[] = [];
  if (data.history?.chronic_illness)
    concerningHistory.push("Chronic illness reported — doctor will review suitability for certification");
  if (data.history?.disability)
    concerningHistory.push("Disability or mobility limitation — functional assessment recommended");

  const physicalReasons = [
    ...consultSymptoms,
    ...concerningVitals,
    ...occupationFlags,
    ...functionalLimitations,
    ...concerningHistory,
  ];

  if (physicalReasons.length > 0) {
    return {
      outcome: "B",
      urgency: "physical",
      title: "Physical Assessment Required",
      message:
        "FitMed cannot safely issue an electronic fitness certificate based on the information provided. A physical medical assessment is recommended before certification can proceed.",
      reasons: physicalReasons,
    };
  }

  // ── Step 8: Outcome A — Eligible for Electronic Certification ────────────
  return {
    outcome: "A",
    urgency: "certify",
    title: "Eligible for Electronic Certification",
    message:
      "Your assessment indicates that you may proceed with electronic fitness certification. A licensed FitMed physician will review your assessment and issue your digital certificate.",
    reasons: [
      "No red flags or danger signs identified",
      "No concerning symptoms requiring physical examination",
      "Vital signs within acceptable range",
      "Functional ability assessed as adequate for requested activity",
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// BMI Calculator
// ─────────────────────────────────────────────────────────────────────────────

export function calculateBMI(heightCm: string, weightKg: string): string {
  const h = parseNum(heightCm);
  const w = parseNum(weightKg);
  if (!h || !w || h <= 0) return "";
  const bmi = w / ((h / 100) ** 2);
  return bmi.toFixed(1);
}

export function bmiCategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: "Underweight", color: "text-sky-600" };
  if (bmi < 25)   return { label: "Normal weight", color: "text-emerald-600" };
  if (bmi < 30)   return { label: "Overweight", color: "text-amber-600" };
  return { label: "Obese", color: "text-rose-600" };
}

export function ageFromDateOfBirth(dob?: string | Date | null): number | null {
  if (!dob) return null;
  let birth: Date;
  if (dob instanceof Date) {
    birth = dob;
  } else {
    const iso = String(dob).trim().slice(0, 10);
    const parts = iso.split("-").map(Number);
    if (parts.length === 3 && parts.every((n) => Number.isFinite(n))) {
      birth = new Date(parts[0], parts[1] - 1, parts[2]);
    } else {
      birth = new Date(dob);
    }
  }
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let years = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) years -= 1;
  if (years < 0 || years > 120) return null;
  return years;
}

type BpRange = { sys: number; dia: number };

const BP_CHART_BY_AGE: {
  label: string;
  minYears: number;
  maxYears: number;
  min: BpRange;
  normal: BpRange;
  max: BpRange;
}[] = [
  { label: "1 to 12 months", minYears: 0, maxYears: 0, min: { sys: 75, dia: 50 }, normal: { sys: 90, dia: 60 }, max: { sys: 110, dia: 75 } },
  { label: "1 to 5 years", minYears: 1, maxYears: 5, min: { sys: 80, dia: 55 }, normal: { sys: 95, dia: 65 }, max: { sys: 110, dia: 79 } },
  { label: "6 to 13 years", minYears: 6, maxYears: 13, min: { sys: 90, dia: 60 }, normal: { sys: 105, dia: 70 }, max: { sys: 115, dia: 80 } },
  { label: "14 to 19 years", minYears: 14, maxYears: 19, min: { sys: 105, dia: 73 }, normal: { sys: 117, dia: 77 }, max: { sys: 120, dia: 81 } },
  { label: "20 to 24 years", minYears: 20, maxYears: 24, min: { sys: 108, dia: 75 }, normal: { sys: 120, dia: 79 }, max: { sys: 132, dia: 83 } },
  { label: "25 to 29 years", minYears: 25, maxYears: 29, min: { sys: 109, dia: 76 }, normal: { sys: 121, dia: 80 }, max: { sys: 133, dia: 84 } },
  { label: "30 to 34 years", minYears: 30, maxYears: 34, min: { sys: 110, dia: 77 }, normal: { sys: 122, dia: 81 }, max: { sys: 134, dia: 85 } },
  { label: "35 to 39 years", minYears: 35, maxYears: 39, min: { sys: 111, dia: 78 }, normal: { sys: 123, dia: 82 }, max: { sys: 135, dia: 86 } },
  { label: "40 to 44 years", minYears: 40, maxYears: 44, min: { sys: 112, dia: 79 }, normal: { sys: 125, dia: 83 }, max: { sys: 137, dia: 87 } },
  { label: "45 to 49 years", minYears: 45, maxYears: 49, min: { sys: 115, dia: 80 }, normal: { sys: 127, dia: 84 }, max: { sys: 139, dia: 88 } },
  { label: "50 to 54 years", minYears: 50, maxYears: 54, min: { sys: 116, dia: 81 }, normal: { sys: 129, dia: 85 }, max: { sys: 142, dia: 89 } },
  { label: "55 to 59 years", minYears: 55, maxYears: 59, min: { sys: 118, dia: 82 }, normal: { sys: 131, dia: 86 }, max: { sys: 144, dia: 90 } },
  { label: "60 years and above", minYears: 60, maxYears: 120, min: { sys: 121, dia: 83 }, normal: { sys: 134, dia: 87 }, max: { sys: 147, dia: 91 } },
];

function bpBandForAge(ageYears: number) {
  return BP_CHART_BY_AGE.find((band) => ageYears >= band.minYears && ageYears <= band.maxYears) || BP_CHART_BY_AGE[BP_CHART_BY_AGE.length - 1];
}

export interface VitalAssessment {
  label: string;
  color: string;
  detail: string;
  isNormal: boolean;
}

export function assessBloodPressure(
  bp: string,
  ageYears?: number | null
): VitalAssessment | null {
  const parsed = parseBP(bp);
  if (!parsed) return null;
  const { systolic, diastolic } = parsed;

  if (systolic >= 180 || diastolic >= 110) {
    return {
      label: "Critical High",
      color: "text-rose-600",
      detail: "Critically elevated blood pressure (≥180/110 mmHg). Urgent medical evaluation required.",
      isNormal: false,
    };
  }
  if (systolic < 80 || diastolic < 50) {
    return {
      label: "Critical Low",
      color: "text-rose-600",
      detail: "Critically low blood pressure (<80/50 mmHg). Urgent medical evaluation required.",
      isNormal: false,
    };
  }
  if (systolic > 140 || diastolic > 90) {
    return {
      label: "Elevated / High",
      color: "text-amber-600",
      detail: `Above standard range (100/60–140/90 mmHg). Your doctor will review this with your age (${ageYears ? `${ageYears} yrs` : "as registered"}).`,
      isNormal: false,
    };
  }
  if (systolic < 100 || diastolic < 60) {
    return {
      label: "Low",
      color: "text-sky-600",
      detail: `Below standard range (100/60–140/90 mmHg). Your doctor will review this with your age (${ageYears ? `${ageYears} yrs` : "as registered"}).`,
      isNormal: false,
    };
  }

  return {
    label: "Normal",
    color: "text-emerald-600",
    detail: "Standard normal range (100/60–140/90 mmHg). Doctor will make final assessment.",
    isNormal: true,
  };
}

export function assessPulse(pulseStr: string): VitalAssessment | null {
  const pulse = parseNum(pulseStr);
  if (pulse === null) return null;
  if (pulse >= 130) {
    return { label: "Severe Tachycardia", color: "text-rose-600", detail: "Severely high pulse rate (≥130 bpm).", isNormal: false };
  }
  if (pulse <= 40) {
    return { label: "Severe Bradycardia", color: "text-rose-600", detail: "Severely low pulse rate (≤40 bpm).", isNormal: false };
  }
  if (pulse > 100) {
    return { label: "High / Tachycardia", color: "text-amber-600", detail: "Above standard range (60–100 bpm). Doctor will evaluate.", isNormal: false };
  }
  if (pulse < 60) {
    return { label: "Low / Bradycardia", color: "text-sky-600", detail: "Below standard range (60–100 bpm). Doctor will evaluate.", isNormal: false };
  }
  return { label: "Normal", color: "text-emerald-600", detail: "Standard normal range (60–100 bpm).", isNormal: true };
}

export function assessSpO2(spo2Str: string): VitalAssessment | null {
  const spo2 = parseNum(spo2Str);
  if (spo2 === null) return null;
  if (spo2 <= 90) {
    return { label: "Critical", color: "text-rose-600", detail: "Critical oxygen saturation (≤90%).", isNormal: false };
  }
  if (spo2 < 94) {
    return { label: "Reduced", color: "text-amber-600", detail: "Below standard range (94–100%). Doctor will evaluate.", isNormal: false };
  }
  return { label: "Normal", color: "text-emerald-600", detail: "Standard normal range (94–100%).", isNormal: true };
}

export function assessTemperature(tempStr: string): VitalAssessment | null {
  const temp = parseNum(tempStr);
  if (temp === null) return null;
  if (temp >= 39.5) {
    return { label: "High Fever", color: "text-rose-600", detail: "High fever (≥39.5°C). Urgent medical review.", isNormal: false };
  }
  if (temp > 37.5) {
    return { label: "Elevated / Fever", color: "text-amber-600", detail: "Above standard range (36.0–37.5°C). Doctor will evaluate.", isNormal: false };
  }
  if (temp < 35.0) {
    return { label: "Hypothermia", color: "text-rose-600", detail: "Critically low body temperature (<35.0°C).", isNormal: false };
  }
  if (temp < 36.0) {
    return { label: "Low", color: "text-sky-600", detail: "Below standard range (36.0–37.5°C). Doctor will evaluate.", isNormal: false };
  }
  return { label: "Normal", color: "text-emerald-600", detail: "Standard normal range (36.0–37.5°C).", isNormal: true };
}

export function assessBloodPressureByAge(
  bp: string,
  ageYears: number | null
): { label: string; color: string; detail: string } | null {
  return assessBloodPressure(bp, ageYears);
}
