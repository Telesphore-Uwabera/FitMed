import { Suspense } from "react";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Create Account",
  description: "Create a FitMed account to request a medical fitness certificate from a licensed doctor in Rwanda.",
  path: "/signup",
});

export default function SignUpLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen w-full bg-slate-50 flex items-center justify-center">
          <div
            className="w-10 h-10 rounded-full border-4 border-[#12B8B0] border-t-transparent animate-spin"
            role="status"
            aria-label="Loading registration form"
          />
        </main>
      }
    >
      {children}
    </Suspense>
  );
}
