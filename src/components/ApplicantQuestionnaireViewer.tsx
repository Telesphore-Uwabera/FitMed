"use client";

import { X, User, Activity, AlertTriangle, FileText, Stethoscope } from "lucide-react";

interface ApplicantQuestionnaireViewerProps {
  candidate: any;
  onClose: () => void;
}

export default function ApplicantQuestionnaireViewer({
  candidate,
  onClose,
}: ApplicantQuestionnaireViewerProps) {
  const certData = candidate?.fullCertificate || candidate;

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
            Medical Fitness Screening Questionnaire
          </h2>
          <p className="text-xs text-slate-500">
            Submitted by: {certData?.candidateName || candidate?.name}
          </p>
        </div>

        {/* Section 1: Applicant Information */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <h3 className="text-sm font-extrabold text-[#0B2D5C] uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-[#12B8B0]" />
            Applicant Information
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-slate-500 font-bold mb-1">Name</label>
              <div className="font-medium text-slate-700">{certData?.candidateName || candidate?.name}</div>
            </div>
            <div>
              <label className="block text-slate-500 font-bold mb-1">National ID</label>
              <div className="font-mono text-slate-700">{certData?.candidateIdNumber || candidate?.nationalId}</div>
            </div>
            <div>
              <label className="block text-slate-500 font-bold mb-1">Age</label>
              <div className="font-medium text-slate-700">{certData?.age || candidate?.age}</div>
            </div>
            <div>
              <label className="block text-slate-500 font-bold mb-1">Gender</label>
              <div className="font-medium text-slate-700">{certData?.gender || candidate?.gender}</div>
            </div>
            <div>
              <label className="block text-slate-500 font-bold mb-1">Purpose</label>
              <div className="font-medium text-slate-700">{certData?.purpose || candidate?.purpose}</div>
            </div>
            <div>
              <label className="block text-slate-500 font-bold mb-1">Job Type</label>
              <div className="font-medium text-slate-700">{certData?.jobType || candidate?.jobType}</div>
            </div>
          </div>
        </div>

        {/* Section 2: Vitals */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <h3 className="text-sm font-extrabold text-[#0B2D5C] uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-600" />
            Vital Signs
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
              <div className="text-sky-600 font-bold text-lg">{certData?.vitals?.bp || certData?.vitals?.bloodPressure || "—"}</div>
              <div className="text-slate-500">Blood Pressure</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
              <div className="text-teal-600 font-bold text-lg">{certData?.vitals?.hr || certData?.vitals?.heartRate || "—"}</div>
              <div className="text-slate-500">Heart Rate</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
              <div className="text-indigo-600 font-bold text-lg">{certData?.vitals?.bmi || "—"}</div>
              <div className="text-slate-500">BMI</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
              <div className="text-emerald-600 font-bold text-lg">{certData?.vitals?.spo2 || "—"}</div>
              <div className="text-slate-500">SpO₂</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-slate-500 font-bold mb-1">Weight</label>
              <div className="font-medium text-slate-700">{certData?.weight || "—"}</div>
            </div>
            <div>
              <label className="block text-slate-500 font-bold mb-1">Height</label>
              <div className="font-medium text-slate-700">{certData?.height || "—"}</div>
            </div>
            <div>
              <label className="block text-slate-500 font-bold mb-1">Temperature</label>
              <div className="font-medium text-slate-700">{certData?.vitals?.temperature || "—"}</div>
            </div>
          </div>
        </div>

        {/* Section 3: Red Flags */}
        <div className={`p-4 rounded-2xl border-2 space-y-3 ${
          certData?.redFlags && Object.values(certData.redFlags).some((v: any) => v === true)
            ? "bg-rose-50 border-rose-300"
            : "bg-emerald-50 border-emerald-300"
        }`}>
          <h3 className="text-sm font-extrabold text-[#0B2D5C] uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Red Flag Screening
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            {certData?.redFlags ? (
              Object.entries(certData.redFlags).map(([key, value]: [string, any]) => (
                <div key={key} className={`flex items-center gap-2 p-2 rounded-lg ${value ? 'bg-rose-100 border border-rose-300' : 'bg-white border border-slate-200'}`}>
                  <div className={`w-3 h-3 rounded ${value ? 'bg-rose-500' : 'bg-slate-300'}`} />
                  <span className="capitalize text-slate-700">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center text-slate-500 py-4">No red flag data available</div>
            )}
          </div>
        </div>

        {/* Section 4: Symptoms */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <h3 className="text-sm font-extrabold text-[#0B2D5C] uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            Reported Symptoms
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            {certData?.symptoms ? (
              Object.entries(certData.symptoms).map(([key, value]: [string, any]) => (
                <div key={key} className={`flex items-center gap-2 p-2 rounded-lg ${value ? 'bg-indigo-50 border border-indigo-200' : 'bg-white border border-slate-200'}`}>
                  <div className={`w-3 h-3 rounded ${value ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                  <span className="capitalize text-slate-700">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center text-slate-500 py-4">No symptom data available</div>
            )}
          </div>
        </div>

        {/* Section 5: Medical History */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <h3 className="text-sm font-extrabold text-[#0B2D5C] uppercase tracking-wider flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-teal-600" />
            Medical History
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            {certData?.history ? (
              Object.entries(certData.history).map(([key, value]: [string, any]) => (
                <div key={key} className={`flex items-center gap-2 p-2 rounded-lg ${value ? 'bg-teal-50 border border-teal-200' : 'bg-white border border-slate-200'}`}>
                  <div className={`w-3 h-3 rounded ${value ? 'bg-teal-500' : 'bg-slate-300'}`} />
                  <span className="capitalize text-slate-700">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center text-slate-500 py-4">No medical history data available</div>
            )}
          </div>
        </div>

        {/* Section 6: Functional Assessment */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <h3 className="text-sm font-extrabold text-[#0B2D5C] uppercase tracking-wider">
            Functional Assessment
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            {certData?.functional ? (
              Object.entries(certData.functional).map(([key, value]: [string, any]) => (
                <div key={key} className={`flex items-center gap-2 p-2 rounded-lg ${value ? 'bg-sky-50 border border-sky-200' : 'bg-white border border-slate-200'}`}>
                  <div className={`w-3 h-3 rounded ${value ? 'bg-sky-500' : 'bg-slate-300'}`} />
                  <span className="capitalize text-slate-700">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center text-slate-500 py-4">No functional assessment data available</div>
            )}
          </div>
        </div>

        {/* Section 7: Additional Notes */}
        {certData?.additionalNotes && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <h3 className="text-sm font-extrabold text-[#0B2D5C] uppercase tracking-wider">
              Additional Notes
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed">{certData.additionalNotes}</p>
          </div>
        )}

        {/* Section 8: Clinical Decision (if already made) */}
        {certData?.decision && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 space-y-3">
            <h3 className="text-sm font-extrabold text-[#0B2D5C] uppercase tracking-wider">
              Clinical Decision
            </h3>
            <div className="text-sm font-bold text-emerald-900">{certData.decision}</div>
            {certData?.restrictions && (
              <div className="text-xs text-emerald-800">
                <strong>Restrictions:</strong> {certData.restrictions}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
