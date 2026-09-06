"use client";

/**
 * TopContactBar
 * ─────────────
 * A slim ticker bar fixed at the very top of every public page.
 * Content scrolls continuously left-to-right using a CSS marquee animation.
 * Includes phone, email and all five social media links.
 */

import Link from "next/link";
import { Phone, Mail } from "lucide-react";

/* ── Contact / social items ─────────────────────────────────────────────── */
const items = [
  {
    key: "phone",
    href: "tel:+250782168650",
    icon: <Phone className="w-3 h-3 shrink-0" />,
    label: "+250 782 168 650",
  },
  {
    key: "email",
    href: "mailto:fitmedrwanda@gmail.com",
    icon: <Mail className="w-3 h-3 shrink-0" />,
    label: "fitmedrwanda@gmail.com",
  },
  {
    key: "instagram",
    href: "https://www.instagram.com/fitmedrwanda",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 shrink-0">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
    label: "Instagram",
  },
  {
    key: "x",
    href: "https://x.com/fitmedrwanda",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 shrink-0">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
    label: "X / Twitter",
  },
  {
    key: "tiktok",
    href: "https://www.tiktok.com/@fitmed4",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 shrink-0">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.73a4.85 4.85 0 01-1.01-.04z"/>
      </svg>
    ),
    label: "TikTok",
  },
  {
    key: "linkedin",
    href: "https://www.linkedin.com/in/fitmed-rwanda-a907a5434/",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 shrink-0">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
    label: "LinkedIn",
  },
  {
    key: "facebook",
    href: "https://web.facebook.com/profile.php?id=61594044600513",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 shrink-0">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    label: "Facebook",
  },
];

/* ── Separator dot ─────────────────────────────────────────────────────── */
function Dot() {
  return <span className="mx-6 opacity-30 select-none">·</span>;
}

/* ── Single link item ─────────────────────────────────────────────────── */
function Item({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  const isExternal = href.startsWith("http");
  const cls =
    "inline-flex items-center gap-1.5 text-white/80 hover:text-[#12B8B0] transition-colors whitespace-nowrap text-[11px] font-medium";

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls} aria-label={label}>
        {icon}
        <span>{label}</span>
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {icon}
      <span>{label}</span>
    </Link>
  );
}

/* ── Main bar ─────────────────────────────────────────────────────────── */
export default function TopContactBar() {
  return (
    <div
      className="fixed top-0 left-0 right-0 z-[60] h-8 bg-[#0B2D5C] dark:bg-[#060e1a] border-b border-white/10 overflow-hidden flex items-center"
      aria-label="Contact information"
    >
      {/* Marquee track — duplicated so the scroll is seamless */}
      <div className="flex animate-marquee-contact whitespace-nowrap">
        {/* First copy */}
        <div className="flex items-center">
          {items.map((item, i) => (
            <span key={`a-${item.key}`} className="inline-flex items-center">
              <Item href={item.href} icon={item.icon} label={item.label} />
              {i < items.length - 1 && <Dot />}
            </span>
          ))}
          {/* Gap before the loop repeats */}
          <Dot />
        </div>
        {/* Second copy (seamless loop) */}
        <div className="flex items-center">
          {items.map((item, i) => (
            <span key={`b-${item.key}`} className="inline-flex items-center">
              <Item href={item.href} icon={item.icon} label={item.label} />
              {i < items.length - 1 && <Dot />}
            </span>
          ))}
          <Dot />
        </div>
      </div>
    </div>
  );
}
