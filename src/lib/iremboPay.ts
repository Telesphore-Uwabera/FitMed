import crypto from "crypto";
import { FITMED_APP_URL } from "@/lib/brevo";

export const IREMBO_FEE_RWF = 5000;

const secretKey = () => String(process.env.IREMBO_SECRET_KEY || "").trim();
const publicKey = () => String(process.env.IREMBO_PUBLIC_KEY || process.env.NEXT_PUBLIC_IREMBO_PUBLIC_KEY || "").trim();
const paymentAccount = () => String(process.env.IREMBO_PAYMENT_ACCOUNT || "").trim();
const productCode = () => String(process.env.IREMBO_PRODUCT_CODE || "").trim();

export function iremboEnv() {
  return String(process.env.IREMBO_ENV || process.env.NEXT_PUBLIC_IREMBO_ENV || "sandbox").toLowerCase() === "production"
    ? "production"
    : "sandbox";
}

export function iremboApiBase() {
  return iremboEnv() === "production" ? "https://api.irembopay.com" : "https://api.sandbox.irembopay.com";
}

export function iremboWidgetSrc() {
  return iremboEnv() === "production"
    ? "https://dashboard.irembopay.com/assets/payment/inline.js"
    : "https://dashboard.sandbox.irembopay.com/assets/payment/inline.js";
}

export function iremboConfigured() {
  return Boolean(secretKey() && publicKey() && paymentAccount() && productCode());
}

function headers() {
  return {
    "Content-Type": "application/json",
    "irembopay-secretKey": secretKey(),
    "X-API-Version": "2",
  };
}

export type IremboInvoice = {
  invoiceNumber?: string;
  transactionId?: string;
  paymentStatus?: string;
  paymentLinkUrl?: string;
  paymentMethod?: string;
  paymentReference?: string;
  amount?: number;
  currency?: string;
};

async function iremboFetch(path: string, init?: RequestInit) {
  const response = await fetch(`${iremboApiBase()}${path}`, {
    ...init,
    headers: { ...headers(), ...(init?.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
}

export async function createIremboInvoice(opts: {
  transactionId: string;
  description: string;
  customer: { name: string; email: string; phoneNumber?: string };
}) {
  if (!iremboConfigured()) {
    return { success: false, error: "IremboPay is not configured. Add merchant keys in the server environment." };
  }

  const { ok, data } = await iremboFetch("/payments/invoices", {
    method: "POST",
    body: JSON.stringify({
      transactionId: opts.transactionId,
      paymentAccountIdentifier: paymentAccount(),
      paymentItems: [{ code: productCode(), quantity: 1, unitAmount: IREMBO_FEE_RWF }],
      description: opts.description,
      language: "EN",
      customer: {
        name: opts.customer.name,
        email: opts.customer.email,
        phoneNumber: opts.customer.phoneNumber || undefined,
      },
    }),
  });

  const invoice = (data?.data || data) as IremboInvoice;
  if (!ok || !invoice?.invoiceNumber) {
    const detail = data?.errors?.[0]?.detail || data?.message || "Could not create an IremboPay invoice.";
    return { success: false, error: String(detail) };
  }
  return { success: true, invoice };
}

export async function getIremboInvoice(reference: string) {
  if (!iremboConfigured() || !reference) {
    return { success: false, error: "IremboPay is not configured." };
  }
  const { ok, data } = await iremboFetch(`/payments/invoices/${encodeURIComponent(reference)}`);
  const invoice = (data?.data || data) as IremboInvoice;
  if (!ok || !invoice?.invoiceNumber) {
    return { success: false, error: data?.errors?.[0]?.detail || data?.message || "Invoice not found." };
  }
  return { success: true, invoice };
}

export function iremboPublicCheckout() {
  return {
    configured: iremboConfigured(),
    publicKey: publicKey(),
    widgetSrc: iremboWidgetSrc(),
    amount: IREMBO_FEE_RWF,
    currency: "RWF",
    callbackUrl: `${FITMED_APP_URL}/api/payments/irembo/webhook`,
  };
}

export function verifyIremboSignature(rawBody: string, signatureHeader: string) {
  const key = secretKey();
  if (!key || !signatureHeader) return false;
  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const [prefix, ...rest] = part.split("=");
      return [prefix.trim(), rest.join("=").trim()];
    })
  );
  const timestamp = parts.t;
  const signatureHash = parts.s;
  if (!timestamp || !signatureHash) return false;
  const expected = crypto.createHmac("sha256", key).update(`${timestamp}#${rawBody}`).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signatureHash, "hex"));
  } catch {
    return false;
  }
}

export function rwandaMomoNumber(value: string) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("250") && digits.length === 12) return `0${digits.slice(3)}`;
  if (digits.length === 9 && digits.startsWith("7")) return `0${digits}`;
  return digits;
}

export function momoUssdCode(provider: "MTN" | "AIRTEL", invoiceNumber: string) {
  const invoice = String(invoiceNumber || "").trim();
  if (provider === "AIRTEL") return `*182*4*5*1*${invoice}#`;
  return `*182*3*7*${invoice}#`;
}

export async function initiateIremboMomo(opts: {
  invoiceNumber: string;
  paymentProvider: "MTN" | "AIRTEL";
  accountIdentifier: string;
  transactionReference?: string;
}) {
  const accountIdentifier = rwandaMomoNumber(opts.accountIdentifier);
  if (!/^07\d{8}$/.test(accountIdentifier)) {
    return { success: false, error: "Enter a valid Rwanda number, for example 078xxxxxxx." };
  }

  const { ok, data } = await iremboFetch("/payments/transactions/initiate", {
    method: "POST",
    body: JSON.stringify({
      accountIdentifier,
      paymentProvider: opts.paymentProvider,
      invoiceNumber: opts.invoiceNumber,
      transactionReference: opts.transactionReference || undefined,
    }),
  });
  if (!ok) {
    const detail = data?.errors?.[0]?.detail || data?.message || "Could not send the Mobile Money PIN prompt.";
    return { success: false, error: String(detail) };
  }
  return { success: true, data: data?.data || data };
}

export function channelFromIremboMethod(method?: string) {
  const value = String(method || "").toUpperCase();
  if (value.includes("MTN") || value.includes("MOMO")) return "MTN Mobile Money";
  if (value.includes("AIRTEL")) return "Airtel Money";
  if (value.includes("CARD") || value.includes("VISA") || value.includes("MASTER")) return "Debit / Credit card";
  if (value.includes("EQUITY") || value.includes("BK") || value.includes("BANK")) return "Bank";
  return "IremboPay";
}
