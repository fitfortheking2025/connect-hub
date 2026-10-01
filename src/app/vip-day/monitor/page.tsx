// src/app/vip-day/monitor/page.tsx
"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  UserCheck, 
  Clock, 
  Download, 
  Search, 
  Lock, 
  RefreshCw, 
  LogOut, 
  CheckCircle2, 
  XCircle, 
  AlertCircle 
} from "lucide-react";
import { 
  verifyMonitorPasscodeAction, 
  getVipMonitorDataAction, 
  manualToggleCheckInAction 
} from "@/app/actions/vipDayAction";

export default function VipMonitorPage() {
  const [passcode, setPasscode] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Monitor Data
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totalRegistered: 0, totalAttended: 0, turnoutRate: 0 });
  const [disciplers, setDisciplers] = useState<any[]>([]);
  const [attendees, setAttendees] = useState<any[]>([]);

  // Filter & Search
  const [filterDiscipler, setFilterDiscipler] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Restore saved session
  useEffect(() => {
    const saved = localStorage.getItem("vip_monitor_passcode");
    if (saved) {
      verifyMonitorPasscodeAction(saved).then((res) => {
        if (res.success) {
          setPasscode(saved);
          setIsUnlocked(true);
        }
      });
    }
  }, []);

  const loadData = async (activeCode = passcode) => {
    setLoading(true);
    const res = await getVipMonitorDataAction(activeCode);
    if (res.success && res.stats && res.disciplers && res.attendees) {
      setStats(res.stats);
      setDisciplers(res.disciplers);
      setAttendees(res.attendees);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isUnlocked) {
      loadData();
      // Optional polling every 15 seconds for live counts during rush
      const timer = setInterval(() => loadData(), 15000);
      return () => clearInterval(timer);
    }
  }, [isUnlocked]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const res = await verifyMonitorPasscodeAction(passcode);
    if (res.success) {
      localStorage.setItem("vip_monitor_passcode", passcode.trim());
      setIsUnlocked(true);
    } else {
      setErrorMsg("Incorrect Coordinator Passcode.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("vip_monitor_passcode");
    setIsUnlocked(false);
  };

  const handleToggle = async (ticketCode: string) => {
    const res = await manualToggleCheckInAction(ticketCode, passcode);
    if (res.success && res.updated) {
      setAttendees((prev) =>
        prev.map((att) => (att.ticketCode === ticketCode ? res.updated : att))
      );
      // Re-calculate local stats
      setStats((prev) => {
        const delta = res.updated.status === "ATTENDED" ? 1 : -1;
        const newAtt = prev.totalAttended + delta;
        return {
          ...prev,
          totalAttended: newAtt,
          turnoutRate: prev.totalRegistered > 0 ? Math.round((newAtt / prev.totalRegistered) * 100) : 0,
        };
      });
    }
  };

  // CSV Export Generation
  const handleExportCSV = () => {
    if (attendees.length === 0) return;
    const headers = ["Ticket Code", "Name", "Contact", "Discipler", "Status", "Attended Time", "Scanned By"];
    const rows = attendees.map((a) => [
      a.ticketCode,
      `"${a.fullName}"`,
      `"${a.contactNumber}"`,
      `"${a.discipler}"`,
      a.status,
      a.attendedAt ? new Date(a.attendedAt).toLocaleTimeString() : "",
      `"${a.scannedBy || ""}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `VIP-Day-2026-Attendees-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered List
  const filteredAttendees = attendees.filter((a) => {
    const matchesSearch =
      a.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.contactNumber.includes(searchQuery) ||
      a.ticketCode.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDiscipler = filterDiscipler === "ALL" || a.discipler === filterDiscipler;
    const matchesStatus = filterStatus === "ALL" || a.status === filterStatus;

    return matchesSearch && matchesDiscipler && matchesStatus;
  });

  // 1. Passcode Prompt
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
          <div className="text-center space-y-1.5">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 text-[#FF6B00] flex items-center justify-center mx-auto mb-2">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">VIP Day Coordinator</h1>
            <p className="text-xs text-slate-500 font-medium">
              Enter the Lead Passcode to access live attendance and reports.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                Lead Passcode (Default: VIP-LEAD-88)
              </label>
              <input
                type="password"
                required
                placeholder="Enter passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-center text-sm font-bold focus:outline-none focus:border-[#FF6B00]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white text-xs font-black uppercase tracking-wider shadow-md shadow-orange-500/20"
            >
              Access Dashboard
            </button>
          </form>

          <p className="text-[11px] text-center text-slate-400">
            River of God Ortigas &bull; Connect Hub Isolated Portal
          </p>
        </div>
      </div>
    );
  }

  // 2. Full Live Coordinator Dashboard
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-[#FF6B00] selection:text-white">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-[#FF6B00] text-white font-black flex items-center justify-center text-sm">
              VIP
            </span>
            <div>
              <h1 className="text-sm font-black tracking-tight text-slate-900">
                VIP Day 2026 &bull; Live Monitor
              </h1>
              <p className="text-[10px] text-slate-500 font-bold">Nov 07, 2026 &bull; ROG Ortigas</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadData()}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-xl bg-[#FF6B00] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800"
              title="Lock Session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* KPI Counter Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Registered</div>
              <div className="text-2xl font-black text-slate-900">{stats.totalRegistered}</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Present (Checked In)</div>
              <div className="text-2xl font-black text-emerald-600">{stats.totalAttended}</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="p-3 rounded-xl bg-orange-50 text-[#FF6B00] border border-orange-100">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Turnout Rate</div>
              <div className="text-2xl font-black text-slate-900">{stats.turnoutRate}%</div>
            </div>
          </div>
        </div>

        {/* Discipler Summary Matrix */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
            Attendance by Discipler
          </h2>
          <div className="flex flex-wrap gap-2">
            {disciplers.map((d) => (
              <button
                key={d.name}
                onClick={() => setFilterDiscipler(filterDiscipler === d.name ? "ALL" : d.name)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                  filterDiscipler === d.name
                    ? "bg-[#FF6B00] text-white border-[#FF6B00]"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span>{d.name}: </span>
                <span className={filterDiscipler === d.name ? "text-white" : "text-emerald-600"}>
                  {d.attended}
                </span>
                <span className="text-slate-400">/{d.total}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Filter & Live Search Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, contact, or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#FF6B00]"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Status</option>
              <option value="ATTENDED">Attended Only</option>
              <option value="REGISTERED">Pending Only</option>
            </select>

            {filterDiscipler !== "ALL" && (
              <button
                onClick={() => setFilterDiscipler("ALL")}
                className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200"
              >
                Clear Filter ({filterDiscipler})
              </button>
            )}
          </div>
        </div>

        {/* Attendee Roster Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Ticket</th>
                  <th className="py-3.5 px-4">Guest Name</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Discipler</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Checked In At</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredAttendees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No attendees match the criteria.
                    </td>
                  </tr>
                ) : (
                  filteredAttendees.map((att) => (
                    <tr key={att.ticketCode} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-600">
                        {att.ticketCode}
                      </td>
                      <td className="py-3 px-4 font-extrabold text-slate-900">
                        {att.fullName}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {att.contactNumber}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {att.discipler}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            att.status === "ATTENDED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {att.status === "ATTENDED" ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Present
                            </>
                          ) : (
                            "Registered"
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {att.attendedAt
                          ? `${new Date(att.attendedAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })} (${att.scannedBy || "Scanner"})`
                          : "—"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleToggle(att.ticketCode)}
                          className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                            att.status === "ATTENDED"
                              ? "bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600"
                              : "bg-emerald-600 hover:bg-emerald-700 text-white"
                          }`}
                        >
                          {att.status === "ATTENDED" ? "Undo" : "Check In"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}