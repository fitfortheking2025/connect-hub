"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Download, X, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 1. Check if already installed in standalone mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) return;

    // 2. Check if user dismissed recently (within 7 days)
    const dismissedAt = localStorage.getItem("pwa_prompt_dismissed");
    if (dismissedAt) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) return;
    }

    // 3. iOS Detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isAppleDevice);

    if (isAppleDevice) {
      setShowPrompt(true);
      return;
    }

    // 4. Android / Chromium BeforeInstallPrompt listener
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa_prompt_dismissed", Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <aside
      aria-label="Install Application"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-3xl border border-slate-700/80 shadow-2xl flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-2xl overflow-hidden bg-white/10 p-1 shrink-0 border border-white/10">
              <Image
                src="/connect-hub.png"
                alt="Connect Hub"
                fill
                className="object-contain p-0.5"
              />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Install Connect Hub</h2>
              <p className="text-[11px] text-slate-400">
                Install as a mobile app for instant access
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            aria-label="Dismiss install prompt"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isIOS ? (
          <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700 text-xs text-slate-300 flex items-center gap-2">
            <Share className="w-4 h-4 text-[#FF6B00] shrink-0" />
            <span>
              Tap <strong className="text-white">Share</strong>, then select{" "}
              <strong className="text-white">Add to Home Screen</strong>.
            </span>
          </div>
        ) : (
          <button
            onClick={handleInstallClick}
            className="w-full py-2.5 px-4 bg-[#FF6B00] hover:bg-[#e05e00] text-white text-xs font-bold rounded-2xl flex items-center justify-center gap-2 transition-transform active:scale-[0.99] shadow-lg shadow-orange-500/20"
          >
            <Download className="w-4 h-4" /> Install on this Phone
          </button>
        )}
      </div>
    </aside>
  );
}