import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Message from "@/models/Message";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const consultationId = searchParams.get("consultationId") || "ROOM-FM-9941";

    try {
      await connectToDatabase();
      const messages = await Message.find({ consultationId }).sort({ createdAt: 1 }).limit(50);
      return NextResponse.json({ success: true, messages });
    } catch (dbErr) {
      console.warn("MongoDB fetch chat fallback:", dbErr);
      return NextResponse.json({ success: true, messages: [] });
    }
  } catch (error: any) {
    console.error("Fetch chat error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { senderName, senderRole, messageText, consultationId, messageType } = body;

    if (!senderName || !messageText) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    try {
      await connectToDatabase();
      const newMsg = await Message.create({
        senderName,
        senderRole: senderRole || "applicant",
        messageText,
        consultationId: consultationId || "ROOM-FM-9941",
        messageType: messageType || "text",
        timestamp: new Date(),
      });

      return NextResponse.json({ success: true, message: newMsg });
    } catch (dbErr) {
      // Fallback response for dev without active MongoDB URI
      console.warn("MongoDB write fallback:", dbErr);
      return NextResponse.json({
        success: true,
        message: {
          id: `local-msg-${Date.now()}`,
          senderName,
          senderRole,
          messageText,
          consultationId,
          timestamp: new Date().toISOString(),
        },
      });
    }
  } catch (error: any) {
    console.error("Save chat error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
