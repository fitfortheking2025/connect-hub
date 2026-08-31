// src/app/components/EditFirstTimerModal.tsx
"use client";

import { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { 
  X, 
  Pencil, 
  CheckCircle2, 
  Loader2, 
  HeartHandshake,
  Lock
} from "lucide-react";
import { updateFirstTimerAction } from "@/app/actions/firstTimerAction";

interface EditModalProps {
  item: any;
  teamMembers: any[];
  canEditCoreDetails?: boolean;
  onUpdate?: (updatedItem: any) => void;
}

export default function EditFirstTimerModal({ 
  item, 
  teamMembers, 
  canEditCoreDetails = false,
  onUpdate 
}: EditModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [fullName, setFullName] = useState(item.fullName || "");
  const [gender, setGender] = useState<number>(
    Number(item.gender) === 1 || String(item.gender).toUpperCase() === "MALE" || String(item.gender).toUpperCase() === "M" ? 1 : 0
  );
  const [contact, setContact] = useState(item.contact || "");
  const [messenger, setMessenger] = useState(item.messenger || "");
  const [iam, setIam] = useState(item.iam || "VISITOR");
  const [ageGroup, setAgeGroup] = useState(item.ageGroup || "Youth");
  const [serviceAttended, setServiceAttended] = useState(item.serviceAttended || "10AM");
  const [approachedBy, setApproachedBy] = useState(item.approachedBy || "");
  const [invitedBy, setInvitedBy] = useState(item.invitedBy || "");
  const [connectedWith, setConnectedWith] = useState(item.connectedWith || "");
  const [startedOne2One, setStartedOne2One] = useState<boolean>(
    Boolean(item.startedOne2One ?? item.startedOne2one)
  );
  const [textedAlready, setTextedAlready] = useState<boolean>(!!item.textedAlready);
  const [updateReport, setUpdateReport] = useState(item.updateReport || "");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setFullName(item.fullName || "");
    setGender(
      Number(item.gender) === 1 || String(item.gender).toUpperCase() === "MALE" || String(item.gender).toUpperCase() === "M" ? 1 : 0
    );
    setContact(item.contact || "");
    setMessenger(item.messenger || "");
    setIam(item.iam || "VISITOR");
    setAgeGroup(item.ageGroup || "Youth");
    setServiceAttended(item.serviceAttended || "10AM");
    setApproachedBy(item.approachedBy || "");
    setInvitedBy(item.invitedBy || "");
    setConnectedWith(item.connectedWith || "");
    setStartedOne2One(Boolean(item.startedOne2One ?? item.startedOne2one));
    setTextedAlready(!!item.textedAlready);
    setUpdateReport(item.updateReport || "");
  }, [item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const payload = {
      id: String(item._id),
      fullName,
      gender,
      contact,
      messenger,
      iam,
      ageGroup,
      serviceAttended,
      approachedBy,
      invitedBy,
      connectedWith,
      startedOne2One,
      textedAlready,
      updateReport,
    };

    startTransition(async () => {
      const res = await updateFirstTimerAction(payload);
      if (res.success) {
        setSuccessMessage(res.message || "Updated successfully!");
        if (typeof onUpdate === "function") {
          onUpdate({ ...item, ...payload });
        }
        router.refresh();
        setTimeout(() => {
          setIsOpen(false);
          setSuccessMessage(null);
        }, 900);
      } else {
        setError(res.error || "Failed to update record.");
      }
    });
  };

  const readOnlyInputClass = !canEditCoreDetails
    ? "bg-slate-100/70 border-slate-200 text-slate-600 cursor-not-allowed select-none"
    : "bg-slate-50 border-slate-200 text-[#111827] focus:border-[#FF6B00]";

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setIsOpen(true);
          setError(null);
          setSuccessMessage(null);
        }}
        className="p-2 rounded-xl bg-slate-100 hover:bg-orange-50 text-slate-500 hover:text-[#FF6B00] transition-colors"
        title="Edit Record"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>

      {isOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-[28px] sm:rounded-[32px] border border-slate-200/80 shadow-2xl p-5 sm:p-7 space-y-5 my-8 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-orange-50 text-[#FF6B00] border border-orange-200/60">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-[#111827]">Edit VIP Info</h2>
                  <p className="text-[11px] text-slate-400 font-medium">Update details & discipleship status</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-600">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-600 flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0" /> {successMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              
              {/* Core Intake Profile */}
              <div className="space-y-4 relative">
                {!canEditCoreDetails && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/90 text-slate-500 text-[11px] font-bold">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    Intake profile details are managed by Leadership
                  </div>
                )}

                {/* Name & Gender */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={!canEditCoreDetails}
                      required
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold focus:outline-none ${readOnlyInputClass}`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gender</label>
                    <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                      <button
                        type="button"
                        disabled={!canEditCoreDetails}
                        onClick={() => canEditCoreDetails && setGender(1)}
                        className={`py-2 rounded-xl text-xs font-black transition-all border ${
                          gender === 1
                            ? "bg-blue-500 text-white border-blue-500 shadow-sm shadow-blue-500/25"
                            : "bg-slate-50 text-slate-500 border-slate-200"
                        } ${!canEditCoreDetails ? "cursor-not-allowed opacity-80" : "hover:bg-slate-100"}`}
                      >
                        Male
                      </button>
                      <button
                        type="button"
                        disabled={!canEditCoreDetails}
                        onClick={() => canEditCoreDetails && setGender(0)}
                        className={`py-2 rounded-xl text-xs font-black transition-all border ${
                          gender !== 1
                            ? "bg-rose-500 text-white border-rose-500 shadow-sm shadow-rose-500/25"
                            : "bg-slate-50 text-slate-500 border-slate-200"
                        } ${!canEditCoreDetails ? "cursor-not-allowed opacity-80" : "hover:bg-slate-100"}`}
                      >
                        Female
                      </button>
                    </div>
                  </div>
                </div>

                {/* Service & Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Service Attended</label>
                    <select
                      value={serviceAttended}
                      onChange={(e) => setServiceAttended(e.target.value)}
                      disabled={!canEditCoreDetails}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold focus:outline-none ${readOnlyInputClass}`}
                    >
                      <option value="10AM">10AM Service</option>
                      <option value="1PM">1PM Service</option>
                      <option value="4PM">4PM Service</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Category</label>
                    <select
                      value={iam}
                      onChange={(e) => setIam(e.target.value)}
                      disabled={!canEditCoreDetails}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold focus:outline-none ${readOnlyInputClass}`}
                    >
                      <option value="VISITOR">Visitor</option>
                      <option value="LOOKING FOR A CHURCH">Looking for a Church</option>
                      <option value="FROM OTHER CHURCH">From Other Church</option>
                    </select>
                  </div>
                </div>

                {/* Age Group & Contact */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Age Group</label>
                    <select
                      value={ageGroup}
                      onChange={(e) => setAgeGroup(e.target.value)}
                      disabled={!canEditCoreDetails}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold focus:outline-none ${readOnlyInputClass}`}
                    >
                      <option value="Youth">Youth</option>
                      <option value="Young Adult">Young Adult</option>
                      <option value="River Men">River Men</option>
                      <option value="River Women">River Women</option>
                      <option value="Seasoned">Seasoned</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Contact Number</label>
                    <input
                      type="text"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      disabled={!canEditCoreDetails}
                      placeholder="0917XXXXXXX"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold focus:outline-none ${readOnlyInputClass}`}
                    />
                  </div>
                </div>

                {/* Messenger */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">FB / Messenger</label>
                  <input
                    type="text"
                    value={messenger}
                    onChange={(e) => setMessenger(e.target.value)}
                    disabled={!canEditCoreDetails}
                    placeholder="Profile name or link"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold focus:outline-none ${readOnlyInputClass}`}
                  />
                </div>

                {/* Approached By & Invited By */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Approached By</label>
                    <input
                      type="text"
                      value={approachedBy}
                      onChange={(e) => setApproachedBy(e.target.value)}
                      disabled={!canEditCoreDetails}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold focus:outline-none ${readOnlyInputClass}`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Invited By</label>
                    <input
                      type="text"
                      value={invitedBy}
                      onChange={(e) => setInvitedBy(e.target.value)}
                      disabled={!canEditCoreDetails}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold focus:outline-none ${readOnlyInputClass}`}
                    />
                  </div>
                </div>
              </div>

              {/* One2One Discipleship Section */}
              <div className="p-4 rounded-2xl bg-orange-50/50 border border-orange-200/60 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-black text-[#FF6B00]">
                  <HeartHandshake className="w-4 h-4" /> One2One Discipleship & Texted Status
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">One2One Started</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setStartedOne2One(true)}
                        className={`py-2 rounded-xl text-xs font-black transition-all border ${
                          startedOne2One
                            ? "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setStartedOne2One(false)}
                        className={`py-2 rounded-xl text-xs font-black transition-all border ${
                          !startedOne2One
                            ? "bg-slate-600 text-white border-slate-600 shadow-md shadow-slate-600/20"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Connected With (1-on-1)</label>
                    <input
                      type="text"
                      value={connectedWith}
                      onChange={(e) => setConnectedWith(e.target.value)}
                      placeholder="e.g. Bro. Piccolo"
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#FF6B00]"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={textedAlready}
                    onChange={(e) => setTextedAlready(e.target.checked)}
                    className="w-4 h-4 rounded text-[#FF6B00] focus:ring-[#FF6B00]"
                  />
                  <span className="text-xs font-bold text-slate-700">Marked as texted / SMS sent</span>
                </label>
              </div>

              {/* Notes & Report */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Update Report / Notes</label>
                <textarea
                  rows={2}
                  value={updateReport}
                  onChange={(e) => setUpdateReport(e.target.value)}
                  placeholder="Notes from initial conversation..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#FF6B00]"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-1/3 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-2/3 py-3 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-extrabold text-xs shadow-lg shadow-orange-500/25 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                </button>
              </div>

            </form>

          </div>
        </div>,
        document.body
      )}
    </>
  );
}