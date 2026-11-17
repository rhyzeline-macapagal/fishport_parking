"use client";

import { useEffect, useRef, useState } from "react";

export function QrScanner({ onScan }: { onScan: (value: string) => void }) {
  const id = useRef(`reader-${Math.random().toString(36).slice(2)}`);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    let scanner: { stop: () => Promise<void>; clear: () => void } | undefined;
    import("html5-qrcode").then(async ({ Html5Qrcode }) => {
      if (!active) return;
      const instance = new Html5Qrcode(id.current);
      scanner = instance;
      try {
        await instance.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 240, height: 240 } }, (text) => {
          if (!active) return;
          onScan(text);
          instance.stop().catch(() => undefined);
        }, () => undefined);
      } catch {
        if (!active) return;
        setError("Camera unavailable. Use manual card-code entry below.");
      }
    });
    return () => {
      active = false;
      if (!scanner) return;
      scanner.stop()
        .catch(() => undefined)
        .finally(() => {
          try {
            scanner?.clear();
          } catch {
            // The scanner may already be cleared during a route transition.
          }
        });
    };
  }, [onScan]);

  return <div><div id={id.current} className="scanner-frame min-h-44 overflow-hidden rounded-xl border-4 border-white/80 shadow-inner" />{error && <p className="mt-2 text-sm text-red-600">{error}</p>}</div>;
}
