import { sendBrevoEmail, FITMED_ADMIN_EMAIL, FITMED_APP_URL } from "@/lib/brevo";
import { connectToDatabase } from "@/lib/mongodb";
import Notification from "@/models/Notification";
import User from "@/models/User";
import { isAdminRole } from "@/lib/roles";

export async function notifyPerson(opts: {
  toEmail?: string;
  toName?: string;
  role?: string;
  subject: string;
  htmlContent: string;
  snippet?: string;
  href?: string;
}) {
  const email = String(opts.toEmail || "").trim().toLowerCase();
  if (!email || !email.includes("@")) return { success: false, error: "missing-email" };

  const [mail] = await Promise.all([
    sendBrevoEmail({
      toEmail: email,
      toName: opts.toName || email.split("@")[0],
      subject: opts.subject,
      htmlContent: opts.htmlContent,
    }),
    connectToDatabase()
      .then(() =>
        Notification.create({
          email,
          role: opts.role || "",
          subject: opts.subject,
          snippet: opts.snippet || opts.subject,
          href: opts.href || "",
          unread: true,
        })
      )
      .catch((err) => {
        console.warn("In-app notification save failed:", err);
        return null;
      }),
  ]);

  return mail;
}

export async function notifyFitMedAdmins(opts: {
  subject: string;
  htmlContent: string;
  snippet?: string;
}) {
  await connectToDatabase();
  const admins = await User.find({}).select("email fullName name role").lean();
  const recipients = new Map<string, string>();
  recipients.set(FITMED_ADMIN_EMAIL, "FitMed Admin");
  for (const admin of admins) {
    if (!isAdminRole(admin.role)) continue;
    const email = String(admin.email || "").trim().toLowerCase();
    if (!email.includes("@")) continue;
    recipients.set(email, String(admin.fullName || admin.name || "FitMed Admin"));
  }

  const href = `${FITMED_APP_URL}/dashboard/admin?nav=users`;
  const results = await Promise.all(
    [...recipients.entries()].map(([email, name]) =>
      notifyPerson({
        toEmail: email,
        toName: name,
        role: "admin",
        subject: opts.subject,
        htmlContent: opts.htmlContent,
        snippet: opts.snippet || opts.subject,
        href,
      })
    )
  );
  const failed = results.filter((result) => !result.success);
  if (failed.length) {
    console.warn(
      "Admin notification email failed for some inboxes:",
      failed.map((item) => item.error).join("; ")
    );
  }
  return { success: failed.length < results.length, sent: results.length - failed.length };
}
