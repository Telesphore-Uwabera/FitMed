import { pageMeta } from "@/lib/seo";
import Link from "next/link";
import PageLayout from "@/components/PageLayout";

export const metadata = pageMeta({
  title: "Cookie Policy",
  description: "How FitMed uses cookies and similar technologies on fitnessmed.rw.",
  path: "/cookies",
});

export default function CookiesPage() {
  return (
    <PageLayout
      title="Cookie Policy"
      lastUpdated="19 August 2026"
    >
      <div className="prose prose-slate max-w-none space-y-10">

        <div className="bg-sky-50 border border-sky-100 rounded-2xl p-7">
          <p className="text-slate-700 leading-relaxed">
            This Cookie Policy explains how FitMed uses cookies and similar tracking technologies
            when you visit our platform. By continuing to use FitMed, you consent to our use of
            cookies as described in this policy.
          </p>
        </div>

        {[
          {
            title: "1. What Are Cookies?",
            body: "Cookies are small text files placed on your device when you visit a website. They allow the website to remember your actions and preferences over time, so you don't have to re-enter information every time you return. Cookies can be 'session cookies' (deleted when you close your browser) or 'persistent cookies' (remain on your device until they expire or are deleted).",
          },
          {
            title: "2. How We Use Cookies",
            items: [
              { heading: "Essential Cookies", text: "Required for the platform to function. These include cookies that manage your login session, maintain your assessment progress, and ensure secure communication. You cannot opt out of essential cookies as they are necessary for the service." },
              { heading: "Functional Cookies", text: "Remember your preferences such as language settings and certificate purpose selections. These improve your experience but are not strictly necessary." },
              { heading: "Analytics Cookies", text: "Help us understand how users interact with FitMed so we can improve the platform. We use anonymised, aggregated data only — no personally identifiable information." },
              { heading: "Security Cookies", text: "Protect against fraudulent activity, detect suspicious behaviour, and maintain platform integrity." },
            ],
          },
          {
            title: "3. Third-Party Cookies",
            body: "We may use trusted third-party services (such as video consultation providers and payment processors) that set their own cookies. These parties have their own privacy and cookie policies. FitMed does not control third-party cookies and recommends reviewing the policies of those providers.",
          },
          {
            title: "4. Managing Cookies",
            body: "You can control and delete cookies through your browser settings. Most browsers allow you to refuse cookies or alert you when cookies are being sent. However, disabling certain cookies may affect the functionality of FitMed — in particular, essential cookies are required for assessments and secure login to work.",
          },
          {
            title: "5. Cookie Retention",
            body: "Session cookies are deleted when you close your browser. Persistent cookies remain for the period specified in the cookie, or until you delete them. Authentication cookies expire after your session or a defined inactivity period. Analytics cookies are typically retained for up to 12 months.",
          },
          {
            title: "6. Changes to This Policy",
            body: "We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated date. Your continued use of FitMed after changes are posted constitutes acceptance of the updated policy.",
          },
          {
            title: "7. Contact",
            body: null,
            contact: true,
          },
        ].map((section) => (
          <section key={section.title} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-7 py-5 bg-sky-50 border-b border-sky-100">
              <h2 className="text-lg font-bold text-slate-900" style={{ fontFamily: "var(--font-primary)" }}>
                {section.title}
              </h2>
            </div>
            <div className="p-7">
              {section.body && <p className="text-sm text-slate-600 leading-relaxed">{section.body}</p>}
              {section.items && (
                <div className="space-y-5">
                  {section.items.map((item) => (
                    <div key={item.heading}>
                      <h3 className="text-sm font-bold text-slate-800 mb-1.5" style={{ fontFamily: "var(--font-primary)" }}>{item.heading}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{item.text}</p>
                    </div>
                  ))}
                </div>
              )}
              {section.contact && (
                <div className="space-y-2 text-sm text-slate-600">
                  <p>For questions about our use of cookies:</p>
                  <div><strong className="text-slate-800">Email:</strong>{" "}<a href="mailto:privacy@fitmed.rw" className="text-sky-600 hover:underline">privacy@fitmed.rw</a></div>
                  <div><strong className="text-slate-800">Address:</strong> Kigali, Rwanda</div>
                </div>
              )}
            </div>
          </section>
        ))}

        <p className="text-center text-xs text-slate-400 flex flex-wrap justify-center gap-3 pt-4">
          <Link href="/" className="hover:text-sky-600 transition-colors">Home</Link>
          <span className="text-slate-300">·</span>
          <Link href="/privacy" className="hover:text-sky-600 transition-colors">Privacy Policy</Link>
          <span className="text-slate-300">·</span>
          <Link href="/cookies" className="text-sky-600 font-medium">Cookie Policy</Link>
          <span className="text-slate-300">·</span>
          <Link href="/terms" className="hover:text-sky-600 transition-colors">Terms of Service</Link>
        </p>
      </div>
    </PageLayout>
  );
}
