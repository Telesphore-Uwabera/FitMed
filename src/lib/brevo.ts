/**
 * Brevo (formerly Sendinblue) Transactional Email Service
 * Handles clinical alerts, certificate delivery, applicant registration, and appointment invitations.
 */

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || "info.teletech.rw@gmail.com";
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || "FitMed Rwanda";

export interface SendEmailParams {
  toEmail: string;
  toName: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  tags?: string[];
  attachmentUrl?: string;
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
    console.warn("⚠️ BREVO_API_KEY not configured. Simulating email dispatch to:", toEmail);
    return {
      success: true,
      messageId: `simulated-brevo-${Date.now()}`,
    };
  }

  try {
    const payload = {
      sender: {
        name: BREVO_SENDER_NAME,
        email: BREVO_SENDER_EMAIL,
      },
      to: [
        {
          email: toEmail,
          name: toName,
        },
      ],
      subject,
      htmlContent,
      textContent: textContent || subject,
      tags: tags || ["fitmed-clinical"],
    };

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY,
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Brevo API Error:", data);
      return { success: false, error: data.message || "Failed to send email via Brevo" };
    }

    return { success: true, messageId: data.messageId };
  } catch (error: any) {
    console.error("Brevo Email Dispatch Exception:", error);
    return { success: false, error: error.message || "Network error sending email via Brevo" };
  }
}

/**
 * Pre-formatted Clinical Email Templates
 */
export const EmailTemplates = {
  welcomeApplicant: (name: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; background-color: #f8fafc; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #0B2D5C; margin: 0;">FitMed Rwanda</h1>
        <p style="color: #12B8B0; font-weight: bold; font-size: 14px;">Digital Medical Fitness Certification</p>
      </div>
      <div style="background-color: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0;">
        <h2 style="color: #0B2D5C;">Welcome to FitMed, ${name}!</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">Your applicant portal account has been successfully created. You can now request fitness certificates, complete self-assessments, and consult licensed physicians via our secure telehealth video room.</p>
        <div style="margin: 24px 0; text-align: center;">
          <a href="https://fitmed.netlify.app/dashboard/user" style="background-color: #12B8B0; color: #0B2D5C; padding: 12px 24px; font-weight: bold; text-decoration: none; border-radius: 8px; display: inline-block;">Access Applicant Dashboard</a>
        </div>
      </div>
      <p style="text-align: center; color: #94a3b8; font-size: 11px; margin-top: 20px;">FitMed Rwanda · Healthcare Digital Services · Kigali, Rwanda</p>
    </div>
  `,

  certificateIssued: (candidateName: string, certId: string, purpose: string, doctorName: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; background-color: #f8fafc; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #0B2D5C; margin: 0;">FitMed Rwanda</h1>
        <span style="background-color: #10b981; color: #ffffff; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">CERTIFICATE ISSUED</span>
      </div>
      <div style="background-color: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0;">
        <h2 style="color: #0B2D5C;">Medical Fitness Certificate Approved</h2>
        <p style="color: #475569; font-size: 14px;">Dear ${candidateName},</p>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">Your medical evaluation for <strong>${purpose}</strong> has been finalized and digitally signed by <strong>${doctorName}</strong>.</p>
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0; color: #166534; font-size: 13px;"><strong>Certificate ID:</strong> ${certId}</p>
          <p style="margin: 4px 0 0 0; color: #166534; font-size: 13px;"><strong>Status:</strong> Fit for Activity (QR Verifiable)</p>
        </div>
        <div style="text-align: center; margin-top: 24px;">
          <a href="https://fitmed.netlify.app/dashboard/user" style="background-color: #0B2D5C; color: #ffffff; padding: 12px 24px; font-weight: bold; text-decoration: none; border-radius: 8px; display: inline-block;">Download & View Certificate</a>
        </div>
      </div>
    </div>
  `,

  certificateApprovedPayLink: (
    candidateName: string,
    certId: string,
    purpose: string,
    doctorName: string,
    payLink: string
  ) => `
    <div style="font-family: 'Manrope', Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; background-color: #f8fafc; border-radius: 20px; border: 1px solid #e2e8f0;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #0B2D5C; margin: 0; font-size: 24px; font-weight: 800;">FitMed Rwanda</h1>
        <div style="margin-top: 6px;">
          <span style="background-color: #fef3c7; color: #92400e; border: 1px solid #fde68a; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase;">APPROVED — PAYMENT REQUIRED</span>
        </div>
      </div>
      <div style="background-color: #ffffff; padding: 28px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <h2 style="color: #0B2D5C; margin-top: 0; font-size: 18px;">Medical Fitness Certificate Approved!</h2>
        <p style="color: #475569; font-size: 14px;">Dear <strong>${candidateName}</strong>,</p>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">Good news! <strong>${doctorName}</strong> has clinically evaluated your questionnaire and approved your Medical Fitness Certificate for <strong>${purpose}</strong>.</p>
        
        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 18px; border-radius: 12px; margin: 20px 0;">
          <table style="width: 100%; font-size: 13px; color: #334155;">
            <tr>
              <td style="padding: 4px 0; color: #64748b;">Certificate ID:</td>
              <td style="padding: 4px 0; font-weight: bold; text-align: right; color: #0B2D5C;">${certId}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;">Evaluated Purpose:</td>
              <td style="padding: 4px 0; font-weight: bold; text-align: right; color: #0B2D5C;">${purpose}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;">Government Fee:</td>
              <td style="padding: 4px 0; font-weight: bold; text-align: right; color: #059669;">5,000 FRW</td>
            </tr>
          </table>
        </div>

        <p style="color: #475569; font-size: 13px; line-height: 1.5;">To unlock and download your digitally signed PDF certificate and verifiable QR code, please complete payment of <strong>5,000 FRW via IremboPay</strong> (MTN MoMo, Airtel Money, or Card).</p>

        <div style="text-align: center; margin: 28px 0 10px 0;">
          <a href="${payLink}" style="background-color: #12B8B0; color: #0B2D5C; padding: 14px 28px; font-weight: 900; text-decoration: none; border-radius: 12px; display: inline-block; font-size: 14px; box-shadow: 0 4px 12px rgba(18,184,176,0.3);">Pay 5,000 FRW via IremboPay to Unlock</a>
        </div>
      </div>
      <p style="text-align: center; color: #94a3b8; font-size: 11px; margin-top: 20px;">FitMed Rwanda · Telehealth &amp; Medical Certification · Republic of Rwanda</p>
    </div>
  `,

  certificatePaidDelivered: (
    candidateName: string,
    certId: string,
    purpose: string,
    iremboRef: string,
    downloadLink: string
  ) => `
    <div style="font-family: 'Manrope', Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; background-color: #f8fafc; border-radius: 20px; border: 1px solid #e2e8f0;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #0B2D5C; margin: 0; font-size: 24px; font-weight: 800;">FitMed Rwanda</h1>
        <div style="margin-top: 6px;">
          <span style="background-color: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase;">✓ PAYMENT CONFIRMED &amp; ISSUED</span>
        </div>
      </div>
      <div style="background-color: #ffffff; padding: 28px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <h2 style="color: #0B2D5C; margin-top: 0; font-size: 18px;">Official Certificate Unlocked &amp; Ready!</h2>
        <p style="color: #475569; font-size: 14px;">Dear <strong>${candidateName}</strong>,</p>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">Thank you for your payment of <strong>5,000 FRW</strong> via IremboPay (Transaction Reference: <strong style="color: #0B2D5C;">${iremboRef}</strong>). Your official Medical Fitness Certificate for <strong>${purpose}</strong> has been released and is active in your dashboard.</p>
        
        <div style="background-color: #f0fdf4; border: 1px solid #86efac; padding: 18px; border-radius: 12px; margin: 20px 0;">
          <table style="width: 100%; font-size: 13px; color: #166534;">
            <tr>
              <td style="padding: 4px 0; color: #15803d;">Certificate ID:</td>
              <td style="padding: 4px 0; font-weight: bold; text-align: right;">${certId}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #15803d;">Irembo Transaction Ref:</td>
              <td style="padding: 4px 0; font-weight: bold; text-align: right;">${iremboRef}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #15803d;">Security:</td>
              <td style="padding: 4px 0; font-weight: bold; text-align: right;">Cryptographically Verified QR</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin: 28px 0 10px 0;">
          <a href="${downloadLink}" style="background-color: #0B2D5C; color: #ffffff; padding: 14px 28px; font-weight: 800; text-decoration: none; border-radius: 12px; display: inline-block; font-size: 14px;">Download Official PDF &amp; QR Code</a>
        </div>
      </div>
      <p style="text-align: center; color: #94a3b8; font-size: 11px; margin-top: 20px;">FitMed Rwanda · Official Medical Certification Portal</p>
    </div>
  `,

  telehealthInvite: (applicantName: string, doctorName: string, meetingLink: string, time: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; background-color: #f8fafc; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #0B2D5C; margin: 0;">FitMed Telehealth</h1>
        <p style="color: #12B8B0; font-weight: bold; font-size: 14px;">Live Video Consultation Room</p>
      </div>
      <div style="background-color: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0;">
        <h2 style="color: #0B2D5C;">Live Consultation Invitation</h2>
        <p style="color: #475569; font-size: 14px;">Hello ${applicantName},</p>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;"><strong>${doctorName}</strong> is inviting you to join a secure live video medical assessment.</p>
        <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0; color: #0369a1; font-size: 13px;"><strong>Scheduled Time:</strong> ${time}</p>
          <p style="margin: 4px 0 0 0; color: #0369a1; font-size: 13px;"><strong>Room Security:</strong> End-to-End Encrypted (HIPAA)</p>
        </div>
        <div style="text-align: center; margin-top: 24px;">
          <a href="${meetingLink}" style="background-color: #12B8B0; color: #0B2D5C; padding: 14px 28px; font-weight: bold; text-decoration: none; border-radius: 8px; display: inline-block;">Join Video Telehealth Room</a>
        </div>
      </div>
    </div>
  `,

  adminNewApplicantNotification: (name: string, email: string, nationalId: string) => `
    <div style="font-family: 'Manrope', Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; background-color: #f8fafc; border-radius: 20px; border: 1px solid #e2e8f0;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #0B2D5C; margin: 0; font-size: 22px;">FitMed Admin Alert</h1>
        <span style="background-color: #e0f2fe; color: #0369a1; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 800;">NEW APPLICANT REGISTRATION</span>
      </div>
      <div style="background-color: #ffffff; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0;">
        <h2 style="color: #0B2D5C; font-size: 16px; margin-top: 0;">New Applicant Awaiting National ID Verification</h2>
        <p style="color: #475569; font-size: 13px; line-height: 1.6;">A new user has submitted their registration with a Rwanda National ID/Passport document. Please verify their identity in the Admin Console to activate their account and issue temporary credentials.</p>
        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 16px; border-radius: 12px; margin: 16px 0; font-size: 13px;">
          <p style="margin: 4px 0;"><strong>Name:</strong> ${name}</p>
          <p style="margin: 4px 0;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 4px 0;"><strong>National ID:</strong> ${nationalId}</p>
        </div>
        <div style="text-align: center; margin-top: 20px;">
          <a href="https://fitmed.rw/dashboard/admin" style="background-color: #0B2D5C; color: #ffffff; padding: 12px 24px; font-weight: bold; text-decoration: none; border-radius: 10px; display: inline-block;">Review &amp; Approve in Admin Console</a>
        </div>
      </div>
    </div>
  `,

  applicantAccountApprovedWithTempPassword: (name: string, email: string, tempPassword: string, loginLink: string) => `
    <div style="font-family: 'Manrope', Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; background-color: #f8fafc; border-radius: 20px; border: 1px solid #e2e8f0;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #0B2D5C; margin: 0; font-size: 22px;">FitMed Rwanda</h1>
        <span style="background-color: #d1fae5; color: #065f46; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 800;">ACCOUNT VERIFIED &amp; APPROVED</span>
      </div>
      <div style="background-color: #ffffff; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0;">
        <h2 style="color: #0B2D5C; font-size: 16px; margin-top: 0;">Welcome to FitMed, ${name}!</h2>
        <p style="color: #475569; font-size: 13px; line-height: 1.6;">Your National ID has been verified and your account has been approved by the platform administrator. You may now sign in using your temporary credentials below:</p>
        
        <div style="background-color: #f0fdf4; border: 1px solid #86efac; padding: 16px; border-radius: 12px; margin: 16px 0; font-size: 13px; text-align: center;">
          <div style="color: #166534; font-size: 12px; font-weight: bold;">Your Temporary Sign-In Password:</div>
          <div style="font-family: monospace; font-size: 20px; font-weight: 900; color: #0B2D5C; margin: 8px 0; letter-spacing: 1px;">${tempPassword}</div>
          <div style="color: #b45309; font-size: 11px; font-weight: 600;">⚠️ You will be prompted to reset your password immediately upon first sign-in.</div>
        </div>

        <div style="text-align: center; margin-top: 24px;">
          <a href="${loginLink}" style="background-color: #12B8B0; color: #0B2D5C; padding: 14px 28px; font-weight: 900; text-decoration: none; border-radius: 12px; display: inline-block;">Sign In &amp; Set New Password</a>
        </div>
      </div>
    </div>
  `,

  forgotPasswordOTP: (name: string, otp: string) => `
    <div style="font-family: 'Manrope', Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; background-color: #f8fafc; border-radius: 20px; border: 1px solid #e2e8f0;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #0B2D5C; margin: 0; font-size: 22px;">FitMed Security</h1>
        <span style="background-color: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 800;">PASSWORD RESET CODE</span>
      </div>
      <div style="background-color: #ffffff; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0;">
        <h2 style="color: #0B2D5C; font-size: 16px; margin-top: 0;">Password Reset Verification</h2>
        <p style="color: #475569; font-size: 13px; line-height: 1.6;">Hello ${name}, we received a request to reset your FitMed account password. Use the 6-digit security code below to complete the reset:</p>
        
        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center;">
          <div style="font-family: monospace; font-size: 32px; font-weight: 900; color: #0B2D5C; letter-spacing: 6px;">${otp}</div>
          <div style="color: #64748b; font-size: 11px; margin-top: 6px;">This code is valid for 15 minutes. Do not share it with anyone.</div>
        </div>
      </div>
    </div>
  `,

  certificateStatusNotification: (
    name: string,
    certId: string,
    purpose: string,
    status: string,
    doctorName: string,
    details: string,
    actionLink: string
  ) => `
    <div style="font-family: 'Manrope', Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; background-color: #f8fafc; border-radius: 20px; border: 1px solid #e2e8f0;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #0B2D5C; margin: 0; font-size: 22px;">FitMed Clinical Status</h1>
        <span style="background-color: #f1f5f9; color: #0B2D5C; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase;">STATUS: ${status}</span>
      </div>
      <div style="background-color: #ffffff; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0;">
        <h2 style="color: #0B2D5C; font-size: 16px; margin-top: 0;">Certificate Application Update</h2>
        <p style="color: #475569; font-size: 13px;">Dear <strong>${name}</strong>,</p>
        <p style="color: #475569; font-size: 13px; line-height: 1.6;">Your medical certificate application for <strong>${purpose}</strong> (ID: ${certId}) has been updated by <strong>${doctorName}</strong>.</p>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px; margin: 16px 0; font-size: 13px;">
          <p style="margin: 4px 0; color: #0B2D5C;"><strong>Current Status:</strong> ${status}</p>
          <p style="margin: 4px 0; color: #475569;"><strong>Doctor Notes / Instructions:</strong> ${details}</p>
        </div>

        <div style="text-align: center; margin-top: 24px;">
          <a href="${actionLink}" style="background-color: #0B2D5C; color: #ffffff; padding: 12px 24px; font-weight: bold; text-decoration: none; border-radius: 10px; display: inline-block;">View in Dashboard</a>
        </div>
      </div>
    </div>
  `,
};
