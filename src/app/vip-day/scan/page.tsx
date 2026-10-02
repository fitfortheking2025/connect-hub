// src/app/vip-day/scan/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Camera, 
  QrCode, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Search, 
  Lock, 
  LogOut, 
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { 
  verifyScannerPinAction, 
  checkInVipGuestAction, 
  searchVipGuestAction 
} from "@/app/actions/vipDayAction";

export default function VipScanPage() {
  const [pin, setPin] = useState("");
  const [stationName, setStationName] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [scanResult, setScanResult] = useState<{
    status: "SUCCESS" | "ALREADY_CHECKED_IN" | "NOT_FOUND" | "ERROR";
    guest?: any;
    error?: string;
  } | null>(null);

  // Manual Lookup Fallback State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef(false);

  // SYNCHRONOUS LOCKS to prevent frame racing
  const isLockedRef = useRef(false);
  const lastScannedCodeRef = useRef<string | null>(null);
  const lastScannedTimeRef = useRef<number>(0);

  const playSound = (type: "success" | "warning" | "error") => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "success") {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === "warning") {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.setValueAtTime(370, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }

      if ("vibrate" in navigator) {
        if (type === "success") navigator.vibrate(100);
        else if (type === "warning") navigator.vibrate([100, 50, 100]);
        else navigator.vibrate(300);
      }
    } catch {
      // Audio autoplay policy
    }
  };

  useEffect(() => {
    const savedPin = localStorage.getItem("vip_scan_pin");
    const savedStation = localStorage.getItem("vip_station_name") || "Entrance 1";
    if (savedPin) {
      verifyScannerPinAction(savedPin).then((res) => {
        if (res.success) {
          setPin(savedPin);
          setStationName(savedStation);
          setIsUnlocked(true);
        }
      });
    }
  }, []);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    const res = await verifyScannerPinAction(pin);
    if (res.success) {
      localStorage.setItem("vip_scan_pin", pin.trim());
      localStorage.setItem("vip_station_name", stationName.trim() || "Entrance");
      setIsUnlocked(true);
    } else {
      setPinError("Invalid Event PIN. Please check with your team coordinator.");
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current && isScanningRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        isScanningRef.current = false;
      } catch (err) {
        console.warn("Camera stop error:", err);
      }
    }
  };

  const handleLogout = () => {
    stopCamera();
    localStorage.removeItem("vip_scan_pin");
    setIsUnlocked(false);
  };

  // Process check-in with synchronous debouncing & cooldown
  const handleCheckIn = async (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    const now = Date.now();

    // 1. If currently busy processing a check-in, drop frame
    if (isLockedRef.current) return;

    // 2. Cooldown check: ignore the exact same QR code if scanned within the last 4 seconds
    if (lastScannedCodeRef.current === cleanCode && now - lastScannedTimeRef.current < 4000) {
      return;
    }

    // Instantly lock before any async gap
    isLockedRef.current = true;
    lastScannedCodeRef.current = cleanCode;
    lastScannedTimeRef.current = now;

    try {
      const res = await checkInVipGuestAction({
        ticketCode: cleanCode,
        stationName: stationName || "Door Scanner",
        pin,
      });

      if (res.status === "SUCCESS") {
        playSound("success");
        setScanResult({ status: "SUCCESS", guest: res.guest });
      } else if (res.status === "ALREADY_CHECKED_IN") {
        playSound("warning");
        setScanResult({ status: "ALREADY_CHECKED_IN", guest: res.guest });
      } else {
        playSound("error");
        setScanResult({ status: "NOT_FOUND", error: res.error || "Ticket not found." });
      }
    } catch {
      playSound("error");
      setScanResult({ status: "ERROR", error: "Network or server connection issue." });
    } finally {
      // Hold screen notification for 2.2 seconds before allowing the next unique scan
      setTimeout(() => {
        setScanResult(null);
        isLockedRef.current = false;
      }, 2200);
    }
  };

  // Camera setup
  useEffect(() => {
    if (!isUnlocked) return;

    let mounted = true;
    const qrScannerId = "qr-reader-container";

    const initScanner = async () => {
      try {
        setCameraError(null);
        const qrScanner = new Html5Qrcode(qrScannerId, {
          verbose: false,
          formatsToSupport: [0],
        });
        html5QrCodeRef.current = qrScanner;

        const cameras = await Html5Qrcode.getCameras();
        if (!cameras || cameras.length === 0) {
          if (mounted) setCameraError("No camera detected on this device.");
          return;
        }

        const backCamera = cameras.find(
          (c) =>
            c.label.toLowerCase().includes("back") ||
            c.label.toLowerCase().includes("rear") ||
            c.label.toLowerCase().includes("environment")
        );
        const selectedCameraId = backCamera ? backCamera.id : cameras[cameras.length - 1].id;

        const config = {
          fps: 15,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            return {
              width: Math.floor(minEdge * 0.75),
              height: Math.floor(minEdge * 0.75),
            };
          },
          aspectRatio: 1.0,
        };

        await qrScanner.start(
          selectedCameraId,
          config,
          (decodedText) => {
            // Drop immediately if lock is engaged
            if (isLockedRef.current) return;
            handleCheckIn(decodedText);
          },
          () => {}
        );

        if (mounted) {
          isScanningRef.current = true;
          const videoElement = document.querySelector<HTMLVideoElement>(`#${qrScannerId} video`);
          if (videoElement) {
            videoElement.setAttribute("playsinline", "true");
            videoElement.setAttribute("webkit-playsinline", "true");
            videoElement.muted = true;
            videoElement.play().catch(() => {});
          }
        }
      } catch (err: any) {
        console.error("Camera startup error:", err);
        if (mounted) {
          setCameraError(
            err?.message?.includes("Permission") || err?.name === "NotAllowedError"
              ? "Camera permission denied. Please allow camera access in browser settings."
              : "Unable to start camera. Please verify permissions."
          );
        }
      }
    };

    const timer = setTimeout(() => {
      initScanner();
    }, 250);

    return () => {
      mounted = false;
      clearTimeout(timer);
      stopCamera();
    };
  }, [isUnlocked]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    const res = await searchVipGuestAction(searchQuery, pin);
    if (res.success) {
      setSearchResults(res.results || []);
    }
    setIsSearching(false);
  };

  // 1. PIN Lock Screen
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-white flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-[#1E293B] rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl space-y-6">
          <div className="text-center space-y-1.5">
            <div className="w-12 h-12 rounded-2xl bg-[#FF6B00]/20 border border-[#FF6B00]/30 text-[#FF6B00] flex items-center justify-center mx-auto mb-2">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-black tracking-tight">Door Scanner Access</h1>
            <p className="text-xs text-slate-400">
              Enter the VIP Day event PIN to unlock continuous scanning.
            </p>
          </div>

          {pinError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
              {pinError}
            </div>
          )}

          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Event PIN (Default: 2026)
              </label>
              <input
                type="password"
                inputMode="numeric"
                required
                placeholder="4-digit PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-white font-mono text-center tracking-[0.4em] text-lg font-black focus:outline-none focus:border-[#FF6B00]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Scanner Station / Volunteer Name
              </label>
              <input
                type="text"
                placeholder="e.g. Rashil"
                value={stationName}
                onChange={(e) => setStationName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-medium focus:outline-none focus:border-[#FF6B00]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
            >
              Unlock Scanner
            </button>
          </form>

          <p className="text-[11px] text-center text-slate-500">
            River of God Ortigas &bull; Connect Hub
          </p>
        </div>
      </div>
    );
  }

  // 2. Active Fast-Scanning Screen
  return (
    <div className="min-h-screen bg-[#090D16] text-white flex flex-col justify-between selection:bg-[#FF6B00]">
      {/* Top Status Bar */}
      <header className="px-4 py-3.5 bg-[#121824] border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <div>
            <span className="text-xs font-black tracking-wide text-white block">
              VIP Door Scanner
            </span>
            <span className="text-[10px] text-slate-400 font-mono block">
              Station: {stationName || "Entrance"}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white text-xs flex items-center gap-1.5"
          title="Lock Scanner"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold uppercase">Exit</span>
        </button>
      </header>

      {/* Main Viewfinder Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 max-w-md mx-auto w-full relative">
        
        {cameraError && (
          <div className="w-full mb-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{cameraError}</span>
          </div>
        )}

        {/* Camera Container */}
        <div className="w-full aspect-square max-w-[320px] rounded-3xl overflow-hidden border-2 border-dashed border-orange-500/40 relative shadow-2xl bg-black flex items-center justify-center">
          <div id="qr-reader-container" className="w-full h-full [&_video]:object-cover [&_video]:w-full [&_video]:h-full" />

          {/* Crosshairs & Scanning Indicator */}
          {!scanResult && !cameraError && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-[#FF6B00] rounded-2xl relative shadow-[0_0_20px_rgba(255,107,0,0.3)]">
                <span className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-white" />
                <span className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-white" />
                <span className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-white" />
                <span className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-white" />
              </div>
            </div>
          )}

          {/* Result Notification Card */}
          {scanResult && (
            <div
              className={`absolute inset-0 z-30 p-6 flex flex-col items-center justify-center text-center backdrop-blur-md transition-all ${
                scanResult.status === "SUCCESS"
                  ? "bg-emerald-950/95 text-white"
                  : scanResult.status === "ALREADY_CHECKED_IN"
                  ? "bg-amber-950/95 text-white"
                  : "bg-rose-950/95 text-white"
              }`}
            >
              {scanResult.status === "SUCCESS" && (
                <>
                  <CheckCircle2 className="w-16 h-16 text-emerald-400 mb-2 animate-bounce" />
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
                    Verified &bull; Welcome!
                  </span>
                  <h2 className="text-xl font-black mt-1 text-white">{scanResult.guest?.fullName}</h2>
                  <p className="text-xs text-emerald-200 mt-1">Discipler: {scanResult.guest?.discipler}</p>
                </>
              )}

              {scanResult.status === "ALREADY_CHECKED_IN" && (
                <>
                  <AlertTriangle className="w-16 h-16 text-amber-400 mb-2" />
                  <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                    Already Checked In
                  </span>
                  <h2 className="text-lg font-black mt-1 text-white">{scanResult.guest?.fullName}</h2>
                  <p className="text-[11px] text-amber-200 mt-1">
                    Scanned at{" "}
                    {new Date(scanResult.guest?.attendedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    by {scanResult.guest?.scannedBy || "Scanner"}
                  </p>
                </>
              )}

              {scanResult.status === "NOT_FOUND" && (
                <>
                  <XCircle className="w-16 h-16 text-rose-400 mb-2" />
                  <span className="text-xs font-black uppercase tracking-wider text-rose-300">
                    Invalid Pass
                  </span>
                  <p className="text-xs text-rose-200 mt-1">
                    {scanResult.error || "No registered guest matches this code."}
                  </p>
                </>
              )}

              {scanResult.status === "ERROR" && (
                <>
                  <AlertCircle className="w-16 h-16 text-rose-400 mb-2" />
                  <span className="text-xs font-black uppercase tracking-wider text-rose-300">
                    Scan Error
                  </span>
                  <p className="text-xs text-rose-200 mt-1">{scanResult.error}</p>
                </>
              )}
            </div>
          )}
        </div>

        <p className="text-xs text-slate-400 mt-4 text-center font-medium">
          Aim camera directly at the attendee&apos;s VIP QR ticket
        </p>

        {/* Manual Search Fallback Drawer */}
        <div className="w-full mt-6 bg-[#161D2C] p-4 rounded-2xl border border-white/10 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-[#FF6B00]" /> Manual Search Fallback
            </span>
            <span className="text-[10px] text-slate-500">Phone died or cracked screen</span>
          </div>

          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="Search name or contact..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs font-medium text-white focus:outline-none focus:border-[#FF6B00]"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="px-3.5 py-2 rounded-xl bg-[#FF6B00] text-xs font-bold text-white uppercase tracking-wider"
            >
              {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Find"}
            </button>
          </form>

          {/* Search Result Matches */}
          {searchResults.length > 0 && (
            <div className="max-h-44 overflow-y-auto divide-y divide-white/5 pt-1">
              {searchResults.map((guest) => (
                <div key={guest.ticketCode} className="py-2 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">{guest.fullName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {guest.contactNumber} &bull; Disc: {guest.discipler}
                    </div>
                  </div>
                  <button
                    onClick={() => handleCheckIn(guest.ticketCode)}
                    disabled={guest.status === "ATTENDED"}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                      guest.status === "ATTENDED"
                        ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                        : "bg-[#FF6B00] text-white hover:bg-orange-600"
                    }`}
                  >
                    {guest.status === "ATTENDED" ? "Present" : "Check In"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}