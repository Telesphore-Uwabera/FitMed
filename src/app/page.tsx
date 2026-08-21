import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import CertificateCategories from "@/components/CertificateCategories";
import EmployerPortal from "@/components/EmployerPortal";
import DoctorDashboard from "@/components/DoctorDashboard";
import { getPublicStaff } from "@/lib/publicStaff";
import TechFeatures from "@/components/TechFeatures";
import CertificatePreview from "@/components/CertificatePreview";
import Pricing from "@/components/Pricing";
import Testimonials from "@/components/Testimonials";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

/*
 * Section order matches the navbar links exactly:
 *   1. How It Works   → #how-it-works
 *   2. Certificates   → #certificates      (CertificateCategories)
 *   3. For Employers  → #employers         (EmployerPortal)
 *   4. Technology     → #technology        (DoctorDashboard + TechFeatures + CertificatePreview)
 *   5. Pricing        → #pricing
 *
 * DoctorDashboard, TechFeatures, CertificatePreview all sit under
 * the Technology anchor so scrolling to #technology leads naturally
 * through all three.
 */
export default async function Home() {
  const { doctors } = await getPublicStaff().catch(() => ({ doctors: [] }));
  return (
    <main className="min-h-screen w-full overflow-x-hidden">
      <Navbar />
      <Hero />

      {/* How It Works */}
      <HowItWorks />

      {/* Certificates */}
      <CertificateCategories />
      <CertificatePreview />

      {/* For Employers */}
      <EmployerPortal />

      {/* Technology */}
      <DoctorDashboard doctors={doctors} />
      <TechFeatures />

      {/* Pricing */}
      <Pricing />

      {/* Social proof & conversion */}
      <Testimonials />
      <FAQ />
      <Footer />
    </main>
  );
}
