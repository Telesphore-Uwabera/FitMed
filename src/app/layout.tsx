import type { Metadata } from "next";
import { Plus_Jakarta_Sans, DM_Sans } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-primary",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FitMed — Your health. Verified.",
  description:
    "Secure digital medical fitness assessments conducted by licensed doctors. Get your medical fitness certificate online — verified, digitally signed, and instantly shareable.",
  keywords: [
    "medical fitness certificate",
    "telemedicine",
    "online doctor consultation",
    "medical clearance",
    "digital health certificate",
    "FitMed",
    "Rwanda health",
  ],
  openGraph: {
    title: "FitMed — Your health. Verified.",
    description: "Secure digital medical fitness assessments by licensed doctors.",
    type: "website",
    images: [{ url: "/logo.webp", width: 939, height: 330 }],
  },
  /*
   * favicon-white.webp is the square icon (256×256) from favicon-icon.webp
   * with all visible pixels turned white — clearly visible in the browser tab.
   * src/app/favicon.ico is the same image saved as PNG (Next.js serves it automatically).
   */
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-white.webp", type: "image/webp", sizes: "256x256" },
    ],
    shortcut: "/favicon.ico",
    apple:    "/favicon-white.webp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${dmSans.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
