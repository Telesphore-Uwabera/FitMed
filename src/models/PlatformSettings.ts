import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPlatformSettings extends Document {
  key: string;
  roundRobinIndex: number;
  lastAssignedDoctorId?: string;
  lastAssignedDoctorName?: string;
  assessmentRate: string;
  requireLiveConsultation: boolean;
  qrValidation: boolean;
  updatedAt: Date;
}

const PlatformSettingsSchema = new Schema<IPlatformSettings>(
  {
    key: { type: String, required: true, unique: true, default: "fitmed" },
    roundRobinIndex: { type: Number, default: 0 },
    lastAssignedDoctorId: { type: String, default: "" },
    lastAssignedDoctorName: { type: String, default: "" },
    assessmentRate: { type: String, default: "5,000 FRW" },
    requireLiveConsultation: { type: Boolean, default: true },
    qrValidation: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "platformsettings" }
);

export const PlatformSettings: Model<IPlatformSettings> =
  mongoose.models.PlatformSettings || mongoose.model<IPlatformSettings>("PlatformSettings", PlatformSettingsSchema);

export default PlatformSettings;
