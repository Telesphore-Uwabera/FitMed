import User from "@/models/User";

export function normalizeEmail(email: string) {
  return String(email || "").trim().toLowerCase();
}

export function normalizeNationalId(value: string) {
  return String(value || "")
    .trim()
    .replace(/[\s\-_.]/g, "")
    .toUpperCase();
}

export function nationalIdQuery(nationalId: string) {
  const nid = normalizeNationalId(nationalId);
  if (!nid) return null;
  const pattern = nid
    .split("")
    .map((ch) => ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("[\\s\\-_.]*");
  return { nationalId: { $regex: `^${pattern}$`, $options: "i" } };
}

export function isMongoDuplicateKey(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && (error as { code: number }).code === 11000);
}

export function duplicateKeyMessage(error: unknown) {
  const text = error instanceof Error ? error.message : String(error || "");
  if (text.includes("nationalId")) {
    return "An account with this National ID already exists. Each applicant may have only one FitMed account.";
  }
  return "An account with this email already exists. Please sign in, or use a different email.";
}

export async function findAccountByEmail(email: string) {
  const clean = normalizeEmail(email);
  if (!clean) return null;
  return User.findOne({ email: clean });
}

export async function findAccountByNationalId(nationalId: string, excludeUserId?: string) {
  const query = nationalIdQuery(nationalId);
  if (!query) return null;
  return User.findOne(
    excludeUserId ? { ...query, _id: { $ne: excludeUserId } } : query
  );
}
