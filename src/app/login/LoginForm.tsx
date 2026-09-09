// src/app/login/LoginForm.tsx
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
  Calendar,
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
    <div className="min-h-screen w-full bg-white flex flex-col justify-between px-6 py-8 sm:px-12 lg:px-20">
      
      {/* Top Spacer */}
      <div className="hidden sm:block" />

      {/* Main Full-Screen Form Canvas */}
      <main className="w-full max-w-md mx-auto py-8 sm:py-12 space-y-6">
        
        {/* Centered Logo & Branding */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="relative h-16 w-16 rounded-[22px] bg-gradient-to-br from-orange-50 to-amber-50/80 p-2.5 border border-orange-200/60 shadow-md shadow-orange-500/10">
            <Image 
              src="/connect-hub.png" 
              alt="Connect Hub" 
              fill 
              className="object-contain p-1" 
              priority 
            />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-[#111827] tracking-tight">
              Connect Hub
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Access the Connect Ministry dashboard & follow-ups
            </p>
          </div>
        </div>

        {/* Error Callout */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs sm:text-sm font-bold text-rose-600 animate-in fade-in duration-200">
            {error}
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleLogin} className="space-y-4">
          
          {/* Username Input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
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
                placeholder=""
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200 text-sm font-medium text-[#111827] placeholder-slate-400 focus:outline-none focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
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
                className="p-2 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
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
                  Access Portal <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </form>

        {/* Quick Public Links: Sunday Schedule & Visitor Intake */}
        <div className="space-y-2 pt-1 border-t border-slate-100">
          
          {/* Sunday Attendance Board Link */}
          <Link
            href="/schedule"
            className="w-full p-3 rounded-2xl bg-[#FFF9F5] hover:bg-[#FFF3EB] border border-orange-200/70 flex items-center justify-between transition-all group active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-xl bg-orange-100/80 text-[#FF6B00] shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-black text-[#111827]">Sunday Attendance Board</div>
                <div className="text-[10px] text-slate-500 font-medium">Plot your service time slot (No login needed)</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#FF6B00] transition-transform group-hover:translate-x-0.5 shrink-0" />
          </Link>

          {/* Sunday Intake Link */}
          <div className="text-center pt-1">
            <Link
              href="/intake"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#FF6B00] transition-colors group py-1"
            >
              <ClipboardPenLine className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#FF6B00] transition-colors" />
              <span>Recording a visitor?</span>
              <span className="font-bold text-[#FF6B00] group-hover:underline underline-offset-4">
                Sunday Intake Form →
              </span>
            </Link>
          </div>

        </div>

        {/* Security / Role Notice */}
        <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-500 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <p className="text-[10px] text-slate-500 leading-snug font-medium">
            Restricted to authorized <strong className="text-slate-700">Admins</strong>, <strong className="text-slate-700">Team Leaders</strong>, and <strong className="text-slate-700">Follow-Up Ministers</strong>.
          </p>
        </div>

      </main>

      {/* Footer */}
      <footer className="w-full text-center text-xs text-slate-400 font-semibold pt-4">
        River of God Church • Connect Hub
      </footer>

    </div>
  );
}