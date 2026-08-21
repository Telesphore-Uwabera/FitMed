"use client";

import { Mail, Phone, MapPin, Globe, Share2, MessageCircle, Send } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

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
    { label: "Careers",       href: "/careers",  ext: false },
    { label: "Press",         href: "/press",    ext: false },
  ],
  Legal: [
    { label: "Privacy Policy",   href: "/privacy",    ext: false },
    { label: "Terms of Service", href: "/terms",      ext: false },
    { label: "Cookie Policy",    href: "/cookies",    ext: false },
    { label: "Compliance",       href: "/compliance", ext: false },
    { label: "HIPAA Notice",     href: "/hipaa",      ext: false },
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
  { icon: MessageCircle, label: "X / Twitter", href: "https://twitter.com/fitmedrw",              ariaLabel: "Follow FitMed on X (Twitter)" },
  { icon: Share2,        label: "LinkedIn",     href: "https://linkedin.com/company/fitmedrw",    ariaLabel: "Connect with FitMed on LinkedIn" },
  { icon: Globe,         label: "Website",      href: "https://fitmed.rw",                        ariaLabel: "Visit the FitMed website" },
];

export default function Footer() {
  const year = new Date().getFullYear();
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
    <footer className="bg-[#0B2D5C]">
      <div className="container-wide pt-20 pb-10">

        {/* ── Main grid ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-10 mb-16">

          {/* Brand col — spans 2 on lg */}
          <div className="col-span-2">

            {/* ── Logo: logo-4.webp has transparent background, shows cleanly on dark footer ── */}
            <Link href="/" aria-label="FitMed home" className="inline-block mb-7 group">
              <Image
                src="/logo-4.webp"
                alt="FitMed"
                width={641}
                height={390}
                className="w-56 h-auto object-contain group-hover:opacity-80 transition-opacity"
              />
            </Link>

            <p className="text-sm text-slate-400 leading-relaxed mb-7 max-w-xs">
              Secure digital medical fitness assessments, conducted by licensed doctors and verified online.
            </p>

            <div className="space-y-3">
              <a
                href="mailto:hello@fitmed.rw"
                className="flex items-center gap-2.5 text-xs text-slate-500 hover:text-sky-400 transition-colors group"
              >
                <Mail className="w-3.5 h-3.5 text-sky-500/60 group-hover:text-sky-400 flex-shrink-0 transition-colors" />
                <span>hello@fitmed.rw</span>
              </a>
              <a
                href="tel:+250700000000"
                className="flex items-center gap-2.5 text-xs text-slate-500 hover:text-sky-400 transition-colors group"
              >
                <Phone className="w-3.5 h-3.5 text-sky-500/60 group-hover:text-sky-400 flex-shrink-0 transition-colors" />
                <span>+250 700 000 000</span>
              </a>
              <div className="flex items-center gap-2.5 text-xs text-slate-500">
                <MapPin className="w-3.5 h-3.5 text-sky-500/60 flex-shrink-0" />
                <span>Kigali, Rwanda</span>
              </div>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([cat, links]) => (
            <div key={cat}>
              <h4
                className="text-xs font-extrabold text-white/90 uppercase tracking-[0.18em] mb-5"
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
                        className="text-sm text-white/50 hover:text-[#12B8B0] transition-colors duration-200"
                      >
                        {l.label}
                      </a>
                    ) : (
                      <Link
                        href={l.href}
                        className="text-sm text-white/50 hover:text-[#12B8B0] transition-colors duration-200"
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

        <div className="mb-16 rounded-3xl border border-white/10 bg-[#082247] p-6 sm:p-8">
          <div className="grid lg:grid-cols-[1.1fr_1fr] gap-8 items-end">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#12B8B0] mb-2">FitMed news</p>
              <h3 className="text-2xl font-extrabold text-white mb-2" style={{ fontFamily: "var(--font-primary)" }}>
                Subscribe for platform updates
              </h3>
              <p className="text-sm text-slate-400 max-w-md">
                Get notices about certificate processing, doctor availability, and FitMed announcements. Administrators send these broadcasts from the admin console.
              </p>
            </div>
            <form onSubmit={subscribe} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Name</span>
                  <input
                    value={newsName}
                    onChange={(e) => setNewsName(e.target.value)}
                    placeholder="Your name"
                    className="w-full mt-1 text-sm text-white placeholder:text-slate-500"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Email</span>
                  <input
                    type="email"
                    required
                    value={newsEmail}
                    onChange={(e) => setNewsEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="w-full mt-1 text-sm text-white placeholder:text-slate-500"
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
              {newsNote ? <p className="text-xs text-[#8ff3e8]">{newsNote}</p> : null}
            </form>
          </div>
        </div>

        {/* ── Divider ─────────────────────────────────────────── */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#12B8B0]/30 to-transparent mb-8" />

        {/* ── Bottom bar ──────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-5">

          <p className="text-xs text-white/30 order-2 md:order-1">
            © {year} FitMed. All rights reserved.
          </p>

          {/* Social icons */}
          <div className="flex items-center gap-2.5 order-1 md:order-2">
            {socials.map(({ icon: Icon, label, href, ariaLabel }) => (
              <a
                key={label}
                href={href}
                aria-label={ariaLabel}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-[#143d7a] border border-white/10 flex items-center justify-center text-white/50 hover:text-[#12B8B0] hover:border-[#12B8B0]/50 transition-all"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>

          <p className="text-xs text-white/30 order-3">
            Built with clinical safety and privacy in mind.
          </p>
        </div>
      </div>
    </footer>
  );
}
