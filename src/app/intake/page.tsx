// src/app/(portal)/intake/page.tsx
"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  User, 
  MessageSquare, 
  Users, 
  CheckCircle2, 
  Sparkles, 
  HeartHandshake, 
  LogIn, 
  ShieldCheck, 
  UserCheck2,
  Loader2,
  Calendar,
  CloudOff
} from "lucide-react";
import { createFirstTimerAction, getActiveMembersPublicAction } from "@/app/actions/firstTimerAction";
import ApproachedByAutocomplete from "@/app/components/ApproachedByAutocomplete";
import OfflineSyncBadge from "@/app/components/OfflineSyncBadge";
import { savePendingVip, OfflineVipRecord } from "@/lib/offlineDb";
import TempCsvUploader from "../components/TempCsvUploader";

export default function StandaloneIntakePage() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [savedOffline, setSavedOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queueCounter, setQueueCounter] = useState(0);

  const [iam, setIam] = useState<"VISITOR" | "LOOKING FOR A CHURCH" | "FROM OTHER CHURCH">("LOOKING FOR A CHURCH");
  const [gender, setGender] = useState<number>(0); // 0 = Female, 1 = Male
  const [age, setAge] = useState<string>("");
  const [serviceAttended, setServiceAttended] = useState<string>("10AM");
  const [lifeGroupInterest, setLifeGroupInterest] = useState<string>("YES");
  const [approachedBy, setApproachedBy] = useState<string>("");
  const [contactInput, setContactInput] = useState<string>("");

  // Cache active members locally on page load if online
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.onLine) {
      getActiveMembersPublicAction().then((res) => {
        if (res.success && res.members) {
          localStorage.setItem("connect_hub_active_members", JSON.stringify(res.members));
        }
      }).catch(() => {});
    }
  }, []);

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.startsWith("63")) val = val.slice(2);
    if (val.startsWith("0")) val = val.slice(1);
    if (val.length <= 10) {
      setContactInput(val);
    }
  };

  const resetFormState = () => {
    setSubmitted(false);
    setSavedOffline(false);
    setError(null);
    setIam("LOOKING FOR A CHURCH");
    setGender(0);
    setAge("");
    setServiceAttended("10AM");
    setLifeGroupInterest("YES");
    setApproachedBy("");
    setContactInput("");
    if (formRef.current) {
      formRef.current.reset();
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!approachedBy.trim()) {
      setError("Please select or search the Connect Member who approached this first timer.");
      return;
    }

    if (!age || parseInt(age, 10) < 1) {
      setError("Please enter a valid age.");
      return;
    }

    if (contactInput.trim() && contactInput.length < 10) {
      setError("Please enter a complete 10-digit mobile number, or leave it blank.");
      return;
    }

    const formattedContact = contactInput.trim() ? "0" + contactInput.trim() : "";

    // 1. IF OFFLINE: Save straight to IndexedDB
    if (!navigator.onLine) {
      try {
        const offlineRecord: OfflineVipRecord = {
          clientTempId: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
          iam,
          fullName: (e.currentTarget.elements.namedItem("fullName") as HTMLInputElement)?.value || "",
          gender,
          age,
          contact: formattedContact,
          serviceAttended,
          messenger: (e.currentTarget.elements.namedItem("messenger") as HTMLInputElement)?.value || "",
          invitedBy: (e.currentTarget.elements.namedItem("invitedBy") as HTMLInputElement)?.value || "",
          connectedWith: (e.currentTarget.elements.namedItem("connectedWith") as HTMLInputElement)?.value || "",
          lifeGroupInterest,
          approachedBy,
          createdAtTimestamp: Date.now(),
        };

        await savePendingVip(offlineRecord);
        setSavedOffline(true);
        setSubmitted(true);
        setQueueCounter((prev) => prev + 1);
        return;
      } catch (err: any) {
        setError("Could not store card locally on device: " + err.message);
        return;
      }
    }

    // 2. IF ONLINE: Normal server action flow with network fallback
    const formData = new FormData(e.currentTarget);
    formData.set("iam", iam);
    formData.set("gender", String(gender));
    formData.set("age", age);
    formData.set("serviceAttended", serviceAttended);
    formData.set("lifeGroupInterest", lifeGroupInterest);
    formData.set("approachedBy", approachedBy);
    formData.set("contact", formattedContact);

    startTransition(async () => {
      try {
        const res = await createFirstTimerAction(formData);
        if (res.success) {
          setSavedOffline(false);
          setSubmitted(true);
        } else {
          setError(res.error || "Submission failed. Please check the inputs.");
        }
      } catch {
        // Network threw unexpectedly mid-flight: fallback to local save
        const offlineRecord: OfflineVipRecord = {
          clientTempId: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
          iam,
          fullName: (formData.get("fullName") as string) || "",
          gender,
          age,
          contact: formattedContact,
          serviceAttended,
          messenger: (formData.get("messenger") as string) || "",
          invitedBy: (formData.get("invitedBy") as string) || "",
          connectedWith: (formData.get("connectedWith") as string) || "",
          lifeGroupInterest,
          approachedBy,
          createdAtTimestamp: Date.now(),
        };
        await savePendingVip(offlineRecord);
        setSavedOffline(true);
        setSubmitted(true);
        setQueueCounter((prev) => prev + 1);
      }
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen w-full bg-white flex flex-col justify-between px-4 sm:px-12 lg:px-20 py-6 sm:py-8">
        <header className="w-full flex items-center justify-between pb-4 sm:pb-6 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-10 w-10 shrink-0 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50/80 p-1.5 border border-orange-200/60 shadow-sm flex items-center justify-center">
              <img
                src="/connect-hub.png"
                alt="Connect Hub"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-black text-[#111827] leading-tight truncate">Connect Hub</h2>
              <span className="text-[10px] font-bold text-[#FF6B00] block leading-tight">River of God</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <OfflineSyncBadge refreshTrigger={queueCounter} />
            <Link 
              href="/login" 
              className="inline-flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] sm:text-xs font-black transition-all shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5 text-[#FF6B00]" />
              <span>Login</span>
            </Link>
          </div>
        </header>

        <div className="w-full max-w-md mx-auto text-center space-y-6 py-12 animate-in fade-in zoom-in-95 duration-300">
          <div className={`h-20 w-20 rounded-3xl flex items-center justify-center mx-auto border shadow-lg ${
            savedOffline 
              ? "bg-amber-50 text-amber-600 border-amber-200/60 shadow-amber-500/10"
              : "bg-emerald-50 text-emerald-600 border-emerald-200/60 shadow-emerald-500/10"
          }`}>
            {savedOffline ? <CloudOff className="w-10 h-10" /> : <CheckCircle2 className="w-10 h-10" />}
          </div>

          <div className="space-y-1.5">
            <h2 className="text-3xl font-black text-[#111827]">
              {savedOffline ? "Saved to Device!" : "Welcome Recorded!"}
            </h2>
            <p className="text-sm text-slate-500 font-medium">
              {savedOffline 
                ? "This card is safely stored offline on your phone and will automatically upload when internet connects."
                : "The first-timer details have been registered into Connect Hub."}
            </p>
          </div>

          <div className="pt-4 flex flex-col gap-3">
            <button
              onClick={resetFormState}
              className="w-full py-4 rounded-2xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-extrabold text-sm shadow-xl shadow-orange-500/25 transition-all active:scale-[0.98]"
            >
              + Record Another First Timer
            </button>
            <Link
              href="/login"
              className="w-full py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all text-center"
            >
              Go to Login
            </Link>
          </div>
        </div>

        <footer className="w-full text-center text-xs text-slate-400 font-semibold pt-4">
          River of God Church • Connect Ministry Hub
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white flex flex-col justify-between px-4 sm:px-12 lg:px-20 py-6 sm:py-8">
      
      {/* Top Header - Responsive & Preserves Login */}
      <header className="w-full flex items-center justify-between pb-4 sm:pb-6 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-10 w-10 shrink-0 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50/80 p-1.5 border border-orange-200/60 shadow-sm flex items-center justify-center">
            <img 
              src="/connect-hub.png" 
              alt="Connect Hub" 
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-black text-[#111827] leading-tight truncate">Connect Hub</h2>
            <span className="text-[10px] font-bold text-[#FF6B00] block leading-tight">River of God</span>
          </div>
        </div>
        {/* <TempCsvUploader /> */}
        <div className="flex items-center gap-1.5 shrink-0">
          <OfflineSyncBadge refreshTrigger={queueCounter} />
          <Link 
            href="/login" 
            className="inline-flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] sm:text-xs font-black transition-all shadow-sm"
          >
            <LogIn className="w-3.5 h-3.5 text-[#FF6B00]" />
            <span>Login</span>
          </Link>
        </div>
      </header>

      {/* Main Full-Screen Form Canvas */}
      <main className="w-full max-w-2xl mx-auto py-8 sm:py-14 space-y-8">
        
        {/* Title Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-[#FF6B00] text-[11px] font-bold">
            <Sparkles className="w-3.5 h-3.5" /> First-Timer Welcome Card
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-[#111827] tracking-tight">
            Welcome to River of God!
          </h1>
          <p className="text-xs sm:text-base text-slate-500 font-medium leading-relaxed">
            We&apos;re glad you&apos;re here. Our team would love to serve you and help you get connected.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs sm:text-sm font-bold text-rose-600 animate-in fade-in duration-200">
            {error}
          </div>
        )}

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          
          {/* 1. I AM... */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              I AM... <span className="text-[#FF6B00]">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
              {[
                { value: "LOOKING FOR A CHURCH", label: "Looking for a Church" },
                { value: "VISITOR", label: "Visitor" },
                { value: "FROM OTHER CHURCH", label: "From Other Church" },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setIam(item.value as any)}
                  className={`py-3.5 px-3 rounded-2xl text-xs font-extrabold transition-all border ${
                    iam === item.value
                      ? "bg-[#FF6B00] text-white border-[#FF6B00] shadow-md shadow-orange-500/20"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. FULL NAME */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Full Name <span className="text-[#FF6B00]">*</span>
            </label>
            <div className="relative group">
              <User className="w-5 h-5 text-slate-400 group-focus-within:text-[#FF6B00] absolute left-4 top-1/2 -translate-y-1/2 transition-colors" />
              <input
                type="text"
                name="fullName"
                required
                placeholder="Your complete name"
                className="w-full pl-12 pr-4 py-3.5 sm:py-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm sm:text-base text-[#111827] placeholder-slate-400 font-medium focus:outline-none focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* 3. GENDER & AGE ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Gender */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Gender <span className="text-[#FF6B00]">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGender(0)}
                  className={`py-3.5 sm:py-4 rounded-2xl text-xs font-extrabold border transition-all ${
                    gender === 0
                      ? "bg-[#FF6B00] text-white border-[#FF6B00] shadow-md shadow-orange-500/20"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  Female
                </button>
                <button
                  type="button"
                  onClick={() => setGender(1)}
                  className={`py-3.5 sm:py-4 rounded-2xl text-xs font-extrabold border transition-all ${
                    gender === 1
                      ? "bg-[#FF6B00] text-white border-[#FF6B00] shadow-md shadow-orange-500/20"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  Male
                </button>
              </div>
            </div>

            {/* Age (Years) */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Age (Years) <span className="text-[#FF6B00]">*</span>
              </label>
              <div className="relative group">
                <Calendar className="w-5 h-5 text-slate-400 group-focus-within:text-[#FF6B00] absolute left-4 top-1/2 -translate-y-1/2 transition-colors" />
                <input
                  type="number"
                  name="age"
                  min={1}
                  max={120}
                  required
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 24"
                  className="w-full pl-12 pr-4 py-3.5 sm:py-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm sm:text-base text-[#111827] placeholder-slate-400 font-medium focus:outline-none focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 focus:bg-white transition-all"
                />
              </div>
            </div>

          </div>

          {/* 4. CONTACT & SERVICE ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Optional PH Mobile Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span>Contact No. <span className="text-slate-400 font-normal lowercase">(optional)</span></span>
                <span className="text-[10px] text-slate-400 font-medium">Philippines</span>
              </label>
              
              <div className="relative flex items-center rounded-2xl bg-slate-50 border border-slate-200 focus-within:border-[#FF6B00] focus-within:ring-4 focus-within:ring-[#FF6B00]/10 focus-within:bg-white transition-all overflow-hidden">
                <div className="flex items-center gap-1.5 px-3 py-3.5 sm:py-4 bg-slate-100/90 border-r border-slate-200 text-xs font-bold text-slate-700 select-none shrink-0">
                  <span className="text-sm leading-none">🇵🇭</span>
                  <span>+63</span>
                </div>

                <input
                  type="tel"
                  value={contactInput}
                  onChange={handleContactChange}
                  placeholder="9** *** ****"
                  className="w-full px-3.5 py-3.5 sm:py-4 bg-transparent text-sm sm:text-base font-semibold text-[#111827] placeholder-slate-400 focus:outline-none tracking-wide"
                />
              </div>
              {contactInput && (
                <p className="text-[11px] text-slate-400 pl-1 font-medium">
                  Saved as <strong className="text-slate-700 font-mono">0{contactInput}</strong>
                </p>
              )}
            </div>

            {/* Service Attended */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Which Service Did You Attend? <span className="text-[#FF6B00]">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["10AM", "1PM", "4PM"].map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setServiceAttended(slot)}
                    className={`py-3.5 sm:py-4 rounded-2xl text-xs font-extrabold border transition-all ${
                      serviceAttended === slot
                        ? "bg-[#FF6B00] text-white border-[#FF6B00] shadow-md shadow-orange-500/20"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* 5. MESSENGER & INVITED BY */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span>Messenger Name</span>
                <span className="text-slate-400 font-normal lowercase text-[10px]">(optional)</span>
              </label>
              <div className="relative group">
                <MessageSquare className="w-5 h-5 text-slate-400 group-focus-within:text-[#FF6B00] absolute left-4 top-1/2 -translate-y-1/2 transition-colors" />
                <input
                  type="text"
                  name="messenger"
                  placeholder="FB / Messenger profile name"
                  className="w-full pl-12 pr-4 py-3.5 sm:py-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm sm:text-base text-[#111827] placeholder-slate-400 font-medium focus:outline-none focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Invited By
              </label>
              <div className="relative group">
                <Users className="w-5 h-5 text-slate-400 group-focus-within:text-[#FF6B00] absolute left-4 top-1/2 -translate-y-1/2 transition-colors" />
                <input
                  type="text"
                  name="invitedBy"
                  placeholder="Inviter's full name"
                  className="w-full pl-12 pr-4 py-3.5 sm:py-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm sm:text-base text-[#111827] placeholder-slate-400 font-medium focus:outline-none focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          {/* 6. CONNECTED WITH */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Connected With
            </label>
            <div className="relative group">
              <UserCheck2 className="w-5 h-5 text-slate-400 group-focus-within:text-[#FF6B00] absolute left-4 top-1/2 -translate-y-1/2 transition-colors" />
              <input
                type="text"
                name="connectedWith"
                placeholder="Endorsed Life Group leader / member"
                className="w-full pl-12 pr-4 py-3.5 sm:py-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm sm:text-base text-[#111827] placeholder-slate-400 font-medium focus:outline-none focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* 7. APPROACHED BY & LIFEGROUP */}
          <div className="space-y-4 pt-1">
            <ApproachedByAutocomplete
              value={approachedBy}
              onChange={setApproachedBy}
              required
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-orange-50/70 border border-orange-200/70">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#FF6B00]/10 text-[#FF6B00]">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-[#111827]">Do you want to join a LifeGroup?</div>
                  <div className="text-[11px] text-slate-500">Connect with small group community</div>
                </div>
              </div>
              <div className="flex gap-1.5">
                {["YES", "NO"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setLifeGroupInterest(opt)}
                    className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-extrabold border transition-all ${
                      lifeGroupInterest === opt
                        ? "bg-[#FF6B00] text-white border-[#FF6B00] shadow-sm"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Data Privacy Disclaimer */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              We are aware of our responsibility to protect your personal data under strict confidentiality. As provided under Republic Act No. 10173, also known as the Data Privacy Act of 2012, you may object to the processing of your personal information, request access to your personal information, and/or have it corrected, erased, or blocked on reasonable grounds.
            </p>
          </div>

          {/* Submit CTA */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-4 rounded-2xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-black text-sm sm:text-base shadow-xl shadow-orange-500/25 hover:shadow-orange-500/35 transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Submitting...
                </>
              ) : (
                "Submit Welcome Card"
              )}
            </button>
          </div>

        </form>

      </main>

      {/* Footer */}
      <footer className="w-full text-center text-xs text-slate-400 font-semibold pt-6 border-t border-slate-100">
        River of God Church • Connect Ministry Hub
      </footer>

    </div>
  );
}