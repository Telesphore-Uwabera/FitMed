"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronRight } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "How It Works",  href: "#how-it-works" },
  { label: "Certificates",  href: "#certificates" },
  { label: "For Employers", href: "#employers" },
  { label: "Technology",    href: "#technology" },
  { label: "Pricing",       href: "#pricing" },
];

/*
 * Navbar heights:
 *  Hero (top of page) → 72px  tall, logo 140px wide on desktop
 *  Scrolled           → 52px  tall, logo  96px wide on desktop
 *
 * We animate the <header> height directly with framer-motion so
 * both padding AND logo size shrink in a single, smooth tween.
 */
const NAV_H_TOP      = 72;   // px — at top of page
const NAV_H_SCROLLED = 52;   // px — after scrolling

export default function Navbar() {
  const [scrolled,   setScrolled]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [onHero,     setOnHero]     = useState(true);

  useEffect(() => {
    const handle = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      setOnHero(y < window.innerHeight * 0.75);
    };
    handle();
    window.addEventListener("scroll", handle, { passive: true });
    return () => window.removeEventListener("scroll", handle);
  }, []);

  const navH = scrolled ? NAV_H_SCROLLED : NAV_H_TOP;

  return (
    <>
      {/* ── Fixed header — height animated by framer-motion ─── */}
      <motion.header
        initial={{ y: -NAV_H_TOP, opacity: 0 }}
        animate={{ y: 0, opacity: 1, height: navH }}
        transition={{ height: { duration: 0.3, ease: "easeInOut" }, y: { duration: 0.65, ease: [0.22, 1, 0.36, 1] }, opacity: { duration: 0.65 } }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 overflow-hidden",
          scrolled
            ? onHero
              ? "bg-slate-900/92 backdrop-blur-xl shadow-xl shadow-black/25"
              : "bg-white/97 backdrop-blur-xl shadow-md"
            : "bg-transparent"
        )}
      >
        {/* Inner flex row — always fills the animated height */}
        <div className="container-wide h-full flex items-center justify-between">

          {/* ── Logo ── */}
          <a href="#" aria-label="FitMed home" className="flex-shrink-0 block">
            <motion.div
              animate={{ width: scrolled ? 96 : 140 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="overflow-hidden"
            >
              <Image
                src="/logo.webp"
                alt="FitMed"
                width={939}
                height={330}
                priority
                /* Width driven by the motion.div wrapper above */
                className="w-full h-auto object-contain"
              />
            </motion.div>
          </a>

          {/* ── Desktop nav ── */}
          <nav className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200",
                  onHero
                    ? "text-white/80 hover:text-white hover:bg-white/10"
                    : "text-slate-600 hover:text-sky-600 hover:bg-sky-50"
                )}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* ── CTA ── */}
          <div className="hidden md:flex items-center gap-3 flex-shrink-0">
            <a
              href="#"
              className={cn(
                "px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200",
                onHero
                  ? "text-white/70 hover:text-white hover:bg-white/10"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              Sign In
            </a>
            <motion.a
              href="#request"
              whileHover={{ scale: 1.04, boxShadow: "0 8px 30px rgba(14,165,233,.35)" }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white btn-primary shadow-md shadow-sky-500/20"
            >
              <span>Request Certificate</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </motion.a>
          </div>

          {/* ── Mobile burger ── */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={cn(
              "md:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl transition-colors font-bold text-xs tracking-widest uppercase",
              onHero ? "text-white hover:bg-white/10" : "text-slate-700 hover:bg-slate-100"
            )}
            aria-label="Toggle menu"
          >
            <AnimatePresence mode="wait">
              {mobileOpen ? (
                <motion.div key="x"
                  initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}
                >
                  <X className="w-6 h-6" />
                </motion.div>
              ) : (
                <motion.div key="m"
                  initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}
                >
                  <Menu className="w-6 h-6" />
                </motion.div>
              )}
            </AnimatePresence>
            <span>{mobileOpen ? "CLOSE" : "MENU"}</span>
          </button>
        </div>
      </motion.header>

      {/* ── Mobile drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed right-0 top-0 bottom-0 z-40 w-80 bg-white shadow-2xl md:hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <Image src="/logo.webp" alt="FitMed" width={939} height={330} className="w-32 h-auto object-contain" />
                <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <div className="flex flex-col p-4 gap-1 flex-1 overflow-y-auto">
                {navLinks.map((link, i) => (
                  <motion.a
                    key={link.href} href={link.href}
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setMobileOpen(false)}
                    className="px-4 py-3.5 text-slate-700 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-all text-sm font-semibold"
                  >
                    {link.label}
                  </motion.a>
                ))}
              </div>
              <div className="p-4 border-t border-slate-100 flex flex-col gap-3">
                <a href="#" className="py-3 text-center text-slate-600 rounded-xl border border-slate-200 hover:border-slate-300 text-sm font-semibold transition-all">Sign In</a>
                <a href="#request" onClick={() => setMobileOpen(false)} className="py-3 text-center rounded-xl font-bold text-white btn-primary text-sm">Request Certificate</a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
