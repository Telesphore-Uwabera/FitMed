import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Certificate from "@/models/Certificate";
import Doctor from "@/models/Doctor";
import User from "@/models/User";
import { officialDocumentNo, toOfficialCertificateData } from "@/lib/certificateDisplay";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ certificateId: string }> }
) {
  const { certificateId } = await params;
  const id = officialDocumentNo(certificateId);
  if (!id) {
    return NextResponse.json({ success: false, error: "Certificate number is required." }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const cert = (await Certificate.findOne({
      certificateId: { $regex: `^${escapeRegex(id)}$`, $options: "i" },
    }).lean()) as Record<string, unknown> | null;

    if (!cert) {
      return NextResponse.json({ success: false, error: "not_found" }, { status: 404 });
    }

    const applicant = cert.applicantEmail
      ? ((await User.findOne({ email: String(cert.applicantEmail).toLowerCase() })
          .select("avatarUrl nationalId")
          .lean()) as { avatarUrl?: string; nationalId?: string } | null)
      : null;

    let doctor: { fullName?: string; licenseNumber?: string; specialty?: string } | null = null;
    if (cert.assignedDoctorId) {
      doctor = (await Doctor.findById(cert.assignedDoctorId)
        .select("fullName licenseNumber specialty")
        .lean()) as { fullName?: string; licenseNumber?: string; specialty?: string } | null;
    }
    if (!doctor) {
      doctor = (await Doctor.findOne({}).select("fullName licenseNumber specialty").lean()) as {
        fullName?: string;
        licenseNumber?: string;
        specialty?: string;
      } | null;
    }

    return NextResponse.json(
      {
        success: true,
        data: toOfficialCertificateData(
          {
            ...cert,
            avatarUrl: cert.avatarUrl || applicant?.avatarUrl,
            candidateIdNumber: cert.candidateIdNumber || applicant?.nationalId,
            assignedDoctorLicense: cert.assignedDoctorLicense || doctor?.licenseNumber,
            assignedDoctor: cert.assignedDoctor || doctor?.fullName,
          },
          {
            doctorLicense: doctor?.licenseNumber,
            doctorSpecialty: doctor?.specialty,
            doctorName: doctor?.fullName,
            applicantImageUrl: applicant?.avatarUrl,
            nationalId: applicant?.nationalId,
          }
        ),
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (error) {
    console.error("Public certificate lookup failed:", error);
    return NextResponse.json({ success: false, error: "unavailable" }, { status: 503 });
  }
}
