import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TeamSlider from "@/components/TeamSlider";
import {
  ShieldCheck,
  Stethoscope,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Lock,
  UserCheck,
  Building2,
  ArrowRight,
  Heart,
  Globe,
  Target,
  FileCheck2,
  Users,
  Award,
  ShieldAlert,
  SlidersHorizontal,
  User,
  Check,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About Us | FitMed Medical Certification Platform",
  description:
    "Learn about FitMed — a secure digital medical assessment and certification platform connecting individuals with qualified healthcare professionals through risk-based clinical screening.",
};

const pillars = [
  {
    icon: ShieldCheck,
    title: "Digital Medical Assessment",
    badge: "Secure & Encrypted",
    desc: "Standardized digital assessments capturing health history, vitals, and specific activity demands under end-to-end encryption.",
    color: "from-teal-500/20 to-teal-500/5",
    accent: "text-[#12B8B0]",
    border: "border-teal-500/30",
  },
  {
    icon: Stethoscope,
    title: "Qualified Healthcare Network",
    badge: "Licensed Physicians",
    desc: "Every assessment is reviewed, authorized, and digitally signed by verified, practicing medical doctors committed to clinical excellence.",
    color: "from-sky-500/20 to-sky-500/5",
    accent: "text-sky-400",
    border: "border-sky-500/30",
  },
  {
    icon: Activity,
    title: "Structured Clinical Screening",
    badge: "Risk-Based Triage",
    desc: "Evidence-based clinical decision frameworks stratify candidate risk for physical, occupational, academic, or athletic activities.",
    color: "from-indigo-500/20 to-indigo-500/5",
    accent: "text-indigo-400",
    border: "border-indigo-500/30",
  },
  {
    icon: AlertTriangle,
    title: "In-Person Clinical Referral",
    badge: "Safety Guarantee",
    desc: "Cases with elevated risk factors or requiring hands-on examination are mandatorily referred to physical partner clinics.",
    color: "from-amber-500/20 to-amber-500/5",
    accent: "text-amber-400",
    border: "border-amber-500/30",
  },
];



const clinicalSteps = [
  {
    num: "01",
    title: "Digital Intake & Activity Screening",
    desc: "Candidates complete structured health declarations and purpose-specific screening forms tailored to their target activity.",
  },
  {
    num: "02",
    title: "Doctor Review & Risk Stratification",
    desc: "A licensed medical doctor reviews candidate history, flags contraindications, and determines risk classification.",
  },
  {
    num: "03",
    title: "Clearance or Physical Referral",
    desc: "Low-risk candidates receive a digitally signed certificate. Candidates requiring physical examination are routed to in-person clinical partners.",
  },
  {
    num: "04",
    title: "Instant Cryptographic Verification",
    desc: "Employers, organizing bodies, or authorities scan the embedded QR code to verify authenticity and validity in real time.",
  },
];

const values = [
  {
    icon: Shield,
    title: "Clinical Rigor",
    desc: "Technology streamlines intake, but licensed doctors retain absolute clinical authority over every clearance decision.",
  },
  {
    icon: Heart,
    title: "Applicant Privacy",
    desc: "Strict data protections ensure candidates share only necessary fitness verification with third parties, keeping medical details private.",
  },
  {
    icon: Target,
    title: "Purpose-Specific",
    desc: "Assessments are calibrated precisely to the physical and medical requirements of the specific activity requested.",
  },
  {
    icon: Globe,
    title: "Accessibility",
    desc: "Democratizing access to verified medical clearance for workers, students, and athletes across Rwanda and East Africa.",
  },
];

function Shield(props: any) {
  return <ShieldCheck {...props} />;
}

export default function AboutPage() {
  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-white">
      {/* Shared Navbar */}
      <Navbar />

      {/* ── HERO SECTION — Full bleed brand navy with background image ── */}
      <section className="relative pt-36 pb-20 lg:pt-44 lg:pb-32 bg-[#0B2D5C] overflow-hidden text-white">
        {/* Full-bleed background image with layered overlays */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1800&q=85&auto=format&fit=crop"
            alt="Medical team background"
            fill
            className="object-cover object-center opacity-25"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B2D5C]/95 via-[#0B2D5C]/80 to-[#0B2D5C]/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B2D5C] via-transparent to-[#0B2D5C]/70" />
        </div>

        {/* Decorative blur glows */}
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-[#12B8B0]/15 rounded-full blur-[160px] pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-[500px] h-[500px] bg-sky-600/15 rounded-full blur-[140px] pointer-events-none" />

        <div className="container-wide relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.08] tracking-tight"
              style={{ fontFamily: "var(--font-primary)" }}
            >
              Fit, Verified, and <span className="bg-gradient-to-r from-[#12B8B0] via-[#1dd9d0] to-[#12B8B0] bg-clip-text text-transparent">Clinically Assessed.</span>
            </h1>

            {/* Core Definition Highlight Card */}
            <div className="mt-8 p-8 sm:p-10 rounded-3xl bg-white/5 border border-white/15 backdrop-blur-xl shadow-2xl text-left relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-[#12B8B0] to-[#1dd9d0]" />
              <p className="text-slate-200 text-lg sm:text-xl leading-relaxed font-medium">
                “A secure digital medical assessment and certification platform that connects
                individuals with qualified healthcare professionals to determine fitness for defined
                activities, while using structured clinical screening and risk-based referral to
                ensure that cases requiring physical examination are assessed in person.”
              </p>
            </div>

            {/* Key stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 text-center">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-2xl sm:text-3xl font-extrabold text-[#12B8B0]" style={{ fontFamily: "var(--font-primary)" }}>
                  100%
                </div>
                <div className="text-xs text-slate-300 mt-1">Licensed Doctors</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-2xl sm:text-3xl font-extrabold text-white" style={{ fontFamily: "var(--font-primary)" }}>
                  Instant
                </div>
                <div className="text-xs text-slate-300 mt-1">QR Verification</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-2xl sm:text-3xl font-extrabold text-[#12B8B0]" style={{ fontFamily: "var(--font-primary)" }}>
                  Risk-Based
                </div>
                <div className="text-xs text-slate-300 mt-1">Clinical Screening</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-2xl sm:text-3xl font-extrabold text-white" style={{ fontFamily: "var(--font-primary)" }}>
                  3 Roles
                </div>
                <div className="text-xs text-slate-300 mt-1">Admin, Doctor & User</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 1: PROBLEM & SOLUTION — White Background ────── */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="container-wide">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-[#0d9690] text-xs font-bold uppercase tracking-wider">
                <Award className="w-4 h-4" />
                Our Origin & Mission
              </div>

              <h2
                className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0B2D5C] leading-tight"
                style={{ fontFamily: "var(--font-primary)" }}
              >
                Modernizing Medical Clearance Without Sacrificing Safety.
              </h2>

              <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
                Obtaining a medical fitness certificate traditionally involved long hospital wait times, paper-based forms susceptible to fraud, and geographic barriers for workers in remote regions.
              </p>

              <p className="text-slate-600 text-base leading-relaxed">
                FitMed bridges telemedicine and occupational health by providing a structured digital intake framework. We connect candidates with licensed doctors for rapid evaluation while maintaining strict safety controls that route complex cases for physical examination.
              </p>

              <div className="pt-4 grid sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <CheckCircle2 className="w-5 h-5 text-[#12B8B0] flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-[#0B2D5C]">Licensed Physicians</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Every record reviewed by verified doctors.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <CheckCircle2 className="w-5 h-5 text-[#12B8B0] flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-[#0B2D5C]">Risk Stratification</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Clinical protocols protect candidate safety.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200 aspect-[4/3]">
                <Image
                  src="https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1200&q=85&auto=format&fit=crop"
                  alt="Doctor conducting telemedicine consultation"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B2D5C]/75 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 text-white space-y-1">
                  <div className="text-xs font-bold text-[#12B8B0] uppercase tracking-wider">Telemedicine & Virtual Clearance</div>
                  <div className="text-lg font-bold">Connecting applicants and licensed doctors everywhere</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* ── SECTION 3: 4 CORE PILLARS — White Background ────── */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="container-wide">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0B2D5C]"
              style={{ fontFamily: "var(--font-primary)" }}
            >
              The Four Pillars of FitMed
            </h2>
            <p className="text-slate-600 text-base sm:text-lg">
              Combining clinical rigor, digital efficiency, and applicant safety into a seamless clearance workflow.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {pillars.map((p) => (
              <div
                key={p.title}
                className="p-8 rounded-3xl bg-slate-50 border border-slate-200 hover:border-[#12B8B0] transition-all duration-300 flex flex-col justify-between group shadow-sm hover:shadow-md"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-[#edf6f6] border border-teal-200 text-[#12B8B0] flex items-center justify-center">
                      <p.icon className="w-7 h-7" />
                    </div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest px-3 py-1 rounded-full bg-white border border-slate-200">
                      {p.badge}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>
                    {p.title}
                  </h3>

                  <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                    {p.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 4: TEAM SLIDER (6 PEOPLE, ADMIN MANAGED) ────── */}
      <section className="py-20 lg:py-28 bg-[#f4f7fb]">
        <div className="container-wide">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0B2D5C]"
              style={{ fontFamily: "var(--font-primary)" }}
            >
              Meet Our Healthcare & Leadership Team
            </h2>
            <p className="text-slate-600 text-base sm:text-lg">
              Our multidisciplinary team of medical directors, telehealth practitioners, compliance leaders, and health informaticists.
            </p>
          </div>

          {/* Interactive 6-Person Team Slider */}
          <TeamSlider />
        </div>
      </section>

      {/* ── SECTION 5: CLINICAL WORKFLOW & REFERRALS — Light Wash ─ */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
            <h2
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0B2D5C]"
              style={{ fontFamily: "var(--font-primary)" }}
            >
              Structured Screening & Risk-Based Referral
            </h2>
            <p className="text-slate-600 text-base sm:text-lg">
              Ensuring candidates requiring physical examination are referred in person while expediting low-risk clearance.
            </p>
          </div>

          <div className="grid lg:grid-cols-4 gap-6">
            {clinicalSteps.map((step) => (
              <div
                key={step.num}
                className="bg-slate-50 rounded-3xl p-7 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-lg transition-shadow"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#0B2D5C] text-[#12B8B0] font-black text-base flex items-center justify-center">
                    {step.num}
                  </div>
                  <h3 className="text-lg font-bold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 p-8 rounded-3xl bg-gradient-to-r from-[#0B2D5C] to-[#071d3d] text-white flex flex-col md:flex-row items-center justify-between gap-6 border border-[#12B8B0]/30 shadow-xl">
            <div className="space-y-2 text-center md:text-left">
              <h4 className="text-xl font-bold text-white" style={{ fontFamily: "var(--font-primary)" }}>
                In-Person Partner Clinic Network
              </h4>
              <p className="text-slate-300 text-sm max-w-2xl">
                When screening indicates elevated risk or physical examination requirements (e.g. auscultation, lab panels, ECG), candidates are scheduled directly at accredited partner clinics.
              </p>
            </div>
            <Link
              href="/signin"
              className="px-6 py-3.5 rounded-2xl bg-[#12B8B0] hover:bg-[#1dd9d0] text-[#0B2D5C] font-extrabold text-sm transition-all whitespace-nowrap flex-shrink-0"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* ── SECTION 6: OUR CORE VALUES — Light Wash ───────── */}
      <section className="py-20 lg:py-28 bg-[#f4f7fb]">
        <div className="container-wide">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>
              Guided by Clinical Values
            </h2>
            <p className="text-slate-600 text-base">
              Principles driving our technology development and clinical operations.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v) => (
              <div key={v.title} className="p-7 rounded-3xl bg-white border border-slate-200 text-center space-y-4 hover:border-[#12B8B0] transition-colors shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-[#edf6f6] border border-teal-200/60 text-[#12B8B0] flex items-center justify-center mx-auto">
                  <v.icon className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>
                  {v.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Shared CTA component */}

      {/* Shared Footer */}
      <Footer />
    </main>
  );
}
