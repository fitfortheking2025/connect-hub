// src/app/(portal)/admin/schedule/AdminScheduleClientView.tsx
"use client";

import { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { 
  Calendar, 
  Clock, 
  Lock, 
  Unlock,
  Trash2, 
  UserPlus, 
  Copy, 
  CheckCheck, 
  ExternalLink,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
  X,
  GripVertical,
  AlertTriangle
} from "lucide-react";
import { formatSundayDateHuman } from "@/lib/sundayDate";
import { 
  leaderPreAssignAction, 
  removeAttendeeAction, 
  toggleLockAttendeeAction 
} from "@/app/actions/scheduleAction";
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

type ServiceType = "10AM" | "1PM" | "4PM" | "NOT_ATTENDING";

export default function AdminScheduleClientView({
  initialSchedule,
  sundayDate,
  teamMembers,
  userRole,
}: {
  initialSchedule: any;
  sundayDate: string;
  teamMembers: Array<{ _id: string; name: string }>;
  userRole: string;
}) {
  const router = useRouter();
  const [schedule, setSchedule] = useState(initialSchedule);
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setSchedule(initialSchedule);
  }, [initialSchedule]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Modals & Notifications
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedName, setSelectedName] = useState("");
  const [selectedService, setSelectedService] = useState<ServiceType>("10AM");
  const [lockSlot, setLockSlot] = useState(true);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedGc, setCopiedGc] = useState(false);

  // Custom Delete Modal State
  const [attendeeToRemove, setAttendeeToRemove] = useState<{ name: string; service: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Drag and Drop States
  const [draggedAttendee, setDraggedAttendee] = useState<Attendee | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<ServiceType | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 3000);
  };

  const attendees: Attendee[] = schedule?.attendees || [];
  const list10AM = attendees.filter((a) => a.service === "10AM");
  const list1PM = attendees.filter((a) => a.service === "1PM");
  const list4PM = attendees.filter((a) => a.service === "4PM");
  const listNotAttending = attendees.filter((a) => a.service === "NOT_ATTENDING");

  const getServiceList = (svc: ServiceType) => {
    switch (svc) {
      case "10AM": return list10AM;
      case "1PM": return list1PM;
      case "4PM": return list4PM;
      case "NOT_ATTENDING": return listNotAttending;
    }
  };

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e: React.DragEvent, attendee: Attendee) => {
    setDraggedAttendee(attendee);
    e.dataTransfer.setData("text/plain", attendee.name);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, targetService: ServiceType) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverColumn !== targetService) {
      setDragOverColumn(targetService);
    }
  };

  const handleDragLeave = (e: React.DragEvent, targetService: ServiceType) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    if (dragOverColumn === targetService) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetService: ServiceType) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (!draggedAttendee) return;
    if (draggedAttendee.service === targetService) {
      setDraggedAttendee(null);
      return;
    }

    const targetList = getServiceList(targetService);
    if (targetService !== "NOT_ATTENDING" && targetList.length >= 8) {
      showToast(`Cannot move: ${targetService} is already full (8/8)!`);
      setDraggedAttendee(null);
      return;
    }

    const movingPerson = draggedAttendee;
    setDraggedAttendee(null);

    // Optimistic UI Update
    setSchedule((prev: any) => {
      const updatedAttendees = (prev?.attendees || []).map((att: Attendee) => {
        if (att.name.toLowerCase() === movingPerson.name.toLowerCase()) {
          return { ...att, service: targetService, isLockedByLeader: true };
        }
        return att;
      });
      return { ...prev, attendees: updatedAttendees };
    });

    startTransition(async () => {
      const res = await leaderPreAssignAction({
        sundayDate,
        name: movingPerson.name,
        service: targetService,
        lock: true,
        reason: targetService === "NOT_ATTENDING" ? (movingPerson.reason || "Moved by Team Leader") : "",
      });

      if (res.success) {
        showToast(`Moved ${movingPerson.name} to ${targetService}`);
        router.refresh();
      } else {
        alert(res.error || "Failed to update slot.");
        router.refresh();
      }
    });
  };

  const handleShiftWeek = (days: number) => {
    const [y, m, d] = sundayDate.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + days);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const nextSunday = `${year}-${month}-${day}`;

    startTransition(() => {
      router.push(`/admin/schedule?date=${nextSunday}`);
    });
  };

  const handleOpenAssignModal = (presetService: ServiceType = "10AM") => {
    setError(null);
    setSelectedName("");
    setSelectedService(presetService);
    setLockSlot(true);
    setReason("");
    setIsAssignModalOpen(true);
  };

  const handlePreAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = await leaderPreAssignAction({
        sundayDate,
        name: selectedName,
        service: selectedService,
        reason,
        lock: lockSlot,
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

          return {
            ...prev,
            attendees: currentAttendees,
          };
        });

        showToast(res.message || "Slot assigned successfully!");
        setIsAssignModalOpen(false);
        router.refresh();
      } else {
        setError(res.error || "Failed to assign slot.");
      }
    });
  };

  const handleToggleLock = (name: string) => {
    // Optimistic Lock Update
    setSchedule((prev: any) => {
      const updatedAttendees = (prev?.attendees || []).map((att: Attendee) => {
        if (att.name.toLowerCase() === name.toLowerCase()) {
          return { ...att, isLockedByLeader: !att.isLockedByLeader };
        }
        return att;
      });
      return { ...prev, attendees: updatedAttendees };
    });

    startTransition(async () => {
      const res = await toggleLockAttendeeAction({ sundayDate, name });
      if (res.success) {
        showToast(res.message || "Lock status updated.");
        router.refresh();
      } else {
        alert(res.error || "Failed to change lock state.");
        router.refresh();
      }
    });
  };

  const handleConfirmRemove = () => {
    if (!attendeeToRemove) return;
    setIsDeleting(true);
    const targetName = attendeeToRemove.name;

    setSchedule((prev: any) => ({
      ...prev,
      attendees: (prev?.attendees || []).filter((a: Attendee) => a.name !== targetName),
    }));

    startTransition(async () => {
      const res = await removeAttendeeAction({ sundayDate, name: targetName });
      setIsDeleting(false);
      setAttendeeToRemove(null);

      if (res.success) {
        showToast(res.message || `Removed ${targetName}.`);
        router.refresh();
      } else {
        alert(res.error || "Failed to remove attendee.");
        router.refresh();
      }
    });
  };

  const handleCopyGcFormat = async () => {
    const formattedDate = formatSundayDateHuman(sundayDate);
    let text = `SUNDAY ATTENDANCE:\n${formattedDate}\nKindly note that we will only be allowing "8 members" per service to ensure balance and order in the team. We appreciate your understanding and cooperation. Thank you and God bless\n\n`;

    text += `10AM SERVICE (${list10AM.length}/8):\n`;
    if (list10AM.length === 0) text += `(Open)\n`;
    else list10AM.forEach((a, i) => { text += `${i + 1}. ${a.name}${a.isLockedByLeader ? " (Assigned)" : ""}\n`; });

    text += `\n1PM SERVICE (${list1PM.length}/8):\n`;
    if (list1PM.length === 0) text += `(Open)\n`;
    else list1PM.forEach((a, i) => { text += `${i + 1}. ${a.name}${a.isLockedByLeader ? " (Assigned)" : ""}\n`; });

    text += `\n4PM SERVICE (${list4PM.length}/8):\n`;
    if (list4PM.length === 0) text += `(Open)\n`;
    else list4PM.forEach((a, i) => { text += `${i + 1}. ${a.name}${a.isLockedByLeader ? " (Assigned)" : ""}\n`; });

    if (listNotAttending.length > 0) {
      text += `\nNot Attending:\n`;
      listNotAttending.forEach((a, i) => {
        text += `${i + 1}. ${a.name}${a.reason ? ` - ${a.reason}` : ""}\n`;
      });
    }

    await navigator.clipboard.writeText(text);
    setCopiedGc(true);
    showToast("Copied Messenger attendance format to clipboard!");
    setTimeout(() => setCopiedGc(false), 2500);
  };

  return (
    <div className="space-y-5 relative select-none">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[99999] animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 text-white shadow-2xl text-xs font-bold border border-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Header Container */}
      <div className="bg-white rounded-[24px] sm:rounded-[32px] border border-slate-200/80 p-4 sm:p-6 shadow-sm space-y-3.5 sm:space-y-4">
        
        {/* Top Row: Title & Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
          
          <div className="flex items-start gap-3">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-orange-50 text-[#FF6B00] border border-orange-200/60 shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-black text-[#111827] tracking-tight leading-tight">
                Sunday Attendance Control
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-400 font-medium mt-0.5 leading-snug">
                💡 Drag & drop members across services or toggle locks to prevent self-editing.
              </p>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="grid grid-cols-2 sm:flex items-center gap-1.5 sm:gap-2">
              <a
                href="/schedule"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>Open Board</span>
              </a>

              <button
                onClick={handleCopyGcFormat}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black transition-all"
              >
                {copiedGc ? (
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                )}
                <span>{copiedGc ? "Copied" : "Copy GC"}</span>
              </button>
            </div>

            <button
              onClick={() => handleOpenAssignModal("10AM")}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white text-xs font-extrabold shadow-md shadow-orange-500/20 transition-all active:scale-95 shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>Pre-Assign Member</span>
            </button>
          </div>
        </div>

        {/* Bottom Row: Date Navigator */}
        <div className="flex items-center justify-between bg-slate-50/90 px-2 py-1.5 sm:px-3 sm:py-2 rounded-2xl border border-slate-200/70">
          <button
            onClick={() => handleShiftWeek(-7)}
            disabled={isPending}
            className="p-1.5 sm:p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 shadow-sm transition-all active:scale-95 disabled:opacity-50"
            title="Previous Sunday"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 truncate px-2">
            <Calendar className="w-4 h-4 text-[#FF6B00] shrink-0" />
            <span className="text-xs sm:text-sm font-extrabold text-[#111827] truncate">
              {formatSundayDateHuman(sundayDate)}
            </span>
            <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-[#FF6B00] shrink-0">
              {attendees.length} Plotted
            </span>
          </div>

          <button
            onClick={() => handleShiftWeek(7)}
            disabled={isPending}
            className="p-1.5 sm:p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 shadow-sm transition-all active:scale-95 disabled:opacity-50"
            title="Next Sunday"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* 3 Services Interactive Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* 10AM COLUMN */}
        <div 
          onDragOver={(e) => handleDragOver(e, "10AM")}
          onDragLeave={(e) => handleDragLeave(e, "10AM")}
          onDrop={(e) => handleDrop(e, "10AM")}
          className={`bg-white rounded-[28px] border p-5 shadow-sm space-y-3 flex flex-col justify-between transition-all duration-200 ${
            dragOverColumn === "10AM"
              ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20 scale-[1.01]"
              : "border-slate-200/80"
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
                <Clock className="w-4 h-4 text-blue-600" /> 10:00 AM Service
              </div>
              <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${
                list10AM.length >= 8 ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-blue-50 text-blue-700 border-blue-200"
              }`}>
                {list10AM.length} / 8 Filled
              </span>
            </div>

            <div className="space-y-1.5 min-h-[260px]">
              {Array.from({ length: 8 }).map((_, i) => {
                const item = list10AM[i];
                return (
                  <div
                    key={i}
                    draggable={!!item}
                    onDragStart={(e) => item && handleDragStart(e, item)}
                    className={`p-2.5 rounded-xl text-xs flex items-center justify-between border transition-all ${
                      item
                        ? "bg-slate-50 hover:bg-slate-100 border-slate-200/90 font-bold text-slate-800 cursor-grab active:cursor-grabbing hover:shadow-sm"
                        : "bg-slate-50/40 border-dashed border-slate-200 text-slate-300 font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {item ? (
                        <GripVertical className="w-3.5 h-3.5 text-slate-400 shrink-0 cursor-grab" />
                      ) : (
                        <span className="text-slate-400 font-mono w-4">{i + 1}.</span>
                      )}
                      <span className="truncate">{item ? item.name : "Open Slot"}</span>
                    </div>

                    {item && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleLock(item.name)}
                          className={`p-1 rounded-lg transition-colors ${
                            item.isLockedByLeader
                              ? "text-orange-500 hover:bg-orange-50"
                              : "text-slate-300 hover:text-slate-600 hover:bg-slate-100"
                          }`}
                          title={item.isLockedByLeader ? "Click to Unlock Slot" : "Click to Lock Slot"}
                        >
                          {item.isLockedByLeader ? (
                            <Lock className="w-3.5 h-3.5" />
                          ) : (
                            <Unlock className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          onClick={() => setAttendeeToRemove({ name: item.name, service: "10:00 AM Service" })}
                          className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Remove from 10AM"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => handleOpenAssignModal("10AM")}
            disabled={list10AM.length >= 8}
            className="w-full py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition-colors disabled:opacity-40"
          >
            + Assign to 10AM
          </button>
        </div>

        {/* 1PM COLUMN */}
        <div 
          onDragOver={(e) => handleDragOver(e, "1PM")}
          onDragLeave={(e) => handleDragLeave(e, "1PM")}
          onDrop={(e) => handleDrop(e, "1PM")}
          className={`bg-white rounded-[28px] border p-5 shadow-sm space-y-3 flex flex-col justify-between transition-all duration-200 ${
            dragOverColumn === "1PM"
              ? "border-orange-500 ring-2 ring-orange-500/20 bg-orange-50/20 scale-[1.01]"
              : "border-slate-200/80"
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
                <Clock className="w-4 h-4 text-[#FF6B00]" /> 1:00 PM Service
              </div>
              <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${
                list1PM.length >= 8 ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-orange-50 text-[#FF6B00] border-orange-200"
              }`}>
                {list1PM.length} / 8 Filled
              </span>
            </div>

            <div className="space-y-1.5 min-h-[260px]">
              {Array.from({ length: 8 }).map((_, i) => {
                const item = list1PM[i];
                return (
                  <div
                    key={i}
                    draggable={!!item}
                    onDragStart={(e) => item && handleDragStart(e, item)}
                    className={`p-2.5 rounded-xl text-xs flex items-center justify-between border transition-all ${
                      item
                        ? "bg-slate-50 hover:bg-slate-100 border-slate-200/90 font-bold text-slate-800 cursor-grab active:cursor-grabbing hover:shadow-sm"
                        : "bg-slate-50/40 border-dashed border-slate-200 text-slate-300 font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {item ? (
                        <GripVertical className="w-3.5 h-3.5 text-slate-400 shrink-0 cursor-grab" />
                      ) : (
                        <span className="text-slate-400 font-mono w-4">{i + 1}.</span>
                      )}
                      <span className="truncate">{item ? item.name : "Open Slot"}</span>
                    </div>

                    {item && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleLock(item.name)}
                          className={`p-1 rounded-lg transition-colors ${
                            item.isLockedByLeader
                              ? "text-orange-500 hover:bg-orange-50"
                              : "text-slate-300 hover:text-slate-600 hover:bg-slate-100"
                          }`}
                          title={item.isLockedByLeader ? "Click to Unlock Slot" : "Click to Lock Slot"}
                        >
                          {item.isLockedByLeader ? (
                            <Lock className="w-3.5 h-3.5" />
                          ) : (
                            <Unlock className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          onClick={() => setAttendeeToRemove({ name: item.name, service: "1:00 PM Service" })}
                          className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Remove from 1PM"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => handleOpenAssignModal("1PM")}
            disabled={list1PM.length >= 8}
            className="w-full py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#FF6B00] font-bold text-xs transition-colors disabled:opacity-40"
          >
            + Assign to 1PM
          </button>
        </div>

        {/* 4PM COLUMN */}
        <div 
          onDragOver={(e) => handleDragOver(e, "4PM")}
          onDragLeave={(e) => handleDragLeave(e, "4PM")}
          onDrop={(e) => handleDrop(e, "4PM")}
          className={`bg-white rounded-[28px] border p-5 shadow-sm space-y-3 flex flex-col justify-between transition-all duration-200 ${
            dragOverColumn === "4PM"
              ? "border-purple-500 ring-2 ring-purple-500/20 bg-purple-50/20 scale-[1.01]"
              : "border-slate-200/80"
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
                <Clock className="w-4 h-4 text-purple-600" /> 4:00 PM Service
              </div>
              <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${
                list4PM.length >= 8 ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-purple-50 text-purple-700 border-purple-200"
              }`}>
                {list4PM.length} / 8 Filled
              </span>
            </div>

            <div className="space-y-1.5 min-h-[260px]">
              {Array.from({ length: 8 }).map((_, i) => {
                const item = list4PM[i];
                return (
                  <div
                    key={i}
                    draggable={!!item}
                    onDragStart={(e) => item && handleDragStart(e, item)}
                    className={`p-2.5 rounded-xl text-xs flex items-center justify-between border transition-all ${
                      item
                        ? "bg-slate-50 hover:bg-slate-100 border-slate-200/90 font-bold text-slate-800 cursor-grab active:cursor-grabbing hover:shadow-sm"
                        : "bg-slate-50/40 border-dashed border-slate-200 text-slate-300 font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {item ? (
                        <GripVertical className="w-3.5 h-3.5 text-slate-400 shrink-0 cursor-grab" />
                      ) : (
                        <span className="text-slate-400 font-mono w-4">{i + 1}.</span>
                      )}
                      <span className="truncate">{item ? item.name : "Open Slot"}</span>
                    </div>

                    {item && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleLock(item.name)}
                          className={`p-1 rounded-lg transition-colors ${
                            item.isLockedByLeader
                              ? "text-orange-500 hover:bg-orange-50"
                              : "text-slate-300 hover:text-slate-600 hover:bg-slate-100"
                          }`}
                          title={item.isLockedByLeader ? "Click to Unlock Slot" : "Click to Lock Slot"}
                        >
                          {item.isLockedByLeader ? (
                            <Lock className="w-3.5 h-3.5" />
                          ) : (
                            <Unlock className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          onClick={() => setAttendeeToRemove({ name: item.name, service: "4:00 PM Service" })}
                          className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Remove from 4PM"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => handleOpenAssignModal("4PM")}
            disabled={list4PM.length >= 8}
            className="w-full py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs transition-colors disabled:opacity-40"
          >
            + Assign to 4PM
          </button>
        </div>

      </div>

      {/* NOT ATTENDING DROP ZONE */}
      <div 
        onDragOver={(e) => handleDragOver(e, "NOT_ATTENDING")}
        onDragLeave={(e) => handleDragLeave(e, "NOT_ATTENDING")}
        onDrop={(e) => handleDrop(e, "NOT_ATTENDING")}
        className={`bg-white rounded-[28px] border p-5 shadow-sm space-y-3 transition-all duration-200 ${
          dragOverColumn === "NOT_ATTENDING"
            ? "border-slate-500 ring-2 ring-slate-400/20 bg-slate-100/60 scale-[1.005]"
            : "border-slate-200/80"
        }`}
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">
            Not Attending / Excused ({listNotAttending.length}) • <span className="text-slate-400 font-normal">Drop members here to mark absent</span>
          </div>
          <button
            onClick={() => handleOpenAssignModal("NOT_ATTENDING")}
            className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
          >
            + Mark Member Absent
          </button>
        </div>

        {listNotAttending.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center italic border border-dashed border-slate-200 rounded-2xl">
            No absent members. Drag members here to mark them not attending.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {listNotAttending.map((a, i) => (
              <div 
                key={i} 
                draggable
                onDragStart={(e) => handleDragStart(e, a)}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between text-xs cursor-grab active:cursor-grabbing transition-all hover:shadow-sm"
              >
                <div className="flex items-center gap-2 truncate">
                  <GripVertical className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <div className="truncate">
                    <div className="font-bold text-slate-800 truncate">{a.name}</div>
                    <div className="text-[10px] text-slate-400 italic truncate">{a.reason || "Excused"}</div>
                  </div>
                </div>
                <button
                  onClick={() => setAttendeeToRemove({ name: a.name, service: "Not Attending" })}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 shrink-0"
                  title="Remove"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pre-Assign Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-[28px] border border-slate-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-black text-[#111827]">Pre-Assign or Lock Slot</h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="p-1 rounded-xl text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            <form onSubmit={handlePreAssignSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Select Member
                </label>
                <CustomMemberSelect
                  teamMembers={teamMembers}
                  selectedName={selectedName}
                  onSelect={(val: any) => setSelectedName(typeof val === "string" ? val : val.name)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Service</label>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value as ServiceType)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-[#FF6B00]"
                >
                  <option value="10AM">10:00 AM Service ({list10AM.length}/8)</option>
                  <option value="1PM">1:00 PM Service ({list1PM.length}/8)</option>
                  <option value="4PM">4:00 PM Service ({list4PM.length}/8)</option>
                  <option value="NOT_ATTENDING">Not Attending / Excused</option>
                </select>
              </div>

              {selectedService === "NOT_ATTENDING" ? (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Reason</label>
                  <input
                    type="text"
                    placeholder="e.g. Sickness, Out of town"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none"
                  />
                </div>
              ) : (
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={lockSlot}
                    onChange={(e) => setLockSlot(e.target.checked)}
                    className="w-4 h-4 rounded text-[#FF6B00] focus:ring-[#FF6B00]"
                  />
                  <span className="text-xs font-bold text-slate-700">Lock slot (prevent member from self-editing)</span>
                </label>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="w-1/3 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || !selectedName}
                  className="w-2/3 py-2.5 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-black text-xs shadow-md shadow-orange-500/20 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Confirmation Removal Modal */}
      {attendeeToRemove && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-[28px] sm:rounded-[32px] border border-slate-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 text-center">
            
            <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200/60 flex items-center justify-center text-rose-600 shadow-lg shadow-rose-500/10">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-[#111827]">Remove from Schedule?</h3>
              <p className="text-xs text-slate-500 font-medium px-2 leading-relaxed">
                Are you sure you want to remove{" "}
                <strong className="text-[#111827] font-extrabold">&ldquo;{attendeeToRemove.name}&rdquo;</strong>{" "}
                from the <span className="font-semibold text-slate-700">{attendeeToRemove.service}</span>?
              </p>
            </div>

            <div className="pt-2 flex gap-2.5">
              <button
                type="button"
                onClick={() => setAttendeeToRemove(null)}
                disabled={isDeleting}
                className="w-1/2 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition-all active:scale-95 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemove}
                disabled={isDeleting}
                className="w-1/2 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-600/25 flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Yes, Remove"}
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
}