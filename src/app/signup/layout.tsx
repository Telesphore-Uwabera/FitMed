import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Create Account",
  description: "Create a FitMed account to request a medical fitness certificate from a licensed doctor in Rwanda.",
  path: "/signup",
});

export default function SignUpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
