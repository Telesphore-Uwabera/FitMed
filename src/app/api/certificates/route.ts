import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Certificate from "@/models/Certificate";
import Doctor from "@/models/Doctor";
import Payment from "@/models/Payment";
import AuditLog from "@/models/AuditLog";
import User from "@/models/User";
import mongoose from "mongoose";
import { runClinicalEngine, WizardData, ageFromDateOfBirth } from "@/lib/clinicalEngine";
import { pickOnDutyDoctor } from "@/lib/assignDoctor";
import crypto from "crypto";
import {
  EmailTemplates,
  FITMED_APP_URL,
  FITMED_ADMIN_EMAIL,
  FITMED_DOCTOR_EMAIL,
} from "@/lib/brevo";
import { nextKey, normalizeCertificateKeys } from "@/lib/sequentialIds";
import { notifyPerson } from "@/lib/notify";
import { isCloudinaryUrl } from "@/lib/imageUtils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const applicantEmail = searchParams.get("applicantEmail");
    const assignedDoctorId = searchParams.get("assignedDoctorId");

      try {
      await connectToDatabase();
      try {
        await normalizeCertificateKeys();
      } catch (normErr) {
        console.warn("Certificate key normalize skipped:", normErr);
      }
      const query: any = {};
      if (status) query.status = status;
      if (applicantEmail) query.applicantEmail = { $regex: `^${applicantEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" };
      if (assignedDoctorId) query.assignedDoctorId = assignedDoctorId;

      const certificates = await Certificate.find(query)
        .sort({ appliedDate: -1, createdAt: -1 })
        .limit(500)
        .lean();

      const doctors = await Doctor.find({}).select("_id fullName email licenseNumber specialty").lean();
      const applicantEmails = [...new Set(certificates.map((c) => String(c.applicantEmail || "").toLowerCase()).filter(Boolean))];
      const applicants = applicantEmails.length
        ? await User.find({ email: { $in: applicantEmails } }).select("email avatarUrl nationalId dateOfBirth gender fullName").lean()
        : [];
      const byId = new Map(doctors.map((d) => [String(d._id), d]));
      const byEmail = new Map(doctors.map((d) => [String(d.email || "").toLowerCase(), d]));
      const applicantByEmail = new Map(applicants.map((u) => [String(u.email || "").toLowerCase(), u]));
      const { categoryFromPurpose } = await import("@/lib/certificateDisplay");
      const enriched = certificates.map((cert) => {
        const doctor =
          (cert.assignedDoctorId && byId.get(String(cert.assignedDoctorId))) ||
          byEmail.get(String(cert.assignedDoctor || "").toLowerCase()) ||
          doctors.find((d) =>
            String(cert.assignedDoctor || "")
              .toLowerCase()
              .includes(String(d.fullName || "").replace(/\b(dr|md)\b\.?/gi, "").trim().toLowerCase().slice(0, 12))
          );
        const applicant = applicantByEmail.get(String(cert.applicantEmail || "").toLowerCase());
        const expiresAt = cert.expiresAt || (cert.issuedAt || cert.appliedDate
          ? new Date(new Date(cert.issuedAt || cert.appliedDate).getTime() + 180 * 24 * 60 * 60 * 1000)
          : new Date(Date.now() + 180 * 24 * 60 * 60 * 1000));
        return {
          ...cert,
          avatarUrl: cert.avatarUrl || applicant?.avatarUrl || "",
          candidateIdNumber: cert.candidateIdNumber || applicant?.nationalId || "",
          gender: cert.gender || applicant?.gender || "",
          age: cert.age || ageFromDateOfBirth(applicant?.dateOfBirth) || undefined,
          assignedDoctorLicense: cert.assignedDoctorLicense || doctor?.licenseNumber || "",
          assignedDoctor: cert.assignedDoctor || doctor?.fullName || "",
          assignedDoctorSpecialty: doctor?.specialty || "Occupational Medicine & Telehealth",
          category: categoryFromPurpose(cert.purpose, cert.category, cert.jobType),
          expiresAt,
          qrCodeUrl: `${FITMED_APP_URL}/verify/${cert.certificateId}`,
        };
      });

      return NextResponse.json(
        { success: true, certificates: enriched },
        { headers: { "Cache-Control": "no-store, max-age=0" } }
      );
    } catch (dbErr) {
      console.warn("MongoDB fetch certificates failed:", dbErr);
      return NextResponse.json({ success: true, certificates: [] });
    }
  } catch (error: any) {
    console.error("GET certificates error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      applicantEmail,
      applicantPhone,
      candidateName,
      candidateIdNumber,
      avatarUrl,
      nationalIdImageUrl,
      age,
      gender,
      purpose,
      jobType,
      height,
      weight,
      bmi,
      vitals,
      redFlags,
      symptoms,
      history,
      functional,
      additionalNotes,
    } = body;

    if (!applicantEmail || !candidateName || !candidateIdNumber || !purpose) {
      return NextResponse.json({ 
        error: "Missing required fields: applicantEmail, candidateName, candidateIdNumber, purpose" 
      }, { status: 400 });
    }

    // Run clinical engine to determine outcome
    const wizardData: WizardData = {
      purpose,
      jobType: jobType || "",
      height: height || "",
      weight: weight || "",
      bmi: bmi || "",
      vitals: vitals || { temperature: "", bp: "", pulse: "", spo2: "" },
      redFlags: redFlags || {},
      symptoms: symptoms || {},
      history: history || {},
      functional: functional || {},
      additionalNotes: additionalNotes || "",
    };

    const clinicalDecision = runClinicalEngine(wizardData);

    // Calculate risk level based on clinical outcome
    let riskLevel = "Low Risk";
    let riskColor = "bg-emerald-100 text-emerald-800 border-emerald-300";
    
    if (clinicalDecision.outcome === "B") {
      riskLevel = "Moderate Risk";
      riskColor = "bg-amber-100 text-amber-800 border-amber-300";
    } else if (clinicalDecision.outcome === "C") {
      riskLevel = "Elevated Risk";
      riskColor = "bg-orange-100 text-orange-800 border-orange-300";
    } else if (clinicalDecision.outcome === "D") {
      riskLevel = "High Risk";
      riskColor = "bg-rose-100 text-rose-800 border-rose-300";
    }

    // Count red flags
    const redFlagCount = Object.values(redFlags || {}).filter(Boolean).length;
    const flagsText = redFlagCount > 0 
      ? `${redFlagCount} Red Flag${redFlagCount > 1 ? 's' : ''}` 
      : "0 Red Flags";

    await connectToDatabase();

    const applicant = await User.findOne({ email: String(applicantEmail).toLowerCase() })
      .select("avatarUrl nationalId nationalIdImageUrl gender dateOfBirth phone fullName")
      .lean();
    const photoUrl = String(avatarUrl || applicant?.avatarUrl || "");
    const idPhotoUrl = String(nationalIdImageUrl || applicant?.nationalIdImageUrl || "");
    if (!isCloudinaryUrl(photoUrl) || !isCloudinaryUrl(idPhotoUrl)) {
      return NextResponse.json(
        {
          success: false,
          error: "Upload your profile photo and National ID photo (saved to Cloudinary) before submitting an application.",
        },
        { status: 400 }
      );
    }
    const idNumber = String(candidateIdNumber || applicant?.nationalId || "");
    const applicantPhoneResolved = String(applicantPhone || applicant?.phone || "");
    const applicantGender = String(gender || applicant?.gender || "");
    const profileDob = String(applicant?.dateOfBirth || body.dateOfBirth || "");
    const resolvedAge = ageFromDateOfBirth(profileDob) ?? (typeof age === "number" ? age : undefined);

    const certificateId = await nextKey("certificate");
    const sha256Hash = crypto.createHash("sha256").update(JSON.stringify(wizardData)).digest("hex");
    const qrCodeUrl = `${FITMED_APP_URL}/verify/${certificateId}`;

    const assignment = await pickOnDutyDoctor();
    const assignedDoctor = assignment.assignedDoctor;
    const assignedDoctorId = assignment.assignedDoctorId;
    const assignedDoctorLicense = assignment.assignedDoctorLicense;

    const newCertificate = {
      certificateId,
      applicantEmail: String(applicantEmail).toLowerCase(),
      applicantPhone: applicantPhoneResolved,
      candidateName,
      candidateIdNumber: idNumber,
      avatarUrl: photoUrl,
      nationalIdImageUrl: idPhotoUrl,
      age: resolvedAge,
      gender: applicantGender,
      purpose,
      jobType,
      category: jobType && !/^none of the above$/i.test(String(jobType)) ? jobType : purpose || "Employment Fitness",
      decision: "PENDING",
      restrictions: "",
      decisionNotes: "",
      vitals: {
        bloodPressure: vitals?.bp || "",
        heartRate: vitals?.pulse || "",
        bmi: bmi || "",
        spo2: vitals?.spo2 || "",
        temperature: vitals?.temperature || "",
        pulse: vitals?.pulse || "",
      },
      redFlags: redFlags || {},
      symptoms: symptoms || {},
      history: history || {},
      functional: functional || {},
      additionalNotes: additionalNotes || "",
      clinicalOutcome: clinicalDecision.outcome,
      sha256Hash,
      qrCodeUrl,
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months
      status: "submitted",
      paymentStatus: "UNPAID",
      assignedDoctor,
      assignedDoctorId,
      assignedDoctorLicense,
      riskLevel,
      riskColor,
      appliedDate: new Date(),
    };

    let savedCertificate: any = newCertificate;

    try {
      savedCertificate = await Certificate.create(newCertificate as any);
    } catch (dbErr) {
      console.warn("MongoDB certificate save failed:", dbErr);
      return NextResponse.json({ success: false, error: "Could not save the application to the database." }, { status: 500 });
    }

    const doctorName = assignedDoctor.replace(/\s*\(You\)\s*$/, "") || "FitMed Physician";
    const doctorEmail = assignment.assignedDoctorEmail || FITMED_DOCTOR_EMAIL;
    const dash = `${FITMED_APP_URL}/dashboard/user`;
    await notifyPerson({
      toEmail: applicantEmail,
      toName: candidateName,
      role: "user",
      subject: `FitMed received your application ${certificateId}`,
      htmlContent: EmailTemplates.applicationReceived(candidateName, certificateId, purpose),
      snippet: `Official Document No. ${certificateId} is with a licensed doctor.`,
      href: dash,
    });
    await notifyPerson({
      toEmail: doctorEmail,
      toName: doctorName,
      role: "doctor",
      subject: `New FitMed queue case ${certificateId}`,
      htmlContent: EmailTemplates.doctorNewQueueApplication(doctorName, candidateName, certificateId, purpose, riskLevel),
      snippet: `${candidateName} submitted ${certificateId} (${purpose}).`,
      href: `${FITMED_APP_URL}/dashboard/doctor`,
    });
    await notifyPerson({
      toEmail: FITMED_ADMIN_EMAIL,
      toName: "FitMed Admin",
      role: "admin",
      subject: `New application ${certificateId} — ${candidateName}`,
      htmlContent: EmailTemplates.doctorNewQueueApplication("FitMed Admin", candidateName, certificateId, purpose, riskLevel),
      snippet: `New application ${certificateId} assigned to ${doctorName}.`,
      href: `${FITMED_APP_URL}/dashboard/admin`,
    });

    return NextResponse.json({
      success: true,
      certificate: savedCertificate,
      clinicalDecision,
      message: "Certificate application submitted successfully",
    });
  } catch (error: any) {
    console.error("POST certificate error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { certificateId, decision, restrictions, decisionNotes, status, paymentStatus, doctorNotes, doctorDocuments, structuredAssessment, iremboRef, action } = body;

    if (!certificateId) {
      return NextResponse.json({ error: "certificateId required" }, { status: 400 });
    }

    const certKey = String(certificateId).toUpperCase();
    const escapedId = String(certificateId).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    try {
      await connectToDatabase();
      const certDoc = await Certificate.findOne({
        $or: [
          { certificateId: certKey },
          { certificateId: { $regex: `^${escapedId}$`, $options: "i" } },
        ],
      });

      if (action === "payment-reminder") {
        if (!certDoc) {
          return NextResponse.json({ success: false, error: "Certificate not found." }, { status: 404 });
        }
        if (String(certDoc.paymentStatus || "").toUpperCase() === "PAID") {
          return NextResponse.json({ success: false, error: "This certificate is already paid." }, { status: 400 });
        }
        const approvedAt = certDoc.approvedAt;
        if (approvedAt && Date.now() - new Date(approvedAt).getTime() > 60 * 60 * 1000) {
          return NextResponse.json(
            { success: false, error: "Payment reminders can only be sent within one hour of approval." },
            { status: 400 }
          );
        }
        if (!approvedAt && String(certDoc.status || "").toLowerCase() !== "approved") {
          return NextResponse.json({ success: false, error: "This certificate is not waiting for payment." }, { status: 400 });
        }
        const name = String(certDoc.candidateName || "Applicant");
        const certId = String(certDoc.certificateId || certKey);
        const purpose = String(certDoc.purpose || "Medical fitness");
        const payLink = `${FITMED_APP_URL}/dashboard/user?pay=${encodeURIComponent(certId)}`;
        await notifyPerson({
          toEmail: String(certDoc.applicantEmail || ""),
          toName: name,
          role: "user",
          subject: `Payment reminder for certificate ${certId}`,
          htmlContent: EmailTemplates.paymentReminder(name, certId, purpose, payLink),
          snippet: `Complete 5,000 FRW to unlock ${certId}.`,
          href: payLink,
        });
        certDoc.lastPaymentReminderAt = new Date();
        await Certificate.updateOne({ _id: certDoc._id }, { $set: { lastPaymentReminderAt: new Date() } }).catch(() => null);
        return NextResponse.json({ success: true });
      }

      const updateData: Record<string, unknown> = {};
      if (decision) updateData.decision = decision;
      if (restrictions !== undefined) updateData.restrictions = restrictions;
      if (decisionNotes !== undefined) updateData.decisionNotes = decisionNotes;
      if (status) {
        updateData.status = status;
        if (String(status).toLowerCase() === "approved") {
          updateData.approvedAt = new Date();
        }
      }
      if (paymentStatus) updateData.paymentStatus = paymentStatus;
      if (String(paymentStatus || "").toUpperCase() === "PAID") {
        updateData.iremboRef = await nextKey("irembo");
      }
      if (iremboRef && String(paymentStatus || "").toUpperCase() !== "PAID") updateData.iremboRef = iremboRef;
      if (doctorNotes !== undefined) updateData.doctorNotes = doctorNotes;
      if (doctorDocuments) updateData.doctorDocuments = doctorDocuments;
      if (structuredAssessment) updateData.structuredAssessment = structuredAssessment;

      const updated = await Certificate.findOneAndUpdate(
        certDoc ? { _id: certDoc._id } : { certificateId: certKey },
        updateData,
        { new: true }
      );

      if (updated) {
        if (String(status || "").toLowerCase() === "approved" && updated.assignedDoctorId) {
          await Doctor.findByIdAndUpdate(updated.assignedDoctorId, { $inc: { totalCertificatesIssued: 1 } }).catch(() => null);
        }
        await AuditLog.create({
          action: status ? `certificate_${String(status).toLowerCase()}` : paymentStatus ? `payment_${String(paymentStatus).toLowerCase()}` : "certificate_updated",
          detail: `${certKey} · ${updated.candidateName} · ${updated.assignedDoctor || "Unassigned"}`,
          actor: updated.assignedDoctor || "doctor",
          meta: { certificateId: certKey, status, paymentStatus },
        }).catch(() => null);
        if (String(paymentStatus || "").toUpperCase() === "PAID") {
          await Payment.findOneAndUpdate(
            { certificateId: certKey },
            {
              certificateId: certKey,
              applicantName: updated.candidateName,
              applicantEmail: updated.applicantEmail,
              applicantPhone: updated.applicantPhone || "",
              purpose: updated.purpose,
              amount: 5000,
              currency: "FRW",
              channel: String(body.channel || updated.paymentChannel || "Irembo"),
              iremboRef: String(updated.iremboRef || iremboRef || certKey),
              status: "PAID",
              doctorName: updated.assignedDoctor || "",
              paidAt: new Date(),
            },
            { upsert: true, new: true }
          ).catch(() => null);
        }
        await notifyCertificateEmails(updated.toObject(), { status, paymentStatus, decision, decisionNotes });
      }

      return NextResponse.json({ success: true, certificate: updated });
    } catch (dbErr) {
      console.warn("MongoDB patch certificate failed:", dbErr);
      return NextResponse.json({ success: false, error: "Could not update the certificate in the database." }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function notifyCertificateEmails(
  cert: Record<string, unknown>,
  change: { status?: string; paymentStatus?: string; decision?: string; decisionNotes?: string }
) {
  const email = String(cert.applicantEmail || "");
  const name = String(cert.candidateName || "Applicant");
  const certId = String(cert.certificateId || "");
  const purpose = String(cert.purpose || "Medical fitness");
  const doctor = String(cert.assignedDoctor || "FitMed Physician").replace(/\s*\(You\)\s*$/, "");
  const dash = `${FITMED_APP_URL}/dashboard/user`;
  const doctorDash = `${FITMED_APP_URL}/dashboard/doctor`;
  const payLink = `${FITMED_APP_URL}/dashboard/user?pay=${encodeURIComponent(certId)}`;
  const verifyLink = `${FITMED_APP_URL}/verify/${encodeURIComponent(certId)}`;
  const status = String(change.status || "").toLowerCase();
  const decision = String(change.decision || "").toUpperCase();
  const paidNow = String(change.paymentStatus || "").toUpperCase() === "PAID";

  if (!email || !certId) return;

  let doctorEmail = FITMED_DOCTOR_EMAIL;
  if (cert.assignedDoctorId && mongoose.isValidObjectId(String(cert.assignedDoctorId))) {
    const assigned = await Doctor.findById(cert.assignedDoctorId).select("email").lean();
    if (assigned?.email) doctorEmail = String(assigned.email);
  }

  if (paidNow) {
    const iremboRef = String(cert.iremboRef || cert.paymentReference || "");
    await notifyPerson({
      toEmail: email,
      toName: name,
      role: "user",
      subject: `Payment confirmed — certificate ${certId} is ready`,
      htmlContent: EmailTemplates.certificatePaidDelivered(name, certId, purpose, iremboRef, verifyLink),
      snippet: `Official certificate ${certId} is ready to view and download.`,
      href: verifyLink,
    });
    await notifyPerson({
      toEmail: FITMED_ADMIN_EMAIL,
      toName: "FitMed Admin",
      role: "admin",
      subject: `Payment received for ${certId}`,
      htmlContent: EmailTemplates.paymentReceivedAdmin(name, certId, "5,000 FRW", iremboRef),
      snippet: `${name} paid 5,000 FRW for ${certId}.`,
      href: `${FITMED_APP_URL}/dashboard/admin`,
    });
    await notifyPerson({
      toEmail: doctorEmail,
      toName: doctor,
      role: "doctor",
      subject: `Certificate ${certId} issued after payment`,
      htmlContent: EmailTemplates.certificateIssued(name, certId, purpose, doctor),
      snippet: `${name} completed payment. ${certId} is issued.`,
      href: doctorDash,
    });
    return;
  }

  if (status === "approved") {
    await notifyPerson({
      toEmail: email,
      toName: name,
      role: "user",
      subject: `Certificate ${certId} approved — complete payment`,
      htmlContent: EmailTemplates.certificateApprovedPayLink(name, certId, purpose, doctor, payLink),
      snippet: `Pay 5,000 FRW to unlock official document ${certId}.`,
      href: payLink,
    });
    await notifyPerson({
      toEmail: doctorEmail,
      toName: doctor,
      role: "doctor",
      subject: `You approved ${certId}`,
      htmlContent: EmailTemplates.certificateStatusNotification(
        doctor,
        certId,
        purpose,
        "Approved — waiting for payment",
        doctor,
        `${name} has been asked to pay 5,000 FRW.`,
        doctorDash
      ),
      snippet: `${name} was notified to pay for ${certId}.`,
      href: doctorDash,
    });
    return;
  }

  if (status === "under-review") {
    await notifyPerson({
      toEmail: email,
      toName: name,
      role: "user",
      subject: `Your application ${certId} is under review`,
      htmlContent: EmailTemplates.certificateStatusNotification(
        name,
        certId,
        purpose,
        "Under review",
        doctor,
        "A licensed physician is reviewing your application. You will be notified of the next step.",
        dash
      ),
      snippet: `${certId} is now under doctor review.`,
      href: dash,
    });
    return;
  }

  if (status === "rejected") {
    await notifyPerson({
      toEmail: email,
      toName: name,
      role: "user",
      subject: `Update on your FitMed application ${certId}`,
      htmlContent: EmailTemplates.certificateStatusNotification(
        name,
        certId,
        purpose,
        "Not issued",
        doctor,
        String(change.decisionNotes || cert.decisionNotes || "Please open your dashboard for the physician's notes."),
        dash
      ),
      snippet: `${certId} was not issued. See your dashboard for details.`,
      href: dash,
    });
    return;
  }

  if (decision && decision !== "PENDING") {
    await notifyPerson({
      toEmail: email,
      toName: name,
      role: "user",
      subject: `Clinical decision on ${certId}: ${decision}`,
      htmlContent: EmailTemplates.certificateStatusNotification(
        name,
        certId,
        purpose,
        decision,
        doctor,
        String(change.decisionNotes || "Your doctor has recorded a clinical decision. Open your dashboard for next steps."),
        dash
      ),
      snippet: `Physician decision for ${certId}: ${decision}.`,
      href: dash,
    });
  }
}

