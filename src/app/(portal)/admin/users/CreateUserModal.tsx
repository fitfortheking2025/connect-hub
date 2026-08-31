// src/app/(portal)/admin/users/CreateUserModal.tsx
"use client";

import { useState, useTransition } from "react";
import { Plus, X, UserPlus, Shield, User, Loader2, Lock } from "lucide-react";
import { createStaffUserAction } from "@/app/actions/authActions";

interface TeamMemberOption {
  _id: string;
  name: string;
  groupName: string;
}

export default function CreateUserModal({
  teamMembers,
}: {
  teamMembers: TeamMemberOption[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await createStaffUserAction(formData);
      if (res.success) {
        setIsOpen(false);
      } else {
        setError(res.error || "Failed to create account.");
      }
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-2xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-black text-xs shadow-md shadow-orange-500/20 transition-all active:scale-95 shrink-0"
      >
        <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 
        <span>Add Account</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-[28px] sm:rounded-[32px] border border-slate-200 shadow-2xl p-5 sm:p-7 space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-orange-50 text-[#FF6B00] border border-orange-200/60">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-[#111827]">Create Leader Account</h2>
                  <p className="text-[10px] sm:text-xs text-slate-500 font-medium">Provision portal credentials</p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="fullName"
                    required
                    placeholder="e.g. Frank Balboa"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-[#111827] focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>
              </div>

              {/* Username */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Username *
                </label>
                <input
                  type="text"
                  name="username"
                  required
                  autoCapitalize="none"
                  placeholder="e.g. frank_b"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-[#111827] focus:outline-none focus:border-[#FF6B00] font-mono"
                />
              </div>

              {/* Default Password Notice */}
              <input type="hidden" name="password" value="connect2026" />
              
              <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/60 space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-900 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-600" /> Default Password
                  </span>
                  <span className="font-mono text-[11px] font-black px-2 py-0.5 rounded-md bg-white border border-amber-200 text-amber-900">
                    connect2026
                  </span>
                </div>
                <p className="text-[9px] text-amber-700 font-medium">
                  Applied upon creation. Users can update this in profile settings.
                </p>
              </div>

              {/* Role Selection */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Role Permission *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-orange-50/50 has-[:checked]:border-[#FF6B00] has-[:checked]:bg-orange-50">
                    <input
                      type="radio"
                      name="role"
                      value="TEAM_LEADER"
                      defaultChecked
                      className="text-[#FF6B00] focus:ring-[#FF6B00]"
                    />
                    <div>
                      <div className="text-xs font-bold text-[#111827]">Team Leader</div>
                      <div className="text-[9px] text-slate-400">Manage queues</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-orange-50/50 has-[:checked]:border-[#FF6B00] has-[:checked]:bg-orange-50">
                    <input
                      type="radio"
                      name="role"
                      value="FOLLOW_UP_TEAM"
                      className="text-[#FF6B00] focus:ring-[#FF6B00]"
                    />
                    <div>
                      <div className="text-xs font-bold text-[#111827]">Follow Up</div>
                      <div className="text-[9px] text-slate-400">Discipleship</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Link to Team Member */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Link to Roster</span>
                  <span className="text-slate-400 font-normal text-[9px]">(optional)</span>
                </label>
                <select
                  name="teamMemberId"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#FF6B00]"
                >
                  <option value="">-- No Roster Linked --</option>
                  {teamMembers.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name} ({m.groupName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Submit Action */}
              <div className="pt-1 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-1/3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-2/3 py-2.5 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-extrabold text-xs shadow-md shadow-orange-500/20 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Create Account"}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}
    </>
  );
}