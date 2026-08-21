import type { Metadata } from "next";
import Link from "next/link";
import PageLayout from "@/components/PageLayout";
import { Mail, Download, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Press — FitMed",
  description: "FitMed press resources, media kit, and brand assets for journalists and media professionals.",
};

const pressItems = [
  { date: "August 2026", headline: "FitMed Launches Digital Medical Fitness Certification Platform in Rwanda", source: "Press Release", summary: "FitMed announces the launch of Rwanda's first digital medical fitness certification platform connecting applicants with licensed doctors through secure video consultations." },
  { date: "August 2026", headline: "FitMed Reaches 10,000 Medical Fitness Certificates Issued", source: "Milestone", summary: "FitMed celebrates issuing 10,000 digital medical fitness certificates, demonstrating rapid adoption across employment, education, and occupational health sectors." },
  { date: "August 2026", headline: "FitMed Partners with Rwandan Employers for Workforce Health Certification", source: "Partnership", summary: "FitMed announces partnerships with leading Rwandan organisations to streamline employee medical fitness certification through its employer portal." },
];

export default function PressPage() {
  return (
    <PageLayout title="Press" subtitle="Media resources and brand assets">
      <div className="space-y-10">

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-7">
          <p className="text-slate-700 leading-relaxed">
            Welcome to the FitMed press room. Here you can find our latest press releases,
            brand assets, and media contact information. For media enquiries, please contact
            our communications team directly.
          </p>
        </div>

        {/* Media contact */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-7">
          <h2 className="text-lg font-bold text-slate-900 mb-5" style={{ fontFamily: "var(--font-primary)" }}>Media Contact</h2>
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex-1 p-5 bg-sky-50 rounded-2xl border border-sky-100">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Press Enquiries</div>
              <a href="mailto:press@fitmed.rw" className="text-base font-bold text-sky-600 hover:underline flex items-center gap-2">
                <Mail className="w-4 h-4" /> press@fitmed.rw
              </a>
            </div>
            <div className="flex-1 p-5 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Response Time</div>
              <div className="text-base font-bold text-slate-800">Within 24 hours</div>
              <div className="text-xs text-slate-500 mt-0.5">Monday – Friday</div>
            </div>
          </div>
        </div>

        {/* Latest news */}
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 mb-6" style={{ fontFamily: "var(--font-primary)" }}>Latest News</h2>
          <div className="space-y-5">
            {pressItems.map((item) => (
              <div key={item.headline} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:border-sky-200 hover:shadow-md transition-all">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-100">{item.source}</span>
                  <span className="text-xs text-slate-400">{item.date}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2" style={{ fontFamily: "var(--font-primary)" }}>{item.headline}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.summary}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Brand assets */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-7">
          <h2 className="text-lg font-bold text-slate-900 mb-5" style={{ fontFamily: "var(--font-primary)" }}>Brand Assets</h2>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            Use these assets when writing about FitMed. Please do not modify our logo or use it
            in a way that implies endorsement without prior written consent.
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { label: "FitMed Logo (WebP)", file: "/logo-4.webp" },
              { label: "FitMed Icon (WebP)", file: "/favicon-icon.webp" },
              { label: "Brand Guidelines", file: "mailto:press@fitmed.rw" },
            ].map((asset) => (
              <a
                key={asset.label}
                href={asset.file}
                className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50 transition-all group"
                download={asset.file.startsWith("/") ? true : undefined}
              >
                <Download className="w-4 h-4 text-sky-500 group-hover:text-sky-600 flex-shrink-0" />
                <span className="text-sm font-semibold text-slate-700 group-hover:text-sky-700">{asset.label}</span>
              </a>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-slate-900 rounded-3xl p-8 text-center">
          <h2 className="text-xl font-extrabold text-white mb-3" style={{ fontFamily: "var(--font-primary)" }}>Cover FitMed?</h2>
          <p className="text-slate-400 mb-6 max-w-md mx-auto text-sm">We're happy to arrange interviews, provide statistics, or offer expert commentary on digital health and telemedicine in Rwanda.</p>
          <a href="mailto:press@fitmed.rw" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-white btn-primary group">
            Get in Touch <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>

        <p className="text-center text-xs text-slate-400 flex flex-wrap justify-center gap-3 pt-4">
          <Link href="/" className="hover:text-sky-600">Home</Link><span>·</span>
          <Link href="/about" className="hover:text-sky-600">About FitMed</Link><span>·</span>
          <Link href="/contact" className="hover:text-sky-600">Contact</Link>
        </p>
      </div>
    </PageLayout>
  );
}
