import mongoose, { Schema, Document, Model } from "mongoose";

export interface IClinic extends Document {
  name: string;
  city: string;
  status: string;
  capacity: string;
  phone?: string;
  type?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClinicSchema = new Schema<IClinic>(
  {
    name: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    status: { type: String, default: "Active Partner" },
    capacity: { type: String, default: "Medium" },
    phone: { type: String, default: "" },
    type: { type: String, default: "Partner clinic" },
  },
  { timestamps: true, collection: "clinics" }
);

export const Clinic: Model<IClinic> = mongoose.models.Clinic || mongoose.model<IClinic>("Clinic", ClinicSchema);
export default Clinic;
