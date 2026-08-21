import Certificate from "@/models/Certificate";
import Appointment from "@/models/Appointment";
import Payment from "@/models/Payment";
import Doctor from "@/models/Doctor";
import { FITMED_APP_URL } from "@/lib/brevo";

const DOCTOR_PREFIX = "DOC-RW-";

export function formatDoctorId(n: number) {
  return `${DOCTOR_PREFIX}${padSerial(n, 4)}`;
}

function padSerial(n: number, width = 5) {
  return String(n).padStart(width, "0");
}

export function yearPrefix(kind: "certificate" | "appointment" | "irembo", year = new Date().getFullYear()) {
  if (kind === "certificate") return `FM-${year}-`;
  if (kind === "appointment") return `APT-${year}-`;
  return `IREMBO-RW-${year}-`;
}

export function formatKey(kind: "certificate" | "appointment" | "irembo", n: number, year = new Date().getFullYear()) {
  return `${yearPrefix(kind, year)}${padSerial(n)}`;
}

function serialFromId(id: string, prefix: string) {
  if (!String(id || "").toUpperCase().startsWith(prefix.toUpperCase())) return null;
  const n = Number(String(id).slice(prefix.length));
  if (!Number.isFinite(n) || n < 1) return null;
  return n;
}

async function remumberField(opts: {
  docs: { _id: unknown; oldId: string }[];
  prefix: string;
  update: (id: unknown, nextId: string, oldId: string) => Promise<void>;
}) {
  const { docs, prefix, update } = opts;
  const expected = docs.map((_, i) => `${prefix}${padSerial(i + 1)}`);
  const alreadySequential = docs.every((doc, i) => String(doc.oldId).toUpperCase() === expected[i]);
  if (alreadySequential) return docs.length;

  for (let i = 0; i < docs.length; i++) {
    await update(docs[i]._id, `${prefix}TMP${padSerial(i + 1)}`, docs[i].oldId);
  }
  for (let i = 0; i < docs.length; i++) {
    await update(docs[i]._id, expected[i], docs[i].oldId);
  }
  return docs.length;
}

export async function normalizeCertificateKeys(year = new Date().getFullYear()) {
  const prefix = yearPrefix("certificate", year);
  const docs = await Certificate.find({ certificateId: { $regex: `^FM-${year}-`, $options: "i" } })
    .sort({ appliedDate: 1, createdAt: 1, _id: 1 })
    .select("_id certificateId")
    .lean();

  await remumberField({
    docs: docs.map((d) => ({ _id: d._id, oldId: String(d.certificateId) })),
    prefix,
    update: async (id, nextId, oldId) => {
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=8&data=${encodeURIComponent(
        `${FITMED_APP_URL}/verify/${nextId}`
      )}`;
      await Certificate.updateOne({ _id: id }, { certificateId: nextId, qrCodeUrl });
      if (!String(nextId).includes("TMP")) {
        await Payment.updateMany({ certificateId: oldId }, { $set: { certificateId: nextId } }).catch(() => null);
      }
    },
  });
}

export async function normalizeAppointmentKeys(year = new Date().getFullYear()) {
  const prefix = yearPrefix("appointment", year);
  const docs = await Appointment.find({})
    .sort({ createdAt: 1, _id: 1 })
    .select("_id appointmentId")
    .lean();

  await remumberField({
    docs: docs.map((d) => ({ _id: d._id, oldId: String(d.appointmentId) })),
    prefix,
    update: async (id, nextId) => {
      await Appointment.updateOne({ _id: id }, { appointmentId: nextId, roomId: nextId });
    },
  });
}

export async function nextKey(
  kind: "certificate" | "appointment" | "irembo",
  year = new Date().getFullYear()
) {
  const prefix = yearPrefix(kind, year);
  if (kind === "certificate") {
    await normalizeCertificateKeys(year);
    const docs = await Certificate.find({ certificateId: { $regex: `^${prefix}\\d{5}$` } })
      .select("certificateId")
      .lean();
    let max = 0;
    for (const row of docs) {
      const n = serialFromId(String(row.certificateId), prefix);
      if (n && n > max) max = n;
    }
    return formatKey("certificate", max + 1, year);
  }
  if (kind === "appointment") {
    const docs = await Appointment.find({}).select("appointmentId").lean();
    let max = 0;
    for (const row of docs) {
      const sequential = serialFromId(String(row.appointmentId), prefix);
      if (sequential && sequential > max) max = sequential;
    }
    return formatKey("appointment", max + 1, year);
  }
  const payments = await Payment.find({ iremboRef: { $regex: `^${prefix}` } })
    .select("iremboRef")
    .lean();
  let max = 0;
  for (const row of payments) {
    const n = serialFromId(String(row.iremboRef), prefix);
    if (n && n > max) max = n;
  }
  const certs = await Certificate.find({ iremboRef: { $regex: `^${prefix}` } })
    .select("iremboRef")
    .lean();
  for (const row of certs) {
    const n = serialFromId(String(row.iremboRef), prefix);
    if (n && n > max) max = n;
  }
  return formatKey("irembo", max + 1, year);
}

export async function ensureDoctorIds() {
  const docs = await Doctor.find({}).sort({ createdAt: 1, _id: 1 }).select("_id doctorId").lean();
  const used = new Set(
    docs
      .map((d) => String(d.doctorId || "").toUpperCase())
      .filter((id) => /^DOC-RW-\d{4}$/.test(id))
  );
  let cursor = 1;
  const takeNext = () => {
    while (used.has(formatDoctorId(cursor))) cursor += 1;
    const id = formatDoctorId(cursor);
    used.add(id);
    cursor += 1;
    return id;
  };
  for (const doc of docs) {
    if (/^DOC-RW-\d{4}$/i.test(String(doc.doctorId || ""))) continue;
    await Doctor.updateOne({ _id: doc._id }, { $set: { doctorId: takeNext() } });
  }
}

export async function nextDoctorId() {
  await ensureDoctorIds();
  const docs = await Doctor.find({ doctorId: { $regex: /^DOC-RW-\d{4}$/i } })
    .select("doctorId")
    .lean();
  let max = 0;
  for (const row of docs) {
    const n = Number(String(row.doctorId).slice(DOCTOR_PREFIX.length));
    if (Number.isFinite(n) && n > max) max = n;
  }
  return formatDoctorId(max + 1);
}
