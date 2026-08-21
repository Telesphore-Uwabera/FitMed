import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getIremboInvoice, verifyIremboSignature, channelFromIremboMethod } from "@/lib/iremboPay";
import { markCertificatePaid } from "@/lib/certificatePayment";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("irembopay-signature") || "";
  if (signature && !verifyIremboSignature(rawBody, signature)) {
    return NextResponse.json({ success: false, error: "Invalid IremboPay signature." }, { status: 401 });
  }

  try {
    const payload = JSON.parse(rawBody || "{}");
    const data = payload.data || payload;
    const invoiceNumber = String(data.invoiceNumber || "").trim();
    const transactionId = String(data.transactionId || "").trim();
    if (!invoiceNumber && !transactionId) {
      return NextResponse.json({ success: false, error: "Invoice missing." }, { status: 400 });
    }

    await connectToDatabase();
    const fetched = await getIremboInvoice(invoiceNumber || transactionId);
    const status = String(fetched.invoice?.paymentStatus || data.paymentStatus || "").toUpperCase();
    if (status !== "PAID") {
      return NextResponse.json({ success: true, ignored: true });
    }

    const invoice = fetched.invoice || data;
    await markCertificatePaid({
      invoiceNumber: String(invoice.invoiceNumber || invoiceNumber),
      transactionId: String(invoice.transactionId || transactionId),
      iremboRef: String(invoice.paymentReference || invoice.invoiceNumber || invoiceNumber),
      channel: channelFromIremboMethod(invoice.paymentMethod),
    });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Webhook failed.";
    console.error("IremboPay webhook error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
