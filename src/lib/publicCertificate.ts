import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import Certificate from "@/models/Certificate";
import Doctor from "@/models/Doctor";
import User from "@/models/User";
import { officialDocumentNo, toOfficialCertificateData } from "@/lib/certificateDisplay";
import type { CertificateData } from "@/components/OfficialMedicalCertificate";

export type VerifyOutcome = "valid" | "invalid" | "expired" | "unavailable";

export type PublicVerification = {
  outcome: VerifyOutcome;
  certificateId: string;
  title: string;
  message: string;
  purpose?: string;
  candidateName?: string;
  issueDate?: string;
  expiryDate?: string;
  data?: CertificateData;
};

const LOOKUP_TIMEOUT_MS = 9000;

export function normalizeCertificateId(raw?: string) {
  const id = officialDocumentNo(raw).replace(/\s+/g, "");
  if (!id || id.length > 64) return "";
  if (!/^[A-Z0-9][A-Z0-9-]{0,63}$/.test(id)) return "";
  return id;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

function isFitDecision(decision: string) {
  const value = decision.toUpperCase().trim();
  if (!value || value === "PENDING") return false;
  if (
    value.includes("NOT") ||
    value.includes("UNFIT") ||
    value.includes("FURTHER") ||
    value.includes("REFERRAL") ||
    value.includes("INVESTIGATION") ||
    value.includes("PHYSICAL")
  ) {
    return false;
  }
  return value === "FIT" || value === "FIT_RESTRICTED" || value.includes("RESTRICT");
}

function isIssuedStatus(status: string) {
  return ["approved", "valid", "issued"].includes(status.toLowerCase());
}

function isPaid(cert: Record<string, unknown>, status: string) {
  if (String(cert.paymentStatus || "").toUpperCase() === "PAID") return true;
  // Older records used status "Valid" only after the certificate was issued.
  return status.toLowerCase() === "valid";
}

function expiryDate(cert: Record<string, unknown>) {
  const raw = cert.expiresAt;
  if (!raw) return null;
  const date = raw instanceof Date ? raw : new Date(String(raw));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function classifyStoredCertificate(cert: Record<string, unknown>): "valid" | "invalid" | "expired" | "revoked" {
  const status = String(cert.status || "");
  const normalized = status.toLowerCase();
  if (normalized === "revoked") return "revoked";
  const fit = isFitDecision(String(cert.decision || ""));
  const issued = isIssuedStatus(status);
  if (!fit || !issued || !isPaid(cert, status)) return "invalid";
  const expiry = expiryDate(cert);
  if (normalized === "expired" || (expiry && expiry.getTime() < Date.now())) return "expired";
  return "valid";
}

async function lookupInDatabase(certificateId: string): Promise<PublicVerification> {
  await connectToDatabase();
  const cert = (await Certificate.findOne({
    certificateId: { $regex: `^${certificateId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
  }).lean()) as Record<string, unknown> | null;

  if (!cert) {
    return {
      outcome: "invalid",
      certificateId,
      title: "Not found",
      message: `No FitMed certificate was found for ${certificateId}.`,
    };
  }

  const state = classifyStoredCertificate(cert);
  const applicant = cert.applicantEmail
    ? ((await User.findOne({ email: String(cert.applicantEmail).toLowerCase() })
        .select("avatarUrl nationalId")
        .lean()) as { avatarUrl?: string; nationalId?: string } | null)
    : null;

  let doctor: { fullName?: string; licenseNumber?: string; specialty?: string } | null = null;
  if (cert.assignedDoctorId && mongoose.isValidObjectId(String(cert.assignedDoctorId))) {
    doctor = (await Doctor.findById(cert.assignedDoctorId)
      .select("fullName licenseNumber specialty")
      .lean()) as { fullName?: string; licenseNumber?: string; specialty?: string } | null;
  }

  const data = toOfficialCertificateData(
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
  ) as CertificateData;

  if (state === "valid") {
    return {
      outcome: "valid",
      certificateId,
      title: "Valid",
      message: `${certificateId} is a valid FitMed certificate.`,
      purpose: data.purpose,
      candidateName: data.candidateName,
      issueDate: data.issueDate,
      expiryDate: data.expiryDate,
      data,
    };
  }

  if (state === "expired") {
    return {
      outcome: "expired",
      certificateId,
      title: "Expired",
      message: `${certificateId} has expired and is no longer valid for use.`,
      purpose: data.purpose,
      candidateName: data.candidateName,
      issueDate: data.issueDate,
      expiryDate: data.expiryDate,
    };
  }

  if (state === "revoked") {
    return {
      outcome: "invalid",
      certificateId,
      title: "Not valid",
      message: `${certificateId} has been revoked and cannot be used.`,
    };
  }

  return {
    outcome: "invalid",
    certificateId,
    title: "Not valid",
    message: `${certificateId} is not a valid public certificate. It may be incomplete, unpaid, or not yet issued.`,
  };
}

export async function lookupPublicCertificate(rawId?: string): Promise<PublicVerification> {
  const certificateId = normalizeCertificateId(rawId);
  if (!certificateId) {
    return {
      outcome: "invalid",
      certificateId: officialDocumentNo(rawId) || "",
      title: "Invalid number",
      message: "Enter the certificate number exactly as it appears on the document.",
    };
  }

  try {
    return await withTimeout(lookupInDatabase(certificateId), LOOKUP_TIMEOUT_MS);
  } catch (error) {
    console.error("Public certificate lookup failed:", error);
    return {
      outcome: "unavailable",
      certificateId,
      title: "Unavailable",
      message: "This certificate could not be checked right now. Please try again in a moment.",
    };
  }
}
