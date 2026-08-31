// src/app/components/PullToRefresh.tsx
"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

interface PullToRefreshProps {
  children: React.ReactNode;
}

export default function PullToRefresh({ children }: PullToRefreshProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const startY = useRef(0);
  const isDragging = useRef(false);

  const PULL_THRESHOLD = 70;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
      isDragging.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || isRefreshing || window.scrollY > 0) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;

    if (diff > 0) {
      const dampedDistance = Math.min(diff * 0.45, PULL_THRESHOLD + 20);
      setPullDistance(dampedDistance);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;

    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(PULL_THRESHOLD * 0.8);

      startTransition(() => {
        router.refresh();
        setTimeout(() => {
          setIsRefreshing(false);
          setPullDistance(0);
        }, 800);
      });
    } else {
      setPullDistance(0);
    }
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative min-h-screen"
    >
      {/* Pull Indicator Spinner */}
      {pullDistance > 0 && (
        <div
          style={{
            transform: `translate3d(-50%, ${pullDistance - 50}px, 0)`,
            opacity: Math.min(pullDistance / PULL_THRESHOLD, 1),
          }}
          className="fixed left-1/2 top-4 z-50 pointer-events-none transition-transform duration-100 ease-out"
        >
          <div className="h-10 w-10 rounded-full bg-white border border-slate-200/80 shadow-xl flex items-center justify-center text-[#FF6B00]">
            <RefreshCw
              className={`w-5 h-5 transition-transform duration-200 ${
                isRefreshing || isPending ? "animate-spin" : ""
              }`}
              style={{
                transform: isRefreshing || isPending ? undefined : `rotate(${pullDistance * 4}deg)`,
              }}
            />
          </div>
        </div>
      )}

      {/* Main Layout Container - Transform is only applied when pulling */}
      <div
        style={
          pullDistance > 0
            ? {
                transform: `translate3d(0, ${pullDistance * 0.4}px, 0)`,
                transition: isDragging.current ? "none" : "transform 0.25s ease-out",
              }
            : undefined
        }
      >
        {children}
      </div>
    </div>
  );
}