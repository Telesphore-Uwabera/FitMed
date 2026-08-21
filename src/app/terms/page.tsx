import { pageMeta } from "@/lib/seo";
import Link from "next/link";
import PageLayout from "@/components/PageLayout";

export const metadata = pageMeta({
  title: "Terms of Service",
  description: "Terms governing use of the FitMed medical fitness certification platform.",
  path: "/terms",
});

const sections = [
  {
    title: "1. Acceptance of Terms",
    body: "By accessing or using the FitMed platform, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree, you may not use FitMed. FitMed is operated by FitMed and is subject to Rwandan law.",
  },
  {
    title: "2. Description of Service",
    body: "FitMed provides a digital medical fitness certification platform that connects applicants with licensed doctors for remote health assessments. FitMed does not provide medical treatment, emergency services, or specialist care. The platform facilitates fitness assessments for specific purposes only.",
  },
  {
    title: "3. Medical Disclaimer",
    body: "FitMed certificates are fitness assessments for stated purposes — they are not diagnoses, treatment plans, or medical opinions. The final medical fitness decision is made by a licensed doctor. FitMed does not replace in-person medical care. If you have a medical emergency, contact emergency services immediately.",
  },
  {
    title: "4. User Accounts",
    items: [
      { heading: "Eligibility", text: "You must be at least 18 years old to create an account. By registering, you confirm that the information you provide is accurate and complete." },
      { heading: "Account Security", text: "You are responsible for maintaining the security of your account credentials. Notify us immediately if you suspect unauthorised access at security@fitmed.rw." },
      { heading: "Accurate Information", text: "Providing false or misleading health information in order to obtain a medical fitness certificate may constitute fraud and is strictly prohibited." },
    ],
  },
  {
    title: "5. Payments and Refunds",
    body: "Assessments are charged at the rates displayed at the time of booking. Payment is required before the assessment begins. Refunds are available if the assessment cannot be completed for reasons within FitMed's control. Refunds are not available for completed assessments, regardless of the outcome.",
  },
  {
    title: "6. Certificates",
    body: "Digitally signed medical fitness certificates are issued by licensed doctors and are the professional opinion of that doctor. FitMed is not liable for decisions made by employers, institutions, or other parties based on certificate content. Certificates are valid for 6 months from the issue date, and only for the purpose stated.",
  },
  {
    title: "7. Prohibited Use",
    items: [
      { heading: "Misrepresentation", text: "You may not provide false identity or health information to obtain a certificate." },
      { heading: "Unauthorised Access", text: "You may not attempt to access data, accounts, or systems you are not authorised to access." },
      { heading: "Certificate Fraud", text: "You may not alter, forge, or misrepresent any certificate issued by FitMed." },
      { heading: "Abuse", text: "You may not harass, threaten, or abuse doctors, staff, or other users of the platform." },
    ],
  },
  {
    title: "8. Intellectual Property",
    body: "All content, design, software, and materials on FitMed are the property of FitMed or its licensors and are protected by applicable copyright and intellectual property laws. You may not copy, reproduce, or distribute any content without written permission.",
  },
  {
    title: "9. Limitation of Liability",
    body: "To the maximum extent permitted by Rwandan law, FitMed is not liable for indirect, incidental, or consequential damages arising from your use of the platform. Our total liability for any claim shall not exceed the amount you paid for the assessment in question.",
  },
  {
    title: "10. Governing Law",
    body: "These Terms are governed by the laws of Rwanda. Any disputes shall be subject to the exclusive jurisdiction of the courts of Kigali, Rwanda.",
  },
  {
    title: "11. Changes to Terms",
    body: "FitMed reserves the right to update these Terms at any time. Changes will be posted with an updated date. Your continued use of the platform after changes constitutes acceptance.",
  },
  {
    title: "12. Contact",
    contact: true,
  },
];

export default function TermsPage() {
  return (
    <PageLayout title="Terms of Service" lastUpdated="19 August 2026">
      <div className="space-y-8">
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-7">
          <p className="text-slate-700 leading-relaxed text-sm">
            Please read these Terms of Service carefully before using FitMed. These terms govern your use of the platform and form a legally binding agreement between you and FitMed.
          </p>
        </div>

        {sections.map((s) => (
          <section key={s.title} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-7 py-5 bg-amber-50 border-b border-amber-100">
              <h2 className="text-lg font-bold text-slate-900" style={{ fontFamily: "var(--font-primary)" }}>{s.title}</h2>
            </div>
            <div className="p-7">
              {s.body && <p className="text-sm text-slate-600 leading-relaxed">{s.body}</p>}
              {s.items && (
                <div className="space-y-4">
                  {s.items.map((item) => (
                    <div key={item.heading}>
                      <h3 className="text-sm font-bold text-slate-800 mb-1" style={{ fontFamily: "var(--font-primary)" }}>{item.heading}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{item.text}</p>
                    </div>
                  ))}
                </div>
              )}
              {s.contact && (
                <div className="space-y-2 text-sm text-slate-600">
                  <p>For questions about these Terms:</p>
                  <div><strong className="text-slate-800">Email:</strong>{" "}<a href="mailto:legal@fitmed.rw" className="text-sky-600 hover:underline">legal@fitmed.rw</a></div>
                  <div><strong className="text-slate-800">Address:</strong> Kigali, Rwanda</div>
                </div>
              )}
            </div>
          </section>
        ))}

        <p className="text-center text-xs text-slate-400 flex flex-wrap justify-center gap-3 pt-4">
          <Link href="/" className="hover:text-sky-600 transition-colors">Home</Link>
          <span>·</span>
          <Link href="/privacy" className="hover:text-sky-600 transition-colors">Privacy Policy</Link>
          <span>·</span>
          <Link href="/terms" className="text-sky-600 font-medium">Terms of Service</Link>
          <span>·</span>
          <Link href="/cookies" className="hover:text-sky-600 transition-colors">Cookie Policy</Link>
        </p>
      </div>
    </PageLayout>
  );
}
