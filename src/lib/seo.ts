import type { Metadata } from "next";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.FITMED_APP_URL ||
  "https://fitnessmed.rw"
).replace(/\/$/, "");

export const SITE_NAME = "FitMed";
export const SITE_TAGLINE = "Fit, Verified, and Ready.";
export const DEFAULT_DESCRIPTION =
  "Get a medical fitness certificate online in Rwanda. Licensed doctors assess you by video, then issue a digitally signed, QR-verifiable certificate.";

export function absoluteUrl(path = "/") {
  if (!path || path === "/") return SITE_URL;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function pageMeta({
  title,
  description,
  path,
  index = true,
  image = "/logo-4.webp",
}: {
  title: string;
  description: string;
  path: string;
  index?: boolean;
  image?: string;
}): Metadata {
  const url = absoluteUrl(path);
  const ogImage = image.startsWith("http") ? image : absoluteUrl(image);
  const fullTitle = title.includes("FitMed") ? title : `${title} | ${SITE_NAME}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: index
      ? { index: true, follow: true }
      : { index: false, follow: false, nocache: true },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      locale: "en_RW",
      type: "website",
      images: [{ url: ogImage, width: 641, height: 390, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [ogImage],
    },
  };
}
