import type { Metadata } from "next";
import Script from "next/script";
import { Manrope } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ToastProvider";
import { DialogProvider } from "@/components/DialogProvider";
import { ThemeProvider } from "@/components/ThemeProvider";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FitMed — Fit, Verified, and Ready.",
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
    title: "FitMed — Fit, Verified, and Ready.",
    description: "Secure digital medical fitness assessments by licensed doctors.",
    type: "website",
    images: [{ url: "/logo-4.webp", width: 641, height: 390 }],
  },
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
    <html lang="en" className={manrope.variable} suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <Script
          id="fitmed-theme"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("fitmed_theme");if(t==="dark"){document.documentElement.classList.add("dark");}else{document.documentElement.classList.remove("dark");}document.documentElement.style.colorScheme="light";}catch(e){}})();`,
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
