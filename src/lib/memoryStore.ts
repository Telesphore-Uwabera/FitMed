/**
 * Process-local fallback when MongoDB is unreachable.
 * Survives Next.js hot reload via globalThis.
 */

export type StoredCertificate = Record<string, unknown> & {
  certificateId: string;
  applicantEmail?: string;
  assignedDoctorId?: string;
  status?: string;
  candidateName?: string;
};

export type StoredAppointment = Record<string, unknown> & {
  appointmentId: string;
  doctorId?: string;
  applicantEmail?: string;
  status?: string;
};

export type StoredMessage = Record<string, unknown> & {
  consultationId?: string;
  messageText: string;
  senderName: string;
};

type MemoryStore = {
  certificates: StoredCertificate[];
  appointments: StoredAppointment[];
  messages: StoredMessage[];
};

const DEMO_CERTIFICATES: StoredCertificate[] = [
  {
    certificateId: "FM-2026-55310",
    applicantEmail: "patrick.mugabo@example.com",
    applicantPhone: "+250 788 111 222",
    candidateName: "Patrick Mugabo",
    candidateIdNumber: "1199580048123049",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80&auto=format&fit=crop",
    nationalIdImageUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80&auto=format&fit=crop",
    age: 28,
    gender: "Male",
    purpose: "Workplace & Office Fitness",
    jobType: "Office Work",
    category: "Office Work",
    decision: "PENDING",
    vitals: { bloodPressure: "120/80", heartRate: "72", bmi: "23.2", spo2: "98%", temperature: "36.6", pulse: "72" },
    redFlags: {},
    additionalNotes: "No significant medical history reported.",
    status: "submitted",
    paymentStatus: "UNPAID",
    assignedDoctor: "Dr. Telesphore Uwabera (You)",
    assignedDoctorId: "DOC-RW-4091",
    riskLevel: "Low Risk",
    riskColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
    appliedDate: "Today, 10:30 AM",
  },
  {
    certificateId: "FM-2026-66419",
    applicantEmail: "claire.mukamwiza@example.com",
    candidateName: "Claire Mukamwiza",
    candidateIdNumber: "1199880056789012",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80&auto=format&fit=crop",
    nationalIdImageUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80&auto=format&fit=crop",
    age: 34,
    gender: "Female",
    purpose: "Transport & Commercial Driver",
    jobType: "Commercial Driving",
    decision: "PENDING",
    vitals: { bloodPressure: "135/85", heartRate: "78", bmi: "26.5", spo2: "97%", pulse: "78" },
    status: "submitted",
    paymentStatus: "UNPAID",
    assignedDoctor: "Dr. Telesphore Uwabera (You)",
    assignedDoctorId: "DOC-RW-4091",
    riskLevel: "Moderate Risk",
    riskColor: "bg-amber-100 text-amber-800 border-amber-300",
    additionalNotes: "Reports mild hypertension, currently on medication.",
    appliedDate: "Today, 09:15 AM",
  },
  {
    certificateId: "FM-2026-77301",
    applicantEmail: "jp.habimana@gmail.com",
    candidateName: "Jean Paul Habimana",
    candidateIdNumber: "1199770067890123",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80&auto=format&fit=crop",
    nationalIdImageUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80&auto=format&fit=crop",
    age: 42,
    gender: "Male",
    purpose: "Construction & Heights Fitness",
    jobType: "Construction Work",
    decision: "PENDING",
    vitals: { bloodPressure: "145/92", heartRate: "85", bmi: "28.7", spo2: "96%", pulse: "85" },
    status: "submitted",
    paymentStatus: "UNPAID",
    assignedDoctor: "Dr. Telesphore Uwabera (You)",
    assignedDoctorId: "DOC-RW-4091",
    riskLevel: "High Risk",
    riskColor: "bg-rose-100 text-rose-800 border-rose-300",
    additionalNotes: "History of vertigo and balance issues. Reports occasional dizziness.",
    appliedDate: "Yesterday, 4:45 PM",
  },
];

const DEMO_APPOINTMENTS: StoredAppointment[] = [
  {
    appointmentId: "APT-2026-891",
    applicantName: "Telesphore Uwabera",
    applicantEmail: "telesphore91073@gmail.com",
    doctorId: "DOC-RW-4091",
    doctorName: "Dr. Telesphore Uwabera, MD",
    purpose: "Workplace & Office Fitness Certification",
    scheduledDate: "Today",
    scheduledTime: "14:30",
    durationMinutes: 15,
    status: "scheduled",
    roomUrl: "/dashboard/user?tab=consultation",
    notes: "Routine medical clearance and identity verification.",
  },
  {
    appointmentId: "APT-2026-904",
    applicantName: "Jean-Paul Habimana",
    applicantEmail: "jp.habimana@gmail.com",
    doctorId: "DOC-RW-4091",
    doctorName: "Dr. Telesphore Uwabera, MD",
    purpose: "Commercial Driver & Transport License",
    scheduledDate: "Tomorrow",
    scheduledTime: "10:00",
    durationMinutes: 20,
    status: "scheduled",
    roomUrl: "/dashboard/doctor?nav=telehealth",
    notes: "Vision and reflex check review.",
  },
];

function getStore(): MemoryStore {
  const globalRef = globalThis as typeof globalThis & { __fitmedMemoryStore?: MemoryStore };
  if (!globalRef.__fitmedMemoryStore) {
    globalRef.__fitmedMemoryStore = {
      certificates: [...DEMO_CERTIFICATES],
      appointments: [...DEMO_APPOINTMENTS],
      messages: [],
    };
  }
  return globalRef.__fitmedMemoryStore;
}

export function listCertificates(filters?: {
  status?: string | null;
  applicantEmail?: string | null;
  assignedDoctorId?: string | null;
}): StoredCertificate[] {
  return getStore().certificates.filter((cert) => {
    if (filters?.status && cert.status !== filters.status) return false;
    if (filters?.applicantEmail && cert.applicantEmail !== filters.applicantEmail) return false;
    if (filters?.assignedDoctorId && cert.assignedDoctorId !== filters.assignedDoctorId) return false;
    return true;
  });
}

export function saveCertificate(cert: StoredCertificate): StoredCertificate {
  const store = getStore();
  store.certificates = [cert, ...store.certificates.filter((c) => c.certificateId !== cert.certificateId)];
  return cert;
}

export function patchCertificate(certificateId: string, update: Record<string, unknown>): StoredCertificate | null {
  const store = getStore();
  const index = store.certificates.findIndex((c) => c.certificateId === certificateId);
  if (index === -1) {
    const created = { certificateId, ...update } as StoredCertificate;
    store.certificates.unshift(created);
    return created;
  }
  store.certificates[index] = { ...store.certificates[index], ...update };
  return store.certificates[index];
}

export function listAppointments(filters?: {
  doctorId?: string | null;
  applicantEmail?: string | null;
  status?: string | null;
}): StoredAppointment[] {
  return getStore().appointments.filter((apt) => {
    if (filters?.doctorId && apt.doctorId !== filters.doctorId) return false;
    if (filters?.applicantEmail && apt.applicantEmail !== filters.applicantEmail) return false;
    if (filters?.status && apt.status !== filters.status) return false;
    return true;
  });
}

export function saveAppointment(apt: StoredAppointment): StoredAppointment {
  const store = getStore();
  store.appointments = [apt, ...store.appointments.filter((a) => a.appointmentId !== apt.appointmentId)];
  return apt;
}

export function patchAppointment(appointmentId: string, update: Record<string, unknown>): StoredAppointment | null {
  const store = getStore();
  const index = store.appointments.findIndex((a) => a.appointmentId === appointmentId);
  if (index === -1) return null;
  store.appointments[index] = { ...store.appointments[index], ...update };
  return store.appointments[index];
}

export function listMessages(consultationId: string): StoredMessage[] {
  return getStore().messages.filter((m) => (m.consultationId || "ROOM-FM-9941") === consultationId);
}

export function saveMessage(message: StoredMessage): StoredMessage {
  const store = getStore();
  store.messages.push(message);
  return message;
}
