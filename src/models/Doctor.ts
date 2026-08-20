import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDoctorSchedule {
  day: string;
  dayEnabled: boolean;
  dayStart: string;
  dayEnd: string;
  nightEnabled: boolean;
  nightStart: string;
  nightEnd: string;
}

export interface IDoctor extends Document {
  user: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  licenseNumber: string; // Rwanda Medical Council (RMDC)
  specialty: string;
  phone?: string;
  avatarUrl: string;
  avatarPublicId?: string;
  isVerified: boolean;
  status: "ONLINE" | "BUSY" | "OFF";
  weeklySchedule: IDoctorSchedule[];
  consultationFee: number;
  totalCertificatesIssued: number;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}

const DoctorScheduleSchema = new Schema<IDoctorSchedule>({
  day: { type: String, required: true },
  dayEnabled: { type: Boolean, default: true },
  dayStart: { type: String, default: "08:00 AM" },
  dayEnd: { type: String, default: "05:00 PM" },
  nightEnabled: { type: Boolean, default: false },
  nightStart: { type: String, default: "05:00 PM" },
  nightEnd: { type: String, default: "11:00 PM" },
});

const DoctorSchema = new Schema<IDoctor>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: false },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    licenseNumber: { type: String, required: true, unique: true },
    specialty: { type: String, default: "Occupational Medicine & Telehealth" },
    phone: { type: String },
    avatarUrl: {
      type: String,
      default: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&q=80&auto=format&fit=crop",
    },
    avatarPublicId: { type: String },
    isVerified: { type: Boolean, default: true },
    status: { type: String, enum: ["ONLINE", "BUSY", "OFF"], default: "ONLINE" },
    weeklySchedule: {
      type: [DoctorScheduleSchema],
      default: [
        { day: "Monday", dayEnabled: true, dayStart: "08:00 AM", dayEnd: "05:00 PM", nightEnabled: false, nightStart: "05:00 PM", nightEnd: "11:00 PM" },
        { day: "Tuesday", dayEnabled: true, dayStart: "08:00 AM", dayEnd: "05:00 PM", nightEnabled: false, nightStart: "05:00 PM", nightEnd: "11:00 PM" },
        { day: "Wednesday", dayEnabled: true, dayStart: "08:00 AM", dayEnd: "05:00 PM", nightEnabled: true, nightStart: "05:00 PM", nightEnd: "11:00 PM" },
        { day: "Thursday", dayEnabled: true, dayStart: "08:00 AM", dayEnd: "05:00 PM", nightEnabled: false, nightStart: "05:00 PM", nightEnd: "11:00 PM" },
        { day: "Friday", dayEnabled: true, dayStart: "08:00 AM", dayEnd: "05:00 PM", nightEnabled: true, nightStart: "05:00 PM", nightEnd: "11:00 PM" },
        { day: "Saturday", dayEnabled: true, dayStart: "08:00 AM", dayEnd: "05:00 PM", nightEnabled: false, nightStart: "05:00 PM", nightEnd: "11:00 PM" },
        { day: "Sunday", dayEnabled: false, dayStart: "08:00 AM", dayEnd: "05:00 PM", nightEnabled: false, nightStart: "05:00 PM", nightEnd: "11:00 PM" },
      ],
    },
    consultationFee: { type: Number, default: 5000 },
    totalCertificatesIssued: { type: Number, default: 0 },
    rating: { type: Number, default: 4.9 },
  },
  { timestamps: true, collection: "doctors" }
);

export const Doctor: Model<IDoctor> =
  mongoose.models.Doctor || mongoose.model<IDoctor>("Doctor", DoctorSchema);

export default Doctor;
