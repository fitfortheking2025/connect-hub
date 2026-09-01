// src/app/schedule/ScheduleClientView.tsx
"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Calendar, 
  Clock, 
  UserCheck, 
  Lock, 
  AlertCircle, 
  CheckCircle2, 
  KeyRound, 
  Loader2,
  X,
  LogIn
} from "lucide-react";
import { formatSundayDateHuman } from "@/lib/sundayDate";
import { plotSundayServiceAction } from "@/app/actions/scheduleAction";
import CustomMemberSelect from "@/app/components/CustomMemberSelect";

interface Attendee {
  memberId?: string;
  name: string;
  service: "10AM" | "1PM" | "4PM" | "NOT_ATTENDING";
  reason?: string;
  editToken: string;
  isLockedByLeader?: boolean;
}

type ServiceType = "10AM" | "1PM" | "4PM" | "NOT_ATTENDING";

export default function ScheduleClientView({
  initialSchedule,
  sundayDate,
  teamMembers,
}: {
  initialSchedule: any;
  sundayDate: string;
  teamMembers: Array<{ _id: string; name: string }>;
}) {
  const [schedule, setSchedule] = useState(initialSchedule);
  const [isPending, startTransition] = useTransition();

  // Booking Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedName, setSelectedName] = useState("");
  const [selectedService, setSelectedService] = useState<ServiceType>("10AM");
  const [reason, setReason] = useState("");
  const [editPasskey, setEditPasskey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ message: string; editToken?: string } | null>(null);

  const attendees: Attendee[] = schedule?.attendees || [];
  const list10AM = attendees.filter((a) => a.service === "10AM");
  const list1PM = attendees.filter((a) => a.service === "1PM");
  const list4PM = attendees.filter((a) => a.service === "4PM");
  const listNotAttending = attendees.filter((a) => a.service === "NOT_ATTENDING");

  const existingAttendee = attendees.find(
    (a) => a.name.toLowerCase() === selectedName.trim().toLowerCase()
  );

  const handleOpenModal = (presetService: ServiceType = "10AM") => {
    setError(null);
    setSuccessInfo(null);
    setSelectedService(presetService);
    setReason("");
    setEditPasskey("");
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedName) {
      setError("Please choose your name from the team roster.");
      return;
    }

    startTransition(async () => {
      const res = await plotSundayServiceAction({
        sundayDate,
        name: selectedName,
        service: selectedService,
        reason,
        editToken: editPasskey,
      });

      if (res.success && res.attendee) {
        setSchedule((prev: any) => {
          const currentAttendees = [...(prev?.attendees || [])];
          const idx = currentAttendees.findIndex(
            (a) => a.name.toLowerCase() === res.attendee.name.toLowerCase()
          );

          if (idx > -1) {
            currentAttendees[idx] = res.attendee;
          } else {
            currentAttendees.push(res.attendee);
          }

          return { ...prev, attendees: currentAttendees };
        });

        setSuccessInfo({
          message: res.message || "Successfully booked slot!",
          editToken: res.editToken,
        });
      } else {
        setError(res.error || "Failed to book slot.");
      }
    });
  };

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] pb-24">
      
      {/* Header */}
        <header className="w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
        <div className="w-full max-w-7xl mx-auto px-3.5 sm:px-8 lg:px-12 py-3 sm:py-4 flex items-center justify-between gap-2 sm:gap-4">
            
            {/* Left: Branding */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl overflow-hidden shadow-sm bg-white border border-slate-100 p-0.5 shrink-0">
                <Image src="/connect-hub.png" alt="Connect Hub" fill className="object-contain p-1" priority />
            </div>
            <div className="min-w-0">
                <h1 className="font-black text-sm sm:text-lg text-[#111827] tracking-tight leading-tight truncate">
                Connect Hub
                </h1>
                <p className="text-[10px] sm:text-[11px] font-bold text-[#FF6B00] leading-none truncate">
                Attendance Board
                </p>
            </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <Link
                href="/login"
                className="inline-flex items-center gap-1 px-2.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
            >
                <LogIn className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="hidden xs:inline sm:inline">Login</span>
            </Link>

            <button
                onClick={() => handleOpenModal("10AM")}
                className="inline-flex items-center gap-1 sm:gap-1.5 px-3 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white text-xs font-extrabold shadow-md shadow-orange-500/20 transition-all active:scale-95"
            >
                <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span>Plot Slot</span>
            </button>
            </div>

        </div>
        </header>

      {/* Main Full-Width Responsive Container */}
      <main className="w-full px-4 sm:px-8 lg:px-12 pt-6 sm:pt-8 space-y-6 sm:space-y-8">
        
        {/* Date & Policy Banner */}
        <div className="w-full bg-white rounded-[24px] sm:rounded-[32px] border border-slate-200/80 p-5 sm:p-7 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 sm:p-3.5 rounded-2xl bg-orange-50 text-[#FF6B00] border border-orange-200/60 shrink-0">
              <Calendar className="w-6 sm:w-7 h-6 sm:h-7" />
            </div>
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Scheduled Sunday Service
              </span>
              <h2 className="text-lg sm:text-2xl font-black text-[#111827] tracking-tight">
                {formatSundayDateHuman(sundayDate)}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200/80 self-start sm:self-center">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-xs sm:text-sm font-bold text-slate-700 whitespace-nowrap">
              8 Members Max Per Service
            </span>
          </div>
        </div>

        {/* 3 Service Cards Grid */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 lg:gap-8 items-start">
          
          {/* 10:00 AM Column */}
          <div className="w-full bg-white rounded-[28px] sm:rounded-[32px] border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-5">
            <div className="space-y-3.5">
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 gap-2">
                <div className="flex items-center gap-2 font-black text-slate-900 text-sm sm:text-base whitespace-nowrap truncate">
                  <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>10:00 AM Service</span>
                </div>
                <span className={`text-[11px] font-extrabold px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border whitespace-nowrap shrink-0 ${
                  list10AM.length >= 8 
                    ? "bg-rose-50 text-rose-600 border-rose-200" 
                    : "bg-blue-50 text-blue-700 border-blue-200"
                }`}>
                  {list10AM.length} / 8 Filled
                </span>
              </div>

              <div className="space-y-2 min-h-[340px]">
                {Array.from({ length: 8 }).map((_, i) => {
                  const item = list10AM[i];
                  return (
                    <div
                      key={i}
                      className={`px-4 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm flex items-center justify-between border transition-all ${
                        item
                          ? "bg-slate-50/80 border-slate-200 font-bold text-slate-800 shadow-2xs"
                          : "bg-slate-50/30 border-dashed border-slate-200/70 text-slate-400 font-medium"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate pr-2 w-full">
                        <span className="text-slate-400 font-mono text-xs w-4 shrink-0">{i + 1}.</span>
                        <span className="truncate text-slate-800 font-semibold">{item ? item.name : "Open Slot"}</span>
                      </div>
                      {item?.isLockedByLeader && (
                        <span title="Locked by Leadership" className="text-orange-500 shrink-0">
                          <Lock className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => handleOpenModal("10AM")}
              disabled={list10AM.length >= 8}
              className="w-full py-2.5 sm:py-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-xs transition-colors disabled:opacity-40"
            >
              {list10AM.length >= 8 ? "Service Full" : "Book 10:00 AM Slot"}
            </button>
          </div>

          {/* 1:00 PM Column */}
          <div className="w-full bg-white rounded-[28px] sm:rounded-[32px] border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-5">
            <div className="space-y-3.5">
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 gap-2">
                <div className="flex items-center gap-2 font-black text-slate-900 text-sm sm:text-base whitespace-nowrap truncate">
                  <Clock className="w-4 h-4 text-[#FF6B00] shrink-0" />
                  <span>1:00 PM Service</span>
                </div>
                <span className={`text-[11px] font-extrabold px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border whitespace-nowrap shrink-0 ${
                  list1PM.length >= 8 
                    ? "bg-rose-50 text-rose-600 border-rose-200" 
                    : "bg-orange-50 text-[#FF6B00] border-orange-200"
                }`}>
                  {list1PM.length} / 8 Filled
                </span>
              </div>

              <div className="space-y-2 min-h-[340px]">
                {Array.from({ length: 8 }).map((_, i) => {
                  const item = list1PM[i];
                  return (
                    <div
                      key={i}
                      className={`px-4 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm flex items-center justify-between border transition-all ${
                        item
                          ? "bg-slate-50/80 border-slate-200 font-bold text-slate-800 shadow-2xs"
                          : "bg-slate-50/30 border-dashed border-slate-200/70 text-slate-400 font-medium"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate pr-2 w-full">
                        <span className="text-slate-400 font-mono text-xs w-4 shrink-0">{i + 1}.</span>
                        <span className="truncate text-slate-800 font-semibold">{item ? item.name : "Open Slot"}</span>
                      </div>
                      {item?.isLockedByLeader && (
                        <span title="Locked by Leadership" className="text-orange-500 shrink-0">
                          <Lock className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => handleOpenModal("1PM")}
              disabled={list1PM.length >= 8}
              className="w-full py-2.5 sm:py-3 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#FF6B00] font-extrabold text-xs transition-colors disabled:opacity-40"
            >
              {list1PM.length >= 8 ? "Service Full" : "Book 1:00 PM Slot"}
            </button>
          </div>

          {/* 4:00 PM Column */}
          <div className="w-full bg-white rounded-[28px] sm:rounded-[32px] border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-5">
            <div className="space-y-3.5">
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 gap-2">
                <div className="flex items-center gap-2 font-black text-slate-900 text-sm sm:text-base whitespace-nowrap truncate">
                  <Clock className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>4:00 PM Service</span>
                </div>
                <span className={`text-[11px] font-extrabold px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border whitespace-nowrap shrink-0 ${
                  list4PM.length >= 8 
                    ? "bg-rose-50 text-rose-600 border-rose-200" 
                    : "bg-purple-50 text-purple-700 border-purple-200"
                }`}>
                  {list4PM.length} / 8 Filled
                </span>
              </div>

              <div className="space-y-2 min-h-[340px]">
                {Array.from({ length: 8 }).map((_, i) => {
                  const item = list4PM[i];
                  return (
                    <div
                      key={i}
                      className={`px-4 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm flex items-center justify-between border transition-all ${
                        item
                          ? "bg-slate-50/80 border-slate-200 font-bold text-slate-800 shadow-2xs"
                          : "bg-slate-50/30 border-dashed border-slate-200/70 text-slate-400 font-medium"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate pr-2 w-full">
                        <span className="text-slate-400 font-mono text-xs w-4 shrink-0">{i + 1}.</span>
                        <span className="truncate text-slate-800 font-semibold">{item ? item.name : "Open Slot"}</span>
                      </div>
                      {item?.isLockedByLeader && (
                        <span title="Locked by Leadership" className="text-orange-500 shrink-0">
                          <Lock className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => handleOpenModal("4PM")}
              disabled={list4PM.length >= 8}
              className="w-full py-2.5 sm:py-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-extrabold text-xs transition-colors disabled:opacity-40"
            >
              {list4PM.length >= 8 ? "Service Full" : "Book 4:00 PM Slot"}
            </button>
          </div>

        </div>

        {/* Not Attending / Excused List */}
        {listNotAttending.length > 0 && (
          <div className="w-full bg-white rounded-[28px] sm:rounded-[32px] border border-slate-200/80 p-5 sm:p-7 shadow-xs space-y-4">
            <div className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">
              Not Attending / Excused ({listNotAttending.length})
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {listNotAttending.map((a, i) => (
                <div key={i} className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm">
                  <div className="font-bold text-slate-800 truncate">{a.name}</div>
                  <div className="text-[11px] text-slate-400 italic truncate mt-0.5">{a.reason || "Excused"}</div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* Booking Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-[28px] sm:rounded-[32px] border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-4 animate-in zoom-in-95">
            
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base sm:text-lg font-black text-[#111827]">Book Sunday Service Slot</h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            {successInfo ? (
              <div className="space-y-4 py-2 text-center">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-black text-slate-900">{successInfo.message}</h4>
                  {successInfo.editToken && (
                    <div className="p-3.5 rounded-2xl bg-orange-50 border border-orange-200 text-xs space-y-1 mt-2">
                      <div className="text-slate-500 font-medium">Your Slot Edit Passkey:</div>
                      <div className="font-mono text-sm font-black text-[#FF6B00] tracking-wider">{successInfo.editToken}</div>
                      <div className="text-[10px] text-slate-400">Save this if you wish to change your slot later.</div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-full py-3 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-extrabold text-xs transition-all"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-3.5">
                
                {/* Searchable Roster Select */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Your Name *
                  </label>
                  <CustomMemberSelect
                    teamMembers={teamMembers}
                    selectedName={selectedName}
                    placeholder="Search and choose your name..."
                    onSelect={(val: any) => setSelectedName(typeof val === "string" ? val : val.name)}
                  />
                </div>

                {/* Service Selection */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Service Time *
                  </label>
                  <select
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value as ServiceType)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-[#FF6B00]"
                  >
                    <option value="10AM">10:00 AM Service ({list10AM.length}/8)</option>
                    <option value="1PM">1:00 PM Service ({list1PM.length}/8)</option>
                    <option value="4PM">4:00 PM Service ({list4PM.length}/8)</option>
                    <option value="NOT_ATTENDING">Cannot Attend (Excused)</option>
                  </select>
                </div>

                {/* Reason if Not Attending */}
                {selectedService === "NOT_ATTENDING" && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Reason
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sickness, Out of town"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none"
                    />
                  </div>
                )}

                {/* Passkey if modifying existing booking */}
                {existingAttendee && (
                  <div className="space-y-1 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <KeyRound className="w-3 h-3 text-[#FF6B00]" />
                      Edit Passkey (Required for updates)
                    </label>
                    <input
                      type="text"
                      placeholder="Enter passkey (e.g. KARM482)"
                      value={editPasskey}
                      onChange={(e) => setEditPasskey(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800 focus:outline-none"
                    />
                  </div>
                )}

                <div className="pt-2 flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="w-1/3 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending || !selectedName}
                    className="w-2/3 py-3 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-black text-xs shadow-md shadow-orange-500/20 flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all active:scale-95"
                  >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Slot"}
                  </button>
                </div>

              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}