import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  fullName: string;
  name?: string;
  email: string;
  password?: string;
  temporaryPassword?: string;
  requiresPasswordReset?: boolean;
  applicantId?: string;
  phone?: string;
  nationalId?: string;
  nationalIdImageUrl?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  role: "applicant" | "doctor" | "admin" | "user" | "staff";
  jobTitle?: string;
  bio?: string;
  showOnAbout?: boolean;
  avatarUrl: string;
  avatarPublicId?: string;
  status: "Active" | "Suspended" | "Pending" | "pending_approval" | "active";
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  employerInfo?: {
    companyName: string;
    employeeId: string;
  };
  wearablesConnected?: {
    appleHealth?: boolean;
    googleFit?: boolean;
    garmin?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    fullName: { type: String, trim: true },
    name: { type: String, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String },
    temporaryPassword: { type: String },
    requiresPasswordReset: { type: Boolean, default: false },
    applicantId: { type: String, unique: true, sparse: true, uppercase: true, trim: true },
    phone: { type: String, trim: true },
    nationalId: { type: String, trim: true },
    nationalIdImageUrl: { type: String },
    dateOfBirth: { type: String, trim: true },
    gender: { type: String, trim: true },
    address: { type: String, trim: true },
    role: { type: String, default: "applicant" },
    jobTitle: { type: String, trim: true },
    bio: { type: String, trim: true },
    showOnAbout: { type: Boolean, default: true },
    avatarUrl: {
      type: String,
      default: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80&auto=format&fit=crop",
    },
    avatarPublicId: { type: String },
    status: { type: String, default: "Active" },
    emergencyContact: {
      name: { type: String },
      phone: { type: String },
      relationship: { type: String },
    },
    employerInfo: {
      companyName: { type: String },
      employeeId: { type: String },
    },
    wearablesConnected: {
      appleHealth: { type: Boolean, default: false },
      googleFit: { type: Boolean, default: false },
      garmin: { type: Boolean, default: false },
    },
  },
  { timestamps: true, collection: "users" }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
