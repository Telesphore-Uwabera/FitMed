import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Certificate from "@/models/Certificate";
import Doctor from "@/models/Doctor";
import Payment from "@/models/Payment";
import AuditLog from "@/models/AuditLog";
import { runClinicalEngine, WizardData } from "@/lib/clinicalEngine";
import { pickOnDutyDoctor } from "@/lib/assignDoctor";
import crypto from "crypto";
import {
  sendBrevoEmail,
  EmailTemplates,
  FITMED_APP_URL,
  FITMED_ADMIN_EMAIL,
} from "@/lib/brevo";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const applicantEmail = searchParams.get("applicantEmail");
    const assignedDoctorId = searchParams.get("assignedDoctorId");

    try {
      await connectToDatabase();
      const query: any = {};
      if (status) query.status = status;
      if (applicantEmail) query.applicantEmail = { $regex: `^${applicantEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" };
      if (assignedDoctorId) query.assignedDoctorId = assignedDoctorId;

      const certificates = await Certificate.find(query)
        .sort({ appliedDate: -1, createdAt: -1 })
        .limit(500);

      return NextResponse.json({ success: true, certificates });
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

    // Generate certificate ID and hash
    const certificateId = `FM-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const sha256Hash = crypto.createHash('sha256').update(JSON.stringify(wizardData)).digest('hex');
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://fitmed.rw/verify/${certificateId}`;

    await connectToDatabase();

    const assignment = await pickOnDutyDoctor();
    const assignedDoctor = assignment.assignedDoctor;
    const assignedDoctorId = assignment.assignedDoctorId;
    const assignedDoctorLicense = assignment.assignedDoctorLicense;

    const newCertificate = {
      certificateId,
      applicantEmail: String(applicantEmail).toLowerCase(),
      applicantPhone: applicantPhone || "",
      candidateName,
      candidateIdNumber,
      avatarUrl: avatarUrl || "",
      nationalIdImageUrl: nationalIdImageUrl || "",
      age,
      gender,
      purpose,
      jobType,
      category: jobType || "General",
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
    void sendBrevoEmail({
      toEmail: applicantEmail,
      toName: candidateName,
      subject: `FitMed received your application ${certificateId}`,
      htmlContent: EmailTemplates.applicationReceived(candidateName, certificateId, purpose),
    });
    if (assignment.assignedDoctorEmail) {
      void sendBrevoEmail({
        toEmail: assignment.assignedDoctorEmail,
        toName: doctorName,
        subject: `New FitMed queue case ${certificateId}`,
        htmlContent: EmailTemplates.doctorNewQueueApplication(
          doctorName,
          candidateName,
          certificateId,
          purpose,
          riskLevel
        ),
      });
    }
    void sendBrevoEmail({
      toEmail: FITMED_ADMIN_EMAIL,
      toName: "FitMed Admin",
      subject: `New application ${certificateId} — ${candidateName}`,
      htmlContent: EmailTemplates.doctorNewQueueApplication(
        "FitMed Admin",
        candidateName,
        certificateId,
        purpose,
        riskLevel
      ),
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

    try {
      await connectToDatabase();
      if (action === "payment-reminder") {
        const cert = await Certificate.findOne({ certificateId: certKey });
        if (!cert) {
          return NextResponse.json({ success: false, error: "Certificate not found." }, { status: 404 });
        }
        await notifyCertificateEmails(cert.toObject(), { status: "approved" });
        return NextResponse.json({ success: true });
      }
      const updateData: any = {};
      if (decision) updateData.decision = decision;
      if (restrictions !== undefined) updateData.restrictions = restrictions;
      if (decisionNotes !== undefined) updateData.decisionNotes = decisionNotes;
      if (status) updateData.status = status;
      if (paymentStatus) updateData.paymentStatus = paymentStatus;
      if (iremboRef) updateData.iremboRef = iremboRef;
      if (doctorNotes !== undefined) updateData.doctorNotes = doctorNotes;
      if (doctorDocuments) updateData.doctorDocuments = doctorDocuments;
      if (structuredAssessment) updateData.structuredAssessment = structuredAssessment;

      const updated = await Certificate.findOneAndUpdate(
        { certificateId: certKey },
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
              iremboRef: String(iremboRef || updated.iremboRef || certKey),
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
  const payLink = `${FITMED_APP_URL}/dashboard/user?pay=${encodeURIComponent(certId)}`;
  const paidNow = String(change.paymentStatus || "").toUpperCase() === "PAID";
  const alreadyPaid = String(cert.paymentStatus || "").toUpperCase() === "PAID";

  if (!email || !certId) return;

  if (paidNow) {
    const iremboRef = String(cert.iremboRef || cert.paymentReference || "");
    await sendBrevoEmail({
      toEmail: email,
      toName: name,
      subject: `Payment confirmed — certificate ${certId} is ready`,
      htmlContent: EmailTemplates.certificatePaidDelivered(name, certId, purpose, iremboRef, dash),
    });
    await sendBrevoEmail({
      toEmail: FITMED_ADMIN_EMAIL,
      toName: "FitMed Admin",
      subject: `Payment received for ${certId}`,
      htmlContent: EmailTemplates.paymentReceivedAdmin(name, certId, "5,000 FRW", iremboRef),
    });
    await sendBrevoEmail({
      toEmail: email,
      toName: name,
      subject: `Your FitMed certificate ${certId} has been issued`,
      htmlContent: EmailTemplates.certificateIssued(name, certId, purpose, doctor),
    });
    return;
  }

  if (change.status === "approved" && !alreadyPaid) {
    await sendBrevoEmail({
      toEmail: email,
      toName: name,
      subject: `Certificate ${certId} approved — complete payment`,
      htmlContent: EmailTemplates.certificateApprovedPayLink(name, certId, purpose, doctor, payLink),
    });
    return;
  }

  if (change.status && !["approved", "submitted", "pending"].includes(change.status)) {
    await sendBrevoEmail({
      toEmail: email,
      toName: name,
      subject: `Update on your FitMed application ${certId}`,
      htmlContent: EmailTemplates.certificateStatusNotification(
        name,
        certId,
        purpose,
        String(change.status || cert.status || "Updated"),
        doctor,
        String(change.decisionNotes || cert.decisionNotes || "Please review the decision in your dashboard."),
        dash
      ),
    });
  } else if (change.decision && !["FIT", "PENDING", ""].includes(String(change.decision).toUpperCase())) {
    await sendBrevoEmail({
      toEmail: email,
      toName: name,
      subject: `Clinical decision on ${certId}`,
      htmlContent: EmailTemplates.certificateStatusNotification(
        name,
        certId,
        purpose,
        String(change.decision),
        doctor,
        String(change.decisionNotes || "Your doctor has recorded a clinical decision. Open your dashboard for details."),
        dash
      ),
    });
  }
}

