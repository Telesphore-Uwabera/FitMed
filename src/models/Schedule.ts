import mongoose, { Schema, Document, Model } from "mongoose";

export interface IScheduleDay {
  day: string;
  dayEnabled: boolean;
  dayStart: string;
  dayEnd: string;
  nightEnabled: boolean;
  nightStart: string;
  nightEnd: string;
}

export interface ISchedule extends Document {
  doctorEmail: string;
  doctorName: string;
  doctorId?: string;
  status: "ONLINE" | "BUSY" | "OFF";
  weeklySchedule: IScheduleDay[];
  createdAt: Date;
  updatedAt: Date;
}

const DaySchema = new Schema<IScheduleDay>(
  {
    day: String,
    dayEnabled: Boolean,
    dayStart: String,
    dayEnd: String,
    nightEnabled: Boolean,
    nightStart: String,
    nightEnd: String,
  },
  { _id: false }
);

const ScheduleSchema = new Schema<ISchedule>(
  {
    doctorEmail: { type: String, required: true, unique: true, lowercase: true, trim: true },
    doctorName: { type: String, required: true },
    doctorId: { type: String },
    status: { type: String, enum: ["ONLINE", "BUSY", "OFF"], default: "OFF" },
    weeklySchedule: { type: [DaySchema], default: [] },
  },
  { timestamps: true, collection: "schedules" }
);

export const Schedule: Model<ISchedule> =
  mongoose.models.Schedule || mongoose.model<ISchedule>("Schedule", ScheduleSchema);
export default Schedule;
