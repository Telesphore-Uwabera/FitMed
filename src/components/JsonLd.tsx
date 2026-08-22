import { SITE_NAME, SITE_URL, DEFAULT_DESCRIPTION, absoluteUrl } from "@/lib/seo";

export default function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: absoluteUrl("/logo-4.webp"),
        email: "support@fitnessmed.rw",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Kigali",
          addressCountry: "RW",
        },
        areaServed: "RW",
      },
      {
        "@type": "MedicalBusiness",
        "@id": `${SITE_URL}/#business`,
        name: SITE_NAME,
        url: SITE_URL,
        description: DEFAULT_DESCRIPTION,
        telephone: "+250 782 168 650",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Kigali",
          addressCountry: "RW",
        },
        priceRange: "5000 FRW",
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: SITE_NAME,
        url: SITE_URL,
        publisher: { "@id": `${SITE_URL}/#organization` },
        inLanguage: "en",
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
