import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Certificate from "@/models/Certificate";
import {
  createIremboInvoice,
  getIremboInvoice,
  iremboConfigured,
  iremboPublicCheckout,
  channelFromIremboMethod,
} from "@/lib/iremboPay";
import { markCertificatePaid } from "@/lib/certificatePayment";

function digits(value: string) {
  return String(value || "").replace(/\D/g, "");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const certificateId = String(body.certificateId || "").trim().toUpperCase();
    if (!certificateId) {
      return NextResponse.json({ success: false, error: "Certificate ID is required." }, { status: 400 });
    }
    if (!iremboConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error:
            "IremboPay is the payment mode, but merchant keys are not on the server yet. Add IREMBO_SECRET_KEY, IREMBO_PUBLIC_KEY, IREMBO_PAYMENT_ACCOUNT, and IREMBO_PRODUCT_CODE.",
        },
        { status: 503 }
      );
    }

    await connectToDatabase();
    const cert = await Certificate.findOne({ certificateId });
    if (!cert) {
      return NextResponse.json({ success: false, error: "Certificate not found." }, { status: 404 });
    }
    if (String(cert.paymentStatus || "").toUpperCase() === "PAID") {
      return NextResponse.json({ success: false, error: "This certificate is already paid." }, { status: 400 });
    }

    if (cert.iremboInvoiceNumber) {
      const existing = await getIremboInvoice(String(cert.iremboInvoiceNumber));
      if (existing.success && String(existing.invoice?.paymentStatus || "").toUpperCase() === "PAID") {
        await markCertificatePaid({
          certificateId,
          invoiceNumber: existing.invoice?.invoiceNumber,
          transactionId: existing.invoice?.transactionId,
          iremboRef: String(existing.invoice?.paymentReference || existing.invoice?.invoiceNumber),
          channel: channelFromIremboMethod(existing.invoice?.paymentMethod),
        });
        return NextResponse.json({ success: true, alreadyPaid: true, invoice: existing.invoice, checkout: iremboPublicCheckout() });
      }
      if (existing.success && String(existing.invoice?.paymentStatus || "").toUpperCase() === "NEW") {
        return NextResponse.json({
          success: true,
          invoice: existing.invoice,
          checkout: iremboPublicCheckout(),
        });
      }
    }

    const transactionId = `${certificateId}-${Date.now().toString(36)}`.slice(0, 40);
    const created = await createIremboInvoice({
      transactionId,
      description: `FitMed medical certificate ${certificateId}`,
      customer: {
        name: String(cert.candidateName || "Applicant"),
        email: String(cert.applicantEmail || ""),
        phoneNumber: digits(String(cert.applicantPhone || "")),
      },
    });
    if (!created.success || !created.invoice) {
      return NextResponse.json({ success: false, error: created.error }, { status: 502 });
    }

    cert.iremboInvoiceNumber = created.invoice.invoiceNumber;
    cert.iremboTransactionId = created.invoice.transactionId || transactionId;
    await cert.save();

    return NextResponse.json({
      success: true,
      invoice: created.invoice,
      checkout: iremboPublicCheckout(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Could not start IremboPay checkout.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
