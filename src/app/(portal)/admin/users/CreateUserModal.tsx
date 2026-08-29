"use client";

import { useState, useTransition } from "react";
import { Plus, X, UserPlus, Key, Shield, User, Loader2 } from "lucide-react";
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
        className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-extrabold text-xs shadow-lg shadow-orange-500/25 transition-all active:scale-95"
      >
        <Plus className="w-4 h-4" /> Provision New Account
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-[32px] border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-5 animate-in zoom-in-95">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-orange-50 text-[#FF6B00] border border-orange-200">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-[#111827]">Create Leader Account</h2>
                  <p className="text-xs text-slate-500 font-medium">Provision portal credentials</p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="fullName"
                    required
                    placeholder="e.g. Frank Balboa"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#F8FAFC] border border-slate-200 text-sm text-[#111827] focus:outline-none focus:border-[#FF6B00] focus:bg-white"
                  />
                </div>
              </div>

              {/* Username & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Username *
                  </label>
                  <input
                    type="text"
                    name="username"
                    required
                    autoCapitalize="none"
                    placeholder="e.g. frank_b"
                    className="w-full px-4 py-3 rounded-2xl bg-[#F8FAFC] border border-slate-200 text-sm text-[#111827] focus:outline-none focus:border-[#FF6B00] focus:bg-white font-mono text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Password *
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      name="password"
                      required
                      placeholder="Min. 6 chars"
                      className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#F8FAFC] border border-slate-200 text-sm text-[#111827] focus:outline-none focus:border-[#FF6B00] focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Role Permission *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 p-3 rounded-2xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-orange-50/50 has-[:checked]:border-[#FF6B00] has-[:checked]:bg-orange-50">
                    <input
                      type="radio"
                      name="role"
                      value="TEAM_LEADER"
                      defaultChecked
                      className="text-[#FF6B00] focus:ring-[#FF6B00]"
                    />
                    <div>
                      <div className="text-xs font-bold text-[#111827]">Team Leader</div>
                      <div className="text-[10px] text-slate-400">Manage queues</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-3 rounded-2xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-orange-50/50 has-[:checked]:border-[#FF6B00] has-[:checked]:bg-orange-50">
                    <input
                      type="radio"
                      name="role"
                      value="FOLLOW_UP_TEAM"
                      className="text-[#FF6B00] focus:ring-[#FF6B00]"
                    />
                    <div>
                      <div className="text-xs font-bold text-[#111827]">Follow Up Team</div>
                      <div className="text-[10px] text-slate-400">1-on-1 discipleship</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Link to Team Member */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                  <span>Link to Roster Member</span>
                  <span className="text-slate-400 font-normal lowercase text-[10px]">(optional)</span>
                </label>
                <select
                  name="teamMemberId"
                  className="w-full px-4 py-3 rounded-2xl bg-[#F8FAFC] border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#FF6B00] focus:bg-white"
                >
                  <option value="">-- No Roster Member Linked --</option>
                  {teamMembers.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name} ({m.groupName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Submit CTA */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-1/3 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-2/3 py-3.5 rounded-2xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-extrabold text-xs shadow-lg shadow-orange-500/25 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Credentials"}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}
    </>
  );
}