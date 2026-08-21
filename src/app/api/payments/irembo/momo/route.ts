import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Certificate from "@/models/Certificate";
import { initiateIremboMomo, iremboConfigured } from "@/lib/iremboPay";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const certificateId = String(body.certificateId || "").trim().toUpperCase();
    const invoiceNumber = String(body.invoiceNumber || "").trim();
    const provider = String(body.paymentProvider || "").trim().toUpperCase() === "AIRTEL" ? "AIRTEL" : "MTN";
    const phone = String(body.phone || body.accountIdentifier || "").trim();

    if (!certificateId || !invoiceNumber) {
      return NextResponse.json({ success: false, error: "Certificate and invoice are required." }, { status: 400 });
    }
    if (!iremboConfigured()) {
      return NextResponse.json({ success: false, error: "IremboPay is not configured on the server." }, { status: 503 });
    }

    await connectToDatabase();
    const cert = await Certificate.findOne({ certificateId });
    if (!cert) {
      return NextResponse.json({ success: false, error: "Certificate not found." }, { status: 404 });
    }
    if (String(cert.iremboInvoiceNumber || "") !== invoiceNumber) {
      return NextResponse.json({ success: false, error: "This invoice does not match the certificate." }, { status: 400 });
    }

    const started = await initiateIremboMomo({
      invoiceNumber,
      paymentProvider: provider,
      accountIdentifier: phone,
      transactionReference: `${certificateId}-${provider}`.slice(0, 40),
    });
    if (!started.success) {
      return NextResponse.json({ success: false, error: started.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Approve the payment on your phone with your Mobile Money PIN.",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Could not start Mobile Money payment.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
