import mongoose, { Schema, Document, Model } from "mongoose";

export const DEFAULT_STAFF_TITLES = [
  "Managing Director & Clinical Director",
  "Chief Operations Officer (COO) & Program Manager",
  "ICT & Digital Health",
  "Legal & Compliance Officer",
  "Marketing & Sales Business Development",
  "Platform Administrator",
  "Licensed Physician",
];

export interface IStaffTitle extends Document {
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

const StaffTitleSchema = new Schema<IStaffTitle>(
  {
    title: { type: String, required: true, unique: true, trim: true },
  },
  { timestamps: true, collection: "stafftitles" }
);

export const StaffTitle: Model<IStaffTitle> =
  mongoose.models.StaffTitle || mongoose.model<IStaffTitle>("StaffTitle", StaffTitleSchema);

export default StaffTitle;
