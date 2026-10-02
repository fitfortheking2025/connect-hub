// src/app/vip-day/register/page.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Heart, 
  User, 
  Users, 
  ArrowRight, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  Hash
} from "lucide-react";
import { registerVipDayAction } from "@/app/actions/vipDayAction";

export default function VipDayRegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [discipler, setDiscipler] = useState("");
  const [gender, setGender] = useState<number | null>(null); // 1 = Male, 2 = Female
  const [age, setAge] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, "");
    
    if (raw.startsWith("63")) {
      raw = raw.slice(2);
    }
    if (raw.startsWith("0")) {
      raw = raw.slice(1);
    }
    
    if (raw.length <= 10) {
      setContactNumber(raw);
      if (errorMsg) setErrorMsg(null);
    }
  };

  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (raw.length <= 2) {
      setAge(raw);
      if (errorMsg) setErrorMsg(null);
    }
  };

  const fullNormalizedNumber = contactNumber ? `0${contactNumber}` : "";
  const isContactValid = contactNumber.length === 10 && contactNumber.startsWith("9");
  const isContactStarted = contactNumber.length > 0;
  const parsedAge = parseInt(age, 10);
  const isFormValid =
    fullName.trim().length > 0 &&
    isContactValid &&
    discipler.trim().length > 0 &&
    gender !== null &&
    !isNaN(parsedAge) &&
    parsedAge >= 10 &&
    parsedAge <= 99;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim() || !contactNumber.trim() || !discipler.trim() || !gender || !parsedAge) {
      setErrorMsg("Please fill out all the fields below to get your pass.");
      return;
    }

    if (!isContactValid) {
      setErrorMsg("Please enter a valid 10-digit mobile number starting with 9.");
      return;
    }

    if (parsedAge < 10 || parsedAge > 99) {
      setErrorMsg("Please enter a valid age.");
      return;
    }

    startTransition(async () => {
      const res = await registerVipDayAction({
        fullName,
        contactNumber: fullNormalizedNumber,
        discipler,
        age: parsedAge,
        gender,
      });

      if (res.success && res.ticketCode) {
        router.push(`/vip-day/ticket/${res.ticketCode}`);
      } else {
        setErrorMsg(res.error || "Unable to submit your registration. Please try again.");
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-8 sm:py-14 px-4 sm:px-6 relative overflow-hidden flex flex-col items-center selection:bg-[#FF6B00] selection:text-white">
      
      {/* Background Soft Ambient Light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[500px] bg-gradient-to-b from-orange-200/40 via-amber-100/25 to-transparent blur-[140px] pointer-events-none -z-10" />
      <div 
        className="absolute inset-0 opacity-[0.035] pointer-events-none -z-10"
        style={{
          backgroundImage: `radial-gradient(#1E293B 1px, transparent 1px)`,
          backgroundSize: "24px 24px"
        }}
      />

      {/* Main Container */}
      <div className="w-full max-w-[760px] space-y-4 relative z-10">
        
        {/* Main Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-orange-200/70 shadow-[0_16px_48px_-12px_rgba(234,88,12,0.12),0_4px_20px_-4px_rgba(0,0,0,0.04)] overflow-hidden">
          
          {/* Header Banner */}
          <div className="relative w-full aspect-[21/9] sm:aspect-[2.4/1] min-h-[190px] sm:min-h-[250px] bg-slate-900 overflow-hidden">
            <Image
              src="/vip-day.jpeg"
              alt="VIP Day 2026 - River of God Ortigas"
              fill
              priority
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Invitation Copy */}
          <div className="p-6 sm:p-9 pb-5 sm:pb-6 space-y-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200/80 text-[11px] font-black text-[#FF6B00] uppercase tracking-wider">
                River of God Ortigas
              </span>
              <span className="text-xs font-bold text-slate-400">
                VIP Day 2026
              </span>
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                YOU BELONG HERE! <span className="text-2xl sm:text-3xl">🫂</span>
              </h1>
              <p className="text-sm font-bold text-[#FF6B00] flex items-center gap-1.5">
                <Heart className="w-4 h-4 fill-[#FF6B00] text-[#FF6B00] shrink-0" />
                <span>New Members Welcome &amp; Fellowship</span>
              </p>
            </div>

            <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed pt-1">
              Are you new to River of God? We want to welcome you home! If you joined our church from January 2026 through today, come makipagkwentuhan, meet new friends, and celebrate with the family. 🏠
            </p>
          </div>

          {/* Event Schedule Bar */}
          <div className="bg-[#FFFDF9] border-y border-orange-100 p-4 sm:p-6 grid grid-cols-3 gap-3 sm:gap-4 text-center">
            <div className="p-3 sm:p-3.5 rounded-2xl bg-white border border-orange-100 shadow-xs space-y-0.5">
              <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-orange-600">
                <Calendar className="w-3.5 h-3.5 text-[#FF6B00]" /> Date
              </div>
              <div className="text-sm sm:text-base font-extrabold text-slate-900">Nov 07, 2026</div>
              <div className="text-xs text-slate-400 font-medium">Saturday</div>
            </div>

            <div className="p-3 sm:p-3.5 rounded-2xl bg-white border border-orange-100 shadow-xs space-y-0.5">
              <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-orange-600">
                <Clock className="w-3.5 h-3.5 text-[#FF6B00]" /> Time
              </div>
              <div className="text-sm sm:text-base font-extrabold text-slate-900">10 AM – 12 NN</div>
              <div className="text-xs text-slate-400 font-medium">2 Hours</div>
            </div>

            <div className="p-3 sm:p-3.5 rounded-2xl bg-white border border-orange-100 shadow-xs space-y-0.5">
              <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-orange-600">
                <MapPin className="w-3.5 h-3.5 text-[#FF6B00]" /> Venue
              </div>
              <div className="text-sm sm:text-base font-extrabold text-slate-900">ROG Ortigas</div>
              <div className="text-xs text-slate-400 font-medium">Sanctuary</div>
            </div>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-9 space-y-5 sm:space-y-6">
            
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                Claim Your Guest Badge
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Enter your details below to generate your personal entrance QR pass.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-bold flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Field 1: Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <User className="w-4 h-4 text-[#FF6B00]" />
                Full Name <span className="text-[#FF6B00]">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Your complete name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 sm:py-3.5 rounded-2xl bg-[#FAF8F5] focus:bg-white border border-stone-200 focus:border-[#FF6B00] text-sm sm:text-base font-bold text-slate-900 placeholder:text-stone-400 focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all"
              />
            </div>

            {/* Field 2: Gender & Age Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Gender */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  Gender <span className="text-[#FF6B00]">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGender(2)}
                    className={`py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all border cursor-pointer ${
                      gender === 2
                        ? "bg-[#FF6B00] text-white border-[#FF6B00] shadow-sm"
                        : "bg-[#FAF8F5] text-slate-600 border-stone-200 hover:bg-stone-100"
                    }`}
                  >
                    Female
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender(1)}
                    className={`py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all border cursor-pointer ${
                      gender === 1
                        ? "bg-[#FF6B00] text-white border-[#FF6B00] shadow-sm"
                        : "bg-[#FAF8F5] text-slate-600 border-stone-200 hover:bg-stone-100"
                    }`}
                  >
                    Male
                  </button>
                </div>
              </div>

              {/* Age (years) */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Hash className="w-4 h-4 text-[#FF6B00]" />
                  Age (Years) <span className="text-[#FF6B00]">*</span>
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  required
                  placeholder="e.g. 24"
                  value={age}
                  onChange={handleAgeChange}
                  className="w-full px-4 py-3 sm:py-3.5 rounded-2xl bg-[#FAF8F5] focus:bg-white border border-stone-200 focus:border-[#FF6B00] text-sm sm:text-base font-bold text-slate-900 placeholder:text-stone-400 focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all"
                />
              </div>

            </div>

            {/* Field 3: Contact Number */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  Contact No. <span className="text-[#FF6B00]">*</span>
                </label>
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  Philippines
                </span>
              </div>

              {/* Input Pill Container */}
              <div
                className={`flex items-center rounded-2xl bg-[#FAF8F5] border transition-all overflow-hidden p-1 sm:p-1.5 ${
                  isContactValid
                    ? "border-emerald-400 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10"
                    : isContactStarted && (!contactNumber.startsWith("9") || contactNumber.length === 10)
                    ? "border-rose-300 focus-within:border-rose-500 focus-within:ring-4 focus-within:ring-rose-500/10"
                    : "border-stone-200 focus-within:border-[#FF6B00] focus-within:ring-4 focus-within:ring-orange-500/10"
                }`}
              >
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-stone-200/80 shadow-2xs text-xs sm:text-sm font-bold text-slate-700 shrink-0">
                  <span className="text-base leading-none">🇵🇭</span>
                  <span>+63</span>
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
                  required
                  placeholder="9XXXXXXXXX"
                  value={contactNumber}
                  onChange={handleContactChange}
                  className="w-full px-3 py-2 bg-transparent text-sm sm:text-base font-mono font-bold text-slate-900 placeholder:text-stone-300 focus:outline-none tracking-wider"
                />
              </div>

              {/* Realtime Status Helper */}
              <div className="flex items-center justify-between px-1 text-xs">
                <div>
                  {isContactStarted && !contactNumber.startsWith("9") ? (
                    <span className="text-rose-500 font-semibold">Must start with 9</span>
                  ) : isContactValid ? (
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 inline" /> Valid (Saved as {fullNormalizedNumber})
                    </span>
                  ) : (
                    <span className="text-slate-500">
                      Saved as <span className="font-mono font-bold text-slate-800">{fullNormalizedNumber || "09XXXXXXXXX"}</span>
                    </span>
                  )}
                </div>

                <div
                  className={`font-mono font-bold text-[11px] ${
                    isContactValid
                      ? "text-emerald-600"
                      : contactNumber.length > 0
                      ? "text-orange-600"
                      : "text-slate-400"
                  }`}
                >
                  {contactNumber.length}/10 digits
                </div>
              </div>
            </div>

            {/* Field 4: Discipler */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#FF6B00]" />
                Discipler / Mentor <span className="text-[#FF6B00]">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Who invited or disciples you in church?"
                value={discipler}
                onChange={(e) => setDiscipler(e.target.value)}
                className="w-full px-4 py-3 sm:py-3.5 rounded-2xl bg-[#FAF8F5] focus:bg-white border border-stone-200 focus:border-[#FF6B00] text-sm sm:text-base font-bold text-slate-900 placeholder:text-stone-400 focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isPending || !isFormValid}
                className="w-full py-4 rounded-2xl bg-[#FF6B00] hover:bg-[#e05e00] text-white text-sm sm:text-base font-black shadow-lg shadow-orange-500/25 transition-all active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 group cursor-pointer"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                    <span>Preparing Your Pass...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Registration &amp; Get Pass</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>

            {/* Trust Footer */}
            <div className="pt-1 flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 text-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Instant digital ticket generated upon submission</span>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}