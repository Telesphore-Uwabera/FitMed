"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import {
  ShieldCheck,
  QrCode,
  Download,
  CheckCircle2,
  Lock,
  User,
} from "lucide-react";
import CertificateQr from "@/components/CertificateQr";
import { publicVerifyUrl } from "@/lib/certificateDisplay";

export interface CertificateData {
  certificateId: string;
  candidateName: string;
  applicantImageUrl?: string;
  nationalId: string;
  gender: "Male" | "Female";
  dateOfBirth: string;
  weightKg: string;
  heightCm: string;
  bmi: string;
  bloodPressure: string;
  heartRate: string;
  spo2: string;
  purpose: string;
  category: string;
  decision: "FIT" | "FIT_RESTRICTED" | "FURTHER_ASSESSMENT" | "NOT_FIT";
  restrictions?: string;
  systemClearances?: {
    hent: string;
    respiratory: string;
    cardiovascular: string;
    git: string;
    musculoskeletal: string;
    mentalHealth: string;
  };
  doctorName: string;
  doctorLicense: string;
  doctorId: string;
  doctorSpecialty: string;
  hospitalPartner: string;
  issueDate: string;
  expiryDate: string;
  sha256Hash: string;
  qrUrl: string;
}

interface OfficialMedicalCertificateProps {
  data?: Partial<CertificateData>;
  onClose?: () => void;
}

export default function OfficialMedicalCertificate({
  data,
  onClose,
}: OfficialMedicalCertificateProps) {
  const certRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const cert: CertificateData = {
    certificateId: data?.certificateId || "—",
    candidateName: data?.candidateName || "—",
    applicantImageUrl: data?.applicantImageUrl,
    nationalId: data?.nationalId || "—",
    gender: data?.gender || "Male",
    dateOfBirth: data?.dateOfBirth || "—",
    weightKg: data?.weightKg || "—",
    heightCm: data?.heightCm || "—",
    bmi: data?.bmi || "—",
    bloodPressure: data?.bloodPressure || "—",
    heartRate: data?.heartRate || "—",
    spo2: data?.spo2 || "—",
    purpose: data?.purpose || "—",
    category: data?.category || "—",
    decision: data?.decision || "FIT",
    restrictions: data?.restrictions || "",
    systemClearances: data?.systemClearances || {
      hent: "—",
      respiratory: "—",
      cardiovascular: "—",
      git: "—",
      musculoskeletal: "—",
      mentalHealth: "—",
    },
    doctorName: data?.doctorName || "—",
    doctorLicense: data?.doctorLicense || "—",
    doctorId: data?.doctorId || "—",
    doctorSpecialty: data?.doctorSpecialty || "—",
    hospitalPartner: data?.hospitalPartner || "—",
    issueDate: data?.issueDate || "—",
    expiryDate: data?.expiryDate || "—",
    sha256Hash: data?.sha256Hash || "—",
    qrUrl: data?.qrUrl || "",
  };

  const verifyUrl = publicVerifyUrl(cert.certificateId);

  const handleDownload = async () => {
    if (!certRef.current || isDownloading) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(certRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const imageData = canvas.toDataURL("image/png");
      pdf.addImage(imageData, "PNG", 0, 0, 210, 297, undefined, "FAST");
      pdf.save(`${cert.certificateId}-medical-fitness-certificate.pdf`);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between bg-slate-900 text-white p-4 rounded-2xl print:hidden shadow-lg">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-[#12B8B0]" />
          <div>
            <div className="text-xs font-extrabold text-white uppercase tracking-wider">
              Official Medical Certificate Viewer
            </div>
            <div className="text-[11px] text-slate-400">
              Purpose-specific certificate · Issued by a licensed physician
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="px-4 py-2 rounded-xl bg-[#12B8B0] hover:bg-[#1dd9d0] text-[#0B2D5C] text-xs font-black flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>{isDownloading ? "Preparing PDF..." : "Download PDF"}</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* ── THE OFFICIAL CERTIFICATE CANVAS ── */}
      <div
        ref={certRef}
        className="official-certificate bg-white rounded-3xl p-6 sm:p-9 border-2 border-slate-300 text-slate-900 shadow-2xl relative overflow-hidden font-serif w-full max-w-[794px] mx-auto print:border-none print:shadow-none print:p-0 print:m-0"
        style={{ minHeight: "1123px", aspectRatio: "210 / 297" }}
      >
        {/* Subtle Decorative Security Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
          <div className="text-[140px] font-black tracking-widest text-[#0B2D5C] rotate-[-25deg]">
            FITMED RWANDA
          </div>
        </div>

        {/* Outer Official Certificate Border */}
        <div className="official-certificate-border border-4 border-double border-[#0B2D5C] p-8 sm:p-10 rounded-2xl relative">
          {/* Header 1: Republic of Rwanda & Clinical Healthcare Network */}
          <div className="flex items-center justify-between border-b-2 border-[#0B2D5C] pb-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-28 h-20 relative flex-shrink-0">
                <Image
                  src="/logo-1.webp"
                  alt="FitMed Rwanda"
                  width={641}
                  height={390}
                  className="w-full h-full object-contain object-left"
                  priority
                />
              </div>
              <div className="font-sans">
                <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#0B2D5C]">
                  Digital Medical Fitness Services
                </div>
                <div className="text-xs font-bold text-slate-700">
                  FitMed Rwanda · Issued by a licensed physician
                </div>
              </div>
            </div>

            <div className="text-right font-sans">
              <div className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                Official Document No.
              </div>
              <div className="text-sm font-extrabold font-mono text-[#0B2D5C]">{cert.certificateId || "Pending"}</div>
              <span className="inline-block mt-0.5 text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                FITMED RECORD · VALID
              </span>
            </div>
          </div>

          {/* Certificate Main Title */}
          <div className="text-center my-6 space-y-1 font-sans">
            <h1
              className="text-2xl sm:text-3xl font-extrabold text-[#0B2D5C] uppercase tracking-wider underline decoration-[#12B8B0] decoration-2 underline-offset-8"
              style={{ fontFamily: "var(--font-primary)" }}
            >
              Medical Fitness Certificate
            </h1>
            <p className="text-xs text-slate-600 font-bold uppercase tracking-widest pt-2">
              Certificate of fitness for a stated purpose
            </p>
          </div>

          {/* Section 1: Applicant image and certificate purpose */}
          <div className="my-8 space-y-2.5 font-sans text-xs">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#0B2D5C] mb-3 pb-1 border-b border-slate-200 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#12B8B0]" />
              <span>1. Applicant & Certificate Purpose</span>
            </div>

            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
              <div className="flex items-center gap-5">
              <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-[#12B8B0] bg-slate-200 flex-shrink-0">
                {cert.applicantImageUrl ? (
                  <img src={cert.applicantImageUrl} alt={`${cert.candidateName} applicant photograph`} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-black text-slate-400">{cert.candidateName.charAt(0)}</div>
                )}
              </div>
              <div className="space-y-1">
                <div className="text-slate-400 text-[10px] uppercase font-bold">Applicant</div>
                <div className="font-extrabold text-base text-[#0B2D5C]">{cert.candidateName}</div>
                <div className="text-slate-500 text-xs">Assessment purpose: <strong className="text-slate-700">{cert.purpose}</strong></div>
                <div className="text-slate-500 text-xs">Category: <strong className="text-slate-700">{cert.category}</strong></div>
              </div>
            </div>
            </div>
          </div>

          {/* Section 2: Physician declaration and fitness decision */}
          <div className="my-6 space-y-2.5 font-sans">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#0B2D5C] mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#12B8B0]" />
              <span>2. Physician Declaration & Determination</span>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-50/60 border-2 border-emerald-300 space-y-4">
              <p className="text-xs sm:text-sm text-emerald-950 leading-relaxed font-serif text-justify">
                Based on the medical history provided by the applicant, the virtual clinical interview, and the physical assessment possible through the FitMed platform, I have assessed the applicant for fitness for the stated purpose.
              </p>
              <div className="mt-3">
                <div className="text-xs sm:text-sm text-emerald-950 font-semibold mb-2">At the time of assessment, the applicant is considered:</div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-emerald-600 rounded bg-white flex items-center justify-center">
                    {cert.decision === "FIT" && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                  </div>
                  <span className="text-sm font-bold text-emerald-950">{cert.decision}</span>
                </div>
              </div>
              <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-[10px] text-amber-900 leading-relaxed">
                <strong>Important:</strong> This certification reflects the applicant's condition at the time of the virtual assessment and is limited to findings that can reasonably be assessed remotely. It does not replace an in-person examination or investigations where these are clinically indicated.
              </div>
            </div>
          </div>

          {/* Section 3: Signatures and verification footer */}
          <div className="mt-8 mb-8 pt-6 border-t-2 border-[#0B2D5C] grid sm:grid-cols-3 gap-6 items-end font-sans">
            {/* Evaluating Physician Details & Stamp */}
            <div className="space-y-1.5 text-xs">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Evaluating Physician</div>
              <div className="font-extrabold text-sm text-[#0B2D5C]">{cert.doctorName}</div>
              <div className="text-slate-600 text-[11px]">RMDC License: <strong className="font-mono">{cert.doctorLicense}</strong></div>
              <div className="text-slate-500 text-[10px]">{cert.doctorSpecialty}</div>

              <div className="pt-2 flex items-center gap-1.5 text-[10px] text-teal-700 font-bold">
                <Lock className="w-3 h-3 text-[#12B8B0]" />
                <span>Digitally signed & timestamped</span>
              </div>
            </div>

            {/* Official Digital Seal / Stamp */}
            <div className="flex flex-col items-center justify-center text-center p-3 rounded-2xl border-2 border-dashed border-[#0B2D5C]/30 bg-slate-50">
              <div className="w-14 h-14 rounded-full border-2 border-[#0B2D5C] text-[#0B2D5C] flex items-center justify-center font-black text-[9px] uppercase tracking-tighter text-center leading-tight mb-1 bg-white shadow-inner">
                FITMED<br />DIGITAL<br />SEAL
              </div>
              <div className="text-[10px] font-extrabold text-[#0B2D5C]">Issued in Kigali, Rwanda</div>
              <div className="text-[10px] text-slate-500">Date: <strong>{cert.issueDate}</strong></div>
              <div className="text-[10px] text-slate-500">Valid Until: <strong>{cert.expiryDate}</strong></div>
            </div>

            {/* QR Code Verification Link */}
            <div className="flex flex-col items-center justify-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
              <div className="w-20 h-20 bg-white p-1 rounded-lg border border-slate-200 shadow-sm flex-shrink-0 flex items-center justify-center overflow-hidden">
                {cert.certificateId && cert.certificateId !== "—" ? (
                  <CertificateQr value={verifyUrl} label={`Official Document No. ${cert.certificateId}`} />
                ) : (
                  <QrCode className="w-10 h-10 text-[#0B2D5C]" />
                )}
              </div>
              <div className="space-y-0.5 text-[10px] text-slate-600">
                <div className="font-extrabold text-[#0B2D5C]">Scan to open certificate</div>
                <div className="font-mono text-[9px] text-[#0B2D5C] break-all">Official Document No. {cert.certificateId}</div>
                <a href={verifyUrl} className="font-mono text-[8px] text-sky-700 break-all underline" target="_blank" rel="noreferrer">
                  {verifyUrl.replace(/^https?:\/\//, "")}
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
