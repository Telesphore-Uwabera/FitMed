import { sendBrevoEmail } from "@/lib/brevo";
import { connectToDatabase } from "@/lib/mongodb";
import Notification from "@/models/Notification";

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
