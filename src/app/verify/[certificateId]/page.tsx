import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import OfficialMedicalCertificate from "@/components/OfficialMedicalCertificate";
import { connectToDatabase } from "@/lib/mongodb";
import Certificate from "@/models/Certificate";
import Doctor from "@/models/Doctor";
import User from "@/models/User";
import { officialDocumentNo, toOfficialCertificateData } from "@/lib/certificateDisplay";

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ certificateId: string }>;
}) {
  const { certificateId } = await params;
  const id = officialDocumentNo(certificateId);
  await connectToDatabase();
  const cert = await Certificate.findOne({ certificateId: id }).lean();
  const applicant = cert?.applicantEmail
    ? await User.findOne({ email: String(cert.applicantEmail).toLowerCase() })
        .select("avatarUrl nationalId gender dateOfBirth")
        .lean()
    : null;
  let doctor = null;
  if (cert?.assignedDoctorId) {
    doctor = await Doctor.findById(cert.assignedDoctorId).select("fullName licenseNumber specialty").lean();
  }
  if (!doctor && cert) {
    doctor = await Doctor.findOne({}).select("fullName licenseNumber specialty").lean();
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-10">
        {!cert ? (
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
