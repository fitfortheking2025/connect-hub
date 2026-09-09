"use client";

import { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import * as XLSX from "xlsx";
import { 
  Search, 
  Calendar, 
  Phone, 
  Check, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  Send,
  Copy,
  CheckCheck,
  CheckCircle2,
  UserCheck,
  FileText,
  FileSpreadsheet,
  ClipboardCopy,
  Trash2,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { 
  toggleDiscipleshipStatusAction, 
  markBatchAsTextedAction,
  deleteFirstTimerAction
} from "@/app/actions/firstTimerAction";
import EditFirstTimerModal from "@/app/components/EditFirstTimerModal";
import { exportConnectedMembersPdf } from "@/lib/exportConnectedPdf";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const WELCOME_SMS_MESSAGE = `Welcome to River of God Church!

We're so glad you joined us for our Sunday Worship service yesterday! 

Kamusta ka? We hope all is well with you!

We would love to pray for you. If you have any prayer requests, feel free to message us. Also, since this is your first time with us, we'd love to get to know you better and connect with you!

Be sure to check out our social media pages to stay updated. We look forward to hearing from you and hope to see you again next Sunday 

— River of God, Connect Team

P.S. Would you be interested in joining a Life Group to grow further in community?`;

function formatPhilippineMobile(rawContact?: string | null): string | null {
  if (!rawContact) return null;

  const digits = rawContact.replace(/\D/g, "");

  let tenDigit = "";
  if (digits.length === 10 && digits.startsWith("9")) {
    tenDigit = digits;
  } else if (digits.length === 11 && digits.startsWith("09")) {
    tenDigit = digits.slice(1);
  } else if (digits.length === 12 && digits.startsWith("639")) {
    tenDigit = digits.slice(2);
  } else {
    return null;
  }

  return `0${tenDigit}`;
}

function getGenderInfo(gender: any) {
  const isMale = gender === 1 || gender === "1" || String(gender).toUpperCase() === "MALE" || String(gender).toUpperCase() === "M";
  return {
    label: isMale ? "Male" : "Female",
    short: isMale ? "M" : "F",
    isMale,
  };
}

function getAgeGroupBadgeStyle(ageGroup?: string) {
  switch (ageGroup) {
    case "Youth":
      return "bg-purple-50 text-purple-700 border-purple-200/80";
    case "Young Adult":
      return "bg-orange-50 text-[#FF6B00] border-orange-200/80";
    case "River Men":
      return "bg-blue-50 text-blue-700 border-blue-200/80";
    case "River Women":
      return "bg-rose-50 text-rose-600 border-rose-200/80";
    case "Seasoned":
      return "bg-emerald-50 text-emerald-700 border-emerald-200/80";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

interface VipsClientProps {
  initialData: any[];
  totalInMonth: number;
  selectedYear: number;
  selectedMonth: number;
  teamMembers: any[];
  canExportPdf?: boolean;
  canEditCoreDetails?: boolean;
  isAdmin?: boolean;
}

export default function VipsTableClient({
  initialData,
  totalInMonth,
  selectedYear,
  selectedMonth,
  teamMembers,
  canExportPdf = false,
  canEditCoreDetails = false,
  isAdmin = false,
}: VipsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);
  const [copiedBatch, setCopiedBatch] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Global Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3000);
  };

  // Custom Delete Modal State
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [data, setData] = useState(initialData);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const safeMonth = (selectedMonth >= 1 && selectedMonth <= 12) ? selectedMonth : (new Date().getMonth() + 1);
  const safeYear = selectedYear || new Date().getFullYear();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedService, setSelectedService] = useState(searchParams.get("service") || "ALL");
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get("status") || "ALL");

  const connectedMembers = data.filter((item) =>
    Boolean(item.startedOne2One ?? item.startedOne2one)
  );

  const untextedVips = data.filter((v) => !v.textedAlready && !!formatPhilippineMobile(v.contact));
  const untextedPhoneNumbers = untextedVips
    .map((v) => formatPhilippineMobile(v.contact)!)
    .filter(Boolean);

  const updateFilters = (
    m: number,
    y: number,
    srv: string,
    st: string,
    term: string
  ) => {
    const params = new URLSearchParams();
    params.set("month", String(m));
    params.set("year", String(y));
    if (srv !== "ALL") params.set("service", srv);
    if (st !== "ALL") params.set("status", st);
    if (term.trim()) params.set("search", term.trim());

    startTransition(() => {
      router.push(`/vips?${params.toString()}`);
    });
  };

  const handlePrevMonth = () => {
    let m = safeMonth - 1;
    let y = safeYear;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    updateFilters(m, y, selectedService, selectedStatus, search);
  };

  const handleNextMonth = () => {
    let m = safeMonth + 1;
    let y = safeYear;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    updateFilters(m, y, selectedService, selectedStatus, search);
  };

  const handleExportConnectedPdf = () => {
    if (!canExportPdf) return;
    exportConnectedMembersPdf({
      month: safeMonth,
      year: safeYear,
      records: connectedMembers,
    });
    showToast(`Exported ${connectedMembers.length} connected members to PDF.`);
  };

  const handleExportPhoneNumbersExcel = () => {
    if (!canExportPdf) return;

    const exportRows = data
      .map((item) => {
        const local = formatPhilippineMobile(item.contact);
        if (!local) return null;
        return {
          "Phone Number": local,
        };
      })
      .filter(Boolean);

    if (exportRows.length === 0) {
      alert("No valid phone numbers found for this month.");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    worksheet["!cols"] = [{ wch: 18 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Contacts");
    XLSX.writeFile(workbook, `VIP_Phone_Numbers_${MONTHS[safeMonth - 1]}_${safeYear}.xlsx`);
    showToast(`Exported ${exportRows.length} phone numbers to Excel.`);
  };

  const handleUpdateItem = (updatedItem: any) => {
    setData((prev) =>
      prev.map((item) => (item._id === updatedItem._id ? updatedItem : item))
    );
    showToast(`Updated ${updatedItem.fullName}.`);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete || !isAdmin) return;
    setIsDeleting(true);

    const targetId = itemToDelete.id;
    const targetName = itemToDelete.name;
    setData((prev) => prev.filter((item) => item._id !== targetId));

    startTransition(async () => {
      const res = await deleteFirstTimerAction(targetId);
      setIsDeleting(false);
      setItemToDelete(null);

      if (res.success) {
        showToast(res.message || `Deleted "${targetName}".`);
      } else {
        alert(res.error || "Failed to delete record.");
        router.refresh();
      }
    });
  };

  const handleToggleStatus = (id: string, field: "textedAlready" | "startedOne2One", currentVal: boolean) => {
    setData((prev) =>
      prev.map((item) => (item._id === id ? { ...item, [field]: !currentVal } : item))
    );

    startTransition(async () => {
      const res = await toggleDiscipleshipStatusAction(id, field, !currentVal);
      if (res.success && res.message) {
        showToast(res.message);
      }
      router.refresh();
    });
  };

  const handleCopySingleVipDetails = async (item: any) => {
    const gender = getGenderInfo(item.gender);
    const dateFormatted = new Date(item.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const contactDisplay = formatPhilippineMobile(item.contact) || item.contact || "None";
    const messengerDisplay = item.messenger ? item.messenger : "None";

    const details = `📋 VIP / FIRST-TIMER DETAILS:
• Name: ${item.fullName}
• Gender: ${gender.label}
• Age Group: ${item.ageGroup || "N/A"}
• Service: ${item.serviceAttended || "N/A"}
• Contact: ${contactDisplay}
• Messenger: ${messengerDisplay}
• Category: ${item.iam || "Visitor"}
• Approached By: ${item.approachedBy || "N/A"}
• Invited By: ${item.invitedBy || "N/A"}
• Connected With (1-on-1): ${item.connectedWith || "Not yet"}
• Discipleship Started: ${Boolean(item.startedOne2One ?? item.startedOne2one) ? "Yes" : "No"}
• Date: ${dateFormatted}${item.updateReport ? `\n• Notes: ${item.updateReport}` : ""}`;

    await navigator.clipboard.writeText(details);
    setCopiedId(String(item._id));
    showToast(`Copied ${item.fullName}'s details to clipboard.`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyNumbers = async () => {
    if (untextedPhoneNumbers.length === 0) return;
    await navigator.clipboard.writeText(untextedPhoneNumbers.join(", "));
    setCopiedBatch(true);
    showToast(`Copied ${untextedPhoneNumbers.length} phone numbers.`);
    setTimeout(() => setCopiedBatch(false), 2000);
  };

  const handleMarkBatchTexted = () => {
    const ids = untextedVips.map((v) => v._id);
    if (ids.length === 0) return;

    setData((prev) =>
      prev.map((item) => (ids.includes(item._id) ? { ...item, textedAlready: true } : item))
    );

    startTransition(async () => {
      const res = await markBatchAsTextedAction(ids);
      if (res.success && res.message) {
        showToast(res.message);
      }
      router.refresh();
    });
  };

  const encodedWelcomeBody = encodeURIComponent(WELCOME_SMS_MESSAGE);
  const isIos = typeof navigator !== "undefined" && /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const smsQueryPrefix = isIos ? "&" : "?";

  const handleBroadcastSms = async () => {
    if (untextedPhoneNumbers.length === 0) return;

    await navigator.clipboard.writeText(untextedPhoneNumbers.join(", "));
    setCopiedBatch(true);
    showToast(`Numbers copied! Opening messaging app...`);
    setTimeout(() => setCopiedBatch(false), 3000);

    const bulkSmsUrl = `sms:${smsQueryPrefix}body=${encodedWelcomeBody}`;
    window.location.href = bulkSmsUrl;
  };

  return (
    <div className="space-y-3.5 relative">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[99999] animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900/90 backdrop-blur-md text-white shadow-2xl border border-slate-700/60 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* 1. Month Navigator & Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3">
        
        {/* Month Picker Box */}
        <div className="md:col-span-2 bg-white rounded-[20px] sm:rounded-[24px] border border-slate-200/80 p-2.5 sm:p-3 flex items-center justify-between shadow-sm">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors active:scale-95"
            title="Previous Month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="p-1.5 sm:p-2 rounded-xl bg-orange-50 text-[#FF6B00]">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="text-sm sm:text-base font-black text-[#111827]">
              {MONTHS[safeMonth - 1]} {safeYear}
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full ml-1">
              {totalInMonth} Total
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5">
            {canExportPdf && (
              <>
                <button
                  onClick={handleExportPhoneNumbersExcel}
                  className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                  title="Export Contacts as Excel (.xlsx)"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span className="hidden lg:inline">Excel</span>
                </button>

                <button
                  onClick={handleExportConnectedPdf}
                  className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#FF6B00] text-xs font-bold transition-all border border-orange-200/60 shadow-sm flex items-center gap-1.5"
                  title="Export Monthly Connected PDF"
                >
                  <FileText className="w-4 h-4 text-[#FF6B00]" />
                  <span className="hidden lg:inline">PDF ({connectedMembers.length})</span>
                </button>
              </>
            )}

            <button
              onClick={handleNextMonth}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors active:scale-95"
              title="Next Month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Instant Search Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateFilters(safeMonth, safeYear, selectedService, selectedStatus, search);
          }}
          className="relative"
        >
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search VIP, phone, approver..."
            className="w-full pl-11 pr-4 py-3 sm:py-3.5 rounded-[20px] sm:rounded-[24px] bg-white border border-slate-200/80 text-xs sm:text-sm font-medium text-[#111827] placeholder-slate-400 focus:outline-none focus:border-[#FF6B00] shadow-sm"
          />
        </form>
      </div>

      {/* 2. Unified Filter Row (Service & Status Only) */}
      <div className="flex items-center gap-2 select-none">
        <select
          value={selectedService}
          onChange={(e) => {
            setSelectedService(e.target.value);
            updateFilters(safeMonth, safeYear, e.target.value, selectedStatus, search);
          }}
          className="px-3.5 py-2 rounded-xl bg-white border border-slate-200/80 text-xs font-extrabold text-slate-700 focus:outline-none shadow-sm cursor-pointer"
        >
          <option value="ALL">All Services</option>
          <option value="10AM">10AM Service</option>
          <option value="1PM">1PM Service</option>
          <option value="4PM">4PM Service</option>
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => {
            setSelectedStatus(e.target.value);
            updateFilters(safeMonth, safeYear, selectedService, e.target.value, search);
          }}
          className="px-3.5 py-2 rounded-xl bg-white border border-slate-200/80 text-xs font-extrabold text-slate-700 focus:outline-none shadow-sm cursor-pointer"
        >
          <option value="ALL">All Statuses</option>
          <option value="UNTEXTED">Pending SMS</option>
          <option value="TEXTED">Texted</option>
          <option value="DISCIPLESHIP_YES">One2One: Yes</option>
          <option value="DISCIPLESHIP_NO">One2One: No</option>
        </select>
      </div>

      {/* 3. Follow-Up Dispatch Banner */}
      <div className="bg-white rounded-[20px] sm:rounded-[24px] border border-orange-200/80 p-3.5 sm:p-4 space-y-3 shadow-sm bg-gradient-to-br from-orange-50/40 to-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-xs font-black text-[#111827] flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-[#FF6B00]" />
              Follow-Up SMS Dispatch
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              {untextedPhoneNumbers.length > 0 ? (
                <>
                  <strong className="text-[#FF6B00] font-black">{untextedPhoneNumbers.length}</strong> pending VIP(s) ready for welcome dispatch.
                </>
              ) : (
                "All VIPs in this filter have received their welcome SMS! 🎉"
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyNumbers}
              disabled={untextedPhoneNumbers.length === 0}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold transition-all hover:bg-slate-50 disabled:opacity-40"
            >
              {copiedBatch ? (
                <>
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" /> Copy ({untextedPhoneNumbers.length})
                </>
              )}
            </button>

            <button
              onClick={handleBroadcastSms}
              disabled={untextedPhoneNumbers.length === 0}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white text-xs font-black shadow-md shadow-orange-500/20 transition-all disabled:opacity-40 active:scale-95"
            >
              <Send className="w-3.5 h-3.5" /> Broadcast SMS
            </button>

            {untextedPhoneNumbers.length > 0 && (
              <button
                onClick={handleMarkBatchTexted}
                disabled={isPending}
                className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-sm"
                title="Mark all as texted"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Texted
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Mobile Cards View */}
      <div className="md:hidden space-y-2.5">
        {data.length === 0 ? (
          <div className="bg-white rounded-[20px] border border-slate-200/80 p-8 text-center text-slate-400 text-xs font-medium">
            No VIP records found for this selection.
          </div>
        ) : (
          data.map((item: any) => {
            const formattedPhone = formatPhilippineMobile(item.contact);
            const isStartedOne2One = Boolean(item.startedOne2One ?? item.startedOne2one);
            const gender = getGenderInfo(item.gender);
            const isCopied = copiedId === String(item._id);
            const singleSmsHref = formattedPhone
              ? `sms:${formattedPhone}${smsQueryPrefix}body=${encodedWelcomeBody}`
              : "#";

            return (
              <div
                key={item._id}
                className="bg-white rounded-[20px] border border-slate-200/80 p-3.5 shadow-sm space-y-2.5"
              >
                {/* Header: Name, Avatar, Date, Copy Details, Edit, Delete Actions */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div>
                      <h3 className="font-extrabold text-sm text-[#111827] leading-tight">
                        {item.fullName}
                      </h3>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {new Date(item.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleCopySingleVipDetails(item)}
                      className={`p-1.5 sm:p-2 rounded-xl transition-all ${
                        isCopied
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                          : "bg-slate-100 hover:bg-orange-50 text-slate-500 hover:text-[#FF6B00]"
                      }`}
                      title="Copy VIP Details"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5" /> : <ClipboardCopy className="w-3.5 h-3.5" />}
                    </button>

                    <EditFirstTimerModal 
                      item={item} 
                      teamMembers={teamMembers} 
                      canEditCoreDetails={canExportPdf || canEditCoreDetails}
                      onUpdate={handleUpdateItem} 
                    />

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => setItemToDelete({ id: item._id, name: item.fullName })}
                        disabled={isPending}
                        className="p-1.5 sm:p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors active:scale-95"
                        title="Delete VIP Record (Admin Only)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Info Badges */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${
                      gender.isMale
                        ? "bg-blue-50 text-blue-600 border-blue-200/60"
                        : "bg-rose-50 text-rose-500 border-rose-200/60"
                    }`}
                  >
                    {gender.label}
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${getAgeGroupBadgeStyle(item.ageGroup)}`}>
                    {item.ageGroup}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                    {item.serviceAttended}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-500">
                    {item.iam}
                  </span>
                </div>

                {/* Ministers Details Box */}
                <div className="text-xs text-slate-600 bg-slate-50/80 rounded-xl p-2 border border-slate-100 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Approached by</span>
                    <span className="font-extrabold text-[#111827]">{item.approachedBy}</span>
                  </div>
                  {item.connectedWith && (
                    <div className="flex items-center justify-between text-[11px] text-emerald-700 font-semibold">
                      <span className="text-[10px] uppercase font-bold text-emerald-600">Connected:</span>
                      <span>{item.connectedWith}</span>
                    </div>
                  )}
                  {item.followedUpBy && (
                    <div className="flex items-center justify-between text-[10px] text-indigo-700 pt-1 border-t border-slate-200/60 font-semibold">
                      <span className="text-[9px] uppercase font-bold text-indigo-500 flex items-center gap-1">
                        <UserCheck className="w-2.5 h-2.5" /> Updated By
                      </span>
                      <span className="bg-indigo-50 px-1 py-0.5 rounded text-[9px] text-indigo-700 border border-indigo-200/60">
                        {item.followedUpBy}
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom Interactive Row */}
                <div className="flex items-center justify-between gap-1.5 pt-0.5">
                  {formattedPhone ? (
                    <a
                      href={singleSmsHref}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-orange-50 hover:text-[#FF6B00] text-slate-700 font-bold text-xs font-mono transition-colors"
                      title="Send Welcome SMS"
                    >
                      <Phone className="w-3 h-3 text-emerald-600" />
                      {formattedPhone}
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400 italic px-2">
                      {item.messenger ? `FB: ${item.messenger}` : "No contact info"}
                    </span>
                  )}

                  <button
                    onClick={() => handleToggleStatus(item._id, "textedAlready", !!item.textedAlready)}
                    disabled={isPending}
                    className={`h-7 w-7 rounded-xl border flex items-center justify-center transition-all shrink-0 ${
                      item.textedAlready
                        ? "bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/30"
                        : "bg-slate-50 border-slate-300 text-transparent"
                    }`}
                    title="Toggle Texted Status"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </button>

                  <button
                    onClick={() => handleToggleStatus(item._id, "startedOne2One", isStartedOne2One)}
                    disabled={isPending}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold border transition-all shrink-0 ${
                      isStartedOne2One
                        ? "bg-emerald-50 text-emerald-600 border-emerald-300"
                        : "bg-slate-100 text-slate-500 border-slate-200"
                    }`}
                  >
                    One2One: {isStartedOne2One ? "YES" : "NO"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. Desktop Data Table */}
      <div className="hidden md:block bg-white rounded-[32px] border border-slate-200/80 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-4 px-5">VIP Name</th>
                <th className="py-4 px-4 text-center">Gender</th>
                <th className="py-4 px-4 text-center">Age Group</th>
                <th className="py-4 px-4 text-center">Service</th>
                <th className="py-4 px-5">Approached By</th>
                <th className="py-4 px-5">Contact / FB</th>
                <th className="py-4 px-4 text-center">Texted</th>
                <th className="py-4 px-4 text-center">One2One</th>
                <th className="py-4 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-400 text-xs font-medium">
                    No VIP logs found for this month.
                  </td>
                </tr>
              ) : (
                data.map((item: any) => {
                  const formattedPhone = formatPhilippineMobile(item.contact);
                  const isStartedOne2One = Boolean(item.startedOne2One ?? item.startedOne2one);
                  const gender = getGenderInfo(item.gender);
                  const isCopied = copiedId === String(item._id);
                  const singleSmsHref = formattedPhone
                    ? `sms:${formattedPhone}${smsQueryPrefix}body=${encodedWelcomeBody}`
                    : "#";

                  return (
                    <tr key={item._id} className="hover:bg-orange-50/30 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
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

                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-xl font-extrabold text-xs border whitespace-nowrap ${
                            gender.isMale
                              ? "bg-blue-50 text-blue-600 border-blue-200/60"
                              : "bg-rose-50 text-rose-500 border-rose-200/60"
                          }`}
                        >
                          {gender.label}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-xl border font-black text-xs whitespace-nowrap ${getAgeGroupBadgeStyle(item.ageGroup)}`}>
                          {item.ageGroup}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-extrabold text-xs whitespace-nowrap">
                          {item.serviceAttended}
                        </span>
                      </td>

                      <td className="py-4 px-5">
                        <div className="text-xs font-bold text-slate-800">{item.approachedBy}</div>
                        {item.connectedWith && (
                          <div className="text-[11px] text-emerald-600 font-semibold">
                            Connected: {item.connectedWith}
                          </div>
                        )}
                        {item.followedUpBy && (
                          <div className="text-[10px] text-indigo-600 font-bold mt-0.5 flex items-center gap-1">
                            <span className="text-slate-400 font-medium">Updated By:</span> {item.followedUpBy}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-5">
                        {formattedPhone ? (
                          <a
                            href={singleSmsHref}
                            className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-700 hover:text-[#FF6B00]"
                            title="Click to send welcome SMS"
                          >
                            <Phone className="w-3 h-3 text-emerald-600" />
                            {formattedPhone}
                          </a>
                        ) : item.messenger ? (
                          <div className="text-xs font-semibold text-blue-600 truncate max-w-[140px]" title={item.messenger}>
                            FB: {item.messenger}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-300 italic">
                            No contact info
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-center">
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

                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(item._id, "startedOne2One", isStartedOne2One)}
                          disabled={isPending}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold border transition-all ${
                            isStartedOne2One
                              ? "bg-emerald-50 text-emerald-600 border-emerald-300 shadow-sm"
                              : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                          }`}
                        >
                          {isStartedOne2One ? "YES" : "NO"}
                        </button>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopySingleVipDetails(item)}
                            className={`p-2 rounded-xl transition-all ${
                              isCopied
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                : "bg-slate-100 hover:bg-orange-50 text-slate-500 hover:text-[#FF6B00]"
                            }`}
                            title="Copy VIP Details"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5" /> : <ClipboardCopy className="w-3.5 h-3.5" />}
                          </button>

                          <EditFirstTimerModal 
                            item={item} 
                            teamMembers={teamMembers} 
                            canEditCoreDetails={canExportPdf || canEditCoreDetails}
                            onUpdate={handleUpdateItem} 
                          />

                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => setItemToDelete({ id: item._id, name: item.fullName })}
                              disabled={isPending}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                              title="Delete VIP Record (Admin Only)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Custom Confirmation Delete Modal (Admin Only) */}
      {itemToDelete && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-[28px] sm:rounded-[32px] border border-slate-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 text-center">
            
            <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200/60 flex items-center justify-center text-rose-600 shadow-lg shadow-rose-500/10">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-[#111827]">Delete VIP Record?</h3>
              <p className="text-xs text-slate-500 font-medium px-2">
                Are you sure you want to permanently delete{" "}
                <strong className="text-[#111827] font-extrabold">&ldquo;{itemToDelete.name}&rdquo;</strong>? This action cannot be undone.
              </p>
            </div>

            <div className="pt-2 flex gap-2.5">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                disabled={isDeleting}
                className="w-1/2 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition-all active:scale-95 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="w-1/2 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-600/25 flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Yes, Delete"}
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
}