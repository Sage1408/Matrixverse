"use client";

import { useState, useEffect } from "react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setShow(false);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === "accepted") setShow(false);
    setDeferredPrompt(null);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:bottom-4 md:left-auto md:right-4 md:w-80">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-4 shadow-2xl flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00D4FF] to-[#7C3AED] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
          M
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[var(--text-primary)] font-semibold text-sm">Install MatrixVerse</p>
          <p className="text-[var(--text-muted)] text-[10px]">Add to home screen for the best experience</p>
        </div>
        <button onClick={handleInstall} className="bg-[var(--accent-blue)] text-[var(--bg-primary)] font-bold text-xs px-4 py-2 rounded-full hover:bg-[var(--accent-blue-hover)] transition-colors flex-shrink-0">
          Install
        </button>
        <button onClick={() => setShow(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm flex-shrink-0">✕</button>
      </div>
    </div>
  );
}
