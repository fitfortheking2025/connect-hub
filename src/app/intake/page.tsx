"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
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
  UserCheck2 
} from "lucide-react";
import { createFirstTimerAction } from "@/app/actions/firstTimerAction";
import ApproachedByAutocomplete from "@/app/components/ApproachedByAutocomplete";

const ageGroups = [
  { value: "Youth", label: "River Youth", age: "13 to 19 years old" },
  { value: "Young Adult", label: "Young Adult", age: "20 to 35 years old" },
  { value: "River Men", label: "River Men", age: "36 to 50 years old" },
  { value: "River Women", label: "River Women", age: "36 to 50 years old" },
  { value: "Seasoned", label: "Seasoned", age: "51 years old & above" },
];

export default function StandaloneIntakePage() {
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [iam, setIam] = useState<"VISITOR" | "LOOKING FOR A CHURCH" | "FROM OTHER CHURCH">("LOOKING FOR A CHURCH");
  const [gender, setGender] = useState<number>(0); // 0 = Female, 1 = Male
  const [ageGroup, setAgeGroup] = useState<string>("Young Adult");
  const [serviceAttended, setServiceAttended] = useState<string>("10AM");
  const [lifeGroupInterest, setLifeGroupInterest] = useState<string>("YES");
  const [approachedBy, setApproachedBy] = useState<string>("");
  const [contactInput, setContactInput] = useState<string>("");

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.startsWith("63")) val = val.slice(2);
    if (val.startsWith("0")) val = val.slice(1);
    if (val.length <= 10) {
      setContactInput(val);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!approachedBy.trim()) {
      setError("Please select or search the Connect Member who approached this first timer.");
      return;
    }

    if (contactInput.trim() && contactInput.length < 10) {
      setError("Please enter a complete 10-digit mobile number, or leave it blank.");
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.set("iam", iam);
    formData.set("gender", String(gender));
    formData.set("ageGroup", ageGroup);
    formData.set("serviceAttended", serviceAttended);
    formData.set("lifeGroupInterest", lifeGroupInterest);
    formData.set("approachedBy", approachedBy);
    formData.set("contact", contactInput.trim() ? "0" + contactInput.trim() : "");

    startTransition(async () => {
      const res = await createFirstTimerAction(formData);
      if (res.success) {
        setSubmitted(true);
      } else {
        setError(res.error || "Submission failed. Please check the inputs.");
      }
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen w-full bg-[#F4F6FA] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-[32px] p-8 border border-slate-200/80 shadow-2xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-500">
          <div className="h-16 w-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200/60 shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-extrabold text-[#111827]">Welcome Recorded!</h2>
            <p className="text-xs text-slate-500">
              The first-timer details have been registered into Connect Hub.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2.5">
            <button
              onClick={() => {
                setSubmitted(false);
                setApproachedBy("");
                setContactInput("");
              }}
              className="w-full py-3.5 rounded-2xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold text-sm shadow-lg shadow-orange-500/25 transition-all"
            >
              + Record Another First Timer
            </button>
            <Link
              href="/login"
              className="w-full py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#F4F6FA] py-6 md:py-10 px-4 sm:px-6 lg:px-8 flex justify-center items-start">
      <div className="w-full max-w-2xl space-y-4">
        
        {/* Header Navigation */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2.5">
            <div className="relative h-8 w-8 rounded-xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 p-1 border border-orange-500/20 shadow-sm">
              <Image src="/connect-hub.png" alt="Connect Hub" fill className="object-contain p-0.5" priority />
            </div>
            <span className="font-extrabold text-sm text-[#111827] tracking-tight">Connect Hub</span>
          </div>

          <Link 
            href="/login" 
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#FF6B00] bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-sm hover:shadow transition-all active:scale-95"
          >
            <LogIn className="w-3.5 h-3.5 text-[#FF6B00]" />
            Login
          </Link>
        </div>

        {/* Main Intake Form Card */}
        <div className="bg-white rounded-[32px] border border-slate-200/80 shadow-xl shadow-slate-200/40 p-6 sm:p-9 space-y-6">
          
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-[#FF6B00] text-[11px] font-bold">
              <Sparkles className="w-3.5 h-3.5" /> First-Timer Welcome Card
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#111827] tracking-tight mt-2.5">
              Welcome to River of God Church!
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium leading-relaxed">
              We&apos;re glad you&apos;re here. Our team would love to serve you and help you get connected.
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 1. I AM... */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                I AM... <span className="text-[#FF6B00]">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { value: "LOOKING FOR A CHURCH", label: "Looking for a Church" },
                  { value: "VISITOR", label: "Visitor" },
                  { value: "FROM OTHER CHURCH", label: "From Other Church" },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setIam(item.value as any)}
                    className={`py-3 px-3 rounded-2xl text-xs font-bold transition-all border ${
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
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Full Name <span className="text-[#FF6B00]">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="fullName"
                  required
                  placeholder="Your complete name"
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200 text-sm text-[#111827] placeholder-slate-400 font-medium focus:outline-none focus:border-[#FF6B00] focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* 3. GENDER & CONTACT ROW */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Gender (0 = Female, 1 = Male) */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Gender <span className="text-[#FF6B00]">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGender(0)}
                    className={`py-3.5 rounded-2xl text-xs font-bold border transition-all ${
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
                    className={`py-3.5 rounded-2xl text-xs font-bold border transition-all ${
                      gender === 1
                        ? "bg-[#FF6B00] text-white border-[#FF6B00] shadow-md shadow-orange-500/20"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Male
                  </button>
                </div>
              </div>

              {/* Optional PH Mobile Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                  <span>Contact No. <span className="text-slate-400 font-normal lowercase">(optional)</span></span>
                  <span className="text-[10px] text-slate-400 font-medium">Philippines</span>
                </label>
                
                <div className="relative flex items-center rounded-2xl bg-[#F8FAFC] border border-slate-200 focus-within:border-[#FF6B00] focus-within:bg-white transition-all overflow-hidden">
                  <div className="flex items-center gap-1.5 px-3.5 py-3.5 bg-slate-100/90 border-r border-slate-200 text-xs font-bold text-slate-700 select-none shrink-0">
                    <span className="text-sm leading-none">🇵🇭</span>
                    <span>+63</span>
                  </div>

                  <input
                    type="tel"
                    value={contactInput}
                    onChange={handleContactChange}
                    placeholder="906 097 9218"
                    className="w-full px-3.5 py-3.5 bg-transparent text-sm font-semibold text-[#111827] placeholder-slate-400 focus:outline-none tracking-wide"
                  />
                </div>
                {contactInput ? (
                  <p className="text-[10px] text-slate-400 pl-1">
                    Saved as <strong className="text-slate-600 font-mono">0{contactInput}</strong>
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-400 pl-1">
                    Optional contact number
                  </p>
                )}
              </div>

            </div>

            {/* 4. AGE GROUP */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Age Group <span className="text-[#FF6B00]">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ageGroups.map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => {
                      setAgeGroup(g.value);
                      if (g.value === "River Men") setGender(1);
                      if (g.value === "River Women") setGender(0);
                    }}
                    className={`py-3 px-4 rounded-2xl text-left border transition-all flex items-center justify-between ${
                      ageGroup === g.value
                        ? "bg-[#FF6B00] text-white border-[#FF6B00] shadow-md shadow-orange-500/20"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">{g.label}</div>
                      <div className={`text-[10px] ${ageGroup === g.value ? "text-white/80" : "text-slate-400"}`}>
                        {g.age}
                      </div>
                    </div>
                    {ageGroup === g.value && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. WHICH SERVICE DID YOU ATTEND? */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Which Service Did You Attend? <span className="text-[#FF6B00]">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {["10AM", "1PM", "4PM"].map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setServiceAttended(slot)}
                    className={`py-3 rounded-2xl text-xs font-bold border transition-all ${
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

            {/* 6. MESSENGER & INVITED BY */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                  <span>Messenger Name</span>
                  <span className="text-slate-400 font-normal lowercase text-[10px]">(optional)</span>
                </label>
                <div className="relative">
                  <MessageSquare className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="messenger"
                    placeholder="FB / Messenger profile name"
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200 text-sm text-[#111827] placeholder-slate-400 font-medium focus:outline-none focus:border-[#FF6B00] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  If invited by someone, please type name:
                </label>
                <div className="relative">
                  <Users className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="invitedBy"
                    placeholder="Inviter's full name"
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200 text-sm text-[#111827] placeholder-slate-400 font-medium focus:outline-none focus:border-[#FF6B00] focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            {/* 7. CONNECTED WITH */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Connected With:
              </label>
              <div className="relative">
                <UserCheck2 className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="connectedWith"
                  placeholder="Endorsed Life Group leader / member"
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200 text-sm text-[#111827] placeholder-slate-400 font-medium focus:outline-none focus:border-[#FF6B00] focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* 8. APPROACHED BY (Autocomplete) & LIFEGROUP */}
            <div className="space-y-4 pt-1">
              <ApproachedByAutocomplete
                value={approachedBy}
                onChange={setApproachedBy}
                required
              />

              <div className="flex items-center justify-between p-4 rounded-2xl bg-orange-50/60 border border-orange-200/70">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-[#FF6B00]/10 text-[#FF6B00]">
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
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                        lifeGroupInterest === opt
                          ? "bg-[#FF6B00] text-white border-[#FF6B00] shadow-sm"
                          : "bg-white text-slate-600 border-slate-200"
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
              <p className="text-[11px] text-slate-500 leading-relaxed">
                We are aware of our responsibility to protect your personal data under strict confidentiality. As provided by the Data Privacy Act, you may object to the processing of your personal information, request to access your personal information, and/or have it corrected, erased, or blocked on reasonable grounds. For details, get in touch with our Discipleship Team.
              </p>
            </div>

            {/* Submit CTA */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="w-full py-4 rounded-2xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-extrabold text-sm sm:text-base shadow-xl shadow-orange-500/25 transition-all active:scale-[0.99] disabled:opacity-50"
              >
                {isPending ? "Submitting..." : "Submit Welcome Card"}
              </button>
            </div>

          </form>

        </div>
      </div>
    </div>
  );
}