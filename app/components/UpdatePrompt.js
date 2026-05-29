"use client";

import { useState, useEffect } from "react";

export default function UpdatePrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Listen for updates from the service worker
    const handler = (event) => {
      if (event.data?.type === "NEW_VERSION") {
        setShow(true);
      }
    };
    navigator.serviceWorker?.addEventListener("message", handler);

    // Also handle controllerchange (SW took over)
    const onControllerChange = () => setShow(true);
    navigator.serviceWorker?.addEventListener("controllerchange", onControllerChange);

    return () => {
      navigator.serviceWorker?.removeEventListener("message", handler);
      navigator.serviceWorker?.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  const handleRefresh = () => {
    setShow(false);
    window.location.reload();
  };

  if (!show) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-4 shadow-2xl flex items-center gap-3">
        <span className="text-xl">🔄</span>
        <div className="flex-1 min-w-0">
          <p className="text-[var(--text-primary)] font-semibold text-sm">New version available</p>
          <p className="text-[var(--text-muted)] text-[10px]">Refresh to see the latest updates</p>
        </div>
        <button onClick={handleRefresh} className="bg-[var(--accent-blue)] text-[var(--bg-primary)] font-bold text-xs px-4 py-2 rounded-full hover:bg-[var(--accent-blue-hover)] transition-colors flex-shrink-0">
          Refresh
        </button>
      </div>
    </div>
  );
}
