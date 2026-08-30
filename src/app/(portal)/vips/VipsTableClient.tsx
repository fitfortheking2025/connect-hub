"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import * as XLSX from "xlsx";
import { 
  Search, 
  Calendar, 
  Phone, 
  Check, 
  MessageSquare, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  Send,
  Copy,
  CheckCheck,
  CheckCircle2,
  UserCheck,
  Download,
  FileSpreadsheet
} from "lucide-react";
import { toggleDiscipleshipStatusAction, markBatchAsTextedAction } from "@/app/actions/firstTimerAction";
import EditFirstTimerModal from "@/app/components/EditFirstTimerModal";
import { exportConnectedMembersPdf } from "@/lib/exportConnectedPdf";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const AGE_GROUPS = [
  "ALL",
  "Youth",
  "Young Adult",
  "River Men",
  "River Women",
  "Seasoned"
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

function formatInternationalMobile(localPhone: string): string {
  if (localPhone.startsWith("0")) {
    return `+63${localPhone.slice(1)}`;
  }
  return localPhone;
}

interface VipsClientProps {
  initialData: any[];
  totalInMonth: number;
  selectedYear: number;
  selectedMonth: number;
  teamMembers: any[];
  canExportPdf?: boolean;
}

export default function VipsTableClient({
  initialData,
  totalInMonth,
  selectedYear,
  selectedMonth,
  teamMembers,
  canExportPdf = false,
}: VipsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  const [data, setData] = useState(initialData);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const safeMonth = (selectedMonth >= 1 && selectedMonth <= 12) ? selectedMonth : (new Date().getMonth() + 1);
  const safeYear = selectedYear || new Date().getFullYear();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedAge, setSelectedAge] = useState(searchParams.get("ageGroup") || "ALL");
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
    age: string,
    srv: string,
    st: string,
    term: string
  ) => {
    const params = new URLSearchParams();
    params.set("month", String(m));
    params.set("year", String(y));
    if (age !== "ALL") params.set("ageGroup", age);
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
    updateFilters(m, y, selectedAge, selectedService, selectedStatus, search);
  };

  const handleNextMonth = () => {
    let m = safeMonth + 1;
    let y = safeYear;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    updateFilters(m, y, selectedAge, selectedService, selectedStatus, search);
  };

  const handleExportConnectedPdf = () => {
    if (!canExportPdf) return;
    exportConnectedMembersPdf({
      month: safeMonth,
      year: safeYear,
      records: connectedMembers,
    });
  };
  // Export Single Column Phone Numbers Only (09xx) as an .xlsx Excel file
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

    // Column width for the single phone number column
    worksheet["!cols"] = [{ wch: 18 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Contacts");

    XLSX.writeFile(workbook, `VIP_Phone_Numbers_${MONTHS[safeMonth - 1]}_${safeYear}.xlsx`);
  };

  const handleUpdateItem = (updatedItem: any) => {
    setData((prev) =>
      prev.map((item) => (item._id === updatedItem._id ? updatedItem : item))
    );
  };

  const handleToggleStatus = (id: string, field: "textedAlready" | "startedOne2One", currentVal: boolean) => {
    setData((prev) =>
      prev.map((item) => (item._id === id ? { ...item, [field]: !currentVal } : item))
    );

    startTransition(async () => {
      await toggleDiscipleshipStatusAction(id, field, !currentVal);
      router.refresh();
    });
  };

  const handleCopyNumbers = async () => {
    if (untextedPhoneNumbers.length === 0) return;
    await navigator.clipboard.writeText(untextedPhoneNumbers.join(", "));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMarkBatchTexted = () => {
    const ids = untextedVips.map((v) => v._id);
    if (ids.length === 0) return;

    setData((prev) =>
      prev.map((item) => (ids.includes(item._id) ? { ...item, textedAlready: true } : item))
    );

    startTransition(async () => {
      await markBatchAsTextedAction(ids);
      router.refresh();
    });
  };

  const encodedWelcomeBody = encodeURIComponent(WELCOME_SMS_MESSAGE);
  const isIos = typeof navigator !== "undefined" && /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const smsQueryPrefix = isIos ? "&" : "?";

  const handleBroadcastSms = async () => {
    if (untextedPhoneNumbers.length === 0) return;

    await navigator.clipboard.writeText(untextedPhoneNumbers.join(", "));
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);

    const bulkSmsUrl = `sms:${smsQueryPrefix}body=${encodedWelcomeBody}`;
    window.location.href = bulkSmsUrl;
  };

  return (
    <div className="space-y-4">
      
      {/* 1. Month Navigator, PDF & Excel Export & Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 bg-white rounded-[24px] border border-slate-200/80 p-3 sm:p-3.5 flex items-center justify-between shadow-sm">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
            title="Previous Month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-50 text-[#FF6B00]">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="text-sm sm:text-base font-black text-[#111827]">
              {MONTHS[safeMonth - 1]} {safeYear}
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full ml-1">
              {totalInMonth} Total
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Conditional Role Gate: ADMIN & TEAM LEADER only */}
            {canExportPdf && (
              <>
                <button
                  onClick={handleExportPhoneNumbersExcel}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all shadow-sm"
                  title="Export Contacts as Excel (.xlsx)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">Export Excel</span>
                </button>

                <button
                  onClick={handleExportConnectedPdf}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#FF6B00] text-xs font-bold transition-all border border-orange-200/60 shadow-sm"
                  title="Export Monthly Connected PDF"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export Connected ({connectedMembers.length})</span>
                </button>
              </>
            )}

            <button
              onClick={handleNextMonth}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateFilters(safeMonth, safeYear, selectedAge, selectedService, selectedStatus, search);
          }}
          className="relative"
        >
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search VIP, phone, leader..."
            className="w-full pl-11 pr-4 py-3 sm:py-3.5 rounded-[24px] bg-white border border-slate-200/80 text-xs sm:text-sm font-medium text-[#111827] placeholder-slate-400 focus:outline-none focus:border-[#FF6B00] shadow-sm"
          />
        </form>
      </div>

      {/* 2. Age Group Filter Tabs */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
          Follow-Up Age Group
        </span>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {AGE_GROUPS.map((age) => (
            <button
              key={age}
              onClick={() => {
                setSelectedAge(age);
                updateFilters(safeMonth, safeYear, age, selectedService, selectedStatus, search);
              }}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-all shrink-0 ${
                selectedAge === age
                  ? "bg-[#FF6B00] text-white shadow-md shadow-orange-500/20"
                  : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
              }`}
            >
              {age === "ALL" ? "All Age Groups" : age}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Follow-Up Dispatch Banner */}
      <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent border border-orange-200/80 rounded-[28px] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
        <div>
          <div className="text-xs font-black text-[#111827] flex items-center gap-1.5">
            <Send className="w-3.5 h-3.5 text-[#FF6B00]" />
            Follow-Up SMS Dispatch • {selectedAge === "ALL" ? "All Groups" : selectedAge}
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            {untextedPhoneNumbers.length > 0 ? (
              <>
                <span className="font-bold text-[#FF6B00]">{untextedPhoneNumbers.length} pending VIP(s)</span> ready for welcome SMS.
              </>
            ) : (
              "All VIPs in this selection have been texted! 🎉"
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleCopyNumbers}
            disabled={untextedPhoneNumbers.length === 0}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all disabled:opacity-40"
          >
            {copied ? (
              <>
                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" /> Copy ({untextedPhoneNumbers.length})
              </>
            )}
          </button>

          <button
            onClick={handleBroadcastSms}
            disabled={untextedPhoneNumbers.length === 0}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white text-xs font-black transition-all shadow-md shadow-orange-500/25 disabled:opacity-40`}
          >
            <Send className="w-3.5 h-3.5" /> Broadcast SMS
          </button>

          {untextedPhoneNumbers.length > 0 && (
            <button
              onClick={handleMarkBatchTexted}
              disabled={isPending}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-sm"
              title="Mark all untexted VIPs as texted"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Mark {untextedPhoneNumbers.length} as Texted
            </button>
          )}
        </div>
      </div>

      {/* 4. Dropdowns */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={selectedService}
          onChange={(e) => {
            setSelectedService(e.target.value);
            updateFilters(safeMonth, safeYear, selectedAge, e.target.value, selectedStatus, search);
          }}
          className="px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 text-xs font-bold text-slate-700 focus:outline-none"
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
            updateFilters(safeMonth, safeYear, selectedAge, selectedService, e.target.value, search);
          }}
          className="px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 text-xs font-bold text-slate-700 focus:outline-none"
        >
          <option value="ALL">All Statuses</option>
          <option value="UNTEXTED">Pending Welcome Text</option>
          <option value="TEXTED">Texted Already</option>
          <option value="DISCIPLESHIP_YES">1-to-1: Yes</option>
          <option value="DISCIPLESHIP_NO">1-to-1: No</option>
        </select>
      </div>

      {/* 5. Mobile Cards View */}
      <div className="md:hidden space-y-3">
        {data.length === 0 ? (
          <div className="bg-white rounded-[24px] border border-slate-200/80 p-8 text-center text-slate-400 text-xs font-medium">
            No VIP records found for this month.
          </div>
        ) : (
          data.map((item: any) => {
            const formattedPhone = formatPhilippineMobile(item.contact);
            const singleSmsHref = formattedPhone
              ? `sms:${formattedPhone}${smsQueryPrefix}body=${encodedWelcomeBody}`
              : "#";

            return (
              <div
                key={item._id}
                className="bg-white rounded-[24px] border border-slate-200/80 p-4 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`h-9 w-9 rounded-xl flex items-center justify-center font-black text-xs text-white shrink-0 ${
                        item.gender === 1 ? "bg-blue-500" : "bg-rose-400"
                      }`}
                    >
                      {item.gender === 1 ? "M" : "F"}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-[#111827] leading-tight">
                        {item.fullName}
                      </h3>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {new Date(item.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  </div>

                  <EditFirstTimerModal item={item} teamMembers={teamMembers} onUpdate={handleUpdateItem} />
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-orange-50 text-[#FF6B00] border border-orange-200/60">
                    {item.ageGroup}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-600">
                    {item.serviceAttended}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 text-slate-500">
                    {item.iam}
                  </span>
                </div>

                <div className="text-xs text-slate-600 bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 space-y-1">
                  <div className="flex items-center justify-between">
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
                    <div className="flex items-center justify-between text-[11px] text-indigo-700 pt-1 border-t border-slate-200/60 font-semibold">
                      <span className="text-[10px] uppercase font-bold text-indigo-500 flex items-center gap-1">
                        <UserCheck className="w-3 h-3" /> Updated By
                      </span>
                      <span className="bg-indigo-50 px-1.5 py-0.5 rounded text-[10px] text-indigo-700 border border-indigo-200/60">
                        {item.followedUpBy}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  {formattedPhone ? (
                    <a
                      href={singleSmsHref}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-orange-50 hover:text-[#FF6B00] text-slate-700 font-bold text-xs font-mono transition-colors"
                      title="Send Welcome SMS"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      {formattedPhone}
                    </a>
                  ) : (
                    <span className="text-xs text-slate-300 italic px-2">
                      {item.contact ? "Invalid phone" : "No phone"}
                    </span>
                  )}

                  {item.messenger && (
                    <a
                      href={item.messenger.startsWith("http") ? item.messenger : `https://m.me/${item.messenger}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors shrink-0"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </a>
                  )}

                  <button
                    onClick={() => handleToggleStatus(item._id, "textedAlready", !!item.textedAlready)}
                    disabled={isPending}
                    className={`h-8 w-8 rounded-xl border flex items-center justify-center transition-all shrink-0 ${
                      item.textedAlready
                        ? "bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/30"
                        : "bg-slate-50 border-slate-300 text-transparent"
                    }`}
                    title="Mark Texted"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                  </button>

                  <button
                    onClick={() =>
                      handleToggleStatus(
                        item._id,
                        "startedOne2One",
                        Boolean(item.startedOne2One ?? item.startedOne2one)
                      )
                    }
                    disabled={isPending}
                    className={`px-3 py-2 rounded-xl text-xs font-extrabold border transition-all shrink-0 ${
                      Boolean(item.startedOne2One ?? item.startedOne2one)
                        ? "bg-emerald-50 text-emerald-600 border-emerald-300"
                        : "bg-slate-100 text-slate-500 border-slate-200"
                    }`}
                  >
                    1-to-1: {Boolean(item.startedOne2One ?? item.startedOne2one) ? "YES" : "NO"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 6. Desktop Data Table */}
      <div className="hidden md:block bg-white rounded-[32px] border border-slate-200/80 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-4 px-5">VIP Name</th>
                <th className="py-4 px-4">Age Group</th>
                <th className="py-4 px-4">Service</th>
                <th className="py-4 px-5">Approached By</th>
                <th className="py-4 px-5">Contact</th>
                <th className="py-4 px-4 text-center">Texted</th>
                <th className="py-4 px-4 text-center">1-to-1</th>
                <th className="py-4 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400 text-xs font-medium">
                    No VIP logs found for this month.
                  </td>
                </tr>
              ) : (
                data.map((item: any) => {
                  const formattedPhone = formatPhilippineMobile(item.contact);
                  const singleSmsHref = formattedPhone
                    ? `sms:${formattedPhone}${smsQueryPrefix}body=${encodedWelcomeBody}`
                    : "#";

                  return (
                    <tr key={item._id} className="hover:bg-orange-50/30 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-9 w-9 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-sm ${
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

                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 rounded-xl bg-orange-50 text-[#FF6B00] border border-orange-200/60 font-extrabold text-xs">
                          {item.ageGroup}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-extrabold text-xs">
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
                        ) : (
                          <span className="text-[11px] text-slate-300 italic">
                            {item.contact ? "Invalid phone" : "No contact"}
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
                          onClick={() =>
                            handleToggleStatus(
                              item._id,
                              "startedOne2One",
                              Boolean(item.startedOne2One ?? item.startedOne2one)
                            )
                          }
                          disabled={isPending}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold border transition-all ${
                            Boolean(item.startedOne2One ?? item.startedOne2one)
                              ? "bg-emerald-50 text-emerald-600 border-emerald-300 shadow-sm"
                              : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                          }`}
                        >
                          {Boolean(item.startedOne2One ?? item.startedOne2one) ? "YES" : "NO"}
                        </button>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <EditFirstTimerModal item={item} teamMembers={teamMembers} onUpdate={handleUpdateItem} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}