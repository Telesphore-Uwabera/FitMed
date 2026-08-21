import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Doctor from "@/models/Doctor";
import type { PublicTeamMember } from "@/lib/publicStaffTypes";
import { isAdminRole } from "@/lib/roles";

export type { PublicTeamMember } from "@/lib/publicStaffTypes";

const PLACEHOLDER = "";

function publicPhoto(...urls: Array<string | undefined>) {
  for (const url of urls) {
    const value = String(url || "").trim();
    if (!value) continue;
    if (value.includes("images.unsplash.com")) continue;
    return value;
  }
  return PLACEHOLDER;
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
      role: { $nin: ["user", "applicant"] },
      showOnAbout: { $ne: false },
    })
      .select("fullName name email role status avatarUrl jobTitle bio")
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
      const specialty = String(linked?.jobTitle || doc.specialty || "Occupational Medicine & Telehealth");
      const license = String(doc.licenseNumber || "");
      const bio =
        String(linked?.bio || "").trim() ||
        `${name} is a licensed FitMed physician providing telehealth fitness assessments.`;
      return {
        id: String(doc._id),
        name,
        role: specialty,
        qualifications: license ? `RMDC ${license}` : "Licensed physician",
        bio,
        image: publicPhoto(doc.avatarUrl, linked?.avatarUrl),
        badge: "Licensed Physician",
        kind: "doctor" as const,
        license,
        specialty,
      };
    });

  const leadership: PublicTeamMember[] = users
    .filter((user) => isActiveStatus(String(user.status || "active")))
    .filter((user) => String(user.role || "").toLowerCase() !== "doctor")
    .map((user) => {
      const name = displayName(user.fullName || user.name, "FitMed team");
      const title = String(user.jobTitle || (isAdminRole(user.role) ? "Platform Administrator" : "FitMed Team")).trim();
      const bio = String(user.bio || "").trim() || `${name} is part of the FitMed leadership team.`;
      const kind = isAdminRole(user.role) ? ("admin" as const) : ("staff" as const);
      return {
        id: String(user._id),
        name,
        role: title,
        qualifications: title,
        bio,
        image: publicPhoto(user.avatarUrl),
        badge: kind === "admin" ? "Leadership" : "Team",
        kind,
      };
    });

  return { team: [...leadership, ...doctors], doctors };
}
