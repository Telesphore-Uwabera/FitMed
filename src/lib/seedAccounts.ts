import User from "@/models/User";
import Doctor from "@/models/Doctor";
import { hashPassword } from "@/lib/password";

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

export async function seedFitMedAccounts(): Promise<void> {
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
