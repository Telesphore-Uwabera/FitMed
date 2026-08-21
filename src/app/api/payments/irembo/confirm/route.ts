import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getIremboInvoice, channelFromIremboMethod } from "@/lib/iremboPay";
import { markCertificatePaid } from "@/lib/certificatePayment";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const certificateId = String(body.certificateId || "").trim().toUpperCase();
    const invoiceNumber = String(body.invoiceNumber || "").trim();
    const reference = invoiceNumber || certificateId;
    if (!reference) {
      return NextResponse.json({ success: false, error: "Invoice or certificate is required." }, { status: 400 });
    }

    await connectToDatabase();
    const fetched = await getIremboInvoice(reference);
    if (!fetched.success || !fetched.invoice) {
      return NextResponse.json({ success: false, error: fetched.error || "Could not verify IremboPay." }, { status: 400 });
    }
    if (String(fetched.invoice.paymentStatus || "").toUpperCase() !== "PAID") {
      return NextResponse.json({ success: false, error: "IremboPay has not confirmed this payment yet." }, { status: 400 });
    }

    const result = await markCertificatePaid({
      certificateId,
      invoiceNumber: fetched.invoice.invoiceNumber,
      transactionId: fetched.invoice.transactionId,
      iremboRef: String(fetched.invoice.paymentReference || fetched.invoice.invoiceNumber),
      channel: channelFromIremboMethod(fetched.invoice.paymentMethod),
    });
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 404 });
    }
    return NextResponse.json({ success: true, certificate: result.certificate, alreadyPaid: result.alreadyPaid });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Could not confirm IremboPay payment.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
