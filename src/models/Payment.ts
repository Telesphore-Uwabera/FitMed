import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPayment extends Document {
  certificateId: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;
  purpose?: string;
  amount: number;
  currency: string;
  channel: string;
  iremboRef: string;
  status: "PAID" | "WAITING" | "EXPIRED";
  doctorName?: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    certificateId: { type: String, required: true, index: true },
    applicantName: { type: String, required: true },
    applicantEmail: { type: String, required: true, lowercase: true },
    applicantPhone: { type: String, default: "" },
    purpose: { type: String, default: "" },
    amount: { type: Number, default: 5000 },
    currency: { type: String, default: "FRW" },
    channel: { type: String, default: "Irembo" },
    iremboRef: { type: String, default: "" },
    status: { type: String, enum: ["PAID", "WAITING", "EXPIRED"], default: "WAITING" },
    doctorName: { type: String, default: "" },
    paidAt: { type: Date },
  },
  { timestamps: true, collection: "payments" }
);

export const Payment: Model<IPayment> =
  mongoose.models.Payment || mongoose.model<IPayment>("Payment", PaymentSchema);
export default Payment;
