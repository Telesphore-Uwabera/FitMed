import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Contact Us",
  description:
    "Contact FitMed in Kigali for certificate help, doctor support, employer accounts, and technical questions. We typically respond within two hours.",
  path: "/contact",
});

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
