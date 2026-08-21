import { hashPassword, generateTempPassword } from "@/lib/password";
import User from "@/models/User";
import { sendBrevoEmail, EmailTemplates, FITMED_APP_URL } from "@/lib/brevo";
import { normalizeRole } from "@/lib/roles";

export async function sendApplicantApprovalEmail(opts: {
  email: string;
  name: string;
  tempPassword?: string;
}) {
  const loginLink = `${FITMED_APP_URL}/signin`;
  if (opts.tempPassword) {
    return sendBrevoEmail({
      toEmail: opts.email,
      toName: opts.name,
      subject: "Your FitMed account is approved — sign-in details inside",
      htmlContent: EmailTemplates.applicantAccountApprovedWithTempPassword(
        opts.name,
        opts.email,
        opts.tempPassword,
        loginLink
      ),
    });
  }
  return sendBrevoEmail({
    toEmail: opts.email,
    toName: opts.name,
    subject: "Your FitMed account is approved",
    htmlContent: EmailTemplates.applicantAccountApprovedOwnPassword(opts.name, loginLink),
  });
}

export async function resetApplicantPasswordWithApprovalEmail(user: {
  email: string;
  fullName?: string;
  name?: string;
  status?: string;
  password?: string;
  temporaryPassword?: string;
  requiresPasswordReset?: boolean;
  save: () => Promise<unknown>;
}) {
  const name = user.fullName || user.name || "Applicant";
  const oneTimePassword = generateTempPassword();
  const mail = await sendApplicantApprovalEmail({
    email: user.email,
    name,
    tempPassword: oneTimePassword,
  });
  if (!mail.success) {
    return {
      success: false as const,
      status: 502,
      error: "The approval email could not be sent, so the password was not changed. Check Brevo and try again.",
    };
  }

  user.password = hashPassword(oneTimePassword);
  user.temporaryPassword = oneTimePassword;
  user.requiresPasswordReset = true;
  const status = String(user.status || "").toLowerCase();
  if (status === "pending" || status === "pending_approval") {
    user.status = "Active";
  }
  await user.save();

  return {
    success: true as const,
    emailSent: true,
    message: `Password reset. The approval email with sign-in details was sent to ${user.email}.`,
  };
}

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

  if (!hasOwnPassword) {
    tempPassword = generateTempPassword();
  }

  const emailResult = await sendApplicantApprovalEmail({
    email: user.email,
    name,
    tempPassword: hasOwnPassword ? undefined : tempPassword,
  });
  if (!emailResult.success) {
    return {
      success: false as const,
      status: 502,
      error: "The approval email could not be sent. The account was not approved. Check Brevo and try again.",
    };
  }

  user.status = "Active";
  if (hasOwnPassword) {
    user.requiresPasswordReset = false;
  } else {
    user.password = hashPassword(tempPassword);
    user.temporaryPassword = tempPassword;
    user.requiresPasswordReset = true;
  }
  await user.save();

  return {
    success: true as const,
    usedOwnPassword: hasOwnPassword,
    emailSent: true,
    message: hasOwnPassword
      ? `Account approved. ${name} can sign in with the password they created at registration.`
      : `Account approved and a first-time sign-in password was emailed to ${user.email}.`,
  };
}
