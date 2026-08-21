import Certificate from "@/models/Certificate";
import Payment from "@/models/Payment";
import AuditLog from "@/models/AuditLog";
import Doctor from "@/models/Doctor";
import mongoose from "mongoose";
import { notifyPerson } from "@/lib/notify";
import { EmailTemplates, FITMED_ADMIN_EMAIL, FITMED_APP_URL, FITMED_DOCTOR_EMAIL } from "@/lib/brevo";
import { IREMBO_FEE_RWF } from "@/lib/iremboPay";

export async function markCertificatePaid(opts: {
  certificateId?: string;
  invoiceNumber?: string;
  transactionId?: string;
  iremboRef: string;
  channel: string;
}) {
  const or = [];
  if (opts.certificateId) or.push({ certificateId: String(opts.certificateId).toUpperCase() });
  if (opts.invoiceNumber) or.push({ iremboInvoiceNumber: opts.invoiceNumber });
  if (opts.transactionId) or.push({ iremboTransactionId: opts.transactionId });
  if (!or.length) return { success: false, error: "Certificate not found." };

  const cert = await Certificate.findOne({ $or: or });
  if (!cert) return { success: false, error: "Certificate not found." };
  if (String(cert.paymentStatus || "").toUpperCase() === "PAID") {
    return { success: true, certificate: cert, alreadyPaid: true };
  }

  cert.paymentStatus = "PAID";
  cert.iremboRef = opts.iremboRef;
  if (opts.invoiceNumber) cert.iremboInvoiceNumber = opts.invoiceNumber;
  await cert.save();

  const certKey = String(cert.certificateId);
  await Payment.findOneAndUpdate(
    { certificateId: certKey },
    {
      certificateId: certKey,
      applicantName: cert.candidateName,
      applicantEmail: cert.applicantEmail,
      applicantPhone: cert.applicantPhone || "",
      purpose: cert.purpose,
      amount: IREMBO_FEE_RWF,
      currency: "FRW",
      channel: opts.channel || "IremboPay",
      iremboRef: opts.iremboRef,
      status: "PAID",
      doctorName: cert.assignedDoctor || "",
      paidAt: new Date(),
    },
    { upsert: true, returnDocument: "after" }
  ).catch(() => null);

  await AuditLog.create({
    action: "payment_paid",
    detail: `${certKey} · ${cert.candidateName} · IremboPay`,
    actor: "irembo",
    meta: { certificateId: certKey, iremboRef: opts.iremboRef },
  }).catch(() => null);

  const email = String(cert.applicantEmail || "");
  const name = String(cert.candidateName || "Applicant");
  const purpose = String(cert.purpose || "Medical fitness");
  const doctor = String(cert.assignedDoctor || "FitMed Physician").replace(/\s*\(You\)\s*$/, "");
  const verifyLink = `${FITMED_APP_URL}/verify/${encodeURIComponent(certKey)}`;
  let doctorEmail = FITMED_DOCTOR_EMAIL;
  if (cert.assignedDoctorId && mongoose.isValidObjectId(String(cert.assignedDoctorId))) {
    const assigned = await Doctor.findById(cert.assignedDoctorId).select("email").lean();
    if (assigned?.email) doctorEmail = String(assigned.email);
  }

  await notifyPerson({
    toEmail: email,
    toName: name,
    role: "user",
    subject: `Payment confirmed — certificate ${certKey} is ready`,
    htmlContent: EmailTemplates.certificatePaidDelivered(name, certKey, purpose, opts.iremboRef, verifyLink),
    snippet: `Official certificate ${certKey} is ready to view and download.`,
    href: verifyLink,
  });
  await notifyPerson({
    toEmail: FITMED_ADMIN_EMAIL,
    toName: "FitMed Admin",
    role: "admin",
    subject: `Payment received for ${certKey}`,
    htmlContent: EmailTemplates.paymentReceivedAdmin(name, certKey, `${IREMBO_FEE_RWF.toLocaleString()} FRW`, opts.iremboRef),
    snippet: `${name} paid ${IREMBO_FEE_RWF.toLocaleString()} FRW for ${certKey}.`,
    href: `${FITMED_APP_URL}/dashboard/admin`,
  });
  await notifyPerson({
    toEmail: doctorEmail,
    toName: doctor,
    role: "doctor",
    subject: `Certificate ${certKey} issued after payment`,
    htmlContent: EmailTemplates.certificateIssued(name, certKey, purpose, doctor),
    snippet: `${name} completed IremboPay. ${certKey} is issued.`,
    href: `${FITMED_APP_URL}/dashboard/doctor`,
  });

  return { success: true, certificate: cert };
}
