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
  UserCheck, 
  RefreshCw,
  Sparkles
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { 
  verifyScannerPinAction, 
  checkInVipGuestAction, 
  searchVipGuestAction 
} from "@/app/actions/vipDayAction";

export default function VipScanPage() {
  // Session State
  const [pin, setPin] = useState("");
  const [stationName, setStationName] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  // Scanner & UI State
  const [scanResult, setScanResult] = useState<{
    status: "SUCCESS" | "ALREADY_CHECKED_IN" | "NOT_FOUND" | "ERROR";
    guest?: any;
    error?: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Manual Lookup Fallback State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef(false);

  // Audio helper (AudioContext synthesized chimes, zero external assets needed)
  const playSound = (type: "success" | "warning" | "error") => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "success") {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
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
      // Audio playback blocked or unsupported
    }
  };

  // Restore saved station session
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

  // Handle PIN unlock
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

  const handleLogout = () => {
    stopCamera();
    localStorage.removeItem("vip_scan_pin");
    setIsUnlocked(false);
  };

  // Camera Lifecycle
  useEffect(() => {
    if (!isUnlocked) return;

    const qrScannerId = "qr-reader-container";
    const qrScanner = new Html5Qrcode(qrScannerId);
    html5QrCodeRef.current = qrScanner;

    const startCamera = async () => {
      try {
        await qrScanner.start(
          { facingMode: "environment" },
          { fps: 15, qrbox: { width: 240, height: 240 } },
          async (decodedText) => {
            if (isProcessing) return;
            handleCheckIn(decodedText);
          },
          () => {}
        );
        isScanningRef.current = true;
      } catch (err) {
        console.error("Camera start failed:", err);
      }
    };

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isUnlocked]);

  const stopCamera = () => {
    if (html5QrCodeRef.current && isScanningRef.current) {
      html5QrCodeRef.current.stop().catch(() => {}).finally(() => {
        isScanningRef.current = false;
      });
    }
  };

  // Process check-in (from camera or manual tap)
  const handleCheckIn = async (code: string) => {
    setIsProcessing(true);
    const res = await checkInVipGuestAction({
      ticketCode: code,
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

    // Auto-resume camera scanning after 1.8 seconds
    setTimeout(() => {
      setScanResult(null);
      setIsProcessing(false);
    }, 1800);
  };

  // Manual Search Handler
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
                placeholder="e.g. Entrance 1 / Judy"
                value={stationName}
                onChange={(e) => setStationName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs font-medium focus:outline-none focus:border-[#FF6B00]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white text-xs font-black uppercase tracking-wider transition-all"
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
        
        {/* Camera Viewfinder */}
        <div className="w-full aspect-square max-w-[320px] rounded-3xl overflow-hidden border-2 border-dashed border-orange-500/40 relative shadow-2xl bg-black flex items-center justify-center">
          <div id="qr-reader-container" className="w-full h-full object-cover" />

          {/* Crosshairs & Scanning Indicator */}
          {!scanResult && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-[#FF6B00] rounded-2xl relative">
                <span className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-white" />
                <span className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-white" />
                <span className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-white" />
                <span className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-white" />
              </div>
            </div>
          )}

          {/* Fullscreen Overlay Notification Card */}
          {scanResult && (
            <div
              className={`absolute inset-0 z-30 p-6 flex flex-col items-center justify-center text-center backdrop-blur-md transition-all ${
                scanResult.status === "SUCCESS"
                  ? "bg-emerald-950/90 text-white"
                  : scanResult.status === "ALREADY_CHECKED_IN"
                  ? "bg-amber-950/90 text-white"
                  : "bg-rose-950/90 text-white"
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
            </div>
          )}
        </div>

        <p className="text-xs text-slate-400 mt-4 text-center font-medium">
          Aim camera directly at the attendee&apos;s VIP QR ticket
        </p>

        {/* Emergency Search Fallback Drawer */}
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