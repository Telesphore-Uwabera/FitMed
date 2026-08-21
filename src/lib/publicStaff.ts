import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Doctor from "@/models/Doctor";
import type { PublicTeamMember } from "@/lib/publicStaffTypes";
import { isAdminRole } from "@/lib/roles";

export type { PublicTeamMember } from "@/lib/publicStaffTypes";

const PLACEHOLDER = "";

function isStockAvatar(url?: string) {
  const value = String(url || "");
  return !value || value.includes("images.unsplash.com");
}

function isActiveStatus(status?: string) {
  const value = String(status || "active").toLowerCase();
  return value === "active" || value === "";
}

function displayName(fullName?: string, fallback = "FitMed staff") {
  return String(fullName || fallback).trim() || fallback;
}

export async function getPublicStaff(): Promise<{ team: PublicTeamMember[]; doctors: PublicTeamMember[] }> {
  await connectToDatabase();

  const [users, doctorDocs] = await Promise.all([
    User.find({
      $or: [{ role: { $in: ["admin", "doctor", "administrator"] } }, { role: { $regex: /^(admin|doctor|administrator)$/i } }],
    })
      .select("fullName name email role status avatarUrl")
      .sort({ createdAt: 1 })
      .lean(),
    Doctor.find({})
      .select("fullName email licenseNumber specialty avatarUrl isVerified status")
      .sort({ createdAt: 1 })
      .lean(),
  ]);

  const userByEmail = new Map(users.map((user) => [String(user.email || "").toLowerCase(), user]));

  const doctors: PublicTeamMember[] = doctorDocs
    .filter((doc) => doc.isVerified !== false)
    .filter((doc) => {
      const linked = userByEmail.get(String(doc.email || "").toLowerCase());
      return !linked || isActiveStatus(String(linked.status || "active"));
    })
    .map((doc) => {
      const linked = userByEmail.get(String(doc.email || "").toLowerCase());
      const name = displayName(doc.fullName || linked?.fullName || linked?.name, "FitMed doctor");
      const specialty = String(doc.specialty || "Occupational Medicine & Telehealth");
      const license = String(doc.licenseNumber || "");
      return {
        id: String(doc._id),
        name,
        role: specialty,
        qualifications: license ? `RMDC ${license}` : "Licensed physician",
        bio: `${name} is a licensed FitMed physician providing telehealth fitness assessments${license ? ` (licence ${license})` : ""}.`,
        image: isStockAvatar(doc.avatarUrl || linked?.avatarUrl) ? PLACEHOLDER : String(doc.avatarUrl || linked?.avatarUrl),
        badge: "Licensed Physician",
        kind: "doctor" as const,
        license,
        specialty,
      };
    });

  const admins: PublicTeamMember[] = users
    .filter((user) => isAdminRole(user.role) && isActiveStatus(String(user.status || "active")))
    .map((user) => {
      const name = displayName(user.fullName || user.name, "FitMed administrator");
      return {
        id: String(user._id),
        name,
        role: "Platform Administrator",
        qualifications: "FitMed operations & clinical network",
        bio: `${name} oversees FitMed account approval, doctor onboarding, and platform operations.`,
        image: isStockAvatar(user.avatarUrl) ? PLACEHOLDER : String(user.avatarUrl),
        badge: "Leadership",
        kind: "admin" as const,
      };
    });

  return { team: [...admins, ...doctors], doctors };
}
