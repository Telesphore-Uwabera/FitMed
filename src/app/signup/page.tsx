"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Footer from "@/components/Footer";
import Image from "next/image";
import {
  User,
  ArrowRight,
  ArrowLeft,
  UserPlus,
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
  IdCard,
  ShieldCheck,
  Camera,
  UploadCloud,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { convertToWebP, uploadToCloudinary, WebPConversionResult } from "@/lib/imageUtils";
import { useToast } from "@/components/ToastProvider";

export default function SignUpPage() {
  const router = useRouter();
  const { success, warning, info } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Profile Image & WebP Conversion State
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [webpResult, setWebpResult] = useState<WebPConversionResult | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  // National ID Document Image & WebP Conversion State
  const idFileInputRef = useRef<HTMLInputElement>(null);
  const [nationalIdImage, setNationalIdImage] = useState<string | null>(null);
  const [idWebpResult, setIdWebpResult] = useState<WebPConversionResult | null>(null);
  const [isConvertingId, setIsConvertingId] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsConverting(true);
      // Auto-convert to WebP format before storage in Cloudinary
      const converted = await convertToWebP(file, 0.85, 800);
      setWebpResult(converted);
      setProfileImage(converted.dataUrl);
    } catch (err) {
      console.error("WebP conversion error:", err);
      const reader = new FileReader();
      reader.onload = () => setProfileImage(reader.result as string);
      reader.readAsDataURL(file);
    } finally {
      setIsConverting(false);
    }
  };

  const handleIdImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsConvertingId(true);
      // Auto-convert National ID document to WebP format before storage in Cloudinary
      const converted = await convertToWebP(file, 0.90, 1200);
      setIdWebpResult(converted);
      setNationalIdImage(converted.dataUrl);
    } catch (err) {
      console.error("National ID WebP conversion error:", err);
      const reader = new FileReader();
      reader.onload = () => setNationalIdImage(reader.result as string);
      reader.readAsDataURL(file);
    } finally {
      setIsConvertingId(false);
    }
  };

  const [registrationSubmitted, setRegistrationSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      warning("Passwords do not match", "Please confirm the same password in both fields.");
      return;
    }
    if (!nationalIdImage && !idWebpResult) {
      warning("National ID Required", "Please upload your National ID or Passport document photo for doctor identity verification.");
      return;
    }
    setIsSubmitting(true);

    try {
      let avatarUrl = "";
      let idDocUrl = "";

      if (webpResult) {
        const uploadRes = await uploadToCloudinary(webpResult.file, "fitmed/applicants");
        if (uploadRes.url) avatarUrl = uploadRes.url;
      }

      if (idWebpResult) {
        const uploadIdRes = await uploadToCloudinary(idWebpResult.file, "fitmed/national_ids");
        idDocUrl = uploadIdRes.url || idWebpResult.dataUrl || nationalIdImage || "";
      } else if (nationalIdImage) {
        idDocUrl = nationalIdImage;
      }

      if (!idDocUrl) {
        warning("National ID Required", "Please upload your National ID or Passport document photo.");
        setIsSubmitting(false);
        return;
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName,
          email,
          phone,
          nationalId,
          password,
          avatarUrl,
          idDocUrl,
        }),
      });
      const data = await res.json().catch(() => ({ success: false }));
      if (!res.ok || !data.success) {
        warning("Registration not saved", data.error || "Please try again. Your account was not created.");
        return;
      }

      success("Registration Received!", "An administrator will review your details. You can sign in after approval.");
      setRegistrationSubmitted(true);
    } catch (err) {
      console.error("Registration error:", err);
      warning("Registration not saved", "Could not reach FitMed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-slate-50 flex flex-col justify-between">
      {/* Top Header */}
      <header className="w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40">
        <div className="container-wide py-4 flex items-center justify-between">
          <Link href="/" className="inline-block focus:outline-none">
            <Image
              src="/logo-1.webp"
              alt="FitMed"
              width={591}
              height={422}
              className="w-36 h-auto object-contain"
              priority
              loading="eager"
            />
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[#0B2D5C] font-bold text-xs shadow-sm hover:border-[#12B8B0] transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-[#12B8B0]" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      <div className="py-16 px-6 flex-1 flex items-start justify-center">
        {registrationSubmitted ? (
          <div className="w-full max-w-xl bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl space-y-6 text-center animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-extrabold uppercase tracking-wider">
                Registration Received · Pending Verification
              </span>
              <h2 className="text-2xl font-extrabold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>
                National ID Submitted to Admin
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Thank you, <strong>{fullName}</strong>. Your registration and identity document have been received. You can sign in after the FitMed team has approved your account.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
              <div className="font-extrabold text-[#0B2D5C]">What happens next?</div>
              <ul className="list-disc ml-4 space-y-1 text-slate-600">
                <li>The administrator verifies your identity against Rwanda National ID records.</li>
                <li>You will receive an email at <strong>{email}</strong> with a first-time sign-in password.</li>
                <li>The first time you sign in, you will choose a password of your own and then open your dashboard.</li>
              </ul>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/signin"
                className="px-6 py-3 rounded-xl bg-[#0B2D5C] hover:bg-[#082247] text-white font-extrabold text-xs transition-colors shadow-sm"
              >
                Go to Sign-In Portal
              </Link>
              <Link
                href="/"
                className="px-6 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
              >
                Return to Home
              </Link>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-7xl space-y-8">
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-extrabold uppercase tracking-wider">
                <UserPlus className="w-3.5 h-3.5" />
                Applicant Registration Portal
              </div>
              <h1
                className="text-3xl font-extrabold text-[#0B2D5C]"
                style={{ fontFamily: "var(--font-primary)" }}
              >
                Create Your Applicant Account
              </h1>
              <p className="text-slate-500 text-sm max-w-md mx-auto">
                Register as an applicant to access medical fitness certification services, telehealth consultations, and digital health records.
              </p>
            </div>

            {/* Registration Form */}
            <div className="w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-6">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center">
                  <User className="w-4 h-4 text-[#12B8B0]" />
                </div>
                <div>
                  <div className="text-sm font-extrabold text-[#0B2D5C]">Applicant / Candidate Account</div>
                  <div className="text-[11px] text-slate-400">Secure applicant registration</div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid lg:grid-cols-2 gap-4">
                {/* ── PROFILE PHOTO UPLOAD ── */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Profile Photo
                  </label>

                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-slate-200 border-2 border-[#12B8B0] flex-shrink-0 flex items-center justify-center shadow-inner">
                      {profileImage ? (
                        <img
                          src={profileImage}
                          alt="Profile Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-8 h-8 text-slate-400" />
                      )}

                      {isConverting && (
                        <div className="absolute inset-0 bg-[#0B2D5C]/70 flex items-center justify-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-1.5">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageSelect}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-[#12B8B0] text-[#0B2D5C] font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                      >
                        <Camera className="w-3.5 h-3.5 text-[#12B8B0]" />
                        <span>{profileImage ? "Change Photo" : "Upload Photo"}</span>
                      </button>
                      <p className="text-[11px] text-slate-400">
                        Add a clear photo of yourself for your applicant profile.
                      </p>
                    </div>
                  </div>

                  {/* Upload confirmation */}
                  {webpResult && (
                    <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-200 text-[11px] text-teal-900 font-semibold flex items-center justify-between animate-in fade-in">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                        <span>
                          Profile photo ready for upload
                        </span>
                      </div>
                      <span className="text-[10px] uppercase font-bold bg-teal-200 text-teal-800 px-2 py-0.5 rounded-md">
                        Ready
                      </span>
                    </div>
                  )}
                </div>

                {/* ── NATIONAL ID / PASSPORT DOCUMENT UPLOAD ── */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      National ID / Passport Document
                    </label>
                    <span className="text-[10px] font-bold text-[#12B8B0] bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                      Required for Doctor ID Verification
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="relative w-24 h-16 rounded-xl overflow-hidden bg-slate-200 border-2 border-slate-300 flex-shrink-0 flex items-center justify-center shadow-inner">
                      {nationalIdImage ? (
                        <img
                          src={nationalIdImage}
                          alt="National ID Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <IdCard className="w-8 h-8 text-slate-400" />
                      )}

                      {isConvertingId && (
                        <div className="absolute inset-0 bg-[#0B2D5C]/70 flex items-center justify-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-1.5">
                      <input
                        type="file"
                        ref={idFileInputRef}
                        onChange={handleIdImageSelect}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => idFileInputRef.current?.click()}
                        className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-[#12B8B0] text-[#0B2D5C] font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                      >
                        <UploadCloud className="w-3.5 h-3.5 text-[#12B8B0]" />
                        <span>{nationalIdImage ? "Change National ID" : "Upload National ID / Passport"}</span>
                      </button>
                      <p className="text-[11px] text-slate-400">
                        Upload a clear photo of the front of your Rwanda National ID or passport for identity verification.
                      </p>
                    </div>
                  </div>

                  {/* Upload confirmation */}
                  {idWebpResult && (
                    <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-[11px] text-sky-900 font-semibold flex items-center justify-between animate-in fade-in">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                        <span>
                          Identity document ready for review
                        </span>
                      </div>
                      <span className="text-[10px] uppercase font-bold bg-sky-200 text-sky-800 px-2 py-0.5 rounded-md">
                        Ready
                      </span>
                    </div>
                  )}
                </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Full Legal Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Jean Paul Habimana"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#12B8B0] text-slate-800"
                    />
                  </div>
                </div>

                {/* Email & Phone */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@email.com"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#12B8B0] text-slate-800"
                      />
                    </div>
                    <p className="mt-1.5 text-[11px] text-slate-400">This email can be used for one FitMed account only.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+250 788 000 000"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#12B8B0] text-slate-800"
                      />
                    </div>
                  </div>
                </div>

                {/* National ID */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    National ID / Passport Number
                  </label>
                  <div className="relative">
                    <IdCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      value={nationalId}
                      onChange={(e) => setNationalId(e.target.value)}
                      placeholder="e.g. 1199580048123049"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#12B8B0] text-slate-800"
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-400">Each National ID can be registered once.</p>
                </div>

                {/* Password */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Create Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#12B8B0] text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-700 p-0.5 focus:outline-none"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-slate-600" />
                      ) : (
                        <Eye className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        minLength={8}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat your password"
                        className={`w-full pl-10 pr-11 py-3 rounded-xl border text-sm focus:outline-none focus:border-[#12B8B0] text-slate-800 ${confirmPassword && confirmPassword !== password ? "border-rose-300" : "border-slate-200"}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-700 p-0.5 focus:outline-none"
                        aria-label={showConfirmPassword ? "Hide confirmed password" : "Show confirmed password"}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4 text-slate-600" /> : <Eye className="w-4 h-4 text-slate-400" />}
                      </button>
                    </div>
                    {confirmPassword && confirmPassword !== password && (
                      <p className="mt-1 text-[11px] text-rose-600">Passwords do not match.</p>
                    )}
                  </div>
                </div>

                {/* Terms */}
                <div className="flex items-start gap-2 pt-2">
                  <input
                    type="checkbox"
                    required
                    id="terms"
                    className="mt-1 rounded text-[#12B8B0] focus:ring-[#12B8B0]"
                  />
                  <label htmlFor="terms" className="text-xs text-slate-600 leading-relaxed">
                    I agree to FitMed's{" "}
                    <Link href="/terms" className="text-[#12B8B0] underline font-semibold">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-[#12B8B0] underline font-semibold">
                      Privacy Policy
                    </Link>
                    . I consent to the secure processing of my health data in accordance with Rwanda Data Protection Law.
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full max-w-md mx-auto py-3 rounded-xl font-bold text-white btn-primary text-sm flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 disabled:opacity-75"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Applicant Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Supporting panels below the full-width form */}
            <div className="grid md:grid-cols-2 gap-6 items-stretch">
              <div className="bg-[#0B2D5C] rounded-2xl p-6 text-white space-y-4 border border-[#12B8B0]/30">
                <div className="text-xs font-extrabold uppercase tracking-wider text-[#12B8B0]">After Registration</div>
                <ul className="space-y-3 text-xs text-slate-300">
                  {[
                    "Identity verified against National ID registry",
                    "Assigned a licensed FitMed physician",
                    "Access to all 7 certificate categories",
                    "Secure telehealth room for live consultation",
                    "Digitally signed & QR-verified certificates",
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#12B8B0] flex-shrink-0 mt-0.5" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col items-center justify-center text-center">
                <div className="text-sm font-extrabold text-[#0B2D5C]">Already registered?</div>
                <p className="text-xs text-slate-500 mt-1 mb-4">Continue to your applicant dashboard.</p>
                <Link href="/signin" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#12B8B0] text-[#0B2D5C] font-bold text-xs hover:bg-[#1dd9d0] transition-colors">
                  Sign In to Your Account
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
      )}
    </div>

    <Footer />
  </main>
);
}
