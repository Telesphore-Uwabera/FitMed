import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import OfficialMedicalCertificate from "@/components/OfficialMedicalCertificate";
import { connectToDatabase } from "@/lib/mongodb";
import Certificate from "@/models/Certificate";
import Doctor from "@/models/Doctor";
import User from "@/models/User";
import { officialDocumentNo, toOfficialCertificateData } from "@/lib/certificateDisplay";
import { pageMeta } from "@/lib/seo";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ certificateId: string }>;
}): Promise<Metadata> {
  const { certificateId } = await params;
  const id = officialDocumentNo(certificateId);
  return pageMeta({
    title: id ? `Verify ${id}` : "Verify Certificate",
    description: id
      ? `Check whether FitMed certificate ${id} is valid. Medical history is never shown on this page.`
      : "Verify a FitMed medical fitness certificate by official document number.",
    path: `/verify/${encodeURIComponent(id || certificateId || "")}`,
  });
}

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ certificateId: string }>;
}) {
  const { certificateId } = await params;
  const id = officialDocumentNo(certificateId);

  let cert: Record<string, unknown> | null = null;
  let applicant: { avatarUrl?: string; nationalId?: string } | null = null;
  let doctor: { fullName?: string; licenseNumber?: string; specialty?: string } | null = null;
  let loadError = "";

  try {
    await connectToDatabase();
    cert = (await Certificate.findOne({ certificateId: id }).lean()) as Record<string, unknown> | null;
    applicant = cert?.applicantEmail
      ? ((await User.findOne({ email: String(cert.applicantEmail).toLowerCase() })
          .select("avatarUrl nationalId gender dateOfBirth")
          .lean()) as { avatarUrl?: string; nationalId?: string } | null)
      : null;
    if (cert?.assignedDoctorId) {
      doctor = (await Doctor.findById(cert.assignedDoctorId)
        .select("fullName licenseNumber specialty")
        .lean()) as { fullName?: string; licenseNumber?: string; specialty?: string } | null;
    }
    if (!doctor && cert) {
      doctor = (await Doctor.findOne({}).select("fullName licenseNumber specialty").lean()) as {
        fullName?: string;
        licenseNumber?: string;
        specialty?: string;
      } | null;
    }
  } catch {
    loadError = "This certificate could not be opened right now. Please try again in a moment.";
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-10">
        {loadError ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
            {loadError}
          </div>
        ) : !cert ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">
            No FitMed certificate was found for <strong className="font-mono">{id || "this number"}</strong>.
          </div>
        ) : (
          <OfficialMedicalCertificate
            data={toOfficialCertificateData(
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
            )}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}
