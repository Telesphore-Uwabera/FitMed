import { NextRequest, NextResponse } from "next/server";
import { lookupPublicCertificate } from "@/lib/publicCertificate";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ certificateId: string }> }
) {
  const { certificateId } = await params;
  const result = await lookupPublicCertificate(certificateId);
  const body = {
    success: result.outcome === "valid" || result.outcome === "expired",
    outcome: result.outcome,
    certificateId: result.certificateId,
    title: result.title,
    message: result.message,
    purpose: result.purpose,
    candidateName: result.outcome === "expired" || result.outcome === "valid" ? result.candidateName : undefined,
    issueDate: result.issueDate,
    expiryDate: result.expiryDate,
    data: result.outcome === "valid" ? result.data : undefined,
  };

  if (result.outcome === "unavailable") {
    return NextResponse.json({ ...body, success: false, error: "unavailable" }, { status: 503, headers: { "Cache-Control": "no-store, max-age=0" } });
  }
  if (result.outcome === "invalid") {
    return NextResponse.json({ ...body, success: false, error: "not_found" }, { status: 404, headers: { "Cache-Control": "no-store, max-age=0" } });
  }
  return NextResponse.json(body, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
