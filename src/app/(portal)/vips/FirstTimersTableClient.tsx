"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Search, 
  Calendar, 
  Phone, 
  Check, 
  MessageSquare, 
  Users, 
  UserCheck2, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  HeartHandshake
} from "lucide-react";
import { toggleDiscipleshipStatusAction } from "@/app/actions/firstTimerAction";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

interface FirstTimersClientProps {
  initialData: any[];
  totalInMonth: number;
  selectedYear: number;
  selectedMonth: number;
  teamMembers: any[];
}

export default function FirstTimersTableClient({
  initialData,
  totalInMonth,
  selectedYear,
  selectedMonth,
}: FirstTimersClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedService, setSelectedService] = useState(searchParams.get("service") || "ALL");

  const updateFilters = (newMonth: number, newYear: number, service: string, searchTerm: string) => {
    const params = new URLSearchParams();
    params.set("month", String(newMonth));
    params.set("year", String(newYear));
    if (service !== "ALL") params.set("service", service);
    if (searchTerm.trim()) params.set("search", searchTerm.trim());

    startTransition(() => {
      router.push(`/vips?${params.toString()}`);
    });
  };

  const handlePrevMonth = () => {
    let m = selectedMonth - 1;
    let y = selectedYear;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    updateFilters(m, y, selectedService, search);
  };

  const handleNextMonth = () => {
    let m = selectedMonth + 1;
    let y = selectedYear;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    updateFilters(m, y, selectedService, search);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters(selectedMonth, selectedYear, selectedService, search);
  };

  const handleToggleStatus = (id: string, field: "textedAlready" | "oneToOneStarted", currentVal: boolean) => {
    startTransition(async () => {
      await toggleDiscipleshipStatusAction(id, field, !currentVal);
    });
  };

  return (
    <div className="space-y-4">
      
      {/* Month Selector Bar & Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        
        {/* Month Navigator */}
        <div className="md:col-span-2 bg-white rounded-[24px] border border-slate-200/80 p-3.5 flex items-center justify-between shadow-sm">
          <button
            onClick={handlePrevMonth}
            className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
            title="Previous Month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-50 text-[#FF6B00]">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="text-base sm:text-lg font-black text-[#111827]">
              {MONTHS[selectedMonth - 1]} {selectedYear}
            </span>
            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full ml-1">
              {totalInMonth} Recorded
            </span>
          </div>

          <button
            onClick={handleNextMonth}
            className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
            title="Next Month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Search */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search visitor or approacher..."
            className="w-full pl-11 pr-4 py-3.5 rounded-[24px] bg-white border border-slate-200/80 text-xs sm:text-sm font-medium text-[#111827] placeholder-slate-400 focus:outline-none focus:border-[#FF6B00] shadow-sm"
          />
        </form>

      </div>

      {/* Service Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {["ALL", "10AM", "1PM", "4PM"].map((slot) => (
          <button
            key={slot}
            onClick={() => {
              setSelectedService(slot);
              updateFilters(selectedMonth, selectedYear, slot, search);
            }}
            className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all shrink-0 ${
              selectedService === slot
                ? "bg-[#FF6B00] text-white shadow-md shadow-orange-500/20"
                : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
            }`}
          >
            {slot === "ALL" ? "All Services" : `${slot} Service`}
          </button>
        ))}
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-[32px] border border-slate-200/80 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-4 px-5">Visitor Details</th>
                <th className="py-4 px-5">Category & Age</th>
                <th className="py-4 px-4">Service</th>
                <th className="py-4 px-5">Approached By</th>
                <th className="py-4 px-5">Contact / FB</th>
                <th className="py-4 px-5 text-center">Texted</th>
                <th className="py-4 px-5 text-center">1-to-1 Discipleship</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium">
              {initialData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400 text-xs font-medium">
                    No first-timer logs found for this period.
                  </td>
                </tr>
              ) : (
                initialData.map((item: any) => (
                  <tr key={item._id} className="hover:bg-orange-50/30 transition-colors">
                    
                    {/* Visitor Name & Gender */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-xs text-white shadow-sm ${
                            item.gender === 1
                              ? "bg-blue-500 shadow-blue-500/20"
                              : "bg-rose-400 shadow-rose-400/20"
                          }`}
                        >
                          {item.gender === 1 ? "M" : "F"}
                        </div>
                        <div>
                          <div className="font-extrabold text-[#111827]">{item.fullName}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {new Date(item.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category & Age Group */}
                    <td className="py-4 px-5">
                      <div className="space-y-1">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold ${
                            item.iam === "VISITOR"
                              ? "bg-blue-50 text-blue-600 border border-blue-200/60"
                              : item.iam === "LOOKING FOR A CHURCH"
                              ? "bg-amber-50 text-amber-600 border border-amber-200/60"
                              : "bg-purple-50 text-purple-600 border border-purple-200/60"
                          }`}
                        >
                          {item.iam}
                        </span>
                        <div className="text-xs text-slate-500 font-semibold">{item.ageGroup}</div>
                      </div>
                    </td>

                    {/* Service Slot */}
                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-extrabold text-xs">
                        {item.serviceAttended}
                      </span>
                    </td>

                    {/* Approached By */}
                    <td className="py-4 px-5">
                      <div className="text-xs font-bold text-slate-800">{item.approachedBy}</div>
                      {item.invitedBy && (
                        <div className="text-[10px] text-slate-400">Invited by: {item.invitedBy}</div>
                      )}
                    </td>

                    {/* Contact & Messenger */}
                    <td className="py-4 px-5">
                      {item.contact ? (
                        <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-700">
                          <Phone className="w-3 h-3 text-emerald-600" />
                          {item.contact}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-300 italic">No contact</span>
                      )}
                      {item.messenger && (
                        <div className="flex items-center gap-1 text-[11px] text-blue-600 font-medium mt-0.5">
                          <MessageSquare className="w-3 h-3" />
                          {item.messenger}
                        </div>
                      )}
                    </td>

                    {/* Texted Toggle */}
                    <td className="py-4 px-5 text-center">
                      <button
                        onClick={() => handleToggleStatus(item._id, "textedAlready", !!item.textedAlready)}
                        disabled={isPending}
                        className={`h-7 w-7 rounded-xl border flex items-center justify-center mx-auto transition-all ${
                          item.textedAlready
                            ? "bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/30"
                            : "bg-slate-50 border-slate-300 text-transparent hover:border-emerald-500"
                        }`}
                        title={item.textedAlready ? "Marked as texted" : "Click to mark as texted"}
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                      </button>
                    </td>

                    {/* 1-to-1 Discipleship Status */}
                    <td className="py-4 px-5 text-center">
                      <button
                        onClick={() => handleToggleStatus(item._id, "oneToOneStarted", !!item.oneToOneStarted)}
                        disabled={isPending}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold border transition-all ${
                          item.oneToOneStarted
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200/80 shadow-sm"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-orange-50 hover:text-[#FF6B00] hover:border-orange-200"
                        }`}
                      >
                        {item.oneToOneStarted ? "✓ In Discipleship" : "+ Start 1-to-1"}
                      </button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}