// src/app/schedule/ScheduleClientView.tsx
"use client";

import { useState, useEffect, useTransition } from "react";
import { 
  Users, 
  Calendar, 
  Clock, 
  AlertCircle, 
  Lock, 
  X,
  Sparkles,
  Loader2,
  KeyRound,
  UserCheck
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
  assignedBy?: string;
}

export default function ScheduleClientView({
  initialSchedule,
  sundayDate,
  teamMembers,
}: {
  initialSchedule: any;
  sundayDate: string;
  teamMembers: Array<{ _id: string; name: string; groupName?: string }>;
}) {
  const [schedule, setSchedule] = useState(initialSchedule);
  const [isPending, startTransition] = useTransition();

  // Local storage stored identity
  const [savedIdentity, setSavedIdentity] = useState<{ name: string; token: string } | null>(null);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedName, setSelectedName] = useState("");
  const [selectedService, setSelectedService] = useState<"10AM" | "1PM" | "4PM" | "NOT_ATTENDING">("10AM");
  const [reason, setReason] = useState("");
  const [passkeyInput, setPasskeyInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [newPasskeyNotice, setNewPasskeyNotice] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("rog_connect_schedule_user");
      if (stored) {
        setSavedIdentity(JSON.parse(stored));
      }
    } catch {}
  }, []);

  const attendees: Attendee[] = schedule?.attendees || [];
  const list10AM = attendees.filter((a) => a.service === "10AM");
  const list1PM = attendees.filter((a) => a.service === "1PM");
  const list4PM = attendees.filter((a) => a.service === "4PM");
  const listNotAttending = attendees.filter((a) => a.service === "NOT_ATTENDING");

  const myBooking = attendees.find(
    (a) => savedIdentity && a.name.toLowerCase() === savedIdentity.name.toLowerCase()
  );

  const openPlotModal = (presetName?: string) => {
    setError(null);
    const targetName = presetName || savedIdentity?.name || "";
    setSelectedName(targetName);

    const existing = attendees.find((a) => a.name.toLowerCase() === targetName.toLowerCase());
    if (existing) {
      setSelectedService(existing.service);
      setReason(existing.reason || "");
      setPasskeyInput(savedIdentity?.token || "");
    } else {
      setSelectedService(list10AM.length < 8 ? "10AM" : list1PM.length < 8 ? "1PM" : "4PM");
      setReason("");
      setPasskeyInput("");
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const tokenToSend = passkeyInput || (savedIdentity?.name === selectedName ? savedIdentity?.token : undefined);

    startTransition(async () => {
      const res = await plotSundayServiceAction({
        sundayDate,
        name: selectedName,
        service: selectedService,
        reason,
        editToken: tokenToSend,
      });

      if (res.success && res.attendee) {
        const newIdent = { name: res.attendee.name, token: res.attendee.editToken };
        localStorage.setItem("rog_connect_schedule_user", JSON.stringify(newIdent));
        setSavedIdentity(newIdent);

        // Update local state instantly
        setSchedule((prev: any) => {
          const list = [...(prev?.attendees || [])];
          const idx = list.findIndex((a) => a.name.toLowerCase() === res.attendee.name.toLowerCase());
          if (idx > -1) {
            list[idx] = res.attendee;
          } else {
            list.push(res.attendee);
          }
          return { ...prev, attendees: list };
        });

        setNewPasskeyNotice(res.attendee.editToken);
        setIsModalOpen(false);
      } else {
        setError(res.error || "Failed to save.");
      }
    });
  };

  return (
    <div className="space-y-4">
      
      {/* Header Card */}
      <div className="bg-white rounded-[28px] border border-slate-200/80 p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#FF6B00]">
          <Sparkles className="w-4 h-4" /> River of God Church
        </div>

        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#111827]">
            Sunday Attendance Plotting
          </h1>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mt-0.5">
            <Calendar className="w-3.5 h-3.5 text-[#FF6B00]" />
            {formatSundayDateHuman(sundayDate)}
          </div>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed bg-orange-50/50 p-3 rounded-2xl border border-orange-200/60 font-medium">
          Kindly note that we will only be allowing <strong>8 members</strong> per service to ensure balance and order in the team.
        </p>

        {/* User Card Recognition */}
        {myBooking ? (
          <div className="bg-slate-900 text-white p-3.5 rounded-2xl flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Your Booking</div>
              <div className="text-sm font-extrabold flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-400" /> {myBooking.name}
                <span className="text-xs font-bold text-[#FF6B00] bg-orange-500/20 px-2 py-0.5 rounded-lg border border-orange-500/30">
                  {myBooking.service}
                </span>
              </div>
            </div>
            <button
              onClick={() => openPlotModal(myBooking.name)}
              className="px-3 py-1.5 rounded-xl bg-white text-slate-900 text-xs font-black shadow hover:bg-slate-100 transition-all"
            >
              Change
            </button>
          </div>
        ) : (
          <button
            onClick={() => openPlotModal()}
            className="w-full py-3.5 rounded-2xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-black text-sm shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Users className="w-4 h-4" /> Plot My Sunday Service
          </button>
        )}
      </div>

      {/* Passkey Alert on Successful Save */}
      {newPasskeyNotice && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl space-y-1 animate-in fade-in">
          <div className="flex items-center justify-between text-xs font-black text-emerald-800">
            <span className="flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-emerald-600" /> Saved! Multi-Device Passkey
            </span>
            <button onClick={() => setNewPasskeyNotice(null)}>
              <X className="w-4 h-4 text-emerald-600" />
            </button>
          </div>
          <p className="text-[11px] text-emerald-700 font-medium">
            If you change devices or open on a laptop later, your edit code is:{" "}
            <strong className="font-mono font-black text-sm bg-emerald-100 px-1.5 py-0.5 rounded text-emerald-900">
              {newPasskeyNotice}
            </strong>
          </p>
        </div>
      )}

      {/* Services Breakdown Cards */}
      <div className="space-y-3">
        
        {/* 10 AM */}
        <div className="bg-white rounded-[24px] border border-slate-200/80 p-4 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-black text-sm text-[#111827]">
              <Clock className="w-4 h-4 text-blue-600" /> 10:00 AM Service
            </div>
            <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${
              list10AM.length >= 8 
                ? "bg-rose-50 text-rose-600 border-rose-200" 
                : "bg-blue-50 text-blue-700 border-blue-200"
            }`}>
              {list10AM.length}/8 {list10AM.length >= 8 ? "FULL" : "Slots"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {Array.from({ length: 8 }).map((_, i) => {
              const attendee = list10AM[i];
              return (
                <div
                  key={i}
                  className={`p-2 rounded-xl text-xs flex items-center justify-between border ${
                    attendee
                      ? "bg-slate-50 border-slate-200/80 text-slate-800 font-bold"
                      : "bg-slate-50/40 border-dashed border-slate-200 text-slate-300 font-medium"
                  }`}
                >
                  <span className="truncate">
                    {i + 1}. {attendee ? attendee.name : "Available"}
                  </span>
                  {attendee?.isLockedByLeader && <Lock className="w-3 h-3 text-orange-500 shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* 1 PM */}
        <div className="bg-white rounded-[24px] border border-slate-200/80 p-4 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-black text-sm text-[#111827]">
              <Clock className="w-4 h-4 text-[#FF6B00]" /> 1:00 PM Service
            </div>
            <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${
              list1PM.length >= 8 
                ? "bg-rose-50 text-rose-600 border-rose-200" 
                : "bg-orange-50 text-[#FF6B00] border-orange-200"
            }`}>
              {list1PM.length}/8 {list1PM.length >= 8 ? "FULL" : "Slots"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {Array.from({ length: 8 }).map((_, i) => {
              const attendee = list1PM[i];
              return (
                <div
                  key={i}
                  className={`p-2 rounded-xl text-xs flex items-center justify-between border ${
                    attendee
                      ? "bg-slate-50 border-slate-200/80 text-slate-800 font-bold"
                      : "bg-slate-50/40 border-dashed border-slate-200 text-slate-300 font-medium"
                  }`}
                >
                  <span className="truncate">
                    {i + 1}. {attendee ? attendee.name : "Available"}
                  </span>
                  {attendee?.isLockedByLeader && <Lock className="w-3 h-3 text-orange-500 shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* 4 PM */}
        <div className="bg-white rounded-[24px] border border-slate-200/80 p-4 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-black text-sm text-[#111827]">
              <Clock className="w-4 h-4 text-purple-600" /> 4:00 PM Service
            </div>
            <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${
              list4PM.length >= 8 
                ? "bg-rose-50 text-rose-600 border-rose-200" 
                : "bg-purple-50 text-purple-700 border-purple-200"
            }`}>
              {list4PM.length}/8 {list4PM.length >= 8 ? "FULL" : "Slots"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {Array.from({ length: 8 }).map((_, i) => {
              const attendee = list4PM[i];
              return (
                <div
                  key={i}
                  className={`p-2 rounded-xl text-xs flex items-center justify-between border ${
                    attendee
                      ? "bg-slate-50 border-slate-200/80 text-slate-800 font-bold"
                      : "bg-slate-50/40 border-dashed border-slate-200 text-slate-300 font-medium"
                  }`}
                >
                  <span className="truncate">
                    {i + 1}. {attendee ? attendee.name : "Available"}
                  </span>
                  {attendee?.isLockedByLeader && <Lock className="w-3 h-3 text-orange-500 shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Not Attending Section */}
        {listNotAttending.length > 0 && (
          <div className="bg-white rounded-[24px] border border-slate-200/80 p-4 shadow-sm space-y-2">
            <div className="text-xs font-black text-slate-500 uppercase tracking-wider">
              Not Attending ({listNotAttending.length})
            </div>
            <div className="space-y-1.5">
              {listNotAttending.map((a, i) => (
                <div key={i} className="text-xs text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-center justify-between">
                  <span className="font-bold text-slate-800">{i + 1}. {a.name}</span>
                  {a.reason && <span className="text-[11px] text-slate-400 italic">{a.reason}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Interactive Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-[28px] border border-slate-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-[#111827]">Plot Sunday Service</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              
              {/* Searchable Member Select */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Select Your Name
                </label>
                <CustomMemberSelect
                  teamMembers={teamMembers}
                  selectedName={selectedName}
                  onSelect={(name) => setSelectedName(name)}
                  placeholder="Search or pick your name..."
                />
              </div>

              {/* Service Radio Grid */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Select Service (8 max)</label>
                <div className="grid grid-cols-1 gap-2">
                  
                  {/* 10AM */}
                  <label className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    selectedService === "10AM"
                      ? "bg-blue-50 border-blue-500 shadow-sm shadow-blue-500/10"
                      : "bg-white border-slate-200"
                  } ${list10AM.length >= 8 && selectedService !== "10AM" ? "opacity-40 cursor-not-allowed" : ""}`}>
                    <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800">
                      <input
                        type="radio"
                        name="service"
                        value="10AM"
                        disabled={list10AM.length >= 8 && selectedService !== "10AM"}
                        checked={selectedService === "10AM"}
                        onChange={() => setSelectedService("10AM")}
                        className="text-[#FF6B00]"
                      />
                      10:00 AM Service
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                      {list10AM.length}/8 Filled
                    </span>
                  </label>

                  {/* 1PM */}
                  <label className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    selectedService === "1PM"
                      ? "bg-orange-50 border-[#FF6B00] shadow-sm shadow-orange-500/10"
                      : "bg-white border-slate-200"
                  } ${list1PM.length >= 8 && selectedService !== "1PM" ? "opacity-40 cursor-not-allowed" : ""}`}>
                    <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800">
                      <input
                        type="radio"
                        name="service"
                        value="1PM"
                        disabled={list1PM.length >= 8 && selectedService !== "1PM"}
                        checked={selectedService === "1PM"}
                        onChange={() => setSelectedService("1PM")}
                        className="text-[#FF6B00]"
                      />
                      1:00 PM Service
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                      {list1PM.length}/8 Filled
                    </span>
                  </label>

                  {/* 4PM */}
                  <label className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    selectedService === "4PM"
                      ? "bg-purple-50 border-purple-500 shadow-sm shadow-purple-500/10"
                      : "bg-white border-slate-200"
                  } ${list4PM.length >= 8 && selectedService !== "4PM" ? "opacity-40 cursor-not-allowed" : ""}`}>
                    <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800">
                      <input
                        type="radio"
                        name="service"
                        value="4PM"
                        disabled={list4PM.length >= 8 && selectedService !== "4PM"}
                        checked={selectedService === "4PM"}
                        onChange={() => setSelectedService("4PM")}
                        className="text-[#FF6B00]"
                      />
                      4:00 PM Service
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                      {list4PM.length}/8 Filled
                    </span>
                  </label>

                  {/* Not Attending */}
                  <label className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    selectedService === "NOT_ATTENDING"
                      ? "bg-slate-100 border-slate-400"
                      : "bg-white border-slate-200"
                  }`}>
                    <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800">
                      <input
                        type="radio"
                        name="service"
                        value="NOT_ATTENDING"
                        checked={selectedService === "NOT_ATTENDING"}
                        onChange={() => setSelectedService("NOT_ATTENDING")}
                        className="text-[#FF6B00]"
                      />
                      Not Attending
                    </div>
                  </label>

                </div>
              </div>

              {/* Reason input when not attending */}
              {selectedService === "NOT_ATTENDING" && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Reason (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Out of town / Nephew's bday"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>
              )}

              {/* New Device Passkey Input */}
              {savedIdentity && savedIdentity.name !== selectedName && (
                <div className="space-y-1 pt-1 border-t border-slate-100">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <KeyRound className="w-3 h-3 text-[#FF6B00]" /> Edit Passkey (If changing from another device)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. NINO482"
                    value={passkeyInput}
                    onChange={(e) => setPasskeyInput(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800 focus:outline-none"
                  />
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/3 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || !selectedName}
                  className="w-2/3 py-3 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-black text-xs shadow-lg shadow-orange-500/25 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Slot"}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}