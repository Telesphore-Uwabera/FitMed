import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Certificate from "@/models/Certificate";
import { runClinicalEngine, WizardData } from "@/lib/clinicalEngine";
import crypto from "crypto";
import { listCertificates, patchCertificate, saveCertificate } from "@/lib/memoryStore";

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
      if (applicantEmail) query.applicantEmail = applicantEmail;
      if (assignedDoctorId) query.assignedDoctorId = assignedDoctorId;

      const certificates = await Certificate.find(query)
        .sort({ appliedDate: -1 })
        .limit(50);

      return NextResponse.json({ success: true, certificates });
    } catch (dbErr) {
      console.warn("MongoDB fetch certificates fallback:", dbErr);
      return NextResponse.json({
        success: true,
        certificates: listCertificates({ status, applicantEmail, assignedDoctorId }),
        source: "memory",
      });
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

    // Assign doctor (simple round-robin for now)
    const assignedDoctor = "Dr. Telesphore Uwabera (You)";
    const assignedDoctorId = "DOC-RW-4091";

    const newCertificate = {
      certificateId,
      applicantEmail,
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
      riskLevel,
      riskColor,
      appliedDate: new Date(),
    };

    let savedCertificate: any = newCertificate;

    try {
      await connectToDatabase();
      savedCertificate = await Certificate.create(newCertificate);
    } catch (dbErr) {
      console.warn("MongoDB certificate save fallback:", dbErr);
      savedCertificate = saveCertificate(newCertificate);
    }

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
    const { certificateId, decision, restrictions, decisionNotes, status, paymentStatus, doctorNotes, doctorDocuments, structuredAssessment } = body;

    if (!certificateId) {
      return NextResponse.json({ error: "certificateId required" }, { status: 400 });
    }

    try {
      await connectToDatabase();
      const updateData: any = {};
      if (decision) updateData.decision = decision;
      if (restrictions !== undefined) updateData.restrictions = restrictions;
      if (decisionNotes !== undefined) updateData.decisionNotes = decisionNotes;
      if (status) updateData.status = status;
      if (paymentStatus) updateData.paymentStatus = paymentStatus;
      if (doctorNotes !== undefined) updateData.doctorNotes = doctorNotes;
      if (doctorDocuments) updateData.doctorDocuments = doctorDocuments;
      if (structuredAssessment) updateData.structuredAssessment = structuredAssessment;

      const updated = await Certificate.findOneAndUpdate(
        { certificateId },
        updateData,
        { new: true }
      );

      return NextResponse.json({ success: true, certificate: updated });
    } catch (dbErr) {
      console.warn("MongoDB patch certificate fallback:", dbErr);
      const updated = patchCertificate(certificateId, {
        ...(decision && { decision }),
        ...(restrictions !== undefined && { restrictions }),
        ...(decisionNotes !== undefined && { decisionNotes }),
        ...(status && { status }),
        ...(paymentStatus && { paymentStatus }),
        ...(doctorNotes !== undefined && { doctorNotes }),
        ...(doctorDocuments && { doctorDocuments }),
        ...(structuredAssessment && { structuredAssessment }),
      });
      return NextResponse.json({ success: true, certificate: updated, source: "memory" });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
