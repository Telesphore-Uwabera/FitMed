import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Sign In",
  description: "Sign in to your FitMed account to request a medical fitness certificate, join a video consult, or manage issued certificates.",
  path: "/signin",
});

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return children;
}
