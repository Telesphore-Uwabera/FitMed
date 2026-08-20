import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMessage extends Document {
  senderId?: string;
  senderName: string;
  senderRole: "applicant" | "doctor" | "admin";
  recipientId?: string;
  recipientName?: string;
  consultationId: string;
  messageText: string;
  messageType: "text" | "vitals" | "prescription" | "clinical_note";
  isRead: boolean;
  timestamp: Date;
  attachments?: string[];
}

const MessageSchema = new Schema<IMessage>(
  {
    senderId: { type: String },
    senderName: { type: String, required: true },
    senderRole: { type: String, enum: ["applicant", "doctor", "admin"], required: true },
    recipientId: { type: String },
    recipientName: { type: String },
    consultationId: { type: String, required: true },
    messageText: { type: String, required: true },
    messageType: { type: String, enum: ["text", "vitals", "prescription", "clinical_note"], default: "text" },
    isRead: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now },
    attachments: [{ type: String }],
  },
  { timestamps: true, collection: "messages" }
);

export const Message: Model<IMessage> =
  mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema);

export default Message;
