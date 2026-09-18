import React, { forwardRef } from "react";
import { Sparkles, Users, UserPlus, HeartHandshake } from "lucide-react";

export interface ConnectUpdatesData {
  date: string;
  vips: number;
  visitors: number;
  firstTimers: number;
  connected: number;
}

export const ConnectUpdatesCard = forwardRef<HTMLDivElement, { data: ConnectUpdatesData }>(
  ({ data }, ref) => {
    return (
      <div
        ref={ref}
        style={{ width: "420px" }}
        className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-xl space-y-4 font-sans text-slate-800"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-50 text-[#FF6B00] border border-orange-200/60">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#111827] tracking-tight">
                Connect Updates!
              </h2>
              <p className="text-[11px] text-slate-400 font-bold">River of God</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-extrabold uppercase">
            {data.date}
          </span>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3.5 rounded-2xl bg-orange-50/70 border border-orange-200/60">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#FF6B00]">
              <Sparkles className="w-3.5 h-3.5" /> VIPs Total
            </div>
            <div className="text-2xl font-black text-[#111827] mt-1">{data.vips}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/60">
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600">
              <Users className="w-3.5 h-3.5" /> Visitors
            </div>
            <div className="text-2xl font-black text-[#111827] mt-1">{data.visitors}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/60">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600">
              <UserPlus className="w-3.5 h-3.5" /> First Timers
            </div>
            <div className="text-2xl font-black text-[#111827] mt-1">{data.firstTimers}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/60">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
              <HeartHandshake className="w-3.5 h-3.5" /> Connected
            </div>
            <div className="text-2xl font-black text-[#111827] mt-1">{data.connected}</div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-1 text-[10px] font-bold text-slate-400">
          Connect Ministry • River of God
        </div>
      </div>
    );
  }
);
ConnectUpdatesCard.displayName = "ConnectUpdatesCard";