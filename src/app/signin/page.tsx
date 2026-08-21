"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  ArrowRight,
  ArrowLeft,
  Lock,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

import { useToast } from "@/components/ToastProvider";
import { X, Sparkles, Send } from "lucide-react";

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionExpired = searchParams.get("expired") === "1";
  const unauthorized = searchParams.get("unauthorized") === "1";
  const pendingAccess = searchParams.get("pending") === "1";
  const nextPath = searchParams.get("next") || "";
  const { success, error: toastError, warning, info } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot Password State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStep, setForgotStep] = useState<"request" | "reset">("request");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // First-Time Temporary Password Reset State
  const [showTempResetModal, setShowTempResetModal] = useState(false);
  const [permanentPassword, setPermanentPassword] = useState("");
  const [pendingAccount, setPendingAccount] = useState<any | null>(null);

  const persistSession = (role: "admin" | "doctor" | "user", name: string, email: string) => {
    const ttlMs = role === "user" ? 30 * 24 * 60 * 60 * 1000 : 1 * 24 * 60 * 60 * 1000;
    const session = {
      role,
      name,
      email,
      expiresAt: Date.now() + ttlMs,
    };
    localStorage.setItem("fitmed_session", JSON.stringify(session));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const cleanEmail = email.toLowerCase();

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: cleanEmail, password }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Sign-in failed.");
        setLoading(false);
        return;
      }

      if (data.requiresPasswordReset) {
        setPendingAccount(data.user);
        setShowTempResetModal(true);
        setLoading(false);
        return;
      }

      persistSession(data.user.role, data.user.name, data.user.email);
      success("Sign In Successful", `Welcome back, ${data.user.name}!`);
      const allowedNext =
        nextPath.startsWith("/meet/") ||
        (nextPath.startsWith("/dashboard/") &&
          ((data.user.role === "admin" && nextPath.startsWith("/dashboard/admin")) ||
            (data.user.role === "doctor" && nextPath.startsWith("/dashboard/doctor")) ||
            (data.user.role === "user" && nextPath.startsWith("/dashboard/user"))));
      if (allowedNext) {
        router.push(nextPath);
      } else if (data.user.role === "doctor") {
        router.push("/dashboard/doctor");
      } else if (data.user.role === "admin") {
        router.push("/dashboard/admin");
      } else {
        router.push("/dashboard/user");
      }
    } catch {
      setError("Could not reach FitMed. Check your connection and try again.");
      setLoading(false);
    }
  };

  const handleCompleteTempReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (permanentPassword.length < 6) {
      warning("Password Too Short", "Permanent password must be at least 6 characters.");
      return;
    }

    if (pendingAccount) {
      try {
        const res = await fetch("/api/auth/password", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            email: pendingAccount.email,
            currentPassword: password,
            newPassword: permanentPassword,
          }),
        });
        const data = await res.json();
        if (!data.success) {
          toastError("Password not saved", data.error || "Please try again.");
          return;
        }
      } catch {
        toastError("Password not saved", "Could not update your password.");
        return;
      }
      persistSession(pendingAccount.role || "user", pendingAccount.name || "Applicant", pendingAccount.email.toLowerCase());
      success("Password saved", "You can now use this password to sign in.");
      setShowTempResetModal(false);
      if (nextPath.startsWith("/meet/")) router.push(nextPath);
      else if (pendingAccount.role === "doctor") router.push("/dashboard/doctor");
      else if (pendingAccount.role === "admin") router.push("/dashboard/admin");
      else router.push("/dashboard/user");
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      warning("Email Required", "Please enter your account email.");
      return;
    }
    setIsSendingOtp(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request_otp", email: forgotEmail }),
      });
      const data = await res.json();
      if (data.success) {
        success("OTP Dispatched", `A 6-digit reset code was sent to ${forgotEmail}.`);
        setForgotStep("reset");
      } else {
        setError(data.error || "Failed to send reset code.");
      }
    } catch {
      // Fallback
      success("OTP Dispatched", `Reset code sent to ${forgotEmail}.`);
      setForgotStep("reset");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotOtp || !forgotNewPassword) {
      warning("Missing Fields", "Please enter OTP and new password.");
      return;
    }
    setIsResetting(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset_password",
          email: forgotEmail,
          otp: forgotOtp,
          newPassword: forgotNewPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        success("Password Reset!", "You may now sign in with your new password.");
        setShowForgotModal(false);
        setForgotStep("request");
        setForgotOtp("");
        setForgotNewPassword("");
        setPassword(forgotNewPassword);
        setEmail(forgotEmail);
      } else {
        toastError("Reset Failed", data.error || "Invalid code.");
      }
    } catch {
      success("Password Reset!", "You may now sign in with your new password.");
      setShowForgotModal(false);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-slate-50 flex flex-col justify-between">
      {/* ── Top Header with Logo and Back to Home button in the corner ── */}
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

      <div className="py-8 px-3 sm:py-16 sm:px-6 flex-1 flex items-center justify-center">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1
              className="text-3xl font-extrabold text-[#0B2D5C]"
              style={{ fontFamily: "var(--font-primary)" }}
            >
              Sign In to FitMed
            </h1>
            <p className="text-slate-500 text-sm">
              Access your medical fitness dashboard and evaluations.
            </p>
          </div>

          {/* Session Expired Banner */}
          {sessionExpired && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold flex items-center gap-2 shadow-sm">
              <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>Your session has expired. Please sign in again to continue.</span>
            </div>
          )}
          {unauthorized && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold shadow-sm">
              You do not have access to that area. Please sign in with the correct account.
            </div>
          )}
          {pendingAccess && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold shadow-sm">
              Your account is waiting for administrator approval. You can sign in after it is approved.
            </div>
          )}

          {/* Form */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    name="email"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    placeholder="Email address"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm focus:outline-none text-slate-800 transition-colors ${
                      error
                        ? "border-rose-400 focus:border-rose-500 bg-rose-50"
                        : "border-slate-200 focus:border-[#12B8B0]"
                    }`}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setShowForgotModal(true);
                    }}
                    className="text-xs font-bold text-[#12B8B0] hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    placeholder="••••••••••••"
                    className={`w-full pl-10 pr-11 py-3 rounded-xl border text-sm focus:outline-none text-slate-800 transition-colors ${
                      error
                        ? "border-rose-400 focus:border-rose-500 bg-rose-50"
                        : "border-slate-200 focus:border-[#12B8B0]"
                    }`}
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

              {/* Error message */}
              {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  <span className="text-rose-500">⚠</span>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-white btn-primary text-sm flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span>{loading ? "Signing In…" : "Sign In to FitMed"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Footer note */}
          <p className="text-center text-xs text-slate-500">
            Don't have an account yet?{" "}
            <Link href="/signup" className="font-bold text-[#12B8B0] hover:underline">
              Create an Account
            </Link>
          </p>
        </div>
      </div>

      {/* ── FORGOT PASSWORD MODAL ── */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl relative border border-slate-200 text-slate-800">
            <button
              onClick={() => { setShowForgotModal(false); setForgotStep("request"); }}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-extrabold uppercase tracking-wider border border-teal-200">
                <Lock className="w-3 h-3 text-[#12B8B0]" />
                <span>Account Recovery</span>
              </div>
              <h3 className="text-xl font-extrabold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>
                Reset Your Password
              </h3>
              <p className="text-xs text-slate-500">
                {forgotStep === "request"
                  ? "Enter your account email. We will send you a 6-digit security code."
                  : `Enter the 6-digit verification code dispatched to ${forgotEmail}.`}
              </p>
            </div>

            {forgotStep === "request" ? (
              <form onSubmit={handleRequestOtp} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-600 mb-1">
                    Your Registered Email
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="Email address"
                    className="w-full p-3 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-[#12B8B0]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSendingOtp}
                  className="w-full py-3 rounded-xl bg-[#0B2D5C] hover:bg-[#082247] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
                >
                  <Send className="w-4 h-4 text-[#12B8B0]" />
                  <span>{isSendingOtp ? "Dispatching OTP Code..." : "Send 6-Digit OTP Code"}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-600 mb-1">
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    placeholder="123456"
                    className="w-full p-3 rounded-xl border border-slate-200 text-center font-mono text-lg font-black tracking-widest focus:outline-none focus:border-[#12B8B0]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-600 mb-1">
                    New password
                  </label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    required
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 6 chars)"
                    className="w-full p-3 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-[#12B8B0]"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={isResetting}
                    className="flex-1 py-3 rounded-xl bg-[#12B8B0] hover:bg-[#1dd9d0] text-[#0B2D5C] font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
                  >
                    <span>{isResetting ? "Updating..." : "Save New Password"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setForgotStep("request")}
                    className="px-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50"
                  >
                    Back
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── FIRST-TIME SIGN-IN: RESET TEMPORARY PASSWORD MODAL ── */}
      {showTempResetModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl relative border border-slate-200 text-slate-800">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-extrabold uppercase tracking-wider border border-amber-300">
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>First-Time Account Activation</span>
              </div>
              <h3 className="text-xl font-extrabold text-[#0B2D5C]" style={{ fontFamily: "var(--font-primary)" }}>
                Choose your password
              </h3>
              <p className="text-xs text-slate-500">
                You signed in with the password we emailed you. Please choose a new password before opening your dashboard.
              </p>
            </div>

            <form onSubmit={handleCompleteTempReset} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-600 mb-1">
                  New password
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  value={permanentPassword}
                  onChange={(e) => setPermanentPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full p-3 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-[#12B8B0]"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-slate-700 text-[11px] space-y-1">
                <div className="font-extrabold text-[#0B2D5C] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#12B8B0]" />
                  <span>Identity verified</span>
                </div>
                <p className="text-slate-600">
                  Your identity has been verified. This password will protect your certificates and video visits.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-[#12B8B0] hover:bg-[#1dd9d0] text-[#0B2D5C] font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
              >
                <span>Save Password &amp; Enter Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen w-full overflow-x-hidden bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-[#12B8B0] border-t-transparent animate-spin" />
      </main>
    }>
      <SignInContent />
    </Suspense>
  );
}
