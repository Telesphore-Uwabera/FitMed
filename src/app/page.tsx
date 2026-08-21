import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import { getPublicStaff } from "@/lib/publicStaff";
import { pageMeta } from "@/lib/seo";
import dynamic from "next/dynamic";

const HowItWorks = dynamic(() => import("@/components/HowItWorks"));
const CertificateCategories = dynamic(() => import("@/components/CertificateCategories"));
const CertificatePreview = dynamic(() => import("@/components/CertificatePreview"));
const EmployerPortal = dynamic(() => import("@/components/EmployerPortal"));
const DoctorDashboard = dynamic(() => import("@/components/DoctorDashboard"));
const TechFeatures = dynamic(() => import("@/components/TechFeatures"));
const Pricing = dynamic(() => import("@/components/Pricing"));
const Testimonials = dynamic(() => import("@/components/Testimonials"));
const FAQ = dynamic(() => import("@/components/FAQ"));

export const metadata = pageMeta({
  title: "Medical Fitness Certificate Online",
  description:
    "Request a medical fitness certificate online in Rwanda. A licensed doctor assesses you by video and issues a digitally signed, QR-verifiable certificate.",
  path: "/",
});

export default async function Home() {
  const { doctors } = await getPublicStaff().catch(() => ({ doctors: [] }));
  return (
    <main className="min-h-screen w-full overflow-x-hidden">
      <Navbar />
      <Hero />
      <HowItWorks />
      <CertificateCategories />
      <CertificatePreview />
      <EmployerPortal />
      <DoctorDashboard doctors={doctors} />
      <TechFeatures />
      <Pricing />
      <Testimonials />
      <FAQ />
      <Footer />
    </main>
  );
}
