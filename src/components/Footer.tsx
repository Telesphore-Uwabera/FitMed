"use client";

import { Mail, Phone, MapPin, Globe, Share2, MessageCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

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
