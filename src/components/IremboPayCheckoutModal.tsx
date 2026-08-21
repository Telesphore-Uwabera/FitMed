"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Copy, CreditCard, X } from "lucide-react";

const FEE_RWF = 5000;

function momoUssdCode(provider: "MTN" | "AIRTEL", invoiceNumber: string) {
  const invoice = String(invoiceNumber || "").trim();
  return provider === "AIRTEL" ? `*182*4*5*1*${invoice}#` : `*182*3*7*${invoice}#`;
}

type PayMethod = "mtn" | "airtel" | "card";
type CertToPay = { id: string; doctor?: string; purpose?: string };

function formatRwf(amount: number) {
  return `${amount.toLocaleString("en-US")} RWF`;
}

function MtnMark() {
  return (
    <span className="w-8 h-8 rounded-full bg-[#ffcb05] text-[#004f9f] text-[9px] font-black flex items-center justify-center shrink-0">
      MTN
    </span>
  );
}

function AirtelMark() {
  return (
    <span className="w-8 h-8 rounded-full bg-[#e4002b] text-white text-[8px] font-black flex items-center justify-center shrink-0">
      airtel
    </span>
  );
}

export default function IremboPayCheckoutModal({
  cert,
  onClose,
  onPaid,
  onError,
}: {
  cert: CertToPay;
  onClose: () => void;
  onPaid: (txRef: string) => void;
  onError: (title: string, message: string) => void;
}) {
  const [method, setMethod] = useState<PayMethod>("mtn");
  const [phone, setPhone] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [widgetSrc, setWidgetSrc] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [paymentLink, setPaymentLink] = useState("");
  const [loadingInvoice, setLoadingInvoice] = useState(true);
  const [busy, setBusy] = useState(false);
  const [waitingPin, setWaitingPin] = useState(false);
  const [copied, setCopied] = useState(false);
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardMm, setCardMm] = useState("");
  const [cardYy, setCardYy] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const amountLabel = formatRwf(FEE_RWF);
  const ussd = invoiceNumber ? momoUssdCode(method === "airtel" ? "AIRTEL" : "MTN", invoiceNumber) : "";

  const confirmPaid = useCallback(async () => {
    const res = await fetch("/api/payments/irembo/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ certificateId: cert.id, invoiceNumber }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) return false;
    onPaid(String(data.certificate?.iremboRef || invoiceNumber));
    return true;
  }, [cert.id, invoiceNumber, onPaid]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/payments/irembo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ certificateId: cert.id }),
        });
        const data = await res.json().catch(() => ({}));
        if (!active) return;
        if (!res.ok || !data.success) {
          onError("IremboPay not started", data.error || "Could not open checkout.");
          onClose();
          return;
        }
        if (data.alreadyPaid) {
          onPaid(String(data.invoice?.paymentReference || data.invoice?.invoiceNumber || ""));
          return;
        }
        setInvoiceNumber(String(data.invoice?.invoiceNumber || ""));
        setPaymentLink(String(data.invoice?.paymentLinkUrl || ""));
        setPublicKey(String(data.checkout?.publicKey || ""));
        setWidgetSrc(String(data.checkout?.widgetSrc || ""));
      } catch {
        if (active) {
          onError("IremboPay not started", "Could not reach FitMed.");
          onClose();
        }
      } finally {
        if (active) setLoadingInvoice(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [cert.id, onClose, onError, onPaid]);

  useEffect(() => {
    if (!waitingPin || !invoiceNumber) return;
    let attempts = 0;
    const timer = setInterval(async () => {
      attempts += 1;
      const paid = await confirmPaid();
      if (paid || attempts >= 40) {
        clearInterval(timer);
        setWaitingPin(false);
        setBusy(false);
        if (!paid && attempts >= 40) {
          onError("Payment pending", "Approve the PIN prompt on your phone, then tap Pay again if needed.");
        }
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [waitingPin, invoiceNumber, confirmPaid, onError]);

  const copyUssd = async () => {
    if (!ussd) return;
    try {
      await navigator.clipboard.writeText(ussd);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      onError("Copy failed", "Select the USSD code and copy it manually.");
    }
  };

  const startCardWidget = () => {
    const pay = (window as typeof window & { IremboPay?: any }).IremboPay;
    if (pay && publicKey && invoiceNumber) {
      pay.initiate({
        publicKey,
        invoiceNumber,
        locale: pay.locale?.EN || "EN",
        callback: async (err: unknown) => {
          if (err) {
            onError("Payment not completed", "Finish card payment with IremboPay to unlock the certificate.");
            setBusy(false);
            return;
          }
          pay.closeModal?.();
          const paid = await confirmPaid();
          setBusy(false);
          if (!paid) onError("Payment pending", "Complete card payment, then return here.");
        },
      });
      return;
    }
    if (paymentLink) {
      window.location.href = paymentLink;
      return;
    }
    onError("IremboPay unavailable", "Card checkout could not open.");
    setBusy(false);
  };

  const payMomo = async () => {
    if (!invoiceNumber) return;
    setBusy(true);
    try {
      const res = await fetch("/api/payments/irembo/momo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          certificateId: cert.id,
          invoiceNumber,
          paymentProvider: method === "airtel" ? "AIRTEL" : "MTN",
          phone,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        onError("Payment not started", data.error || "Check the phone number and try again.");
        setBusy(false);
        return;
      }
      setWaitingPin(true);
    } catch {
      onError("Payment not started", "Could not reach FitMed.");
      setBusy(false);
    }
  };

  const payCard = () => {
    setBusy(true);
    if (typeof window !== "undefined" && (window as typeof window & { IremboPay?: unknown }).IremboPay) {
      startCardWidget();
      return;
    }
    if (!widgetSrc) {
      startCardWidget();
      return;
    }
    const script = document.createElement("script");
    script.src = widgetSrc;
    script.async = true;
    script.onload = startCardWidget;
    script.onerror = () => startCardWidget();
    document.body.appendChild(script);
  };

  const methods: { id: PayMethod; label: string; icon: ReactNode }[] = [
    { id: "mtn", label: "MTN Mobile Money", icon: <MtnMark /> },
    { id: "airtel", label: "Airtel Money", icon: <AirtelMark /> },
    {
      id: "card",
      label: "Debit / Credit card",
      icon: (
        <span className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0">
          <CreditCard className="w-4 h-4" />
        </span>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-[860px] w-full shadow-2xl relative text-slate-800 overflow-hidden">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-2 rounded-md hover:bg-slate-100 text-slate-500"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid md:grid-cols-[280px_1fr] min-h-[420px]">
          <div className="bg-[#f6f7f9] border-b md:border-b-0 md:border-r border-slate-200">
            <h3 className="px-5 pt-6 pb-3 text-[17px] font-bold text-slate-900">How would you like to pay?</h3>
            <div className="flex flex-col">
              {methods.map((item) => {
                const active = method === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMethod(item.id)}
                    className={`flex items-center gap-3 px-5 py-3.5 text-left text-sm font-semibold transition-colors ${
                      active ? "bg-[#eceff3] text-slate-900" : "text-slate-700 hover:bg-slate-100/80"
                    } ${item.id === "airtel" && active ? "border-l-[3px] border-l-[#e4002b]" : active ? "border-l-[3px] border-l-slate-400" : "border-l-[3px] border-l-transparent"}`}
                  >
                    {item.icon}
                    <span className="flex-1">{item.label}</span>
                    <span className="text-slate-400 text-lg leading-none">›</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-5 sm:p-7 flex flex-col">
            {loadingInvoice ? (
              <p className="text-sm text-slate-500 py-10 text-center">Preparing IremboPay checkout…</p>
            ) : method !== "card" ? (
              <div className="space-y-6 flex-1">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-800">
                    Option 1: Enter your {method === "airtel" ? "AIRTEL Money" : "MTN MoMo"} phone number
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="tel"
                      inputMode="numeric"
                      placeholder={method === "airtel" ? "ex: 072xxxxxxx" : "ex: 078/9xxxxxx"}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="flex-1 px-3 py-2.5 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                    <button
                      type="button"
                      disabled={busy || !phone.trim()}
                      onClick={payMomo}
                      className="px-5 py-2.5 rounded-md bg-[#3dcc4a] hover:bg-[#2db83a] text-white font-bold text-sm whitespace-nowrap disabled:opacity-50"
                    >
                      {waitingPin ? "Waiting for PIN…" : `Pay ${amountLabel}`}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">
                    After you press pay, you will be prompted to submit your Mobile Money PIN on your phone to complete the
                    payment.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-800">
                    Option 2: Dial this on your {method === "airtel" ? "AIRTEL" : "MTN"} phone to pay
                  </p>
                  <div className="flex items-center gap-2 rounded-md bg-[#f3f4f6] px-3 py-2.5">
                    <p className="flex-1 font-mono text-sm text-slate-800 break-all">
                      {ussd.split(invoiceNumber).map((part, idx, arr) => (
                        <span key={`${part}-${idx}`}>
                          {part}
                          {idx < arr.length - 1 ? (
                            <span className="inline-block mx-0.5 px-1 rounded border-2 border-[#3dcc4a] font-bold">
                              {invoiceNumber}
                            </span>
                          ) : null}
                        </span>
                      ))}
                    </p>
                    <button
                      type="button"
                      onClick={copyUssd}
                      className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-slate-200 text-xs font-semibold text-slate-700"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 flex-1">
                <p className="text-sm font-bold text-slate-900">Enter your card details to pay:</p>
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-slate-600">Card holder&apos;s name</span>
                  <input
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="Enter the name on card"
                    className="w-full px-3 py-2.5 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-slate-600">Card number</span>
                  <div className="relative">
                    <input
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="ACCT-000015"
                      className="w-full px-3 py-2.5 pr-20 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] font-black text-slate-400">
                      VISA · MC
                    </span>
                  </div>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-600">Expiry Date</span>
                    <div className="flex gap-2">
                      <input
                        value={cardMm}
                        onChange={(e) => setCardMm(e.target.value.replace(/\D/g, "").slice(0, 2))}
                        placeholder="MM"
                        className="w-full px-3 py-2.5 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                      <input
                        value={cardYy}
                        onChange={(e) => setCardYy(e.target.value.replace(/\D/g, "").slice(0, 2))}
                        placeholder="YY"
                        className="w-full px-3 py-2.5 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                    </div>
                  </div>
                  <label className="block space-y-1">
                    <span className="text-xs font-semibold text-slate-600">CVV</span>
                    <input
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="123"
                      className="w-full px-3 py-2.5 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={payCard}
                  className="w-full py-3 rounded-md bg-[#3dcc4a] hover:bg-[#2db83a] text-white font-bold text-sm disabled:opacity-50"
                >
                  {busy ? "Opening secure card pay…" : `Pay ${amountLabel}`}
                </button>
                <p className="text-[11px] text-slate-500">
                  Card details are processed by IremboPay (PCI DSS). FitMed does not store your card number.
                </p>
              </div>
            )}

            <div className="mt-auto pt-6 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
              <p>
                Powered by <span className="font-bold text-slate-700">iremboPay</span>
              </p>
              <div className="flex items-center gap-4">
                <span>Regulated by BNR</span>
                <span className="font-bold tracking-wide">PCI DSS</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
