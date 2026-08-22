/**
 * Brevo transactional email — FitMed branded layout and clinical notifications.
 */

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || "info.teletech.rw@gmail.com";
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || "FitMed Rwanda";
export const FITMED_APP_URL = (
  process.env.NEXT_PUBLIC_APP_URL || "https://fitmed-l2uv.onrender.com"
).replace(/\/$/, "");
export const FITMED_ADMIN_EMAIL = (
  process.env.FITMED_ADMIN_EMAIL ||
  process.env.ADMIN_EMAIL ||
  "info.teletech.rw@gmail.com"
)
  .trim()
  .toLowerCase();
export const FITMED_DOCTOR_EMAIL = "uwaberatelesphore@gmail.com";

export interface SendEmailParams {
  toEmail: string;
  toName: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  tags?: string[];
  attachmentUrl?: string;
}

export function brandedEmail(title: string, bodyHtml: string): string {
  const year = new Date().getFullYear();
  return `
  <div style="margin:0;padding:0;background:#f4f7fb;font-family:'Manrope',Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
            <tr>
              <td style="background:#0B2D5C;padding:22px 28px;border-radius:16px 16px 0 0;">
                <p style="margin:0;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#12B8B0;font-weight:800;">FitMed Rwanda</p>
                <h1 style="margin:8px 0 0;font-size:22px;line-height:1.25;color:#ffffff;font-weight:800;">${title}</h1>
                <p style="margin:8px 0 0;font-size:13px;color:#8ff3e8;">Fit, Verified, and Ready.</p>
              </td>
            </tr>
            <tr>
              <td style="background:#ffffff;padding:28px;border:1px solid #e2e8f0;border-top:0;color:#334155;font-size:14px;line-height:1.65;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="background:#0B2D5C;padding:22px 28px;border-radius:0 0 16px 16px;color:#cbd5e1;font-size:12px;line-height:1.7;">
                <p style="margin:0 0 8px;color:#12B8B0;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;font-size:11px;">FitMed</p>
                <p style="margin:0 0 10px;color:#e2e8f0;">Secure digital medical fitness assessments, conducted by licensed doctors and verified online.</p>
                <p style="margin:0;">
                  <a href="${FITMED_APP_URL}" style="color:#12B8B0;text-decoration:none;font-weight:700;">${FITMED_APP_URL.replace(/^https?:\/\//, "")}</a>
                  &nbsp;·&nbsp;
                  <a href="mailto:support@fitnessmed.rw" style="color:#12B8B0;text-decoration:none;">support@fitnessmed.rw</a>
                </p>
                <p style="margin:10px 0 0;color:#94a3b8;">Kigali, Rwanda · Telehealth &amp; medical certification</p>
                <p style="margin:12px 0 0;color:#64748b;">© ${year} FitMed. All rights reserved.</p>
                <p style="margin:8px 0 0;color:#64748b;font-size:11px;">This message may contain health-related information intended only for the named recipient. If you received it in error, please delete it and notify FitMed.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>`;
}

function button(href: string, label: string, invert = false): string {
  const bg = invert ? "#0B2D5C" : "#12B8B0";
  const color = invert ? "#ffffff" : "#0B2D5C";
  return `<p style="text-align:center;margin:24px 0 8px;"><a href="${href}" style="background:${bg};color:${color};padding:14px 26px;font-weight:800;text-decoration:none;border-radius:12px;display:inline-block;font-size:14px;">${label}</a></p>`;
}

function brevoRecipient(toEmail: string) {
  const to = String(toEmail || "").trim();
  const sender = BREVO_SENDER_EMAIL.trim().toLowerCase();
  if (to.toLowerCase() !== sender) return to;
  const at = to.indexOf("@");
  if (at < 1) return to;
  const local = to.slice(0, at).split("+")[0];
  const domain = to.slice(at + 1);
  return `${local}+fitmed-admin@${domain}`;
}

export async function sendBrevoEmail({
  toEmail,
  toName,
  subject,
  htmlContent,
  textContent,
  tags,
}: SendEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!BREVO_API_KEY) {
    console.warn("BREVO_API_KEY not configured. Simulating email dispatch to:", toEmail);
    return { success: true, messageId: `simulated-brevo-${Date.now()}` };
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY,
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: BREVO_SENDER_NAME, email: BREVO_SENDER_EMAIL },
        to: [{ email: brevoRecipient(toEmail), name: toName }],
        replyTo: { email: BREVO_SENDER_EMAIL, name: BREVO_SENDER_NAME },
        subject,
        htmlContent,
        textContent: textContent || subject,
        tags: tags || ["fitmed"],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Brevo API Error:", data);
      return { success: false, error: data.message || "Failed to send email via Brevo" };
    }
    return { success: true, messageId: data.messageId };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Network error sending email via Brevo";
    console.error("Brevo Email Dispatch Exception:", error);
    return { success: false, error: message };
  }
}

export const EmailTemplates = {
  welcomeApplicantPending: (name: string) =>
    brandedEmail(
      "Registration received — waiting for approval",
      `<p>Dear <strong>${name}</strong>,</p>
       <p>Thank you for creating a FitMed applicant account. Your registration is now with our administration team for verification.</p>
       <p><strong>You cannot sign in or use the applicant dashboard until an administrator approves your account.</strong> Certificate applications, telehealth, and other features stay locked until then.</p>
       <p>This usually takes one business day. You will receive another email when your account is approved. After that, sign in with the email and password you used when you registered.</p>
       ${button(`${FITMED_APP_URL}/signin`, "Go to FitMed Sign In")}`
    ),

  welcomeApplicant: (name: string) =>
    brandedEmail(
      "Welcome to FitMed",
      `<p>Dear <strong>${name}</strong>,</p>
       <p>Your applicant portal is ready. You can request fitness certificates, complete self-assessments, and consult licensed physicians in our secure telehealth room.</p>
       ${button(`${FITMED_APP_URL}/dashboard/user`, "Open applicant dashboard")}`
    ),

  adminNewApplicantNotification: (name: string, email: string, nationalId: string) =>
    brandedEmail(
      "New applicant to review",
      `<p>A new applicant has submitted registration documents and is waiting for verification.</p>
       <table style="width:100%;font-size:13px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:8px 12px;">
         <tr><td style="padding:6px 0;color:#64748b;">Name</td><td style="padding:6px 0;text-align:right;font-weight:700;color:#0B2D5C;">${name}</td></tr>
         <tr><td style="padding:6px 0;color:#64748b;">Email</td><td style="padding:6px 0;text-align:right;font-weight:700;color:#0B2D5C;">${email}</td></tr>
         <tr><td style="padding:6px 0;color:#64748b;">National ID</td><td style="padding:6px 0;text-align:right;font-weight:700;color:#0B2D5C;">${nationalId}</td></tr>
       </table>
       ${button(`${FITMED_APP_URL}/dashboard/admin`, "Review in admin console", true)}`
    ),

  applicantAccountApprovedOwnPassword: (name: string, loginLink: string) =>
    brandedEmail(
      "Account approved",
      `<p>Dear <strong>${name}</strong>,</p>
       <p>Your registration has been verified and your FitMed account is now active. Sign in with the email and password you created when you registered.</p>
       ${button(loginLink, "Sign in to FitMed")}`
    ),

  applicantAccountApprovedWithTempPassword: (name: string, email: string, tempPassword: string, loginLink: string) =>
    brandedEmail(
      "Account approved",
      `<p>Dear <strong>${name}</strong>,</p>
       <p>Your National ID has been verified and your FitMed account is ready. Sign in with the one-time password below, then choose a password of your own.</p>
       <p style="margin:4px 0;color:#64748b;font-size:13px;">Email</p>
       <p style="margin:0 0 12px;font-weight:800;color:#0B2D5C;">${email}</p>
       <div style="background:#edf6f6;border:1px solid #12B8B0;border-radius:12px;padding:16px;text-align:center;">
         <p style="margin:0;font-size:12px;font-weight:700;color:#0B2D5C;">One-time sign-in password</p>
         <p style="margin:8px 0 0;font-family:Consolas,monospace;font-size:20px;font-weight:800;letter-spacing:1px;color:#0B2D5C;">${tempPassword}</p>
       </div>
       ${button(loginLink, "Sign in and set your password")}`
    ),

  applicantAccountRejected: (name: string, reason: string) =>
    brandedEmail(
      "Registration not approved",
      `<p>Dear <strong>${name}</strong>,</p>
       <p>Thank you for registering with FitMed. After reviewing your application, we are unable to approve your applicant account at this time.</p>
       <p style="margin:16px 0 8px;font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#64748b;">Reason for rejection</p>
       <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px;color:#9f1239;font-size:14px;line-height:1.6;">${reason}</div>
       <p>If you believe this is a mistake, reply to this email or contact FitMed with a clearer National ID document and we will review again.</p>`
    ),

  staffAccountCreated: (name: string, email: string, role: string, password: string) =>
    brandedEmail(
      `Your FitMed ${role} account`,
      `<p>Dear <strong>${name}</strong>,</p>
       <p>A FitMed <strong>${role}</strong> account has been created for you. Sign in with the details below. You may be asked to choose your own password the first time you sign in.</p>
       <table style="width:100%;font-size:13px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:8px 12px;">
         <tr><td style="padding:6px 0;color:#64748b;">Role</td><td style="padding:6px 0;text-align:right;font-weight:700;color:#0B2D5C;text-transform:capitalize;">${role}</td></tr>
         <tr><td style="padding:6px 0;color:#64748b;">Email</td><td style="padding:6px 0;text-align:right;font-weight:700;color:#0B2D5C;">${email}</td></tr>
         <tr><td style="padding:6px 0;color:#64748b;">Password</td><td style="padding:6px 0;text-align:right;font-weight:800;color:#0B2D5C;font-family:Consolas,monospace;">${password}</td></tr>
       </table>
       ${button(`${FITMED_APP_URL}/signin`, "Sign in to FitMed")}`
    ),

  forgotPasswordOTP: (name: string, otp: string) =>
    brandedEmail(
      "Password reset code",
      `<p>Hello <strong>${name}</strong>,</p>
       <p>Use this 6-digit code to reset your FitMed password. It expires in 15 minutes. Do not share it with anyone.</p>
       <p style="text-align:center;margin:20px 0;font-family:Consolas,monospace;font-size:32px;font-weight:800;letter-spacing:8px;color:#0B2D5C;">${otp}</p>
       <p style="font-size:13px;color:#64748b;">If you did not request this, you can ignore this email. Your password will stay the same.</p>`
    ),

  applicationReceived: (name: string, certId: string, purpose: string) =>
    brandedEmail(
      "Application received",
      `<p>Dear <strong>${name}</strong>,</p>
          <p>We have received your medical fitness application <strong>Official Document No. ${certId}</strong>. A licensed doctor will review it and, where required, invite you to a video consultation.</p>
       <table style="width:100%;font-size:13px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:8px 12px;">
         <tr><td style="padding:6px 0;color:#64748b;">Official Document No.</td><td style="padding:6px 0;text-align:right;font-weight:700;color:#0B2D5C;">${certId}</td></tr>
         <tr><td style="padding:6px 0;color:#64748b;">Purpose</td><td style="padding:6px 0;text-align:right;font-weight:700;color:#0B2D5C;">${purpose}</td></tr>
       </table>
       ${button(`${FITMED_APP_URL}/dashboard/user`, "Track your application")}`
    ),

  doctorNewQueueApplication: (doctorName: string, applicantName: string, certId: string, purpose: string, riskLevel: string) =>
    brandedEmail(
      "New case in your queue",
      `<p>Dear <strong>${doctorName}</strong>,</p>
       <p>A new fitness certificate application is waiting in your clinical queue.</p>
       <table style="width:100%;font-size:13px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:8px 12px;">
         <tr><td style="padding:6px 0;color:#64748b;">Applicant</td><td style="padding:6px 0;text-align:right;font-weight:700;color:#0B2D5C;">${applicantName}</td></tr>
         <tr><td style="padding:6px 0;color:#64748b;">Official Document No.</td><td style="padding:6px 0;text-align:right;font-weight:700;color:#0B2D5C;">${certId}</td></tr>
         <tr><td style="padding:6px 0;color:#64748b;">Purpose</td><td style="padding:6px 0;text-align:right;font-weight:700;color:#0B2D5C;">${purpose}</td></tr>
         <tr><td style="padding:6px 0;color:#64748b;">Screening risk</td><td style="padding:6px 0;text-align:right;font-weight:700;color:#0B2D5C;">${riskLevel}</td></tr>
       </table>
       ${button(`${FITMED_APP_URL}/dashboard/doctor`, "Open clinical workspace", true)}`
    ),

  certificateIssued: (candidateName: string, certId: string, purpose: string, doctorName: string) =>
    brandedEmail(
      "Certificate issued",
      `<p>Dear <strong>${candidateName}</strong>,</p>
       <p>Your medical evaluation for <strong>${purpose}</strong> has been completed and digitally signed by <strong>${doctorName}</strong>.</p>
       <p><strong>Official Document No.:</strong> ${certId}<br/><strong>Status:</strong> Fit for the stated purpose (QR verifiable)</p>
       ${button(`${FITMED_APP_URL}/dashboard/user`, "View and download certificate", true)}`
    ),

  certificateApprovedPayLink: (candidateName: string, certId: string, purpose: string, doctorName: string, payLink: string) =>
    brandedEmail(
      "Approved — payment required",
      `<p>Dear <strong>${candidateName}</strong>,</p>
       <p><strong>${doctorName}</strong> has approved your medical fitness certificate for <strong>${purpose}</strong>.</p>
       <p>To unlock the digitally signed PDF and verifiable QR code, complete the service fee of <strong>5,000 FRW</strong> via IremboPay (MTN Mobile Money, Airtel Money, or debit/credit card).</p>
       <p><strong>Official Document No.:</strong> ${certId}</p>
       ${button(payLink, "Pay 5,000 FRW via IremboPay")}`
    ),

  paymentReminder: (candidateName: string, certId: string, purpose: string, payLink: string) =>
    brandedEmail(
      "Payment reminder",
      `<p>Dear <strong>${candidateName}</strong>,</p>
       <p>This is a reminder that your approved FitMed certificate for <strong>${purpose}</strong> is waiting for the <strong>5,000 FRW</strong> service fee.</p>
       <p><strong>Official Document No.:</strong> ${certId}</p>
       <p>Please complete payment so we can release the signed PDF and QR verification.</p>
       ${button(payLink, "Pay 5,000 FRW now")}`
    ),

  certificatePaidDelivered: (candidateName: string, certId: string, purpose: string, iremboRef: string, downloadLink: string) =>
    brandedEmail(
      "Payment confirmed",
      `<p>Dear <strong>${candidateName}</strong>,</p>
       <p>We have confirmed your payment of <strong>5,000 FRW</strong>${iremboRef ? ` (reference <strong>${iremboRef}</strong>)` : ""}. Your official medical fitness certificate for <strong>${purpose}</strong> is now available.</p>
       <p><strong>Official Document No.:</strong> ${certId}</p>
       ${button(downloadLink, "Download certificate", true)}`
    ),

  paymentReceivedAdmin: (applicantName: string, certId: string, amount: string, iremboRef: string) =>
    brandedEmail(
      "Payment received",
      `<p>IremboPay settlement has been recorded for a FitMed certificate.</p>
       <table style="width:100%;font-size:13px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:8px 12px;">
         <tr><td style="padding:6px 0;color:#64748b;">Applicant</td><td style="padding:6px 0;text-align:right;font-weight:700;color:#0B2D5C;">${applicantName}</td></tr>
         <tr><td style="padding:6px 0;color:#64748b;">Official Document No.</td><td style="padding:6px 0;text-align:right;font-weight:700;color:#0B2D5C;">${certId}</td></tr>
         <tr><td style="padding:6px 0;color:#64748b;">Amount</td><td style="padding:6px 0;text-align:right;font-weight:700;color:#0B2D5C;">${amount}</td></tr>
         <tr><td style="padding:6px 0;color:#64748b;">Reference</td><td style="padding:6px 0;text-align:right;font-weight:700;color:#0B2D5C;">${iremboRef || "—"}</td></tr>
       </table>
       ${button(`${FITMED_APP_URL}/dashboard/admin`, "Open admin dashboard", true)}`
    ),

  telehealthInvite: (
    applicantName: string,
    doctorName: string,
    meetingLink: string,
    details: {
      scheduledDate: string;
      scheduledTime: string;
      durationMinutes?: number;
      purpose?: string;
      appointmentId?: string;
      notes?: string;
    }
  ) =>
    brandedEmail(
      "Video consultation scheduled",
      `<p>Hello <strong>${applicantName}</strong>,</p>
       <p><strong>${doctorName}</strong> has scheduled a FitMed telehealth visit. Sign in with your applicant email and password, then you will enter this meeting room.</p>
       <table style="width:100%;font-size:13px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:8px 12px;">
         <tr><td style="padding:6px 0;color:#64748b;">Doctor</td><td style="padding:6px 0;text-align:right;font-weight:700;color:#0B2D5C;">${doctorName}</td></tr>
         <tr><td style="padding:6px 0;color:#64748b;">Date</td><td style="padding:6px 0;text-align:right;font-weight:700;color:#0B2D5C;">${details.scheduledDate}</td></tr>
         <tr><td style="padding:6px 0;color:#64748b;">Time</td><td style="padding:6px 0;text-align:right;font-weight:700;color:#0B2D5C;">${details.scheduledTime} (Africa/Kigali)</td></tr>
         <tr><td style="padding:6px 0;color:#64748b;">Duration</td><td style="padding:6px 0;text-align:right;font-weight:700;color:#0B2D5C;">${details.durationMinutes || 15} minutes</td></tr>
         <tr><td style="padding:6px 0;color:#64748b;">Purpose</td><td style="padding:6px 0;text-align:right;font-weight:700;color:#0B2D5C;">${details.purpose || "Medical fitness consultation"}</td></tr>
         <tr><td style="padding:6px 0;color:#64748b;">Meeting ID</td><td style="padding:6px 0;text-align:right;font-weight:700;color:#0B2D5C;font-family:Consolas,monospace;">${details.appointmentId || "—"}</td></tr>
         ${details.notes ? `<tr><td style="padding:6px 0;color:#64748b;">Notes</td><td style="padding:6px 0;text-align:right;font-weight:700;color:#0B2D5C;">${details.notes}</td></tr>` : ""}
       </table>
       <p>Click below, sign in, and you will be taken straight to this meeting.</p>
       ${button(meetingLink, "Join telehealth room")}`
    ),

  appointmentReminder: (applicantName: string, doctorName: string, meetingLink: string, time: string) =>
    brandedEmail(
      "Appointment reminder",
      `<p>Dear <strong>${applicantName}</strong>,</p>
       <p>This is a reminder of your FitMed video consultation with <strong>${doctorName}</strong>.</p>
       <p><strong>Scheduled time:</strong> ${time}</p>
       <p>Sign in with your applicant email and password. The join button takes you to this meeting after sign-in.</p>
       ${button(meetingLink, "Join consultation room")}`
    ),

  appointmentStartingSoon: (applicantName: string, doctorName: string, meetingLink: string, time: string, minutes: number) =>
    brandedEmail(
      `Your visit starts in ${minutes} minutes`,
      `<p>Dear <strong>${applicantName}</strong>,</p>
       <p>Your FitMed video consultation with <strong>${doctorName}</strong> begins in <strong>${minutes} minutes</strong> (${time}).</p>
       <p>Sign in, then join. You will enter meeting <strong>${time}</strong>.</p>
       ${button(meetingLink, "Join video meeting")}`
    ),

  appointmentStartingNow: (applicantName: string, doctorName: string, meetingLink: string, time: string) =>
    brandedEmail(
      "Your FitMed visit is starting now",
      `<p>Dear <strong>${applicantName}</strong>,</p>
       <p>Your video consultation with <strong>${doctorName}</strong> is starting now (${time}).</p>
       <p>Sign in with your FitMed applicant account, then you will enter this meeting.</p>
       ${button(meetingLink, "Join now")}`
    ),

  appointmentRescheduled: (
    applicantName: string,
    doctorName: string,
    meetingLink: string,
    details: {
      scheduledDate: string;
      scheduledTime: string;
      durationMinutes?: number;
      purpose?: string;
      appointmentId?: string;
    }
  ) =>
    brandedEmail(
      "Your FitMed visit was rescheduled",
      `<p>Dear <strong>${applicantName}</strong>,</p>
       <p><strong>${doctorName}</strong> has updated your video consultation. Please use the new date and time below.</p>
       <table style="width:100%;font-size:13px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:8px 12px;">
         <tr><td style="padding:6px 0;color:#64748b;">New date</td><td style="padding:6px 0;text-align:right;font-weight:700;color:#0B2D5C;">${details.scheduledDate}</td></tr>
         <tr><td style="padding:6px 0;color:#64748b;">New time</td><td style="padding:6px 0;text-align:right;font-weight:700;color:#0B2D5C;">${details.scheduledTime} (Africa/Kigali)</td></tr>
         <tr><td style="padding:6px 0;color:#64748b;">Duration</td><td style="padding:6px 0;text-align:right;font-weight:700;color:#0B2D5C;">${details.durationMinutes || 15} minutes</td></tr>
         <tr><td style="padding:6px 0;color:#64748b;">Purpose</td><td style="padding:6px 0;text-align:right;font-weight:700;color:#0B2D5C;">${details.purpose || "Medical fitness consultation"}</td></tr>
         <tr><td style="padding:6px 0;color:#64748b;">Meeting ID</td><td style="padding:6px 0;text-align:right;font-weight:700;color:#0B2D5C;font-family:Consolas,monospace;">${details.appointmentId || "—"}</td></tr>
       </table>
       <p>Sign in with your email and password, then you will enter this meeting room.</p>
       ${button(meetingLink, "Join the rescheduled visit")}`
    ),

  certificateStatusNotification: (
    name: string,
    certId: string,
    purpose: string,
    status: string,
    doctorName: string,
    details: string,
    actionLink: string
  ) =>
    brandedEmail(
      "Application update",
      `<p>Dear <strong>${name}</strong>,</p>
       <p>Your medical certificate application for <strong>${purpose}</strong> (${certId}) was updated by <strong>${doctorName}</strong>.</p>
       <p><strong>Status:</strong> ${status}</p>
       <p>${details || "Please open your dashboard for next steps."}</p>
       ${button(actionLink, "View in dashboard", true)}`
    ),

  contactConfirmation: (fullName: string, subject: string, message: string) =>
    brandedEmail(
      "We received your request",
      `<p>Dear <strong>${fullName}</strong>,</p>
       <p>Thank you for writing to FitMed. We have received your request and our team will reach out to you.</p>
       <p>This is to confirm we have seen your message about <strong>${subject}</strong>. Please keep this email for your records. A FitMed team member will contact you using the details you provided.</p>
       <blockquote style="margin:16px 0;padding:12px 16px;border-left:3px solid #12B8B0;background:#f8fafc;color:#475569;">${message}</blockquote>
       <p>Kind regards,<br/>FitMed Support<br/>Kigali, Rwanda</p>`
    ),

  contactAdminCopy: (fullName: string, email: string, phone: string, subject: string, message: string, category: string) =>
    brandedEmail(
      "New contact inquiry",
      `<p>A visitor submitted the FitMed contact form.</p>
       <table style="width:100%;font-size:13px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:8px 12px;">
         <tr><td style="padding:6px 0;color:#64748b;">Name</td><td style="padding:6px 0;text-align:right;font-weight:700;color:#0B2D5C;">${fullName}</td></tr>
         <tr><td style="padding:6px 0;color:#64748b;">Email</td><td style="padding:6px 0;text-align:right;font-weight:700;color:#0B2D5C;">${email}</td></tr>
         <tr><td style="padding:6px 0;color:#64748b;">Phone</td><td style="padding:6px 0;text-align:right;font-weight:700;color:#0B2D5C;">${phone || "—"}</td></tr>
         <tr><td style="padding:6px 0;color:#64748b;">Category</td><td style="padding:6px 0;text-align:right;font-weight:700;color:#0B2D5C;">${category || "general"}</td></tr>
         <tr><td style="padding:6px 0;color:#64748b;">Subject</td><td style="padding:6px 0;text-align:right;font-weight:700;color:#0B2D5C;">${subject}</td></tr>
       </table>
       <blockquote style="margin:16px 0;padding:12px 16px;border-left:3px solid #12B8B0;background:#f8fafc;color:#475569;">${message}</blockquote>
       ${button(`${FITMED_APP_URL}/dashboard/admin`, "Open admin console", true)}`
    ),

  newsletterBroadcast: (name: string, message: string) =>
    brandedEmail(
      "FitMed news",
      `<p>Hello <strong>${name}</strong>,</p>
       <p>${String(message || "").replace(/\n/g, "<br/>")}</p>
       <p>You received this because you subscribed to FitMed updates. Reply to this email if you have questions.</p>`
    ),

  newsletterWelcome: (name: string) =>
    brandedEmail(
      "You are subscribed",
      `<p>Hello <strong>${name || "there"}</strong>,</p>
       <p>You are now subscribed to FitMed news. We will email you about certificate processing, doctor availability, and platform announcements.</p>
       <p>If you did not subscribe, reply to this message and we will remove your address.</p>`
    ),

  contactReply: (fullName: string, reply: string) => {
    const raw = String(reply || "");
    const isHtml = /<(p|div|br|strong|em|u|h[1-6]|ul|ol|li|a)\b/i.test(raw);
    const body = isHtml
      ? raw
          .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
          .replace(/\son\w+=(["']).*?\1/gi, "")
      : `<p>Dear <strong>${fullName}</strong>,</p><p>${raw.replace(/\n/g, "<br/>")}</p>`;
    return brandedEmail(
      "Reply from FitMed",
      `${body}
       <p>You can reply to this email, or write to <a href="mailto:support@fitnessmed.rw" style="color:#12B8B0;">support@fitnessmed.rw</a>.</p>`
    );
  },
};
