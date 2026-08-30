"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { 
  User, 
  Lock, 
  ArrowRight, 
  ShieldCheck, 
  Loader2, 
  ClipboardPenLine,
  Eye,
  EyeOff
} from "lucide-react";
import { loginAction } from "@/app/actions/authActions";

export default function LoginForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("callbackUrl", callbackUrl);

    startTransition(async () => {
      const res = await loginAction(formData);
      if (res?.error) {
        setError(res.error);
      }
    });
  };

  return (
    <div className="relative min-h-screen w-full bg-[#F4F6FA] flex flex-col justify-center items-center p-4 sm:p-6 overflow-hidden">
      
      {/* Ambient Background Glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#FF7A00]/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Main Card */}
      <div className="w-full max-w-[420px] relative z-10">
        <div className="bg-white/95 backdrop-blur-xl rounded-[32px] border border-slate-200/80 shadow-2xl shadow-slate-300/40 p-7 sm:p-9 space-y-6">
          
          {/* Centered Brand Header */}
          <div className="flex flex-col items-center text-center">
            <div className="relative h-16 w-16 rounded-[22px] bg-gradient-to-br from-orange-50 to-amber-50/80 p-2.5 border border-orange-200/60 shadow-md shadow-orange-500/10 mb-4 transition-transform hover:scale-105">
              <Image 
                src="/connect-hub.png" 
                alt="Connect Hub" 
                fill 
                className="object-contain p-1" 
                priority 
              />
            </div>
            
            <h1 className="text-2xl sm:text-[26px] font-black text-[#111827] tracking-tight leading-tight">
              Leader Sign In
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Access the Connect Ministry dashboard & follow-ups
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50/90 border border-rose-200 text-xs font-bold text-rose-600 animate-in fade-in zoom-in-95 duration-200">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Username
              </label>
              <div className="relative group">
                <User className="w-4 h-4 text-slate-400 group-focus-within:text-[#FF6B00] absolute left-4 top-1/2 -translate-y-1/2 transition-colors" />
                <input
                  type="text"
                  name="username"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  placeholder="user_name"
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200 text-sm font-medium text-[#111827] placeholder-slate-400 focus:outline-none focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Password Input with Show/Hide Toggle */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Password
              </label>
              <div className="relative group">
                <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-[#FF6B00] absolute left-4 top-1/2 -translate-y-1/2 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200 text-sm font-medium text-[#111827] placeholder-slate-400 focus:outline-none focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-2 space-y-3">
              <button
                type="submit"
                disabled={isPending}
                className="w-full py-3.5 rounded-2xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-extrabold text-sm shadow-xl shadow-orange-500/25 hover:shadow-orange-500/35 transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Authenticating...
                  </>
                ) : (
                  <>
                    Enter Portal <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Sunday Intake Link */}
              <div className="text-center pt-1">
                <Link
                  href="/intake"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#FF6B00] transition-colors group py-1"
                >
                  <ClipboardPenLine className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#FF6B00] transition-colors" />
                  <span>Recording a visitor?</span>
                  <span className="font-bold text-[#FF6B00] group-hover:underline underline-offset-4">Sunday Intake Form →</span>
                </Link>
              </div>
            </div>

          </form>

          {/* Security Badge */}
          <div className="p-3 rounded-2xl bg-slate-50/90 border border-slate-200/60 flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-slate-100 text-slate-500 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <p className="text-[10px] text-slate-500 leading-snug font-medium">
              Restricted to authorized <strong className="text-slate-700">Admins</strong>, <strong className="text-slate-700">Team Leaders</strong>, and <strong className="text-slate-700">Follow-Up Ministers</strong>.
            </p>
          </div>

        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-slate-400 font-semibold mt-6">
          River of God Church • Connect Ministry Hub
        </div>
      </div>
    </div>
  );
}