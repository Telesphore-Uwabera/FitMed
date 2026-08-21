export const FITMED_SERVICES = [
  {
    id: "workplace",
    title: "Workplace & Office Fitness",
    desc: "Pre-employment screening, annual corporate health checks, and sedentary desk fitness.",
    tag: "Most Popular",
    time: "Under 15 mins",
  },
  {
    id: "school",
    title: "School & University Admission",
    desc: "Academic clearance, boarding school admissions, and physical education fitness clearance.",
    tag: "Student Fast-Track",
    time: "Under 10 mins",
  },
  {
    id: "sports",
    title: "Sports, Gym & Athletic Fitness",
    desc: "Cardiovascular endurance screening, marathon clearance, and gym club memberships.",
    tag: "Athletic Ready",
    time: "Under 15 mins",
  },
  {
    id: "transport",
    title: "Commercial Driver & Transport",
    desc: "Vision, reflex, and blood pressure screening for taxi, bus, and fleet operators.",
    tag: "Regulatory Approved",
    time: "Under 20 mins",
  },
  {
    id: "food",
    title: "Food Handler & Hygiene Clearance",
    desc: "Gastrointestinal screening, infectious symptom check, and commercial hygiene compliance.",
    tag: "Hygienic Verified",
    time: "Under 15 mins",
  },
  {
    id: "travel",
    title: "Visa & International Travel Medical",
    desc: "Embassy and immigration health assessments, travel clearance, and vaccine status checks.",
    tag: "Global Format",
    time: "Under 15 mins",
  },
  {
    id: "construction",
    title: "Construction & Heights Fitness",
    desc: "Balance, vertigo, and occupational physical readiness for manual and high-risk work.",
    tag: "High Risk Review",
    time: "Physician & Clinic",
  },
] as const;

export const FITMED_SERVICE_TITLES = FITMED_SERVICES.map((service) => service.title);

export const DEFAULT_FITMED_PURPOSE = FITMED_SERVICE_TITLES[0];
