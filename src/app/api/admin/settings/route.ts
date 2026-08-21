import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import PlatformSettings from "@/models/PlatformSettings";
import AuditLog from "@/models/AuditLog";

export async function GET() {
  try {
    await connectToDatabase();
    const settings = await PlatformSettings.findOneAndUpdate(
      { key: "fitmed" },
      { $setOnInsert: { key: "fitmed" } },
      { upsert: true, new: true }
    );
    const logs = await AuditLog.find({}).sort({ createdAt: -1 }).limit(40).lean();
    return NextResponse.json({
      success: true,
      settings: {
        assessmentRate: settings.assessmentRate,
        requireLiveConsultation: settings.requireLiveConsultation,
        qrValidation: settings.qrValidation,
        lastAssignedDoctorName: settings.lastAssignedDoctorName || "",
        roundRobinIndex: settings.roundRobinIndex || 0,
      },
      logs: logs.map((log) => ({
        id: String(log._id),
        action: log.action,
        detail: log.detail,
        actor: log.actor,
        time: log.createdAt ? new Date(log.createdAt).toLocaleString() : "—",
      })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Could not load settings.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    await connectToDatabase();
    const settings = await PlatformSettings.findOneAndUpdate(
      { key: "fitmed" },
      {
        $set: {
          assessmentRate: body.assessmentRate,
          requireLiveConsultation: Boolean(body.requireLiveConsultation),
          qrValidation: Boolean(body.qrValidation),
        },
        $setOnInsert: { key: "fitmed" },
      },
      { upsert: true, new: true }
    );
    return NextResponse.json({
      success: true,
      settings: {
        assessmentRate: settings.assessmentRate,
        requireLiveConsultation: settings.requireLiveConsultation,
        qrValidation: settings.qrValidation,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Could not save settings.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
