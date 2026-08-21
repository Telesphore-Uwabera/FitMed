import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICertificate extends Document {
  certificateId: string; // e.g. FM-2026-88421
  applicant: mongoose.Types.ObjectId;
  doctor: mongoose.Types.ObjectId;
  candidateName: string;
  candidateIdNumber: string;
  applicantEmail: string;
  applicantPhone?: string;
  avatarUrl?: string;
  nationalIdImageUrl?: string;
  age?: number;
  gender?: string;
  purpose: string;
  jobType?: string;
  category: string;
  decision: "FIT" | "FIT_RESTRICTED" | "FURTHER_ASSESSMENT" | "NOT_FIT" | "PENDING";
  restrictions?: string;
  decisionNotes?: string;
  vitals: {
    bloodPressure: string;
    heartRate: string;
    bmi: string;
    spo2: string;
    temperature?: string;
    pulse?: string;
  };
  redFlags?: Record<string, boolean>;
  symptoms?: Record<string, boolean>;
  history?: Record<string, boolean>;
  functional?: Record<string, boolean>;
  additionalNotes?: string;
  clinicalOutcome?: string; // A, B, C, D from clinical engine
  doctorNotes?: string; // Notes written by doctor during assessment
  doctorDocuments?: Array<{
    name: string;
    url: string;
    uploadedAt: Date;
    type: string;
  }>; // Documents uploaded by doctor
  structuredAssessment?: {
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
    redFlags: Record<string, boolean>;
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
    // Section 5: Vital Signs
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
      mentation: Record<string, any>;
      hearing: Record<string, boolean>;
      vision: Record<string, boolean>;
      neurological: Record<string, boolean>;
      otherSystems: Record<string, string>;
    };
    // Section 7: Doctor's Clinical Assessment
    overallAssessment: string;
    clinicalImpression: string;
    // Section 8: Certification Decision
    decision: string;
    decisionReason: string;
    restrictions: string;
    // Section 9: Doctor Declaration
    doctorDeclaration: boolean;
    electronicSignature: string;
  };
  sha256Hash: string;
  qrCodeUrl: string;
  issuedAt: Date;
  expiresAt: Date;
  status: "Valid" | "Expired" | "Revoked" | "submitted" | "under-review" | "approved" | "rejected";
  paymentStatus?: "PAID" | "UNPAID";
  iremboRef?: string;
  assignedDoctor?: string;
  assignedDoctorId?: string;
  assignedDoctorLicense?: string;
  riskLevel?: string;
  riskColor?: string;
  appliedDate?: Date;
}

const CertificateSchema = new Schema<ICertificate>(
  {
    certificateId: { type: String, required: true, unique: true, uppercase: true },
    applicant: { type: Schema.Types.ObjectId, ref: "User", required: false },
    doctor: { type: Schema.Types.ObjectId, ref: "Doctor", required: false },
    candidateName: { type: String, required: true },
    candidateIdNumber: { type: String, required: true },
    applicantEmail: { type: String, required: true },
    applicantPhone: { type: String },
    avatarUrl: { type: String },
    nationalIdImageUrl: { type: String },
    age: { type: Number },
    gender: { type: String },
    purpose: { type: String, required: true },
    jobType: { type: String },
    category: { type: String, required: true },
    decision: {
      type: String,
      enum: ["FIT", "FIT_RESTRICTED", "FURTHER_ASSESSMENT", "NOT_FIT", "PENDING"],
      default: "PENDING",
    },
    restrictions: { type: String },
    decisionNotes: { type: String },
    vitals: {
      bloodPressure: { type: String },
      heartRate: { type: String },
      bmi: { type: String },
      spo2: { type: String },
      temperature: { type: String },
      pulse: { type: String },
    },
    redFlags: { type: Map, of: Boolean },
    symptoms: { type: Map, of: Boolean },
    history: { type: Map, of: Boolean },
    functional: { type: Map, of: Boolean },
    additionalNotes: { type: String },
    clinicalOutcome: { type: String },
    doctorNotes: { type: String },
    doctorDocuments: [{
      name: { type: String },
      url: { type: String },
      uploadedAt: { type: Date, default: Date.now },
      type: { type: String },
    }],
    structuredAssessment: {
      // Section 1
      patientName: { type: String },
      patientId: { type: String },
      dateOfBirth: { type: String },
      sex: { type: String },
      consultationDate: { type: String },
      doctorName: { type: String },
      licenseNumber: { type: String },
      certificatePurpose: { type: String },
      occupation: { type: String },
      employer: { type: String },
      // Section 2
      redFlags: { type: Map, of: Boolean },
      redFlagAction: { type: String },
      redFlagDetails: { type: String },
      // Section 3
      knownConditions: [String],
      previousSurgery: { type: String },
      currentMedications: { type: String },
      allergies: { type: String },
      smokingAlcoholHistory: { type: String },
      // Section 4
      jobRequirements: [String],
      functionalAbility: { type: String },
      functionalLimitation: { type: String },
      // Section 5
      vitals: {
        bp: { type: String },
        heartRate: { type: String },
        respiratoryRate: { type: String },
        spo2: { type: String },
        temperature: { type: String },
        weight: { type: String },
        height: { type: String },
        bmi: { type: String },
      },
      // Section 6
      virtualExam: {
        mentation: { type: Map, of: Schema.Types.Mixed },
        hearing: { type: Map, of: Boolean },
        vision: { type: Map, of: Boolean },
        neurological: { type: Map, of: Boolean },
        otherSystems: { type: Map, of: String },
      },
      // Section 7
      overallAssessment: { type: String },
      clinicalImpression: { type: String },
      // Section 8
      decision: { type: String },
      decisionReason: { type: String },
      restrictions: { type: String },
      // Section 9
      doctorDeclaration: { type: Boolean },
      electronicSignature: { type: String },
    },
    sha256Hash: { type: String, required: true },
    qrCodeUrl: { type: String, required: true },
    issuedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ["Valid", "Expired", "Revoked", "submitted", "under-review", "approved", "rejected"],
      default: "submitted",
    },
    paymentStatus: { type: String, enum: ["PAID", "UNPAID"], default: "UNPAID" },
    iremboRef: { type: String },
    assignedDoctor: { type: String },
    assignedDoctorId: { type: String },
    assignedDoctorLicense: { type: String },
    riskLevel: { type: String },
    riskColor: { type: String },
    appliedDate: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: "certificates" }
);

export const Certificate: Model<ICertificate> =
  mongoose.models.Certificate || mongoose.model<ICertificate>("Certificate", CertificateSchema);

export default Certificate;
