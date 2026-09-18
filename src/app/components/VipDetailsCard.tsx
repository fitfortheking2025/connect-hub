import React, { forwardRef } from "react";
import { Phone, Send, HeartHandshake, FileText } from "lucide-react";

export interface VipCardData {
  name: string;
  gender: string;
  ageGroup: string;
  service: string;
  contact?: string;
  messenger?: string;
  category: string;
  approachedBy?: string;
  invitedBy?: string;
  connectedWith?: string;
  discipleshipStarted: boolean;
  date: string;
  notes?: string;
}

export const VipDetailsCard = forwardRef<HTMLDivElement, { data: VipCardData }>(
  ({ data }, ref) => {
    return (
      <div
        ref={ref}
        style={{ width: "420px" }}
        className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-xl space-y-3.5 font-sans text-slate-800"
      >
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div>
            <span className="text-[9px] font-black uppercase tracking-wider text-[#FF6B00]">
              VIP / First-Timer Details
            </span>
            <h2 className="text-lg font-black text-[#111827] leading-tight mt-0.5">
              {data.name}
            </h2>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-bold text-slate-400">
              <span>{data.gender}</span>
              <span>•</span>
              <span>{data.ageGroup}</span>
              <span>•</span>
              <span className="text-slate-600 font-extrabold">{data.service}</span>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-xl bg-orange-50 text-[#FF6B00] border border-orange-200/60 text-[10px] font-black uppercase">
            {data.category}
          </span>
        </div>

        {(data.contact || data.messenger) && (
          <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
            {data.contact && (
              <div className="flex items-center gap-1.5 font-bold text-slate-700 truncate">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{data.contact}</span>
              </div>
            )}
            {data.messenger && (
              <div className="flex items-center gap-1.5 font-bold text-slate-700 truncate">
                <Send className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span className="truncate">{data.messenger}</span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-1.5 text-xs">
          {data.approachedBy && (
            <div className="flex justify-between py-0.5">
              <span className="text-slate-400 font-bold text-[11px]">Approached By</span>
              <span className="font-extrabold text-[#111827]">{data.approachedBy}</span>
            </div>
          )}
          {data.invitedBy && (
            <div className="flex justify-between py-0.5">
              <span className="text-slate-400 font-bold text-[11px]">Invited By</span>
              <span className="font-extrabold text-[#111827]">{data.invitedBy}</span>
            </div>
          )}
          {data.connectedWith && (
            <div className="flex justify-between py-0.5 border-t border-slate-100 pt-1">
              <span className="text-slate-400 font-bold text-[11px]">Connected With</span>
              <span className="font-black text-emerald-600 flex items-center gap-1">
                <HeartHandshake className="w-3.5 h-3.5" />
                {data.connectedWith}
              </span>
            </div>
          )}
          <div className="flex justify-between py-0.5">
            <span className="text-slate-400 font-bold text-[11px]">Discipleship Started</span>
            <span
              className={`font-black text-[11px] ${
                data.discipleshipStarted ? "text-emerald-600" : "text-slate-400"
              }`}
            >
              {data.discipleshipStarted ? "Yes" : "No"}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold pt-1 border-t border-slate-100">
          <span>Date: {data.date}</span>
          <span>Connect Ministry</span>
        </div>
      </div>
    );
  }
);
VipDetailsCard.displayName = "VipDetailsCard";