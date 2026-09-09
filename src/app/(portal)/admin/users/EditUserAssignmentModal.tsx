"use client";

import { useState, useTransition } from "react";
import { Edit2, X, Shield, Users, Loader2, CheckCircle2 } from "lucide-react";
import { updateUserAssignmentAction } from "@/app/actions/authActions";

const AGE_GROUPS = [
  "Youth",
  "Young Adult",
  "River Men",
  "River Women",
  "Seasoned",
];

interface EditUserModalProps {
  user: {
    _id: string;
    fullName: string;
    username: string;
    role: "ADMIN" | "TEAM_LEADER" | "FOLLOW_UP_TEAM";
    assignedAgeGroups?: string[];
    assignedGender?: number | null;
  };
}

export default function EditUserAssignmentModal({ user }: EditUserModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [role, setRole] = useState(user.role);
  const [ageGroups, setAgeGroups] = useState<string[]>(user.assignedAgeGroups || []);
  const [gender, setGender] = useState<number | null>(
    user.assignedGender !== undefined ? user.assignedGender : null
  );
  const [error, setError] = useState<string | null>(null);

  const toggleAgeGroup = (group: string) => {
    setAgeGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]
    );
  };

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const res = await updateUserAssignmentAction({
        userId: user._id,
        role: role as any,
        assignedAgeGroups: ageGroups,
        assignedGender: gender,
      });

      if (res.success) {
        setIsOpen(false);
      } else {
        setError(res.error || "Failed to save changes.");
      }
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:text-[#FF6B00] hover:border-orange-200 hover:bg-orange-50/50 transition-colors"
        title="Edit Role & Assignments"
      >
        <Edit2 className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in text-left">
          <div className="w-full max-w-lg bg-white rounded-[28px] border border-slate-200 shadow-2xl p-6 space-y-5 animate-in zoom-in-95">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-[#111827]">Edit Permissions</h3>
                <p className="text-xs text-slate-400 font-medium">
                  Configuring {user.fullName} (@{user.username})
                </p>
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

            {/* Role Selection */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                System Role
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: "FOLLOW_UP_TEAM", label: "Follow Up" },
                  { id: "TEAM_LEADER", label: "Team Leader" },
                  { id: "ADMIN", label: "Admin" },
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id as any)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-extrabold border transition-all ${
                      role === r.id
                        ? "bg-[#FF6B00] text-white border-[#FF6B00] shadow-sm shadow-orange-500/20"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Demographic Scope: Only active for FOLLOW_UP_TEAM */}
            {role === "FOLLOW_UP_TEAM" ? (
              <div className="space-y-4 pt-2 border-t border-slate-100">
                
                {/* Age Group Badges */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Assigned Age Groups
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {AGE_GROUPS.map((g) => {
                      const active = ageGroups.includes(g);
                      return (
                        <button
                          key={g}
                          type="button"
                          onClick={() => toggleAgeGroup(g)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                            active
                              ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {g}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Gender Scope */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Assigned Gender Scope
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 1, label: "Male Only" },
                      { value: 0, label: "Female Only" },
                      { value: null, label: "Both (Any)" },
                    ].map((item) => (
                      <button
                        key={String(item.value)}
                        type="button"
                        onClick={() => setGender(item.value)}
                        className={`py-2 rounded-xl text-xs font-extrabold border transition-all ${
                          gender === item.value
                            ? "bg-[#FF6B00] text-white border-[#FF6B00] shadow-sm shadow-orange-500/20"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/70 text-xs text-amber-900 font-medium flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>{role === "TEAM_LEADER" ? "Team Leaders" : "Admins"}</strong> have full system access and can see all VIP records without restriction.
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-1/3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleSave}
                className="w-2/3 py-2.5 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-extrabold text-xs shadow-md shadow-orange-500/20 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Assignment"}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}