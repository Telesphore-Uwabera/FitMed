import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Manrope } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ToastProvider";
import { DialogProvider } from "@/components/DialogProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import JsonLd from "@/components/JsonLd";
import TopContactBar from "@/components/TopContactBar";
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
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — Medical Fitness Certificate Online`,
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Medical Fitness Certificate Online`,
    description: DEFAULT_DESCRIPTION,
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon-48x48.png", type: "image/png", sizes: "48x48" },
      { url: "/favicon-icon.webp", type: "image/webp" },
    ],
    shortcut: "/favicon.ico",
    apple: "/favicon-48x48.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={manrope.variable} suppressHydrationWarning>
      <head>
        <meta name="google-site-verification" content="P7tFxJLbr0ugu0-lq5ZXBX_JsIwzoc0q6iFGN0AN9A8" />
        <link rel="icon" href="/favicon.ico" sizes="48x48" />
        <link rel="icon" href="/favicon-48x48.png" type="image/png" sizes="48x48" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon-48x48.png" />
        <JsonLd />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <Script
          id="fitmed-theme"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("fitmed_theme");var d=t==="dark";document.documentElement.classList.toggle("dark",d);document.documentElement.style.colorScheme=d?"dark":"light";}catch(e){}})();`,
          }}
        />
        <ThemeProvider>
          <TopContactBar />
          <ToastProvider>
            <DialogProvider>{children}</DialogProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
