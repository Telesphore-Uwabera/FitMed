import { connectToDatabase } from "@/lib/mongodb";
import Doctor, { IDoctor } from "@/models/Doctor";
import User from "@/models/User";
import { sendBrevoEmail, EmailTemplates, FITMED_ADMIN_EMAIL } from "@/lib/brevo";

/**
 * Checks for verified doctors whose RMDC license is expiring within 30 days (or expired)
 * and sends an alert email to the platform administrator(s).
 */
export async function checkAndNotifyExpiringLicenses(): Promise<{ checked: number; sent: number }> {
  try {
    await connectToDatabase();

    const now = new Date();
    // 30 days in the future
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    // Don't resend notice more than once every 14 days
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const expiringDoctors = await Doctor.find({
      licenseExpiryDate: { $exists: true, $ne: null, $lte: thirtyDaysFromNow },
      isVerified: true,
      $or: [
        { licenseExpiryNoticeSentAt: { $exists: false } },
        { licenseExpiryNoticeSentAt: null },
        { licenseExpiryNoticeSentAt: { $lte: fourteenDaysAgo } },
      ],
    });

    if (!expiringDoctors || expiringDoctors.length === 0) {
      return { checked: 0, sent: 0 };
    }

    // Get admin accounts
    const admins = await User.find({
      role: "admin",
      status: { $in: ["Active", "active"] },
    })
      .select("fullName name email")
      .lean();

    const adminRecipients: { name: string; email: string }[] = [];
    if (admins && admins.length > 0) {
      for (const a of admins) {
        if (a.email) {
          adminRecipients.push({
            name: a.fullName || a.name || "Administrator",
            email: a.email,
          });
        }
      }
    }

    if (adminRecipients.length === 0 && FITMED_ADMIN_EMAIL) {
      adminRecipients.push({
        name: "Administrator",
        email: FITMED_ADMIN_EMAIL,
      });
    }

    if (adminRecipients.length === 0) {
      console.warn("[licenseExpiry] No administrator email found to receive license alerts.");
      return { checked: expiringDoctors.length, sent: 0 };
    }

    let sentCount = 0;

    for (const doc of expiringDoctors) {
      if (!doc.licenseExpiryDate) continue;

      const expiryDate = new Date(doc.licenseExpiryDate);
      const diffMs = expiryDate.getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const expiryFormatted = expiryDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const subject =
        daysRemaining <= 0
          ? `⚠️ URGENT: Dr. ${doc.fullName}'s License has EXPIRED`
          : `⚠️ NOTICE: Dr. ${doc.fullName}'s RMDC License expires in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}`;

      let anySent = false;
      for (const admin of adminRecipients) {
        try {
          const res = await sendBrevoEmail({
            toEmail: admin.email,
            toName: admin.name,
            subject,
            htmlContent: EmailTemplates.doctorLicenseExpiringAlert(
              admin.name,
              doc.fullName,
              doc.licenseNumber,
              expiryFormatted,
              daysRemaining,
              doc.email,
              doc.phone
            ),
          });
          if (res.success) anySent = true;
        } catch (err) {
          console.error(`[licenseExpiry] Failed sending alert to ${admin.email}:`, err);
        }
      }

      if (anySent) {
        doc.licenseExpiryNoticeSentAt = now;
        await doc.save();
        sentCount++;
      }
    }

    return { checked: expiringDoctors.length, sent: sentCount };
  } catch (error) {
    console.error("[licenseExpiry] Error checking expiring licenses:", error);
    return { checked: 0, sent: 0 };
  }
}
