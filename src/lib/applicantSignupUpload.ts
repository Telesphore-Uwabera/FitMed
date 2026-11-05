import { isCloudinaryUrl } from "@/lib/imageUtils";

/** Folders a logged-out applicant may write during registration. */
export const APPLICANT_SIGNUP_FOLDERS = ["fitmed/applicants", "fitmed/national_ids"] as const;

export type ApplicantSignupFolder = (typeof APPLICANT_SIGNUP_FOLDERS)[number];

/** Passport and ID scans are resized to WebP in the browser before upload. */
export const MAX_APPLICANT_SIGNUP_BYTES = 4 * 1024 * 1024;

export function isApplicantSignupFolder(folder: string): folder is ApplicantSignupFolder {
  return (APPLICANT_SIGNUP_FOLDERS as readonly string[]).includes(folder);
}

export function detectSignupImageType(bytes: Uint8Array): "webp" | "jpeg" | "png" | null {
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "webp";
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "png";
  }
  return null;
}

/**
 * Stores a signup photo without a session. Dashboard uploads keep using
 * the authenticated `/api/upload` helper.
 */
export async function uploadApplicantSignupFile(
  file: Blob,
  folder: ApplicantSignupFolder
): Promise<{ url: string; publicId: string; format: string; error?: string }> {
  if (file.size > MAX_APPLICANT_SIGNUP_BYTES) {
    return { url: "", publicId: "", format: "webp", error: "Photo must be 4 MB or smaller." };
  }

  try {
    const body = new FormData();
    const name = file instanceof File && file.name ? file.name : "photo.webp";
    body.append("file", file, name);
    body.append("folder", folder);
    const response = await fetch("/api/auth/register/upload", { method: "POST", body });
    const data = await response.json().catch(() => ({}));
    const url = String(data.url || "");
    if (response.ok && isCloudinaryUrl(url)) {
      return {
        url,
        publicId: String(data.publicId || ""),
        format: String(data.format || "webp"),
      };
    }
    return {
      url: "",
      publicId: "",
      format: "webp",
      error: String(data.error || "Could not store the photo. Try again."),
    };
  } catch {
    return {
      url: "",
      publicId: "",
      format: "webp",
      error: "Could not reach FitMed. Check your connection and try again.",
    };
  }
}
