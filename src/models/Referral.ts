import mongoose, { Schema, Document, Model } from "mongoose";

export interface IReferral extends Document {
  applicantName: string;
  applicantEmail?: string;
  clinicName: string;
  clinicCity?: string;
  reason: string;
  doctorName?: string;
  doctorEmail?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReferralSchema = new Schema<IReferral>(
  {
    applicantName: { type: String, required: true },
    applicantEmail: { type: String, default: "" },
    clinicName: { type: String, required: true },
    clinicCity: { type: String, default: "" },
    reason: { type: String, required: true },
    doctorName: { type: String, default: "" },
    doctorEmail: { type: String, default: "" },
    status: { type: String, default: "Pending in-person visit" },
  },
  { timestamps: true, collection: "referrals" }
);

export const Referral: Model<IReferral> =
  mongoose.models.Referral || mongoose.model<IReferral>("Referral", ReferralSchema);
export default Referral;
