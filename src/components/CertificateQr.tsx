"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function CertificateQr({ value, label }: { value: string; label?: string }) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    if (!value) return;
    let active = true;
    QRCode.toDataURL(value, {
      width: 240,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#0B2D5C", light: "#ffffff" },
    })
      .then((url) => {
        if (active) setSrc(url);
      })
      .catch(() => {
        if (active) {
          setSrc(
            `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(value)}`
          );
        }
      });
    return () => {
      active = false;
    };
  }, [value]);

  if (!src) {
    return <div className="w-full h-full bg-slate-100 animate-pulse rounded" />;
  }

  return <img src={src} alt={label || "Scan to open this certificate"} className="w-full h-full object-contain" />;
}
