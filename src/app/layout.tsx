import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Manrope } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ToastProvider";
import { DialogProvider } from "@/components/DialogProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import JsonLd from "@/components/JsonLd";
import { DEFAULT_DESCRIPTION, SITE_NAME, SITE_URL, SITE_TAGLINE } from "@/lib/seo";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0B2D5C" },
    { media: "(prefers-color-scheme: dark)", color: "#071422" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Medical Fitness Certificate Online | ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "medical fitness certificate Rwanda",
    "online medical fitness certificate",
    "telemedicine Kigali",
    "digital health certificate",
    "doctor video consultation Rwanda",
    "employment medical clearance",
    "QR certificate verification",
    "FitMed",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "health",
  verification: {
    google: "P7tFxJLbr0ugu0-lq5ZXBX_JsIwzoc0q6iFGN0AN9A8",
  },
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: `${SITE_NAME} — Medical Fitness Certificate Online`,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "en_RW",
    type: "website",
    images: [{ url: "/logo-4.webp", width: 641, height: 390, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Medical Fitness Certificate Online`,
    description: DEFAULT_DESCRIPTION,
    images: ["/logo-4.webp"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-white.webp", type: "image/webp", sizes: "256x256" },
    ],
    shortcut: "/favicon.ico",
    apple: "/favicon-white.webp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={manrope.variable} suppressHydrationWarning>
      <head>
        <meta name="google-site-verification" content="P7tFxJLbr0ugu0-lq5ZXBX_JsIwzoc0q6iFGN0AN9A8" />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <JsonLd />
        <Script
          id="fitmed-theme"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("fitmed_theme");var d=t==="dark";document.documentElement.classList.toggle("dark",d);document.documentElement.style.colorScheme=d?"dark":"light";}catch(e){}})();`,
          }}
        />
        <ThemeProvider>
          <ToastProvider>
            <DialogProvider>{children}</DialogProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
