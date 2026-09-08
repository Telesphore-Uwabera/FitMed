"use client";

import { Mail, Phone, MapPin, Send } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useTheme } from "@/components/ThemeProvider";

const footerLinks = {
  Platform: [
    { label: "How It Works",           href: "/#how-it-works",   ext: false },
    { label: "Certificate Categories",  href: "/#certificates",   ext: false },
    { label: "For Employers",           href: "/#employers",      ext: false },
    { label: "Technology",              href: "/#technology",     ext: false },
  ],
  Company: [
    { label: "About FitMed",  href: "/about",    ext: false },
    { label: "Our Doctors",   href: "/doctors",  ext: false },
  ],
  Legal: [
    { label: "Privacy Policy",   href: "/privacy",    ext: false },
    { label: "Terms of Service", href: "/terms",      ext: false },
    { label: "Cookie Policy",    href: "/cookies",    ext: false },
    { label: "Compliance",       href: "/compliance", ext: false },
    { label: "Health data notice", href: "/hipaa",      ext: false },
  ],
  Support: [
    { label: "Help Centre",      href: "/contact",          ext: false },
    { label: "Contact Us",       href: "/contact",          ext: false },
    { label: "Doctor Support",   href: "/contact#doctors",  ext: false },
    { label: "Employer Support", href: "/contact#employers",ext: false },
    { label: "Report an Issue",  href: "/contact#report",   ext: false },
  ],
};

const socials = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/fitmedrwanda",
    ariaLabel: "Follow FitMed on Instagram",
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
  },
  {
    label: "X / Twitter",
    href: "https://x.com/fitmedrwanda",
    ariaLabel: "Follow FitMed on X (Twitter)",
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@fitmed4",
    ariaLabel: "Follow FitMed on TikTok",
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.73a4.85 4.85 0 01-1.01-.04z"/>
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/fitmed-rwanda-a907a5434/",
    ariaLabel: "Connect with FitMed on LinkedIn",
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
  },
  {
    label: "Facebook",
    href: "https://web.facebook.com/profile.php?id=61594044600513",
    ariaLabel: "Follow FitMed on Facebook",
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
];

export default function Footer() {
  const year = new Date().getFullYear();
  const { theme } = useTheme();
  const [newsEmail, setNewsEmail] = useState("");
  const [newsName, setNewsName] = useState("");
  const [newsNote, setNewsNote] = useState("");
  const [newsBusy, setNewsBusy] = useState(false);

  const subscribe = async (event: React.FormEvent) => {
    event.preventDefault();
    setNewsBusy(true);
    setNewsNote("");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newsEmail, name: newsName }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setNewsNote(data.error || "Could not subscribe. Please try again.");
      } else {
        setNewsNote("You are subscribed. FitMed will email platform news to this address.");
        setNewsEmail("");
        setNewsName("");
      }
    } catch {
      setNewsNote("Could not reach FitMed. Check your connection and try again.");
    } finally {
      setNewsBusy(false);
    }
  };

  return (
    <footer className="bg-[#f4f7fb] dark:bg-[#0B2D5C] border-t border-slate-200 dark:border-transparent">
      <div className="container-wide pt-20 pb-10">

        {/* ── Main grid ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-10 mb-16">

          {/* Brand col — spans 2 on lg */}
          <div className="col-span-2">

            <Link href="/" aria-label="FitMed home" className="inline-block mb-7 group">
              <Image
                src={theme === "dark" ? "/logo-4.webp" : "/logo-2.webp"}
                alt="FitMed"
                width={641}
                height={390}
                className="w-56 h-auto object-contain group-hover:opacity-80 transition-opacity"
              />
            </Link>

            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-7 max-w-xs">
              Secure digital medical fitness assessments, conducted by licensed doctors and verified online.
            </p>

            <div className="space-y-3">
              <a
                href="mailto:fitmedrwanda@gmail.com"
                className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-500 hover:text-[#12B8B0] transition-colors group"
              >
                <Mail className="w-3.5 h-3.5 text-[#12B8B0]/80 group-hover:text-[#12B8B0] flex-shrink-0 transition-colors" />
                <span>fitmedrwanda@gmail.com</span>
              </a>
              <a
                href="tel:+250782168650"
                className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-500 hover:text-[#12B8B0] transition-colors group"
              >
                <Phone className="w-3.5 h-3.5 text-[#12B8B0]/80 group-hover:text-[#12B8B0] flex-shrink-0 transition-colors" />
                <span>+250 782 168 650</span>
              </a>
              <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-500">
                <MapPin className="w-3.5 h-3.5 text-[#12B8B0]/80 flex-shrink-0" />
                <span>Kigali, Rwanda</span>
              </div>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([cat, links]) => (
            <div key={cat}>
              <h4
                className="text-xs font-extrabold text-[#0B2D5C] dark:text-white/90 uppercase tracking-[0.18em] mb-5"
                style={{ fontFamily: "var(--font-primary)" }}
              >
                {cat}
              </h4>
              <ul className="space-y-3">
                {links.map((l) => (
                  <li key={l.label}>
                    {l.ext ? (
                      <a
                        href={l.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-slate-600 dark:text-white/50 hover:text-[#12B8B0] transition-colors duration-200"
                      >
                        {l.label}
                      </a>
                    ) : (
                      <Link
                        href={l.href}
                        className="text-sm text-slate-600 dark:text-white/50 hover:text-[#12B8B0] transition-colors duration-200"
                      >
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mb-16 rounded-3xl border-0 bg-white dark:bg-[#082247] p-6 sm:p-8">
          <div className="grid lg:grid-cols-[1.1fr_1fr] gap-8 items-end">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#12B8B0] mb-2">FitMed news</p>
              <h3 className="text-2xl font-extrabold text-[#0B2D5C] dark:text-white mb-2" style={{ fontFamily: "var(--font-primary)" }}>
                Subscribe for platform updates
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md">
                Get notices about certificate processing, doctor availability, and FitMed announcements.
              </p>
            </div>
            <form onSubmit={subscribe} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">Name</span>
                  <input
                    type="text"
                    value={newsName}
                    onChange={(e) => setNewsName(e.target.value)}
                    placeholder="Your name"
                    className="w-full mt-1 text-sm text-[#0B2D5C] dark:text-white placeholder:text-slate-400 bg-slate-50 dark:bg-transparent border border-slate-200 dark:border-white/15 rounded-xl px-3 py-2"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">Email</span>
                  <input
                    type="email"
                    required
                    value={newsEmail}
                    onChange={(e) => setNewsEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="w-full mt-1 text-sm text-[#0B2D5C] dark:text-white placeholder:text-slate-400 bg-slate-50 dark:bg-transparent border border-slate-200 dark:border-white/15 rounded-xl px-3 py-2"
                  />
                </label>
              </div>
              <button
                type="submit"
                disabled={newsBusy}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#12B8B0] text-[#0B2D5C] text-xs font-black disabled:opacity-60"
              >
                <Send className="w-3.5 h-3.5" />
                {newsBusy ? "Saving…" : "Subscribe"}
              </button>
              {newsNote ? <p className="text-xs text-[#0d9690] dark:text-[#8ff3e8]">{newsNote}</p> : null}
            </form>
          </div>
        </div>

        {/* ── Divider ─────────────────────────────────────────── */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#12B8B0]/30 to-transparent mb-8" />

        {/* ── Bottom bar ──────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-5">

          <p className="text-xs text-slate-500 dark:text-white/30 order-2 md:order-1">
            © {year} FitMed. All rights reserved.
          </p>

          {/* Social icons */}
          <div className="flex items-center gap-2.5 order-1 md:order-2">
            {socials.map(({ svg, label, href, ariaLabel }) => (
              <a
                key={label}
                href={href}
                aria-label={ariaLabel}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-white dark:bg-[#143d7a] border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-white/50 hover:text-[#12B8B0] hover:border-[#12B8B0]/50 transition-all"
              >
                {svg}
              </a>
            ))}
          </div>

          <p className="text-xs text-slate-500 dark:text-white/30 order-3">
            Built with clinical safety and privacy in mind.
          </p>
        </div>
      </div>
    </footer>
  );
}
