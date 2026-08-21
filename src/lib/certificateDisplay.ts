export function publicAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://fitmed-l2uv.onrender.com").replace(/\/$/, "");
}

export function officialDocumentNo(certificateId?: string) {
  return String(certificateId || "").trim().toUpperCase();
}

export function publicVerifyUrl(certificateId?: string) {
  const id = officialDocumentNo(certificateId);
  return id ? `${publicAppUrl()}/verify/${encodeURIComponent(id)}` : publicAppUrl();
}

export function qrCodeImageUrl(certificateId?: string, storedUrl?: string) {
  const verifyUrl = publicVerifyUrl(certificateId);
  if (storedUrl && /^https?:\/\//i.test(storedUrl) && storedUrl.includes("create-qr-code")) {
    return storedUrl;
  }
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(verifyUrl)}`;
}

export function qrCodeFallbackUrl(certificateId?: string) {
  return `https://quickchart.io/qr?size=220&text=${encodeURIComponent(publicVerifyUrl(certificateId))}`;
}

export function categoryFromPurpose(purpose?: string, category?: string, jobType?: string) {
  const existing = String(category || jobType || "").trim();
  const ignored = !existing || existing === "—" || /^general$/i.test(existing) || /^none of the above$/i.test(existing);
  if (!ignored) return existing;
  const value = String(purpose || "").toLowerCase();
  if (value.includes("employ") || value.includes("office") || value.includes("workplace")) return "Employment Fitness";
  if (value.includes("school") || value.includes("univers") || value.includes("student")) return "School & University";
  if (value.includes("driver") || value.includes("transport") || value.includes("taxi")) return "Transport & Driving";
  if (value.includes("height") || value.includes("construction") || value.includes("mining") || value.includes("occup")) {
    return "Occupational / High-Risk";
  }
  if (value.includes("aviation") || value.includes("pilot") || value.includes("diving")) return "Aviation & Specialised";
  if (existing) return existing;
  return "General Health Fitness";
}

export function formatCertDate(value?: string | Date | null) {
  if (!value || value === "—") return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-GB");
}

export function defaultExpiryDate(issueDate?: string | Date | null, expiresAt?: string | Date | null) {
  const formattedExpiry = formatCertDate(expiresAt);
  if (formattedExpiry) return formattedExpiry;
  const issued = issueDate ? new Date(issueDate) : new Date();
  if (Number.isNaN(issued.getTime())) {
    const fallback = new Date();
    fallback.setMonth(fallback.getMonth() + 6);
    return fallback.toLocaleDateString("en-GB");
  }
  const expiry = new Date(issued);
  expiry.setMonth(expiry.getMonth() + 6);
  return expiry.toLocaleDateString("en-GB");
}

export function displayDoctorName(value?: string) {
  return String(value || "")
    .replace(/\s*\(You\)\s*/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function firstFilled(...values: unknown[]) {
  for (const value of values) {
    const text = String(value || "").trim();
    if (text && text !== "—") return text;
  }
  return "";
}

export function toOfficialCertificateData(
  source: CertSource,
  extras: {
    doctorName?: string;
    doctorLicense?: string;
    doctorSpecialty?: string;
    doctorId?: string;
    candidateName?: string;
    applicantImageUrl?: string;
    nationalId?: string;
  } = {}
) {
  const cert = source.fullCertificate || source;
  const certificateId = officialDocumentNo(cert.certificateId || source.id || source.certificateId);
  const issueRaw = cert.issuedAt || cert.appliedDate || source.date || source.issueDate;
  const doctorName =
    displayDoctorName(
      firstFilled(cert.assignedDoctor, extras.doctorName, source.doctor)
    ) || "FitMed Physician";
  const doctorLicense = firstFilled(
    cert.assignedDoctorLicense,
    cert.structuredAssessment?.licenseNumber,
    extras.doctorLicense,
    source.license
  );
  const photo = firstFilled(cert.avatarUrl, extras.applicantImageUrl, source.avatarUrl, source.applicantImageUrl);

  return {
    certificateId,
    candidateName: String(cert.candidateName || extras.candidateName || source.candidate || source.name || "Applicant"),
    applicantImageUrl: photo || undefined,
    nationalId: firstFilled(cert.candidateIdNumber, extras.nationalId) || "—",
    purpose: String(cert.purpose || source.purpose || "Medical fitness assessment"),
    category: categoryFromPurpose(cert.purpose || source.purpose, cert.category, cert.jobType),
    decision: String(cert.decision || source.decision || "FIT").includes("RESTRICT")
      ? ("FIT_RESTRICTED" as const)
      : ("FIT" as const),
    doctorName,
    doctorLicense: doctorLicense || "—",
    doctorId: String(cert.assignedDoctorId || extras.doctorId || ""),
    doctorSpecialty: String(extras.doctorSpecialty || "Occupational Medicine & Telehealth"),
    hospitalPartner: "FitMed Rwanda · Licensed telehealth",
    issueDate: formatCertDate(issueRaw) || new Date().toLocaleDateString("en-GB"),
    expiryDate: defaultExpiryDate(issueRaw, cert.expiresAt || source.expiryDate),
    qrUrl: qrCodeImageUrl(certificateId, cert.qrCodeUrl || source.qrUrl),
    sha256Hash: String(cert.sha256Hash || "—"),
  };
}
