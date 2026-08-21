import type { Metadata } from "next";
import PageLayout from "@/components/PageLayout";
import { connectToDatabase } from "@/lib/mongodb";
import Certificate from "@/models/Certificate";
import Doctor from "@/models/Doctor";
import { categoryFromPurpose, displayDoctorName, formatCertDate, officialDocumentNo } from "@/lib/certificateDisplay";

export const metadata: Metadata = {
  title: "Verify certificate — FitMed",
  description: "Confirm a FitMed official document number and fitness decision.",
};

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ certificateId: string }>;
}) {
  const { certificateId } = await params;
  const id = officialDocumentNo(certificateId);
  await connectToDatabase();
  const cert = await Certificate.findOne({ certificateId: id }).lean();
  let doctor = null;
  if (cert?.assignedDoctorId) {
    doctor = await Doctor.findById(cert.assignedDoctorId).select("fullName licenseNumber specialty").lean();
  }
  if (!doctor && cert?.assignedDoctorLicense) {
    doctor = await Doctor.findOne({ licenseNumber: cert.assignedDoctorLicense }).select("fullName licenseNumber specialty").lean();
  }
  if (!doctor && cert?.assignedDoctor) {
    const name = displayDoctorName(String(cert.assignedDoctor)).replace(/^Dr\.?\s*/i, "").split(",")[0].trim();
    if (name) {
      doctor = await Doctor.findOne({ fullName: { $regex: name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } })
        .select("fullName licenseNumber specialty")
        .lean();
    }
  }

  return (
    <PageLayout title="Certificate verification" subtitle="Official Document No. lookup">
      {!cert ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">
          No FitMed certificate was found for <strong className="font-mono">{id || "this number"}</strong>.
        </div>
      ) : (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Official Document No.</p>
          <p className="font-mono text-2xl font-extrabold text-[#0B2D5C]">{cert.certificateId}</p>
          <dl className="grid sm:grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs text-slate-400 font-bold uppercase">Applicant</dt>
              <dd className="font-semibold text-slate-800">{cert.candidateName}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400 font-bold uppercase">Purpose</dt>
              <dd className="font-semibold text-slate-800">{cert.purpose}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400 font-bold uppercase">Category</dt>
              <dd className="font-semibold text-slate-800">{categoryFromPurpose(cert.purpose, cert.category, cert.jobType)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400 font-bold uppercase">Decision</dt>
              <dd className="font-semibold text-slate-800">{cert.decision || cert.status}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400 font-bold uppercase">Evaluating physician</dt>
              <dd className="font-semibold text-slate-800">{displayDoctorName(cert.assignedDoctor) || doctor?.fullName || "FitMed physician"}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400 font-bold uppercase">RMDC licence</dt>
              <dd className="font-semibold font-mono text-slate-800">{cert.assignedDoctorLicense || doctor?.licenseNumber || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400 font-bold uppercase">Issued</dt>
              <dd className="font-semibold text-slate-800">{formatCertDate(cert.issuedAt || cert.appliedDate)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400 font-bold uppercase">Valid until</dt>
              <dd className="font-semibold text-slate-800">{formatCertDate(cert.expiresAt) || "Six months from issue"}</dd>
            </div>
          </dl>
        </div>
      )}
    </PageLayout>
  );
}
