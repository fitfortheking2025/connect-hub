"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function SplashScreen() {
  const [show, setShow] = useState<boolean>(true);
  const [fadeOut, setFadeOut] = useState<boolean>(false);

  useEffect(() => {
    // 1. Hold on screen for 3.5 seconds
    const timer = setTimeout(() => {
      setFadeOut(true);

      // 2. Remove component after 800ms fade transition
      setTimeout(() => {
        setShow(false);
      }, 500);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between bg-gradient-to-b from-[#FFA14A] via-[#FF7A00] to-[#E65100] transition-opacity duration-800 ease-in-out select-none ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Top Spacer */}
      <div className="w-full h-12" />

      {/* Center Brand Identity */}
      <div className="flex flex-col items-center text-center px-6 animate-in fade-in zoom-in-95 duration-1000">
        {/* Glow & Logo Box */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-white/30 rounded-full blur-2xl scale-125" />
          <div className="relative h-28 w-28 md:h-36 md:w-36 bg-white rounded-[36px] shadow-2xl shadow-orange-950/30 p-4 flex items-center justify-center">
            <Image
              src="/connect-hub.png"
              alt="Connect Hub"
              width={110}
              height={110}
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-md">
          Connect Hub
        </h1>

        {/* Tagline */}
        <p className="mt-3 text-xs md:text-sm font-extrabold text-white/95 uppercase tracking-[0.25em] drop-shadow-sm">
          Connect. Belong. Grow.
        </p>

        {/* Loading Dots */}
        <div className="mt-8 flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-white/90 animate-bounce [animation-delay:-0.3s]" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/90 animate-bounce [animation-delay:-0.15s]" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/90 animate-bounce" />
        </div>
      </div>

      {/* Responsive Silhouette Graphics */}
      <div className="relative w-full overflow-hidden flex flex-col items-center">
        {/* Sun Glow Behind Mountain */}
        <div className="w-64 h-64 md:w-80 md:h-80 rounded-full bg-[#FFAE5C]/30 blur-2xl absolute -bottom-10" />

        {/* Vector Landscape Contour */}
        <svg
          className="w-full h-32 md:h-48 text-[#B83E00]/40 fill-current"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <path d="M0,224L48,208C96,192,192,160,288,165.3C384,171,480,213,576,213.3C672,213,768,171,864,160C960,149,1056,171,1152,192C1248,213,1344,235,1392,245.3L1440,256L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
        </svg>

        {/* Base Layer */}
        <div className="w-full bg-[#8A2E00]/60 h-6 md:h-10" />
      </div>
    </div>
  );
}