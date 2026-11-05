import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f4f7fb] dark:bg-[#071422] flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-6 pt-32 pb-20">
        <div className="max-w-lg text-center">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#12B8B0] mb-3">404</p>
          <h1 className="text-4xl font-extrabold text-[#0B2D5C] dark:text-white mb-4" style={{ fontFamily: "var(--font-primary)" }}>
            This page is not on FitMed
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
            The address may be mistyped, or the page may have moved. You can go home, check a certificate, or open the help centre.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/" className="rounded-xl bg-[#12B8B0] px-5 py-3 text-sm font-extrabold text-[#0B2D5C]">
              Back home
            </Link>
            <Link href="/verify" className="rounded-xl bg-white dark:bg-white/10 px-5 py-3 text-sm font-bold text-[#0B2D5C] dark:text-white">
              Verify a certificate
            </Link>
            <Link href="/help" className="rounded-xl bg-white dark:bg-white/10 px-5 py-3 text-sm font-bold text-[#0B2D5C] dark:text-white">
              Help centre
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
