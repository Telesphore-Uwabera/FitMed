"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Home",          href: "/" },
  { label: "About Us",      href: "/about" },
  { label: "How It Works",  href: "/#how-it-works" },
  { label: "Certificates",  href: "/#certificates" },
  { label: "For Employers", href: "/#employers" },
  { label: "Technology",    href: "/#technology" },
  { label: "Contact Us",    href: "/contact" },
];

/*
 * Navbar heights (px):
 *  At top of page  → 80px
 *  After scrolling → 58px
 */
const NAV_H_TOP      = 80;
const NAV_H_SCROLLED = 58;

/*
 * Breakpoint strategy:
 *  < 1024px (below lg) → show hamburger + MENU label
 *  ≥ 1024px (lg+)      → show full desktop nav
 *
 * This prevents the nav links wrapping on 768–1023px tablets.
 */
export default function Navbar() {
  const [scrolled,   setScrolled]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [onHero,     setOnHero]     = useState(true);
  const pathname = usePathname();

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

  useEffect(() => {
    const hash = window.location.hash;
    const target = hash ? document.getElementById(hash.slice(1)) : null;
    window.requestAnimationFrame(() => {
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  }, [pathname]);

  const handleLinkClick = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    const url = new URL(href, window.location.origin);
    if (url.pathname !== window.location.pathname) return;

    event.preventDefault();
    window.history.pushState({}, "", `${url.pathname}${url.hash}`);
    setMobileOpen(false);

    const target = url.hash ? document.getElementById(url.hash.slice(1)) : null;
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const navH = scrolled ? NAV_H_SCROLLED : NAV_H_TOP;

  return (
    <>
      {/* ── Fixed header ─────────────────────────────────────── */}
      <motion.header
        initial={{ y: -NAV_H_TOP, opacity: 0 }}
        animate={{ y: 0, opacity: 1, height: navH }}
        transition={{
          height:  { duration: 0.3, ease: "easeInOut" },
          y:       { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
          opacity: { duration: 0.65 },
        }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 overflow-hidden",
          scrolled
            ? onHero
              ? "bg-[#071d3d]/95 backdrop-blur-xl shadow-xl shadow-black/30"
              : "bg-white/97 backdrop-blur-xl shadow-md"
            : "bg-transparent"
        )}
      >
        <div className="container-wide h-full flex items-center justify-between gap-4">

          {/* ── Logo ─────────────────────────────────────────── */}
          <Link href="/" aria-label="FitMed home" className="flex-shrink-0 block">
            <motion.div
              animate={{ width: scrolled ? 120 : 180 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="overflow-hidden"
            >
              {/*
               * Not scrolled (on hero)  → logo-4.webp  (full colour, hero version)
               * Scrolled past hero      → logo-3.webp  (compact scrolled version)
               * Both have transparent backgrounds — no filter needed.
               */}
              <Image
                src={scrolled ? "/logo-2.webp" : "/logo-4.webp"}
                alt="FitMed"
                width={641}
                height={390}
                priority
                loading="eager"
                className="w-full h-auto object-contain transition-all duration-300"
              />
            </motion.div>
          </Link>

          {/* ── Desktop nav — visible from lg (1024px) up ─────
              flex-nowrap + overflow-hidden ensures links NEVER
              wrap to a second row regardless of screen width.
          ─────────────────────────────────────────────────── */}
          <nav className="hidden lg:flex items-center gap-0.5 flex-1 justify-center overflow-hidden">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={(event) => handleLinkClick(event, link.href)}
                className={cn(
                  "whitespace-nowrap flex-shrink-0 px-3 xl:px-4 py-2 rounded-xl text-sm xl:text-[0.9rem] font-semibold transition-all duration-200",
                  onHero
                    ? "text-white/85 hover:text-white hover:bg-white/12"
                    : "text-[#0B2D5C] hover:text-[#12B8B0] hover:bg-[#edf6f6]"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* ── CTA — desktop only (lg+) ──────────────────────── */}
          <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
            <Link
              href="/signin"
              className={cn(
                "whitespace-nowrap flex-shrink-0 px-3 xl:px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200",
                onHero
                  ? "text-white/70 hover:text-white hover:bg-white/10"
                  : "text-[#0B2D5C]/70 hover:text-[#0B2D5C]"
              )}
            >
              Sign In
            </Link>
            <motion.div
              whileHover={{ scale: 1.04, boxShadow: "0 8px 30px rgba(14,165,233,.35)" }}
              whileTap={{ scale: 0.97 }}
              className="flex-shrink-0"
            >
              <Link
                href="/signin"
                className="flex items-center gap-1.5 px-4 xl:px-5 py-2.5 rounded-xl text-sm font-bold text-white btn-primary shadow-md shadow-sky-500/20 whitespace-nowrap"
              >
                <span>Request Certificate</span>
                <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
              </Link>
            </motion.div>
          </div>

          {/* ── Hamburger — visible below lg (< 1024px) ─────────
              Shows icon + "MENU" / "CLOSE" label.
          ─────────────────────────────────────────────────── */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={cn(
              "lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl transition-colors font-bold text-xs tracking-widest uppercase flex-shrink-0",
              onHero
                ? "text-white hover:bg-white/12"
                : "text-[#0B2D5C] hover:bg-[#edf6f6]"
            )}
            aria-label="Toggle menu"
          >
            <AnimatePresence mode="wait">
              {mobileOpen ? (
                <motion.div
                  key="x"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0,   opacity: 1 }}
                  exit={{   rotate: 90,   opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <X className="w-5 h-5" />
                </motion.div>
              ) : (
                <motion.div
                  key="m"
                  initial={{ rotate: 90,  opacity: 0 }}
                  animate={{ rotate: 0,   opacity: 1 }}
                  exit={{   rotate: -90,  opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Menu className="w-5 h-5" />
                </motion.div>
              )}
            </AnimatePresence>
            <span>{mobileOpen ? "CLOSE" : "MENU"}</span>
          </button>
        </div>
      </motion.header>

      {/* ── Mobile / tablet drawer — slides in from right ──── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed right-0 top-0 bottom-0 z-40 w-80 bg-white shadow-2xl lg:hidden flex flex-col"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <Image
                  src="/logo-4.webp"
                  alt="FitMed"
                  width={641}
                  height={390}
                  className="w-32 h-auto object-contain"
                />
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Nav links */}
              <div className="flex flex-col p-4 gap-1 flex-1 overflow-y-auto">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="block px-4 py-3.5 text-slate-700 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-all text-sm font-semibold"
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Bottom actions */}
              <div className="p-4 border-t border-slate-100 flex flex-col gap-3">
                <Link
                  href="/signin"
                  onClick={() => setMobileOpen(false)}
                  className="py-3 text-center text-slate-600 rounded-xl border border-slate-200 hover:border-slate-300 text-sm font-semibold transition-all"
                >
                  Sign In
                </Link>
                <Link
                  href="/signin"
                  onClick={() => setMobileOpen(false)}
                  className="py-3 text-center rounded-xl font-bold text-white btn-primary text-sm"
                >
                  Request Certificate
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
