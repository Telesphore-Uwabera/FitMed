import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  lastUpdated?: string;
  children: React.ReactNode;
}

export default function PageLayout({ title, subtitle, lastUpdated, children }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Dark header */}
      <header className="bg-slate-900 py-14">
        <div className="max-w-5xl mx-auto px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm mb-10 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to FitMed
          </Link>
          <div className="flex items-center gap-5 mb-5">
            <div className="relative flex-shrink-0" style={{ width: 160, height: 97 }}>
              <Image
                src="/logo-4.webp"
                alt="FitMed"
                fill
                className="object-contain"
              />
            </div>
          </div>
          <h1
            className="text-4xl md:text-5xl font-extrabold text-white mb-3"
            style={{ fontFamily: "var(--font-primary)" }}
          >
            {title}
          </h1>
          {subtitle && <p className="text-slate-400 text-lg">{subtitle}</p>}
          {lastUpdated && (
            <p className="text-slate-500 text-sm mt-3">
              Last updated: <strong className="text-slate-300">{lastUpdated}</strong>
            </p>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-16">{children}</div>
    </div>
  );
}
