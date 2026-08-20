import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICertificate extends Document {
  certificateId: string; // e.g. FM-2026-88421
  applicant: mongoose.Types.ObjectId;
  doctor: mongoose.Types.ObjectId;
  candidateName: string;
  candidateIdNumber: string;
  purpose: string;
  category: string;
  decision: "FIT" | "FIT_RESTRICTED" | "FURTHER_ASSESSMENT" | "NOT_FIT";
  restrictions?: string;
  vitals: {
    bloodPressure: string;
    heartRate: string;
    bmi: string;
    spo2: string;
  };
  sha256Hash: string;
  qrCodeUrl: string;
  issuedAt: Date;
  expiresAt: Date;
  status: "Valid" | "Expired" | "Revoked";
}

const CertificateSchema = new Schema<ICertificate>(
  {
    certificateId: { type: String, required: true, unique: true, uppercase: true },
    applicant: { type: Schema.Types.ObjectId, ref: "User", required: false },
    doctor: { type: Schema.Types.ObjectId, ref: "Doctor", required: false },
    candidateName: { type: String, required: true },
    candidateIdNumber: { type: String, required: true },
    purpose: { type: String, required: true },
    category: { type: String, required: true },
    decision: {
      type: String,
      enum: ["FIT", "FIT_RESTRICTED", "FURTHER_ASSESSMENT", "NOT_FIT"],
      default: "FIT",
    },
    restrictions: { type: String },
    vitals: {
      bloodPressure: { type: String },
      heartRate: { type: String },
      bmi: { type: String },
      spo2: { type: String },
    },
    sha256Hash: { type: String, required: true },
    qrCodeUrl: { type: String, required: true },
    issuedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    status: { type: String, enum: ["Valid", "Expired", "Revoked"], default: "Valid" },
  },
  { timestamps: true }
);

export const Certificate: Model<ICertificate> =
  mongoose.models.Certificate || mongoose.model<ICertificate>("Certificate", CertificateSchema);

export default Certificate;
