export function consultationRoomId(apt?: {
  roomId?: string;
  appointmentId?: string;
} | null) {
  return String(apt?.roomId || apt?.appointmentId || "").trim();
}

export function formatChatMessages(messages: any[] = []) {
  return messages.map((m) => ({
    sender: (m.senderRole === "doctor" ? "doctor" : "applicant") as "doctor" | "applicant",
    name: m.senderName,
    text: m.messageText,
    time: new Date(m.timestamp || m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  }));
}

// ── Normalise raw DB decision enum → human-readable label ────────────────────
export function normalizeDecision(raw?: string | null): string {
  if (!raw) return "Pending";
  const d = String(raw).trim().toUpperCase().replace(/-/g, "_");
  if (d === "FIT") return "FIT";
  if (d === "FIT_RESTRICTED" || d === "FIT WITH RESTRICTIONS") return "FIT — WITH RESTRICTIONS";
  if (d === "PHYSICAL_CONSULTATION") return "PHYSICAL CONSULTATION REQUIRED";
  if (d === "INVESTIGATION_SPECIALIST") return "SPECIALIST INVESTIGATION REQUIRED";
  if (d === "FURTHER_ASSESSMENT") return "FURTHER ASSESSMENT REQUIRED";
  if (d === "NOT_FIT" || d === "UNFIT" || d === "REJECTED") return "NOT FIT / DECLINED";
  if (d === "URGENT_REFERRAL") return "URGENT MEDICAL REFERRAL";
  if (d === "PENDING") return "Pending";
  // Fallback: replace underscores, title-case
  return String(raw).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Normalise raw DB status → human-readable label ───────────────────────────
export function normalizeStatus(raw?: string | null): string {
  if (!raw) return "Submitted";
  const s = String(raw).toLowerCase().trim();
  switch (s) {
    case "submitted":            return "Submitted";
    case "under-review":
    case "under_review":         return "Under Review";
    case "approved":             return "Approved";
    case "valid":                return "Valid";
    case "issued":               return "Issued";
    case "rejected":             return "Declined";
    case "revoked":              return "Revoked";
    case "expired":              return "Expired";
    case "video-scheduled":
    case "video appointment requested": return "Video Appointment Scheduled";
    case "physical-checkup":
    case "physical check up requested": return "Physical Check-up Requested";
    case "specialist-referral":  return "Specialist Referral Required";
    case "urgent-referral":      return "Urgent Medical Referral";
    default:
      return String(raw).replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

export function formatCertificateCard(cert: any, existing: Record<string, any> = {}) {
  const status = cert.status || existing.status;
  const paymentStatus = cert.paymentStatus || existing.paymentStatus || "UNPAID";
  const decision = cert.decision || cert.structuredAssessment?.decision;

  // Build a statusLabel that reflects both the workflow status AND the clinical decision
  // so the applicant always understands exactly what state their application is in.
  let statusLabel: string;
  if (status === "approved" || status === "valid" || status === "issued") {
    if (decision === "FIT_RESTRICTED") {
      statusLabel = paymentStatus === "PAID" ? "FIT (WITH RESTRICTIONS)" : "FIT WITH RESTRICTIONS (UNPAID)";
    } else {
      statusLabel = paymentStatus === "PAID" ? "VERIFIED FIT (PAID)" : "APPROVED — PAYMENT DUE";
    }
  } else if (status === "rejected" || decision === "NOT_FIT" || decision === "UNFIT") {
    statusLabel = "DECLINED / NOT FIT";
  } else if (decision === "PHYSICAL_CONSULTATION" || status === "physical-checkup" || status === "physical check up requested") {
    statusLabel = "PHYSICAL CONSULTATION REQUIRED";
  } else if (decision === "INVESTIGATION_SPECIALIST" || status === "specialist-referral") {
    statusLabel = "SPECIALIST INVESTIGATION REQUIRED";
  } else if (decision === "URGENT_REFERRAL" || status === "urgent-referral") {
    statusLabel = "URGENT MEDICAL REFERRAL";
  } else if (status === "video-scheduled" || status === "video appointment requested") {
    statusLabel = "VIDEO APPOINTMENT SCHEDULED";
  } else if (status === "under-review" || status === "under_review") {
    if (decision === "FURTHER_ASSESSMENT") {
      statusLabel = "FURTHER ASSESSMENT REQUIRED";
    } else {
      statusLabel = "UNDER REVIEW";
    }
  } else if (status === "submitted") {
    statusLabel = "SUBMITTED — AWAITING REVIEW";
  } else {
    statusLabel = existing.statusLabel || normalizeStatus(status).toUpperCase();
  }

  const issued = cert.issuedAt || cert.appliedDate;
  const expires = cert.expiresAt;
  return {
    ...existing,
    id: cert.certificateId,
    purpose: cert.purpose || existing.purpose,
    doctor: String(cert.assignedDoctor || existing.doctor || "FitMed Physician").replace(/\s*\(You\)\s*/gi, "").trim(),
    license: cert.assignedDoctorLicense || existing.license || "—",
    issueDate: issued ? new Date(issued).toLocaleDateString() : existing.issueDate || "Today",
    expiryDate: expires ? new Date(expires).toLocaleDateString() : existing.expiryDate || "—",
    status,
    statusLabel,
    paymentStatus,
    iremboRef: cert.iremboRef || existing.iremboRef || null,
    fee: existing.fee || "5,000 FRW",
    notes: existing.notes || cert.decisionNotes || cert.additionalNotes || "",
    qrUrl: cert.qrCodeUrl || existing.qrUrl,
    category: cert.category || cert.jobType || existing.category,
    avatarUrl: cert.avatarUrl || existing.avatarUrl || "",
    fullCertificate: cert,
  };
}
