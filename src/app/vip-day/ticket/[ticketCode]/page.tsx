// src/app/vip-day/ticket/[ticketCode]/page.tsx
"use client";

import { useEffect, useState, useRef, use } from "react";
import QRCode from "qrcode";
import { toPng } from "html-to-image";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Download, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  Loader2, 
  AlertCircle 
} from "lucide-react";
import Link from "next/link";
import { getVipPassAction } from "@/app/actions/vipDayAction";

export default function VipTicketPage({ params }: { params: Promise<{ ticketCode: string }> }) {
  const { ticketCode } = use(params);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadTicket() {
      const res = await getVipPassAction(ticketCode);
      if (res.success && res.data) {
        setData(res.data);
        const qr = await QRCode.toDataURL(res.data.ticketCode, {
          width: 320,
          margin: 1,
          color: {
            dark: "#111827",
            light: "#FFFFFF",
          },
        });
        setQrDataUrl(qr);
      } else {
        setError(res.error || "Unable to locate this ticket.");
      }
      setLoading(false);
    }
    loadTicket();
  }, [ticketCode]);

  const handleSaveToPhotos = async () => {
    if (!cardRef.current) return;
    try {
      setIsSaving(true);
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = `VIP-Day-Pass-${data?.ticketCode || "Ticket"}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to generate ticket image:", err);
      alert("Please take a screenshot of your pass to save it to your photos.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-slate-500 font-bold text-sm">
          <Loader2 className="w-6 h-6 animate-spin text-[#FF6B00]" />
          <span>Generating your VIP Day Pass...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-lg font-black text-slate-900">Pass Not Found</h2>
          <p className="text-xs text-slate-500 font-medium">{error || "Please verify your ticket code or register again."}</p>
          <Link
            href="/vip-day/register"
            className="inline-block px-5 py-2.5 rounded-xl bg-[#FF6B00] text-white text-xs font-black shadow-md shadow-orange-500/20"
          >
            Go to Registration
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8] py-8 sm:py-12 px-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-sm space-y-4">
        
        {/* Success Alert Banner */}
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-bold flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>You&apos;re officially registered! Present this pass at the door.</span>
        </div>

        {/* Exportable Pass Card */}
        <div 
          ref={cardRef}
          className="bg-white rounded-3xl border border-slate-200/80 shadow-lg overflow-hidden relative"
        >
          {/* Card Top Brand */}
          <div className="bg-gradient-to-r from-slate-900 via-orange-950 to-slate-900 p-5 text-white text-center space-y-1 relative overflow-hidden">
            <div className="absolute inset-0 bg-radial-gradient from-orange-500/20 via-transparent to-transparent" />
            <div className="relative z-10 flex flex-col items-center">
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-orange-300">
                <Sparkles className="w-3 h-3 text-[#FF6B00]" /> River of God Ortigas
              </span>
              <h1 className="text-xl font-black tracking-tight text-white mt-0.5">
                VIP Day 2026 Pass
              </h1>
              <p className="text-[11px] text-orange-200/80 font-medium">YOU BELONG HERE!</p>
            </div>
          </div>

          {/* Ticket Information Body */}
          <div className="p-6 space-y-5">
            {/* Guest Identifier */}
            <div className="text-center space-y-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">VIP Name</span>
              <h2 className="text-lg font-black text-[#111827]">{data.fullName}</h2>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-50 text-[11px] font-bold text-[#FF6B00] border border-orange-200/60 mt-1">
                <span>Discipler: {data.discipler}</span>
              </div>
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center p-3 bg-slate-50/80 rounded-2xl border border-slate-200/80">
              {qrDataUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={qrDataUrl} 
                  alt="VIP Ticket QR Code" 
                  className="w-48 h-48 rounded-xl shadow-xs" 
                />
              )}
              <span className="mt-2 text-xs font-mono font-black text-slate-600 tracking-wider">
                {data.ticketCode}
              </span>
            </div>

            {/* Event Time & Venue Chips */}
            <div className="space-y-1.5 pt-1 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-100 font-medium text-slate-600">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Calendar className="w-3.5 h-3.5 text-[#FF6B00]" /> Date
                </span>
                <span className="font-bold text-[#111827]">November 07, 2026</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100 font-medium text-slate-600">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-[#FF6B00]" /> Time
                </span>
                <span className="font-bold text-[#111827]">10:00 AM - 12:00 NN</span>
              </div>

              <div className="flex items-center justify-between py-1 font-medium text-slate-600">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-[#FF6B00]" /> Venue
                </span>
                <span className="font-bold text-[#111827]">River of God Ortigas</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            onClick={handleSaveToPhotos}
            disabled={isSaving}
            className="w-full py-3.5 rounded-2xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-black text-xs shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>Save Pass to Photos</span>
          </button>

          <p className="text-[11px] text-center text-slate-400 font-medium">
            Screenshot this pass or tap the button above to keep it handy offline.
          </p>
        </div>

      </div>
    </div>
  );
}