// src/app/(portal)/admin/schedule/matrix/ScheduleMatrixClient.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { 
  ArrowLeft, 
  Calendar, 
  Download, 
  Search
} from "lucide-react";
import type { MemberMatrixRow } from "@/app/actions/scheduleMatrixAction";

export default function ScheduleMatrixClient({
  year,
  sundayDates,
  initialRows,
}: {
  year: number;
  sundayDates: string[];
  initialRows: MemberMatrixRow[];
}) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "LEADERS" | "FIXED" | "NEEDS_ATTENTION">("ALL");

  const filteredRows = initialRows.filter((row) => {
    const matchesSearch =
      row.name.toLowerCase().includes(search.toLowerCase()) ||
      row.displayName.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === "LEADERS") return row.isLeader;
    if (filterType === "FIXED") return row.stats.preferredSlot.includes("Fixed");
    if (filterType === "NEEDS_ATTENTION") return row.stats.trendLabel === "Needs Follow-up";
    return true;
  });

  const handleExportExcel = () => {
    const exportData = filteredRows.map((r) => {
      const rowObj: Record<string, any> = {
        "Name": r.displayName,
        "Role": r.isLeader ? "Team Leader" : "Member",
        "Attendance Rate": r.stats.totalSundaysRecorded > 0 ? `${r.stats.attendanceRate}%` : "0%",
        "Preferred Slot": r.stats.totalSundaysRecorded > 0 ? r.stats.preferredSlot : "-",
        "Status / Trend": r.stats.totalSundaysRecorded > 0 ? r.stats.trendLabel : "New / Pending",
        "Total Served": r.stats.attendedCount,
        "Total Excused": r.stats.absentCount,
      };

      // Add each Sunday as a column
      sundayDates.forEach((date) => {
        const att = r.attendanceMap[date];
        rowObj[date] = att ? (att.service === "NOT_ATTENDING" ? "ABSENT" : att.service) : "-";
      });

      return rowObj;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Attendance_${year}`);
    XLSX.writeFile(workbook, `ConnectHub_Attendance_Matrix_${year}.xlsx`);
  };

  const getServiceBadge = (service?: string) => {
    switch (service) {
      case "10AM":
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-blue-50 text-blue-600 border border-blue-200">10AM</span>;
      case "1PM":
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-orange-50 text-[#FF6B00] border border-orange-200">1PM</span>;
      case "4PM":
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-purple-50 text-purple-600 border border-purple-200">4PM</span>;
      case "NOT_ATTENDING":
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-rose-50 text-rose-500 border border-rose-200" title="Excused / Absent">ABS</span>;
      default:
        // Soft empty dash for past weeks with no data
        return <span className="text-slate-200 font-mono text-[11px]">-</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-[24px] border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/sunday-schedule"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            title="Back to Weekly Attendance Control"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#FF6B00]" /> Yearly Attendance Matrix ({year})
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Monitor team slot stability, member rotations, and absence trends across the year.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" /> Export Excel
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
          {(["ALL", "LEADERS", "FIXED", "NEEDS_ATTENTION"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterType(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                filterType === tab
                  ? "bg-[#FF6B00] text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              {tab === "ALL" && `All Members (${initialRows.length})`}
              {tab === "LEADERS" && `Leaders Only (${initialRows.filter(r => r.isLeader).length})`}
              {tab === "FIXED" && `Fixed Slot (${initialRows.filter(r => r.stats.preferredSlot.includes("Fixed")).length})`}
              {tab === "NEEDS_ATTENTION" && `Needs Follow-up (${initialRows.filter(r => r.stats.trendLabel === "Needs Follow-up").length})`}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search member name..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#FF6B00]"
          />
        </div>
      </div>

      {/* Matrix Table */}
      <div className="bg-white rounded-[24px] border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[70vh]">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50/90 sticky top-0 z-20 border-b border-slate-200 backdrop-blur-md">
              <tr>
                {/* Frozen column 1: Member Info - Added shadow for smooth horizontal scrolling */}
                <th className="py-3 px-4 sticky left-0 z-30 bg-slate-50 border-r border-slate-200 shadow-[4px_0_12px_-2px_rgba(0,0,0,0.06)] min-w-[180px] font-black text-slate-800">
                  Member / Nickname
                </th>
                <th className="py-3 px-3 min-w-[110px] font-bold text-slate-600 text-center">
                  Consistency
                </th>
                <th className="py-3 px-3 min-w-[100px] font-bold text-slate-600 text-center">
                  Primary Slot
                </th>
                <th className="py-3 px-3 min-w-[80px] font-bold text-slate-600 text-center">
                  Rate (%)
                </th>

                {/* Sunday Date Columns - Added slight background tint to separate from stats */}
                {sundayDates.map((date) => {
                  const [y, m, d] = date.split("-");
                  const monthName = new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  return (
                    <th key={date} className="py-3 px-2 text-center min-w-[65px] bg-slate-100/50 font-extrabold text-slate-600 border-l border-slate-200/80">
                      {monthName}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={4 + sundayDates.length} className="py-12 text-center text-slate-400 italic">
                    No members found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const hasData = row.stats.totalSundaysRecorded > 0;

                  return (
                    <tr key={row.memberId} className="hover:bg-slate-50/70 transition-colors">
                      {/* Frozen Member Column */}
                      <td className="py-2.5 px-4 sticky left-0 z-10 bg-white border-r border-slate-200 shadow-[4px_0_12px_-2px_rgba(0,0,0,0.03)] group-hover:bg-slate-50/70">
                        <div className="font-extrabold text-slate-900 truncate">
                          {row.displayName}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          {row.isLeader ? (
                            <span className="text-[9px] uppercase tracking-wider bg-orange-100 text-[#FF6B00] px-1.5 py-0.5 rounded font-black border border-orange-200/50">Leader</span>
                          ) : (
                            <span className="text-slate-400 font-medium">Member</span>
                          )}
                          {row.stats.consecutiveAbsences > 1 && (
                            <span className="text-rose-500 font-extrabold">
                              ({row.stats.consecutiveAbsences}w ABS)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Trend Status */}
                      <td className="py-2.5 px-3 text-center">
                        {!hasData ? (
                           <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-200">
                             New / Pending
                           </span>
                        ) : (
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black border ${row.stats.trendColor}`}>
                            {row.stats.trendLabel}
                          </span>
                        )}
                      </td>

                      {/* Preferred Slot */}
                      <td className="py-2.5 px-3 text-center font-bold text-slate-700">
                        {!hasData ? (
                          <span className="text-slate-300 font-medium">—</span>
                        ) : (
                          <span className="text-[11px]">{row.stats.preferredSlot}</span>
                        )}
                      </td>

                      {/* Serving Rate */}
                      <td className="py-2.5 px-3 text-center">
                        {!hasData ? (
                          <span className="font-medium text-slate-300">—</span>
                        ) : (
                          <span className={`font-black text-xs ${row.stats.attendanceRate >= 75 ? "text-emerald-600" : row.stats.attendanceRate >= 50 ? "text-amber-600" : "text-rose-600"}`}>
                            {row.stats.attendanceRate}%
                          </span>
                        )}
                      </td>

                      {/* Dynamic Date Slots */}
                      {sundayDates.map((date) => (
                        <td key={date} className="py-2.5 px-1 text-center border-l border-slate-100">
                          {getServiceBadge(row.attendanceMap[date]?.service)}
                        </td>
                      ))}
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