"use client";

import { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { KeyRound, X, Eye, EyeOff, Loader2, CheckCircle2, Lock } from "lucide-react";
import { changePasswordAction } from "@/app/actions/authActions";

export default function ChangePasswordModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await changePasswordAction(formData);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          setIsOpen(false);
          setSuccess(false);
        }, 1500);
      } else {
        setError(res.error || "Failed to update password.");
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setIsOpen(true);
          setError(null);
          setSuccess(false);
        }}
        className="p-2 rounded-xl text-slate-400 hover:text-[#FF6B00] hover:bg-orange-50 transition-colors shrink-0"
        title="Change Password"
      >
        <KeyRound className="w-4 h-4" />
      </button>

      {/* Render outside sidebar hierarchy into document body */}
      {isOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-[32px] border border-slate-200/80 shadow-2xl p-6 sm:p-8 space-y-5 animate-in zoom-in-95">
            
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-orange-50 text-[#FF6B00] border border-orange-200/60">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-[#111827]">Change Password</h2>
                  <p className="text-xs text-slate-500 font-medium">Update your account credentials</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-600 animate-in fade-in">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-600 flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" /> Password updated successfully!
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Current Password */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Current Password
                </label>
                <div className="relative group">
                  <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-[#FF6B00] absolute left-4 top-1/2 -translate-y-1/2 transition-colors" />
                  <input
                    type={showCurrent ? "text" : "password"}
                    name="currentPassword"
                    required
                    placeholder="Enter current password"
                    className="w-full pl-11 pr-11 py-3 rounded-2xl bg-[#F8FAFC] border border-slate-200 text-sm font-medium text-[#111827] placeholder-slate-400 focus:outline-none focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="p-1.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  New Password
                </label>
                <div className="relative group">
                  <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-[#FF6B00] absolute left-4 top-1/2 -translate-y-1/2 transition-colors" />
                  <input
                    type={showNew ? "text" : "password"}
                    name="newPassword"
                    required
                    placeholder="Min. 6 characters"
                    className="w-full pl-11 pr-11 py-3 rounded-2xl bg-[#F8FAFC] border border-slate-200 text-sm font-medium text-[#111827] placeholder-slate-400 focus:outline-none focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="p-1.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Confirm New Password
                </label>
                <div className="relative group">
                  <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-[#FF6B00] absolute left-4 top-1/2 -translate-y-1/2 transition-colors" />
                  <input
                    type={showConfirm ? "text" : "password"}
                    name="confirmPassword"
                    required
                    placeholder="Repeat new password"
                    className="w-full pl-11 pr-11 py-3 rounded-2xl bg-[#F8FAFC] border border-slate-200 text-sm font-medium text-[#111827] placeholder-slate-400 focus:outline-none focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="p-1.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-1/3 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-2/3 py-3.5 rounded-2xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-extrabold text-xs shadow-lg shadow-orange-500/25 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Updating...
                    </>
                  ) : (
                    "Save New Password"
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>,
        document.body
      )}
    </>
  );
}