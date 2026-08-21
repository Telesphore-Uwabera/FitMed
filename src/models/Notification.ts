import mongoose, { Schema, Document, Model } from "mongoose";

export interface INotification extends Document {
  email: string;
  role?: string;
  subject: string;
  snippet: string;
  href?: string;
  unread: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    role: { type: String },
    subject: { type: String, required: true },
    snippet: { type: String, default: "" },
    href: { type: String, default: "" },
    unread: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "notifications" }
);

export const Notification: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;
