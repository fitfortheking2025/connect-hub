"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Calendar, Clock, ShieldCheck, UserCheck, LogIn, Info, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { plotSundayServiceAction } from "@/app/actions/scheduleAction";
import CustomMemberSelect from "@/app/components/CustomMemberSelect";

type ServiceType = "10AM" | "1PM" | "4PM" | "NOT_ATTENDING";

export default function ScheduleClientView({ 
  initialData, 
  teamMembers, 
  isMemberBookingOpen 
}: { 
  initialData: any; 
  teamMembers: any[];
  isMemberBookingOpen: boolean;
}) {
  const [schedule, setSchedule] = useState(initialData);
  const attendees = schedule.attendees || [];
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceType>("10AM");
  const [selectedName, setSelectedName] = useState("");
  const [reason, setReason] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isPending, startTransition] = useTransition();

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

  function getServiceBreakdown(allAttendees: any[], service: ServiceType) {
    const list = allAttendees.filter((a) => a.service === service);
    const leaders = list.filter((a) => a.isLeader);
    const members = list.filter((a) => !a.isLeader);
    return { list, leaders, members };
  }

  const renderServiceCard = (serviceKey: ServiceType, serviceTitle: string) => {
    const { leaders, members } = getServiceBreakdown(attendees, serviceKey);

    return (
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-500" />
            <h3 className="font-black text-slate-900 text-base">{serviceTitle}</h3>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-orange-50 text-orange-600">
            {members.length} / 8 Members Filled
          </span>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-3 border border-orange-200/60">
          <p className="text-[10px] font-black uppercase tracking-wider text-orange-700 flex items-center gap-1.5 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
            Assigned Team Leaders (2)
          </p>
          {leaders.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {leaders.map((leader: any) => (
                <span
                  key={leader.name}
                  className="inline-flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl text-xs font-bold text-slate-800 border border-orange-200 shadow-sm"
                >
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  {leader.name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-orange-950/60 italic">
              Awaiting Team Leader selection...
            </p>
          )}
        </div>

        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, index) => {
            const attendee = members[index];
            return (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-700"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-slate-400 text-[11px] font-bold w-4">
                    {index + 1}.
                  </span>
                  <span className={attendee ? "text-slate-800 font-bold" : "text-slate-400"}>
                    {attendee ? attendee.name : "Open Slot"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <button
          disabled={!isMemberBookingOpen || members.length >= 8}
          onClick={() => handleOpenModal(serviceKey)}
          className="w-full py-3 rounded-2xl bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold transition-all disabled:opacity-40 disabled:pointer-events-none"
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
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <header className="w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
        <div className="w-full max-w-7xl mx-auto px-3.5 sm:px-8 lg:px-12 py-3 sm:py-4 flex items-center justify-between gap-2 sm:gap-4">
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

      <main className="max-w-4xl mx-auto px-4 sm:px-8 pt-8 space-y-6">
        {!isMemberBookingOpen && (
          <div className="w-full p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-3">
            <Info className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="text-xs">
              <p className="font-extrabold text-amber-950">Team Leaders Are Setting Schedules</p>
              <p className="text-amber-800/90 font-medium mt-0.5">
                Monday & Tuesday are reserved for Team Leaders. Attendance opens for all members on <strong>Wednesday morning</strong>.
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                Scheduled Sunday Service
              </p>
              <h2 className="text-2xl font-black text-slate-900">
                {format(new Date(schedule.sundayDate), "MMMM d, yyyy")}
              </h2>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold text-slate-700">8 Members Max Per Service</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {renderServiceCard("10AM", "10:00 AM Service")}
          {renderServiceCard("1PM", "1:00 PM Service")}
          {renderServiceCard("4PM", "4:00 PM Service")}
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-lg font-black text-slate-900 mb-1">Plot Your Attendance</h3>
              <p className="text-xs text-slate-500 font-medium mb-6">
                Select your name and preferred service slot below.
              </p>

              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-xs font-bold border border-red-100">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Your Name *
                  </label>
                  <CustomMemberSelect
                    teamMembers={teamMembers}
                    selectedName={selectedName}
                    placeholder="Select your name..."
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
                    <option value="10AM">10:00 AM Service</option>
                    <option value="1PM">1:00 PM Service</option>
                    <option value="4PM">4:00 PM Service</option>
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