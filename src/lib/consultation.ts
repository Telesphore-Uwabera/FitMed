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

export function formatCertificateCard(cert: any, existing: Record<string, any> = {}) {
  const status = cert.status || existing.status;
  const paymentStatus = cert.paymentStatus || existing.paymentStatus || "UNPAID";
  let statusLabel = existing.statusLabel || "SUBMITTED - AWAITING DOCTOR REVIEW";
  if (status === "approved") {
    statusLabel = paymentStatus === "PAID" ? "VERIFIED FIT (PAID)" : "APPROVED — PAYMENT DUE";
  } else if (status === "rejected") {
    statusLabel = "REJECTED (DECLINED)";
  } else if (status === "under-review") {
    statusLabel = "UNDER REVIEW";
  } else if (status === "submitted") {
    statusLabel = "SUBMITTED - AWAITING DOCTOR REVIEW";
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
  };
}
