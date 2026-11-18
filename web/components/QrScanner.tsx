"use client";

import { useEffect, useRef, useState } from "react";

export function QrScanner({ onScan }: { onScan: (value: string) => void }) {
  const id = useRef(`reader-${Math.random().toString(36).slice(2)}`);
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(true);

  function showScannerError(message: string) {
    setScanning(false);
    setError(message);
  }

  useEffect(() => {
    let active = true;
    let handled = false;
    let scanner: { stop: () => Promise<void>; clear: () => void } | undefined;
    import("html5-qrcode")
      .then(async ({ Html5Qrcode }) => {
        if (!active) return;
        const element = document.getElementById(id.current);
        if (!element) return;
        const instance = new Html5Qrcode(id.current);
        scanner = instance;
        try {
          await instance.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 240, height: 240 } }, (text) => {
            if (!active || handled) return;
            handled = true;
            setScanning(false);
            try {
              onScan(text);
            } catch (scanError) {
              showScannerError(
                scanError instanceof Error
                  ? `QR scan failed: ${scanError.message}`
                  : "The QR code could not be processed. Try scanning again."
              );
            }
          }, () => undefined);
        } catch {
          if (!active) return;
          showScannerError("Camera unavailable. Use manual card-code entry below.");
        }
      })
      .catch(() => {
        if (!active) return;
        showScannerError("QR scanner could not load. Use manual card-code entry below.");
      });
    return () => {
      active = false;
      if (!scanner) return;
      try {
        const stopping = scanner.stop();
        stopping
          .catch(() => undefined)
          .finally(() => {
            try {
              scanner?.clear();
            } catch {
              // The scanner may already be cleared during a route transition.
            }
          });
      } catch {
        try {
          scanner.clear();
        } catch {
          // The scanner may already be cleared during a route transition.
        }
      }
    };
  }, [onScan]);

  return (
    <div>
      <div className="relative">
        <div id={id.current} className="scanner-frame min-h-44 overflow-hidden rounded-xl border-4 border-white/80 shadow-inner" />
        {scanning && <p className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-950/75 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">Searching for QR…</p>}
      </div>
      {error && <p className="mt-2 text-sm font-semibold text-red-600">{error}</p>}
    </div>
  );
}
