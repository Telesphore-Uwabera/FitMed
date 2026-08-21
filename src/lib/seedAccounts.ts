import User from "@/models/User";
import Doctor from "@/models/Doctor";
import Certificate from "@/models/Certificate";
import Appointment from "@/models/Appointment";
import Message from "@/models/Message";
import ContactMessage from "@/models/ContactMessage";
import Clinic from "@/models/Clinic";
import Schedule from "@/models/Schedule";
import Referral from "@/models/Referral";
import NewsletterSubscriber from "@/models/NewsletterSubscriber";
import Payment from "@/models/Payment";
import PlatformSettings from "@/models/PlatformSettings";
import AuditLog from "@/models/AuditLog";
import { connectToDatabase } from "@/lib/mongodb";
import { hashPassword } from "@/lib/password";

export const FITMED_COLLECTIONS = [
  "users",
  "doctors",
  "certificates",
  "appointments",
  "messages",
  "contactmessages",
  "clinics",
  "schedules",
  "referrals",
  "newslettersubscribers",
  "payments",
  "platformsettings",
  "auditlogs",
] as const;

const SEED_PASSWORD = "91073@Tecy";

const SEED_USERS = [
  {
    fullName: "FitMed Admin",
    name: "FitMed Admin",
    email: "info.teletech.rw@gmail.com",
    role: "admin" as const,
    status: "active" as const,
  },
  {
    fullName: "Dr. Telesphore Uwabera",
    name: "Dr. Telesphore Uwabera",
    email: "uwaberatelesphore@gmail.com",
    role: "doctor" as const,
    status: "active" as const,
  },
  {
    fullName: "Telesphore",
    name: "Telesphore",
    email: "telesphore91073@gmail.com",
    role: "user" as const,
    status: "active" as const,
  },
];

declare global {
  // eslint-disable-next-line no-var
  var fitmedAccountsSeeded: boolean | undefined;
}

export async function ensureFitMedCollections(): Promise<string[]> {
  const mongoose = await connectToDatabase();
  const db = mongoose.connection.db;
  if (!db) throw new Error("MongoDB database handle is not ready.");

  // Register models so indexes/collections match the app.
  void User;
  void Doctor;
  void Certificate;
  void Appointment;
  void Message;
  void ContactMessage;
  void Clinic;
  void Schedule;
  void Referral;
  void NewsletterSubscriber;
  void Payment;
  void PlatformSettings;
  void AuditLog;

  const existing = new Set((await db.listCollections().toArray()).map((c) => c.name));
  const created: string[] = [];
  for (const name of FITMED_COLLECTIONS) {
    if (!existing.has(name)) {
      await db.createCollection(name);
      created.push(name);
    }
  }
  return created;
}

export async function seedFitMedAccounts(): Promise<void> {
  await ensureFitMedCollections();
  if ((await Clinic.countDocuments()) === 0) {
    await Clinic.insertMany([
      {
        name: "King Faisal Hospital, Kigali",
        city: "Kigali",
        status: "Active Partner",
        capacity: "High",
        phone: "+250 788 123 000",
        type: "Referral hospital",
      },
      {
        name: "CHUK (University Teaching Hospital)",
        city: "Kigali",
        status: "Active Partner",
        capacity: "High",
        phone: "+250 788 123 001",
        type: "Public teaching hospital",
      },
      {
        name: "Rwanda Military Hospital",
        city: "Kigali",
        status: "Active Partner",
        capacity: "Medium",
        phone: "+250 788 123 002",
        type: "Occupational health clinic",
      },
    ]);
  }
  if (global.fitmedAccountsSeeded) return;

  const passwordHash = hashPassword(SEED_PASSWORD);

  for (const account of SEED_USERS) {
    const existing = await User.findOne({ email: account.email });
    if (!existing) {
      await User.create({
        ...account,
        password: passwordHash,
        requiresPasswordReset: false,
      });
    } else if (!existing.password) {
      existing.password = passwordHash;
      existing.role = account.role;
      existing.status = "active";
      existing.fullName = existing.fullName || account.fullName;
      existing.name = existing.name || account.name;
      await existing.save();
    }
  }

  const doctorEmail = "uwaberatelesphore@gmail.com";
  const doctorUser = await User.findOne({ email: doctorEmail });
  const doctorExists = await Doctor.findOne({ email: doctorEmail });
  if (!doctorExists && doctorUser) {
    await Doctor.create({
      user: doctorUser._id,
      fullName: "Dr. Telesphore Uwabera, MD",
      email: doctorEmail,
      licenseNumber: "RW-RMDC-4091",
      specialty: "Occupational Medicine & Telehealth",
      isVerified: true,
      status: "ONLINE",
    });
  }

  global.fitmedAccountsSeeded = true;
}
