// src/app/schedule/ScheduleClientView.tsx
"use client";

import { useState, useTransition } from "react";
import { Calendar, Clock, ShieldCheck, UserCheck, LogIn, Info, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { plotSundayServiceAction } from "@/app/actions/scheduleAction";
import CustomMemberSelect from "@/app/components/CustomMemberSelect";

type ServiceType = "10AM" | "1PM" | "4PM" | "NOT_ATTENDING";

const SERVICE_CONFIG: Record<
  "10AM" | "1PM" | "4PM",
  {
    title: string;
    text: string;
    bg: string;
    border: string;
    badgeBg: string;
    badgeText: string;
    leaderBg: string;
    leaderBorder: string;
    leaderText: string;
    dotBg: string;
    btn: string;
  }
> = {
  "10AM": {
    title: "10:00 AM Service",
    text: "text-blue-600",
    bg: "bg-blue-50/40",
    border: "border-blue-100",
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-700",
    leaderBg: "from-blue-50 to-indigo-50/60",
    leaderBorder: "border-blue-200/70",
    leaderText: "text-blue-800",
    dotBg: "bg-blue-600",
    btn: "bg-blue-50 hover:bg-blue-100 text-blue-700",
  },
  "1PM": {
    title: "1:00 PM Service",
    text: "text-[#FF6B00]",
    bg: "bg-orange-50/40",
    border: "border-orange-100",
    badgeBg: "bg-orange-50",
    badgeText: "text-orange-700",
    leaderBg: "from-orange-50 to-amber-50/60",
    leaderBorder: "border-orange-200/70",
    leaderText: "text-orange-800",
    dotBg: "bg-[#FF6B00]",
    btn: "bg-orange-50 hover:bg-orange-100 text-[#FF6B00]",
  },
  "4PM": {
    title: "4:00 PM Service",
    text: "text-purple-600",
    bg: "bg-purple-50/40",
    border: "border-purple-100",
    badgeBg: "bg-purple-50",
    badgeText: "text-purple-700",
    leaderBg: "from-purple-50 to-fuchsia-50/60",
    leaderBorder: "border-purple-200/70",
    leaderText: "text-purple-800",
    dotBg: "bg-purple-600",
    btn: "bg-purple-50 hover:bg-purple-100 text-purple-700",
  },
};

export default function ScheduleClientView({ 
  initialSchedule, 
  teamMembers = [], 
  isMemberBookingOpen = false 
}: { 
  initialSchedule: any; 
  teamMembers?: any[];
  isMemberBookingOpen?: boolean;
}) {
  const [schedule, setSchedule] = useState(initialSchedule || {});
  const attendees: any[] = schedule?.attendees || [];
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceType>("10AM");
  const [selectedName, setSelectedName] = useState("");
  const [reason, setReason] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  const selectableMembers = isMemberBookingOpen
    ? teamMembers
    : teamMembers.filter(
        (m: any) => m.isLeader || m.groupName === "Team Leaders"
      );

  const handleOpenModal = (service: ServiceType) => {
    setSelectedService(service);
    setSelectedName("");
    setReason("");
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!selectedName) {
      setErrorMsg("Please select your name.");
      return;
    }

    startTransition(async () => {
      const result = await plotSundayServiceAction({
        sundayDate: schedule.sundayDate,
        name: selectedName,
        service: selectedService,
        reason,
      });

      if (result.success) {
        setIsModalOpen(false);
        window.location.reload(); 
      } else {
        setErrorMsg(result.error || "Failed to plot slot");
      }
    });
  };

  function getServiceBreakdown(allAttendees: any[], service: "10AM" | "1PM" | "4PM") {
    const list = (allAttendees || []).filter((a) => a.service === service);
    const leaders = list.filter((a) => a.isLeader);
    const members = list.filter((a) => !a.isLeader);
    return { list, leaders, members };
  }

  const renderServiceCard = (serviceKey: "10AM" | "1PM" | "4PM") => {
    const config = SERVICE_CONFIG[serviceKey];
    const { leaders, members } = getServiceBreakdown(attendees, serviceKey);

    return (
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
              <Clock className={`w-4 h-4 ${config.text}`} />
              <h3 className="font-black text-slate-900 text-base">{config.title}</h3>
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${config.badgeBg} ${config.badgeText}`}>
              {members.length} / 8 Members
            </span>
          </div>

          <div className={`bg-gradient-to-r ${config.leaderBg} rounded-2xl p-3 border ${config.leaderBorder}`}>
            <p className={`text-[10px] font-black uppercase tracking-wider ${config.leaderText} flex items-center gap-1.5 mb-2`}>
              <ShieldCheck className="w-3.5 h-3.5" />
              Assigned Team Leaders (2)
            </p>
            {leaders.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {leaders.map((leader: any) => (
                  <span
                    key={leader.name}
                    className="inline-flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl text-xs font-bold text-slate-800 border border-slate-200/80 shadow-xs"
                  >
                    <span className={`w-2 h-2 rounded-full ${config.dotBg}`} />
                    {leader.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                Awaiting Team Leader selection...
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            {Array.from({ length: 8 }).map((_, index) => {
              const attendee = members[index];
              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-slate-50/80 border border-slate-100 text-xs font-semibold text-slate-700"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="text-slate-400 text-[11px] font-mono w-4 shrink-0">
                      {index + 1}.
                    </span>
                    <span className={`truncate ${attendee ? "text-slate-800 font-bold" : "text-slate-400 font-medium"}`}>
                      {attendee ? attendee.name : "Open Slot"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          disabled={!isMemberBookingOpen || members.length >= 8}
          onClick={() => handleOpenModal(serviceKey)}
          className={`w-full py-3 rounded-2xl font-bold text-xs transition-all disabled:opacity-40 disabled:pointer-events-none ${config.btn}`}
        >
          {!isMemberBookingOpen
            ? "Booking Opens Wednesday"
            : members.length >= 8
            ? "Service Full"
            : `Book ${serviceKey} Slot`}
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <header className="w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-2xl overflow-hidden shadow-sm bg-white border border-slate-100 p-0.5 shrink-0">
              <Image src="/connect-hub.png" alt="Connect Hub" fill className="object-contain p-1" priority />
            </div>
            <div className="min-w-0">
              <h1 className="font-black text-base sm:text-lg text-[#111827] tracking-tight leading-tight truncate">
                Connect Hub
              </h1>
              <p className="text-[10px] sm:text-[11px] font-bold text-[#FF6B00] leading-none truncate">
                Attendance Board
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
            >
              <LogIn className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>Login</span>
            </Link>

            <button
              onClick={() => handleOpenModal("10AM")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white text-xs font-extrabold shadow-md shadow-orange-500/20 transition-all active:scale-95"
            >
              <UserCheck className="w-4 h-4 shrink-0" />
              <span>Plot Slot</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 pt-8 space-y-6">
        {!isMemberBookingOpen && (
          <div className="w-full p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-3">
            <Info className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="text-xs">
              <p className="font-extrabold text-amber-950">Team Leaders Are Setting Schedules</p>
              <p className="text-amber-800 font-medium mt-0.5">
                Monday & Tuesday are reserved for Team Leaders. Attendance opens for all members on <strong>Wednesday morning</strong>.
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6 text-[#FF6B00]" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                Scheduled Sunday Service
              </p>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                {schedule?.sundayDate
                  ? new Date(schedule.sundayDate + "T00:00:00").toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "Upcoming Sunday"}
              </h2>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold text-slate-700">8 Members Max Per Service</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {renderServiceCard("10AM")}
          {renderServiceCard("1PM")}
          {renderServiceCard("4PM")}
        </div>
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-lg font-black text-slate-900 mb-1">Plot Your Attendance</h3>
              <p className="text-xs text-slate-500 font-medium mb-6">
                Select your name and preferred service slot below.
              </p>

              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold border border-rose-100">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {isMemberBookingOpen ? "Your Name *" : "Team Leader Name *"}
                  </label>
                  <CustomMemberSelect
                    teamMembers={selectableMembers}
                    selectedName={selectedName}
                    placeholder={
                      isMemberBookingOpen
                        ? "Select your name..."
                        : "Select Team Leader name..."
                    }
                    onSelect={(val: any) => setSelectedName(typeof val === "string" ? val : val.name)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Service Time *
                  </label>
                  <select
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value as ServiceType)}
                    className="w-full px-3.5 py-3 rounded-2xl border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:border-[#FF6B00]"
                  >
                    <option value="10AM">10:00 AM Service (Blue)</option>
                    <option value="1PM">1:00 PM Service (Orange)</option>
                    <option value="4PM">4:00 PM Service (Purple)</option>
                    <option value="NOT_ATTENDING">Cannot Attend (Excused)</option>
                  </select>
                </div>

                {selectedService === "NOT_ATTENDING" && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Reason (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Out of town, sick leave"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none"
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}