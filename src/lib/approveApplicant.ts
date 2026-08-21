import User from "@/models/User";
import { sendBrevoEmail, EmailTemplates, FITMED_APP_URL } from "@/lib/brevo";
import { normalizeRole } from "@/lib/roles";

export async function sendApplicantApprovalEmail(opts: {
  email: string;
  name: string;
}) {
  const loginLink = `${FITMED_APP_URL}/signin`;
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
  const mail = await sendApplicantApprovalEmail({
    email: user.email,
    name,
  });
  if (!mail.success) {
    return {
      success: false as const,
      status: 502,
      error: "The approval email could not be sent, so the password was not changed. Check Brevo and try again.",
    };
  }

  const status = String(user.status || "").toLowerCase();
  if (status === "pending" || status === "pending_approval") {
    user.status = "Active";
  }
  user.requiresPasswordReset = false;
  user.temporaryPassword = undefined;
  await user.save();

  return {
    success: true as const,
    emailSent: true,
    message: `Approval email sent to ${user.email}. They can sign in with the password they created at registration.`,
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
  const emailResult = await sendApplicantApprovalEmail({
    email: user.email,
    name,
  });
  if (!emailResult.success) {
    return {
      success: false as const,
      status: 502,
      error: "The approval email could not be sent. The account was not approved. Check Brevo and try again.",
    };
  }

  user.status = "Active";
  user.requiresPasswordReset = false;
  user.temporaryPassword = undefined;
  await user.save();

  return {
    success: true as const,
    usedOwnPassword: true,
    emailSent: true,
    message: `Account approved. An email was sent to ${user.email}. ${name} can sign in with the password they created at registration.`,
  };
}

function escapeEmailText(value: string) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\n/g, "<br/>");
}

export async function rejectApplicantAccount(email: string, reason: string, nameHint = "") {
  const user = await User.findOne({ email: String(email || "").trim().toLowerCase() });
  if (!user) {
    return { success: false as const, status: 404, error: "This applicant is not registered." };
  }
  if (normalizeRole(user.role) !== "user") {
    return { success: false as const, status: 400, error: "Only applicant accounts can be rejected here." };
  }
  const status = String(user.status || "").toLowerCase();
  if (status !== "pending" && status !== "pending_approval") {
    return { success: false as const, status: 400, error: "Only pending registrations can be rejected." };
  }
  const cleanReason = String(reason || "").trim();
  if (cleanReason.length < 8) {
    return { success: false as const, status: 400, error: "Add a rejection reason of at least 8 characters. It is included in the email." };
  }

  const name = user.fullName || user.name || nameHint || "Applicant";
  const emailResult = await sendBrevoEmail({
    toEmail: user.email,
    toName: name,
    subject: "Your FitMed registration was not approved",
    htmlContent: EmailTemplates.applicantAccountRejected(name, escapeEmailText(cleanReason)),
  });
  if (!emailResult.success) {
    return {
      success: false as const,
      status: 502,
      error: "The rejection email could not be sent. The account was not rejected. Check Brevo and try again.",
    };
  }

  user.status = "rejected";
  user.rejectionReason = cleanReason;
  await user.save();

  return {
    success: true as const,
    emailSent: true,
    message: `Registration rejected. The reason was emailed to ${user.email}.`,
  };
}
