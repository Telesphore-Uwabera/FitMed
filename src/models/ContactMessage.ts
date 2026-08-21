import mongoose, { Schema, Document, Model } from "mongoose";

export interface IContactMessage extends Document {
  fullName: string;
  email: string;
  phone?: string;
  organization?: string;
  subject: string;
  message: string;
  category: string;
  status: "New" | "In Review" | "Resolved";
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ContactMessageSchema = new Schema<IContactMessage>(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    organization: { type: String, trim: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    category: { type: String, default: "general", trim: true },
    status: {
      type: String,
      enum: ["New", "In Review", "Resolved"],
      default: "New",
    },
    adminNotes: { type: String },
  },
  { timestamps: true, collection: "contactmessages" }
);

export const ContactMessage: Model<IContactMessage> =
  mongoose.models.ContactMessage ||
  mongoose.model<IContactMessage>("ContactMessage", ContactMessageSchema);

if (ContactMessage.schema.path("category")) {
  ContactMessage.schema.path("category").options.enum = undefined;
}

export default ContactMessage;
