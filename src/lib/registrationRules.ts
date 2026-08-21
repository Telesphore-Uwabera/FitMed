export function compactPhone(value: string) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const plus = raw.startsWith("+") ? "+" : "";
  return plus + raw.replace(/\D/g, "");
}

export function isValidPersonName(name: string) {
  const value = String(name || "").trim();
  if (value.length < 2) return false;
  if (/\d/.test(value)) return false;
  return /^[A-Za-zÀ-ÖØ-öø-ÿ'’.\- ]+$/.test(value);
}

export function isValidApplicantEmail(email: string) {
  const value = String(email || "").trim().toLowerCase();
  const match = /^([^@\s]+)@([^@\s]+\.[^@\s]+)$/.exec(value);
  if (!match) return false;
  const local = match[1];
  const domain = match[2];
  if (/\d/.test(local)) return false;
  if (local.includes("..") || local.startsWith(".") || local.endsWith(".")) return false;
  if (!/^[a-zA-Z._%+\-]+$/.test(local)) return false;
  if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domain)) return false;
  return true;
}

export function isValidNationalId(nationalId: string) {
  return /^\d{16}$/.test(String(nationalId || "").replace(/[\s\-_.]/g, ""));
}

/** Rwanda phone as +25 followed by 10 digits, e.g. +250788123456 */
export function isValidRwandaPhone(phone: string) {
  return /^\+25\d{10}$/.test(compactPhone(phone));
}

export function applicantRegistrationError(opts: {
  name?: string;
  email?: string;
  phone?: string;
  nationalId?: string;
}) {
  if (opts.name !== undefined && !isValidPersonName(opts.name)) {
    return "Full name must use letters only — no numbers.";
  }
  if (opts.email !== undefined && !isValidApplicantEmail(opts.email)) {
    return "Enter a valid email whose name (before @) does not contain numbers.";
  }
  if (opts.phone !== undefined && !isValidRwandaPhone(opts.phone)) {
    return "Phone number must be in the format +25xxxxxxxxxx.";
  }
  if (opts.nationalId !== undefined && !isValidNationalId(opts.nationalId)) {
    return "National ID must be exactly 16 numbers.";
  }
  return "";
}
