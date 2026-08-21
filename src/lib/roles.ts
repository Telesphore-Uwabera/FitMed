export type SessionRole = "admin" | "doctor" | "user";

export function normalizeRole(role?: string | null): SessionRole {
  const value = String(role || "")
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
  if (value === "admin" || value === "administrator" || value === "superadmin") return "admin";
  if (value === "doctor" || value === "physician" || value === "clinician") return "doctor";
  return "user";
}

export function isAdminRole(role?: string | null) {
  return normalizeRole(role) === "admin";
}
