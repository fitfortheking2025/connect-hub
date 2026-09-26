// src/app/components/ScheduleCapacityModal.tsx
"use client";

import { useState, useTransition } from "react";
import { Settings2, X, Users, ShieldCheck, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { updateScheduleCapacityAction } from "@/app/actions/systemSettingActions";
import { useRouter } from "next/navigation";

interface ScheduleCapacityModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMaxMembers: number;
  currentMaxLeaders?: number;
}

export default function ScheduleCapacityModal({
  isOpen,
  onClose,
  currentMaxMembers,
  currentMaxLeaders = 2,
}: ScheduleCapacityModalProps) {
  const router = useRouter();
  const [members, setMembers] = useState<number>(currentMaxMembers);
  const [leaders, setLeaders] = useState<number>(currentMaxLeaders);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const res = await updateScheduleCapacityAction({
        maxMembersPerService: members,
        maxLeadersPerService: leaders,
      });

      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          router.refresh();
        }, 1000);
      } else {
        setError(res.error || "Failed to save configuration.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-sm bg-white rounded-[28px] border border-slate-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-50 text-[#FF6B00]">
              <Settings2 className="w-4 h-4" />
            </div>
            <h3 className="text-base font-black text-[#111827]">Service Capacities</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-600 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Capacities updated successfully!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#FF6B00]" />
              Member Slots Per Service
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={50}
                required
                value={members}
                onChange={(e) => setMembers(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-black font-mono text-slate-800 focus:outline-none focus:border-[#FF6B00]"
              />
              <span className="text-xs font-semibold text-slate-400 shrink-0">slots</span>
            </div>
            <p className="text-[10px] text-slate-400">Default was 8. Applies to 10AM, 1PM, and 4PM.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              Leader Quota Per Service
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={10}
                required
                value={leaders}
                onChange={(e) => setLeaders(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-black font-mono text-slate-800 focus:outline-none focus:border-[#FF6B00]"
              />
              <span className="text-xs font-semibold text-slate-400 shrink-0">leaders</span>
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="w-2/3 py-2.5 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-black text-xs shadow-md shadow-orange-500/20 flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all active:scale-95"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}