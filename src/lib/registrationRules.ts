import { isCloudinaryUrl } from "@/lib/imageUtils";

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

export type ApplicantSignupInput = {
  name: string;
  email: string;
  phone: string;
  nationalId: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
  profileCloudUrl: string;
};

export type ApplicantSignupReadiness = {
  ready: boolean;
  missing: string[];
  errors: {
    name?: string;
    email?: string;
    phone?: string;
    nationalId?: string;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
    photo?: string;
  };
};

const PASSWORD_MIN = 8;

/** Why Create Applicant Account is still disabled. Empty fields and invalid values both appear in `missing`. */
export function applicantSignupReadiness(input: ApplicantSignupInput): ApplicantSignupReadiness {
  const errors: ApplicantSignupReadiness["errors"] = {};
  const missing: string[] = [];

  if (!isCloudinaryUrl(input.profileCloudUrl)) {
    errors.photo = "Upload a clear passport photo before creating your account.";
    missing.push("Passport photo");
  }
  if (!String(input.name || "").trim()) {
    errors.name = "Full legal name is required.";
    missing.push("Full legal name");
  } else if (!isValidPersonName(input.name)) {
    errors.name = "Full name must use letters only — no numbers.";
    missing.push("Full legal name (letters only)");
  }
  if (!String(input.email || "").trim()) {
    errors.email = "Email address is required.";
    missing.push("Email address");
  } else if (!isValidApplicantEmail(input.email)) {
    errors.email = "Enter a valid email whose name (before @) does not contain numbers.";
    missing.push("Valid email (no numbers before @)");
  }
  if (!String(input.phone || "").trim()) {
    errors.phone = "Phone number is required.";
    missing.push("Phone number (+25xxxxxxxxxx)");
  } else if (!isValidRwandaPhone(input.phone)) {
    errors.phone = "Phone number must be in the format +25xxxxxxxxxx.";
    missing.push("Phone number in +25xxxxxxxxxx format");
  }
  const idDigits = String(input.nationalId || "").replace(/\D/g, "");
  if (!idDigits) {
    errors.nationalId = "National ID is required.";
    missing.push("16-digit National ID");
  } else if (!isValidNationalId(input.nationalId)) {
    errors.nationalId = `National ID must be exactly 16 numbers (${idDigits.length} entered).`;
    missing.push("16-digit National ID");
  }
  if (!String(input.dateOfBirth || "").trim()) {
    errors.dateOfBirth = "Date of birth is required.";
    missing.push("Date of birth");
  }
  if (!String(input.gender || "").trim()) {
    errors.gender = "Gender is required.";
    missing.push("Gender");
  }
  if (!String(input.address || "").trim()) {
    errors.address = "Address is required.";
    missing.push("Address");
  }
  if (!input.password) {
    errors.password = "Create a password of at least 8 characters.";
    missing.push("Password (at least 8 characters)");
  } else if (input.password.length < PASSWORD_MIN) {
    errors.password = "Password must be at least 8 characters.";
    missing.push("Password (at least 8 characters)");
  }
  if (!input.confirmPassword) {
    errors.confirmPassword = "Confirm your password.";
    missing.push("Password confirmation");
  } else if (input.confirmPassword !== input.password) {
    errors.confirmPassword = "Passwords do not match.";
    missing.push("Matching passwords");
  }
  if (!input.acceptedTerms) {
    errors.terms = "Accept the Terms of Service and Privacy Policy to continue.";
    missing.push("Terms of Service and Privacy Policy");
  }

  return { ready: missing.length === 0, missing, errors };
}
