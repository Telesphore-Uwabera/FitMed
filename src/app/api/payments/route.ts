import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Payment from "@/models/Payment";
import { displayDoctorName } from "@/lib/certificateDisplay";

export async function GET() {
  try {
    await connectToDatabase();
    const payments = await Payment.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({
      success: true,
      payments: payments.map((p) => ({
        id: String(p._id),
        certId: p.certificateId,
        applicantName: p.applicantName,
        applicantEmail: p.applicantEmail,
        applicantPhone: p.applicantPhone || "—",
        purpose: p.purpose || "—",
        amount: p.amount,
        channel: p.channel,
        iremboRef: p.iremboRef || p.certificateId,
        date: p.paidAt || p.createdAt ? new Date(String(p.paidAt || p.createdAt)).toLocaleString() : "—",
        status: p.status,
        doctorName: displayDoctorName(p.doctorName) || "—",
        doctorPayout: Math.round((p.amount || 0) * 0.8),
        platformFee: Math.round((p.amount || 0) * 0.2),
      })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Could not load payments.";
    return NextResponse.json({ success: false, error: message, payments: [] }, { status: 500 });
  }
}
