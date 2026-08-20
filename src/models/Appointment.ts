import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAppointment extends Document {
  appointmentId: string;
  applicantId?: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty?: string;
  purpose: string;
  certificateDraftId?: string;
  scheduledDate: string; // e.g. "2026-08-22"
  scheduledTime: string; // e.g. "14:30"
  durationMinutes: number;
  status: "scheduled" | "in-progress" | "completed" | "cancelled" | "rescheduled";
  notes?: string;
  roomUrl: string;
  emailNotified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema<IAppointment>(
  {
    appointmentId: { type: String, required: true, unique: true },
    applicantId: { type: String },
    applicantName: { type: String, required: true },
    applicantEmail: { type: String, required: true },
    applicantPhone: { type: String },
    doctorId: { type: String, required: true },
    doctorName: { type: String, required: true },
    doctorSpecialty: { type: String, default: "General Telehealth & Occupational Physician" },
    purpose: { type: String, required: true },
    certificateDraftId: { type: String },
    scheduledDate: { type: String, required: true },
    scheduledTime: { type: String, required: true },
    durationMinutes: { type: Number, default: 15 },
    status: {
      type: String,
      enum: ["scheduled", "in-progress", "completed", "cancelled", "rescheduled"],
      default: "scheduled",
    },
    notes: { type: String },
    roomUrl: { type: String, required: true },
    emailNotified: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Appointment: Model<IAppointment> =
  mongoose.models.Appointment || mongoose.model<IAppointment>("Appointment", AppointmentSchema);

export default Appointment;
