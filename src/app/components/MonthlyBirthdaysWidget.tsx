// src/app/components/MonthlyBirthdaysWidget.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { Cake, Gift, ChevronLeft, ChevronRight, Phone } from "lucide-react";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

interface Celebrant {
  _id: string;
  name: string;
  nickname?: string;
  groupName?: string;
  photoUrl?: string;
  birthdate: string;
  birthDay: number;
}

export default function MonthlyBirthdaysWidget({
  allMembers = [],
}: {
  allMembers: any[];
}) {
  const today = new Date();
  const actualCurrentMonth = today.getMonth(); // 0-11
  const actualCurrentDay = today.getDate();

  const [selectedMonth, setSelectedMonth] = useState<number>(actualCurrentMonth);

  // Filter celebrants in-memory by selected month (1-12)
  const celebrants: Celebrant[] = allMembers
    .filter((m) => {
      if (!m.birthdate) return false;
      const bDate = new Date(m.birthdate);
      return !isNaN(bDate.getTime()) && bDate.getMonth() === selectedMonth;
    })
    .map((m) => {
      const bDate = new Date(m.birthdate);
      return {
        _id: String(m._id),
        name: m.name,
        nickname: m.nickname?.trim() || "",
        groupName: m.groupName || "Members",
        photoUrl: m.photoUrl || "",
        birthdate: m.birthdate,
        birthDay: bDate.getDate(),
        contactNumber: m.contactNumber || m.contact || "",
      };
    })
    .sort((a, b) => a.birthDay - b.birthDay);

  const handlePrevMonth = () => {
    setSelectedMonth((prev) => (prev === 0 ? 11 : prev - 1));
  };

  const handleNextMonth = () => {
    setSelectedMonth((prev) => (prev === 11 ? 0 : prev + 1));
  };

  const isCurrentActualMonth = actualCurrentMonth === selectedMonth;

  return (
    <div className="bg-white rounded-[24px] sm:rounded-[28px] border border-slate-200/80 p-4 sm:p-5 shadow-sm space-y-3.5">
      {/* Widget Header & Stepper */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 sm:p-2.5 rounded-2xl bg-gradient-to-br from-pink-50 to-rose-50 text-rose-500 border border-rose-200/60 shadow-xs">
            <Cake className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-sm sm:text-base leading-tight">
              Birthday Celebrants
            </h3>
            <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400">
              {MONTHS[selectedMonth]} ({celebrants.length} Celebrant{celebrants.length === 1 ? "" : "s"})
            </p>
          </div>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/80 p-1 rounded-xl">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1 rounded-lg hover:bg-white text-slate-500 hover:text-slate-800 transition-all active:scale-95"
            title="Previous Month"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-black text-slate-800 px-2 min-w-[55px] text-center select-none">
            {MONTHS[selectedMonth].slice(0, 3)}
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1 rounded-lg hover:bg-white text-slate-500 hover:text-slate-800 transition-all active:scale-95"
            title="Next Month"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Celebrant Grid */}
      {celebrants.length === 0 ? (
        <div className="py-6 text-center space-y-1">
          <Gift className="w-7 h-7 text-slate-300 mx-auto" />
          <p className="text-xs text-slate-400 font-medium">
            No birthdays found for {MONTHS[selectedMonth]}.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {celebrants.map((c) => {
            const displayName = c.nickname || c.name;
            const isToday = isCurrentActualMonth && c.birthDay === actualCurrentDay;

            return (
              <div
                key={c._id}
                className={`flex items-center justify-between p-2.5 sm:p-3 rounded-2xl border transition-all ${
                  isToday
                    ? "bg-gradient-to-r from-rose-50/80 to-amber-50/80 border-rose-300 shadow-sm ring-1 ring-rose-400/20"
                    : "bg-slate-50/60 hover:bg-slate-50 border-slate-200/80"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative h-9 w-9 rounded-xl overflow-hidden bg-white border border-slate-200 shrink-0 shadow-xs">
                    {c.photoUrl ? (
                      <Image
                        src={c.photoUrl}
                        alt={displayName}
                        fill
                        sizes="36px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center font-black text-xs text-white bg-slate-700">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-xs text-slate-900 truncate">
                        {displayName}
                      </span>
                      {isToday && (
                        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-rose-500 text-white uppercase tracking-wider animate-pulse">
                          Today!
                        </span>
                      )}
                    </div>
                    {c.nickname && c.nickname !== c.name && (
                      <span className="text-[10px] text-slate-400 truncate block">
                        {c.name}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 pl-2">
                  <div className="text-right">
                    <div className="text-xs font-black text-slate-800">
                      {MONTHS[selectedMonth].slice(0, 3)} {c.birthDay}
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">
                      {c.groupName === "Team Leaders" ? "Leader" : "Member"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}