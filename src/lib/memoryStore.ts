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

const DEMO_CERTIFICATES: StoredCertificate[] = [];

const DEMO_APPOINTMENTS: StoredAppointment[] = [];

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
