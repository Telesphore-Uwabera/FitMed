import { hashPassword } from "@/lib/password";
import User from "@/models/User";
import { sendBrevoEmail, EmailTemplates, FITMED_APP_URL } from "@/lib/brevo";
import { normalizeRole } from "@/lib/roles";

export async function approveApplicantAccount(email: string, nameHint = "") {
  const user = await User.findOne({ email: String(email || "").trim().toLowerCase() });
  if (!user) {
    return { success: false as const, status: 404, error: "This applicant is not registered." };
  }
  if (normalizeRole(user.role) !== "user") {
    return { success: false as const, status: 400, error: "Only applicant accounts can be approved here." };
  }

  const name = user.fullName || user.name || nameHint || "Applicant";
  const hasOwnPassword = Boolean(user.password);
  let tempPassword = "";

  user.status = "Active";
  if (hasOwnPassword) {
    user.requiresPasswordReset = false;
  } else {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    tempPassword = `FitMed#${randomDigits}`;
    user.password = hashPassword(tempPassword);
    user.temporaryPassword = tempPassword;
    user.requiresPasswordReset = true;
  }
  await user.save();

  const emailResult = hasOwnPassword
    ? await sendBrevoEmail({
        toEmail: user.email,
        toName: name,
        subject: "Your FitMed account is approved",
        htmlContent: EmailTemplates.applicantAccountApprovedOwnPassword(name, `${FITMED_APP_URL}/signin`),
      })
    : await sendBrevoEmail({
        toEmail: user.email,
        toName: name,
        subject: "Your FitMed account is approved — sign-in details inside",
        htmlContent: EmailTemplates.applicantAccountApprovedWithTempPassword(
          name,
          user.email,
          tempPassword,
          `${FITMED_APP_URL}/signin`
        ),
      });

  return {
    success: true as const,
    usedOwnPassword: hasOwnPassword,
    emailSent: emailResult.success,
    message: hasOwnPassword
      ? `Account approved. ${name} can sign in with the password they created at registration.`
      : `Account approved and a first-time sign-in password was emailed to ${user.email}.`,
  };
}
