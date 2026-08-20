"use client";

import { useState, useEffect } from "react";
import { X, AlertTriangle, CheckCircle2 } from "lucide-react";

interface StructuredAssessmentData {
  // Section 1: Patient & Certificate Information
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

  // Section 2: Red-Flag Screening
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

  // Section 3: Relevant Medical History
  knownConditions: string[];
  previousSurgery: string;
  currentMedications: string;
  allergies: string;
  smokingAlcoholHistory: string;

  // Section 4: Occupational & Functional Assessment
  jobRequirements: string[];
  functionalAbility: string;
  functionalLimitation: string;

  // Section 5: Vital Signs / Measurements
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

  // Section 6: Virtual Physical Examination
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

  // Section 7: Doctor's Clinical Assessment
  overallAssessment: string;
  clinicalImpression: string;

  // Section 8: Certification Decision
  decision: "FIT" | "FIT_RESTRICTED" | "PHYSICAL_CONSULTATION" | "INVESTIGATION_SPECIALIST" | "URGENT_REFERRAL";
  decisionReason: string;
  restrictions: string;

  // Section 9: Doctor Declaration
  doctorDeclaration: boolean;
  electronicSignature: string;
}

interface StructuredDoctorAssessmentFormProps {
  candidate: any;
  doctorName: string;
  doctorLicense: string;
  onComplete: (data: StructuredAssessmentData) => void;
  onClose: () => void;
}

export default function StructuredDoctorAssessmentForm({
  candidate,
  doctorName,
  doctorLicense,
  onComplete,
  onClose,
}: StructuredDoctorAssessmentFormProps) {
  const [assessment, setAssessment] = useState<StructuredAssessmentData>({
    // Section 1
    patientName: candidate?.name || "",
    patientId: candidate?.nationalId || "",
    dateOfBirth: candidate?.dateOfBirth || "",
    sex: candidate?.gender || "Male",
    consultationDate: "",
    doctorName,
    licenseNumber: doctorLicense,
    certificatePurpose: candidate?.purpose || "",
    occupation: candidate?.jobType || "",
    employer: "",

    // Section 2
    redFlags: {
      chestPain: false,
      severeShortnessBreath: false,
      severePalpitations: false,
      fainting: false,
      weaknessNumbness: false,
      speechDifficulty: false,
      visionChange: false,
      seizure: false,
      confusion: false,
      severeHeadache: false,
      coughingBlood: false,
      severeAbdominalPain: false,
      significantBleeding: false,
      severeAllergicReaction: false,
      severeTrauma: false,
      otherSeriousSymptom: false,
    },
    redFlagAction: "",
    redFlagDetails: "",

    // Section 3
    knownConditions: [],
    previousSurgery: "",
    currentMedications: "",
    allergies: "None known",
    smokingAlcoholHistory: "",

    // Section 4
    jobRequirements: [],
    functionalAbility: "Yes",
    functionalLimitation: "",

    // Section 5
    vitals: {
      bp: candidate?.vitals?.bp || "",
      heartRate: candidate?.vitals?.hr || "",
      respiratoryRate: "",
      spo2: candidate?.vitals?.spo2 || "",
      temperature: "",
      weight: candidate?.weight || "",
      height: candidate?.height || "",
      bmi: candidate?.bmi || "",
    },

    // Section 6
    virtualExam: {
      mentation: {
        alert: true,
        oriented: true,
        speechClear: true,
        appearsWell: true,
        noRespiratoryDistress: true,
        abnormality: "",
      },
      hearing: {
        conversesNormally: true,
        hearsNormalVoice: true,
        hearingDifficulty: false,
        formalAssessmentRequired: false,
      },
      vision: {
        adequateVision: true,
        canReadScreen: true,
        usesGlasses: false,
        visualImpairment: false,
        formalAssessmentRequired: false,
      },
      neurological: {
        facialSymmetry: true,
        speechAppropriate: true,
        upperLimbSymmetry: true,
        canStandIndependently: true,
        canWalkSafely: true,
        gaitNormal: true,
        canPerformBalanceTask: true,
        abnormalityObserved: false,
        furtherAssessmentRequired: false,
      },
      otherSystems: {
        cardiorespiratory: "No obvious distress",
        skinGeneral: "No obvious abnormality",
        musculoskeletal: "No obvious limitation",
        abdomen: "No obvious abnormality",
      },
    },

    // Section 7
    overallAssessment: "No significant abnormality identified virtually",
    clinicalImpression: "",

    // Section 8
    decision: "FIT",
    decisionReason: "",
    restrictions: "",

    // Section 9
    doctorDeclaration: false,
    electronicSignature: "",
  });

  const hasSignificantRedFlag = Object.values(assessment.redFlags).some((v) => v === true);

  useEffect(() => {
    setAssessment((prev) =>
      prev.consultationDate
        ? prev
        : { ...prev, consultationDate: new Date().toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) }
    );
  }, []);

  const handleSubmit = () => {
    if (!assessment.doctorDeclaration) {
      alert("Please confirm the doctor declaration before submitting.");
      return;
    }
    onComplete(assessment);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-4xl w-full max-h-[95vh] overflow-y-auto space-y-6 shadow-2xl relative border border-slate-200 text-slate-800">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>
            FitMed – Doctor Medical Fitness Assessment Form
          </h2>
          <p className="text-xs text-slate-500">
            Structured clinical form for virtual certification consultation
          </p>
        </div>

        {/* Section 1: Patient & Certificate Information */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <h3 className="text-sm font-extrabold text-[#0B2D5C] uppercase tracking-wider">
            1. Patient & Certificate Information
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-slate-600 font-bold mb-1">Patient Name</label>
              <input
                type="text"
                value={assessment.patientName}
                onChange={(e) => setAssessment({ ...assessment, patientName: e.target.value })}
                className="w-full p-2 rounded-lg border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">Patient ID</label>
              <input
                type="text"
                value={assessment.patientId}
                onChange={(e) => setAssessment({ ...assessment, patientId: e.target.value })}
                className="w-full p-2 rounded-lg border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">Date of Birth</label>
              <input
                type="text"
                value={assessment.dateOfBirth}
                onChange={(e) => setAssessment({ ...assessment, dateOfBirth: e.target.value })}
                className="w-full p-2 rounded-lg border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">Sex</label>
              <select
                value={assessment.sex}
                onChange={(e) => setAssessment({ ...assessment, sex: e.target.value })}
                className="w-full p-2 rounded-lg border border-slate-200"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">Consultation Date</label>
              <input
                type="text"
                value={assessment.consultationDate}
                disabled
                className="w-full p-2 rounded-lg border border-slate-200 bg-slate-100"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">Doctor Name</label>
              <input
                type="text"
                value={assessment.doctorName}
                disabled
                className="w-full p-2 rounded-lg border border-slate-200 bg-slate-100"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">License No.</label>
              <input
                type="text"
                value={assessment.licenseNumber}
                disabled
                className="w-full p-2 rounded-lg border border-slate-200 bg-slate-100"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">Certificate Purpose</label>
              <input
                type="text"
                value={assessment.certificatePurpose}
                onChange={(e) => setAssessment({ ...assessment, certificatePurpose: e.target.value })}
                className="w-full p-2 rounded-lg border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">Occupation</label>
              <input
                type="text"
                value={assessment.occupation}
                onChange={(e) => setAssessment({ ...assessment, occupation: e.target.value })}
                className="w-full p-2 rounded-lg border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">Employer/Org</label>
              <input
                type="text"
                value={assessment.employer}
                onChange={(e) => setAssessment({ ...assessment, employer: e.target.value })}
                className="w-full p-2 rounded-lg border border-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Red-Flag Screening */}
        <div className={`p-4 rounded-2xl border-2 space-y-3 ${hasSignificantRedFlag ? 'bg-rose-50 border-rose-300' : 'bg-amber-50 border-amber-300'}`}>
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-5 h-5 ${hasSignificantRedFlag ? 'text-rose-600' : 'text-amber-600'}`} />
            <h3 className="text-sm font-extrabold text-[#0B2D5C] uppercase tracking-wider">
              2. Red-Flag Screening – MUST Be Completed
            </h3>
          </div>
          <p className="text-xs text-slate-600">Ask the patient directly. Tick all symptoms present.</p>
          
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2 text-xs">
            {Object.entries({
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
            }).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={assessment.redFlags[key as keyof typeof assessment.redFlags]}
                  onChange={(e) => setAssessment({
                    ...assessment,
                    redFlags: { ...assessment.redFlags, [key]: e.target.checked }
                  })}
                  className="w-4 h-4 rounded"
                />
                <span>{label}</span>
              </label>
            ))}
          </div>

          {hasSignificantRedFlag && (
            <div className="p-3 rounded-xl bg-rose-100 border border-rose-300 space-y-2">
              <p className="text-xs font-bold text-rose-900">⚠️ Significant red flag detected - Certification locked</p>
              <div>
                <label className="block text-xs font-bold text-rose-800 mb-1">Action Required:</label>
                <select
                  value={assessment.redFlagAction}
                  onChange={(e) => setAssessment({ ...assessment, redFlagAction: e.target.value })}
                  className="w-full p-2 rounded-lg border border-rose-300 text-xs"
                >
                  <option value="">Urgent assessment/referral</option>
                  <option value="same-day-physical">Same-day physical review</option>
                  <option value="urgent-referral">Urgent referral</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-rose-800 mb-1">Red-flag details:</label>
                <textarea
                  value={assessment.redFlagDetails}
                  onChange={(e) => setAssessment({ ...assessment, redFlagDetails: e.target.value })}
                  rows={2}
                  className="w-full p-2 rounded-lg border border-rose-300 text-xs resize-none"
                  placeholder="Describe the red flag and action taken..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Relevant Medical History */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <h3 className="text-sm font-extrabold text-[#0B2D5C] uppercase tracking-wider">
            3. Relevant Medical History
          </h3>
          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-600 font-bold mb-1">Known conditions:</label>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                {["Hypertension", "Diabetes", "Heart disease", "Asthma/COPD", "Epilepsy", "Stroke/TIA", "Kidney disease", "Liver disease", "Psychiatric", "Musculoskeletal"].map((condition) => (
                  <label key={condition} className="flex items-center gap-1">
                    <input type="checkbox" className="w-3 h-3 rounded" />
                    <span>{condition}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">Previous surgery/hospitalization:</label>
              <textarea
                value={assessment.previousSurgery}
                onChange={(e) => setAssessment({ ...assessment, previousSurgery: e.target.value })}
                rows={2}
                className="w-full p-2 rounded-lg border border-slate-200 resize-none"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">Current medications:</label>
              <textarea
                value={assessment.currentMedications}
                onChange={(e) => setAssessment({ ...assessment, currentMedications: e.target.value })}
                rows={2}
                className="w-full p-2 rounded-lg border border-slate-200 resize-none"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">Allergies:</label>
              <input
                type="text"
                value={assessment.allergies}
                onChange={(e) => setAssessment({ ...assessment, allergies: e.target.value })}
                className="w-full p-2 rounded-lg border border-slate-200"
                placeholder="None known or specify..."
              />
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">Smoking/alcohol/substance history:</label>
              <textarea
                value={assessment.smokingAlcoholHistory}
                onChange={(e) => setAssessment({ ...assessment, smokingAlcoholHistory: e.target.value })}
                rows={2}
                className="w-full p-2 rounded-lg border border-slate-200 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Occupational & Functional Assessment */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <h3 className="text-sm font-extrabold text-[#0B2D5C] uppercase tracking-wider">
            4. Occupational & Functional Assessment
          </h3>
          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-600 font-bold mb-1">Main job/activity requirements:</label>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {["Heavy physical", "Lifting", "Standing/walking", "Driving", "Machinery", "Heights", "Hazardous", "High concentration"].map((req) => (
                  <label key={req} className="flex items-center gap-1">
                    <input type="checkbox" className="w-3 h-3 rounded" />
                    <span>{req}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">Patient reports ability to perform duties:</label>
              <div className="flex gap-4">
                {["Yes", "No", "With limitations"].map((option) => (
                  <label key={option} className="flex items-center gap-1">
                    <input
                      type="radio"
                      name="functionalAbility"
                      value={option}
                      checked={assessment.functionalAbility === option}
                      onChange={(e) => setAssessment({ ...assessment, functionalAbility: e.target.value })}
                      className="w-3 h-3"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">Functional limitation:</label>
              <textarea
                value={assessment.functionalLimitation}
                onChange={(e) => setAssessment({ ...assessment, functionalLimitation: e.target.value })}
                rows={2}
                className="w-full p-2 rounded-lg border border-slate-200 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Vital Signs */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <h3 className="text-sm font-extrabold text-[#0B2D5C] uppercase tracking-wider">
            5. Vital Signs / Measurements
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {[
              { key: "bp", label: "BP" },
              { key: "heartRate", label: "Heart rate" },
              { key: "respiratoryRate", label: "Respiratory rate" },
              { key: "spo2", label: "SpO₂" },
              { key: "temperature", label: "Temperature" },
              { key: "weight", label: "Weight" },
              { key: "height", label: "Height" },
              { key: "bmi", label: "BMI" },
            ].map(({ key: vitalsKey, label }) => (
              <div key={vitalsKey}>
                <label className="block text-slate-600 font-bold mb-1">{label}</label>
                <input
                  type="text"
                  value={assessment.vitals[vitalsKey as keyof typeof assessment.vitals]}
                  onChange={(e) => setAssessment({
                    ...assessment,
                    vitals: { ...assessment.vitals, [vitalsKey]: e.target.value }
                  })}
                  className="w-full p-2 rounded-lg border border-slate-200"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Section 6: Virtual Physical Examination */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
          <h3 className="text-sm font-extrabold text-[#0B2D5C] uppercase tracking-wider">
            6. Virtual Physical Examination
          </h3>
          <p className="text-xs text-slate-600 italic">
            Doctor observes through video and guides patient-performed assessments. Record only what can reasonably be assessed virtually.
          </p>

          {/* A. Mentation */}
          <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-2">
            <h4 className="text-xs font-bold text-slate-700">A. MENTATION / GENERAL APPEARANCE</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              {[
                { key: "alert", label: "Alert and appropriately responsive" },
                { key: "oriented", label: "Oriented to person/place/time" },
                { key: "speechClear", label: "Speech clear and coherent" },
                { key: "appearsWell", label: "Appears well / not acutely ill" },
                { key: "noRespiratoryDistress", label: "No obvious respiratory distress" },
              ].map(({ key: mentationKey, label }) => (
                <label key={mentationKey} className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={assessment.virtualExam.mentation[mentationKey as keyof typeof assessment.virtualExam.mentation]}
                    onChange={(e) => setAssessment({
                      ...assessment,
                      virtualExam: {
                        ...assessment.virtualExam,
                        mentation: { ...assessment.virtualExam.mentation, [mentationKey]: e.target.checked }
                      }
                    })}
                    className="w-3 h-3 rounded"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">Abnormality observed:</label>
              <input
                type="text"
                value={assessment.virtualExam.mentation.abnormality}
                onChange={(e) => setAssessment({
                  ...assessment,
                  virtualExam: {
                    ...assessment.virtualExam,
                    mentation: { ...assessment.virtualExam.mentation, abnormality: e.target.value }
                  }
                })}
                className="w-full p-2 rounded-lg border border-slate-200 text-xs"
              />
            </div>
          </div>

          {/* B. Hearing, C. Vision, D. Neurological */}
          {[
            { section: "hearing", title: "B. HEARING", fields: ["conversesNormally", "hearsNormalVoice", "hearingDifficulty", "formalAssessmentRequired"] },
            { section: "vision", title: "C. VISION", fields: ["adequateVision", "canReadScreen", "usesGlasses", "visualImpairment", "formalAssessmentRequired"] },
          ].map(({ section, title, fields }) => (
            <div key={section} className="p-3 rounded-xl bg-white border border-slate-200 space-y-2">
              <h4 className="text-xs font-bold text-slate-700">{title}</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                {fields.map((field) => (
                  <label key={field} className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={assessment.virtualExam[section as keyof typeof assessment.virtualExam][field as keyof any]}
                      onChange={(e) => setAssessment({
                        ...assessment,
                        virtualExam: {
                          ...assessment.virtualExam,
                          [section]: { ...assessment.virtualExam[section as keyof typeof assessment.virtualExam], [field]: e.target.checked }
                        }
                      })}
                      className="w-3 h-3 rounded"
                    />
                    <span className="capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          {/* D. Neurological */}
          <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-2">
            <h4 className="text-xs font-bold text-slate-700">D. NEUROLOGICAL / MOBILITY – PATIENT-PERFORMED</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              {[
                { key: "facialSymmetry", label: "Facial symmetry observed" },
                { key: "speechAppropriate", label: "Speech appropriate" },
                { key: "upperLimbSymmetry", label: "Upper-limb movement symmetrical" },
                { key: "canStandIndependently", label: "Can stand independently" },
                { key: "canWalkSafely", label: "Can walk safely" },
                { key: "gaitNormal", label: "Gait appears normal" },
                { key: "canPerformBalanceTask", label: "Can perform balance task" },
                { key: "abnormalityObserved", label: "Abnormality observed" },
                { key: "furtherAssessmentRequired", label: "Further assessment required" },
              ].map(({ key: neuroKey, label }) => (
                <label key={neuroKey} className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={assessment.virtualExam.neurological[neuroKey as keyof typeof assessment.virtualExam.neurological]}
                    onChange={(e) => setAssessment({
                      ...assessment,
                      virtualExam: {
                        ...assessment.virtualExam,
                        neurological: { ...assessment.virtualExam.neurological, [neuroKey]: e.target.checked }
                      }
                    })}
                    className="w-3 h-3 rounded"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* E. Other Systems */}
          <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-2">
            <h4 className="text-xs font-bold text-slate-700">E. OTHER SYSTEMS – VISUAL INSPECTION ONLY</h4>
            {[
              { key: "cardiorespiratory", label: "Cardiorespiratory" },
              { key: "skinGeneral", label: "Skin/general" },
              { key: "musculoskeletal", label: "Musculoskeletal" },
              { key: "abdomen", label: "Abdomen" },
            ].map(({ key: systemKey, label }) => (
              <div key={systemKey}>
                <label className="block text-slate-600 font-bold mb-1">{label}:</label>
                <input
                  type="text"
                  value={assessment.virtualExam.otherSystems[systemKey as keyof typeof assessment.virtualExam.otherSystems]}
                  onChange={(e) => setAssessment({
                    ...assessment,
                    virtualExam: {
                      ...assessment.virtualExam,
                      otherSystems: { ...assessment.virtualExam.otherSystems, [systemKey]: e.target.value }
                    }
                  })}
                  className="w-full p-2 rounded-lg border border-slate-200 text-xs"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Section 7: Doctor's Clinical Assessment */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <h3 className="text-sm font-extrabold text-[#0B2D5C] uppercase tracking-wider">
            7. Doctor's Clinical Assessment
          </h3>
          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-600 font-bold mb-1">Overall assessment:</label>
              <select
                value={assessment.overallAssessment}
                onChange={(e) => setAssessment({ ...assessment, overallAssessment: e.target.value })}
                className="w-full p-2 rounded-lg border border-slate-200"
              >
                <option value="No significant abnormality identified virtually">No significant abnormality identified virtually</option>
                <option value="Abnormal finding requiring physical examination">Abnormal finding requiring physical examination</option>
                <option value="Investigation required">Investigation required</option>
                <option value="Specialist assessment required">Specialist assessment required</option>
                <option value="Urgent medical assessment required">Urgent medical assessment required</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">Clinical impression / relevant findings:</label>
              <textarea
                value={assessment.clinicalImpression}
                onChange={(e) => setAssessment({ ...assessment, clinicalImpression: e.target.value })}
                rows={3}
                className="w-full p-2 rounded-lg border border-slate-200 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Section 8: Certification Decision */}
        <div className={`p-4 rounded-2xl border-2 space-y-3 ${hasSignificantRedFlag ? 'bg-rose-50 border-rose-300' : 'bg-emerald-50 border-emerald-300'}`}>
          <h3 className="text-sm font-extrabold text-[#0B2D5C] uppercase tracking-wider">
            8. Certification Decision
          </h3>
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              {[
                { value: "FIT", label: "FIT - Requirements met; certificate may be issued" },
                { value: "FIT_RESTRICTED", label: "FIT WITH RESTRICTIONS - Certificate with restrictions" },
                { value: "PHYSICAL_CONSULTATION", label: "PHYSICAL CONSULTATION REQUIRED" },
                { value: "INVESTIGATION_SPECIALIST", label: "INVESTIGATION / SPECIALIST REQUIRED" },
                { value: "URGENT_REFERRAL", label: "URGENT MEDICAL REFERRAL" },
              ].map((option) => (
                <label key={option.value} className={`flex items-start gap-2 p-2 rounded-lg border ${hasSignificantRedFlag && option.value === 'FIT' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-white'} ${hasSignificantRedFlag ? 'border-rose-200' : 'border-emerald-200'}`}>
                  <input
                    type="radio"
                    name="decision"
                    value={option.value}
                    checked={assessment.decision === option.value}
                    onChange={(e) => setAssessment({ ...assessment, decision: e.target.value as any })}
                    disabled={hasSignificantRedFlag && option.value === 'FIT'}
                    className="w-4 h-4 mt-0.5"
                  />
                  <span className="text-slate-700">{option.label}</span>
                </label>
              ))}
            </div>
            {hasSignificantRedFlag && (
              <p className="text-xs font-bold text-rose-700">
                ⚠️ FIT decision locked due to significant red flag. Select appropriate referral option.
              </p>
            )}
            <div>
              <label className="block text-slate-600 font-bold mb-1">Reason for decision:</label>
              <textarea
                value={assessment.decisionReason}
                onChange={(e) => setAssessment({ ...assessment, decisionReason: e.target.value })}
                rows={2}
                className="w-full p-2 rounded-lg border border-slate-200 resize-none"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">Restrictions / follow-up / referral:</label>
              <textarea
                value={assessment.restrictions}
                onChange={(e) => setAssessment({ ...assessment, restrictions: e.target.value })}
                rows={2}
                className="w-full p-2 rounded-lg border border-slate-200 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Section 9: Doctor Declaration */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <h3 className="text-sm font-extrabold text-[#0B2D5C] uppercase tracking-wider">
            9. Doctor Declaration
          </h3>
          <p className="text-xs text-slate-600 italic">
            I confirm that I reviewed the patient's relevant history, actively screened for red flags, performed the appropriate virtual assessment within the limitations of telemedicine, and based the certification decision on the clinical information available.
          </p>
          <div className="space-y-3 text-xs">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={assessment.doctorDeclaration}
                onChange={(e) => setAssessment({ ...assessment, doctorDeclaration: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <span className="font-bold text-slate-700">I confirm the above declaration</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Electronic signature:</label>
                <input
                  type="text"
                  value={assessment.electronicSignature}
                  onChange={(e) => setAssessment({ ...assessment, electronicSignature: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200"
                  placeholder="Type your full name"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">Date/time:</label>
                <input
                  type="text"
                  value={assessment.consultationDate}
                  disabled
                  className="w-full p-2 rounded-lg border border-slate-200 bg-slate-100"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!assessment.doctorDeclaration}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              !assessment.doctorDeclaration
                ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                : "bg-[#12B8B0] hover:bg-[#1dd9d0] text-[#0B2D5C]"
            }`}
          >
            Submit Assessment
          </button>
        </div>
      </div>
    </div>
  );
}
