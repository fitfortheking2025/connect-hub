// src/app/(portal)/analytics/AnalyticsClient.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { 
  Users, 
  HeartHandshake, 
  Calendar, 
  Filter, 
  RotateCcw, 
  PieChart as PieIcon,
  TrendingUp,
  BarChart3,
  MessageSquareCheck,
  Flame,
  ArrowUpRight
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar 
} from "recharts";

const AGE_GROUPS = ["ALL", "Youth", "Young Adult", "River Men", "River Women", "Seasoned"];
const SERVICES = ["ALL", "10AM", "1PM", "4PM"];

interface AnalyticsProps {
  initialData: any[];
  startDate: string;
  endDate: string;
  selectedAge: string;
  selectedService: string;
}

export default function AnalyticsClient({
  initialData,
  startDate,
  endDate,
  selectedAge,
  selectedService,
}: AnalyticsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [startInput, setStartInput] = useState(startDate);
  const [endInput, setEndInput] = useState(endDate);
  const [ageInput, setAgeInput] = useState(selectedAge);
  const [serviceInput, setServiceInput] = useState(selectedService);

  // 1. KPI Calculations
  const totalLogs = initialData.length;
  const firstTimersCount = initialData.filter((d) => d.iam === "VISITOR").length;
  const discipleshipCount = initialData.filter((d) => Boolean(d.startedOne2One ?? d.startedOne2one)).length;
  const textedCount = initialData.filter((d) => d.textedAlready).length;

  const firstTimersPct = totalLogs > 0 ? ((firstTimersCount / totalLogs) * 100).toFixed(0) : "0";
  const conversionRate = totalLogs > 0 ? ((discipleshipCount / totalLogs) * 100).toFixed(0) : "0";
  const textedRate = totalLogs > 0 ? ((textedCount / totalLogs) * 100).toFixed(0) : "0";

  // 2. Timeline Aggregation
  const timelineMap: Record<string, { date: string; visitors: number; discipleship: number }> = {};
  initialData.forEach((d) => {
    const day = new Date(d.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (!timelineMap[day]) {
      timelineMap[day] = { date: day, visitors: 0, discipleship: 0 };
    }
    timelineMap[day].visitors += 1;
    if (d.startedOne2One ?? d.startedOne2one) {
      timelineMap[day].discipleship += 1;
    }
  });
  const trendData = Object.values(timelineMap);

  // 3. Category Distribution
  const visitorsOnly = initialData.filter((d) => d.iam === "VISITOR").length;
  const lookingChurch = initialData.filter((d) => d.iam === "LOOKING FOR A CHURCH").length;
  const fromOtherChurch = initialData.filter((d) => d.iam === "FROM OTHER CHURCH").length;

  const categoryData = [
    { name: "Visitor", value: visitorsOnly, color: "#FF6B00" },
    { name: "Looking for Church", value: lookingChurch, color: "#3B82F6" },
    { name: "From Other Church", value: fromOtherChurch, color: "#A855F7" },
  ].filter((d) => d.value > 0);

  // 4. Age Group Distribution
  const ageDistData = [
    { name: "Youth", count: initialData.filter((d) => d.ageGroup === "Youth").length, color: "#FF6B00" },
    { name: "Young Adult", count: initialData.filter((d) => d.ageGroup === "Young Adult").length, color: "#F97316" },
    { name: "River Men", count: initialData.filter((d) => d.ageGroup === "River Men").length, color: "#3B82F6" },
    { name: "River Women", count: initialData.filter((d) => d.ageGroup === "River Women").length, color: "#EC4899" },
    { name: "Seasoned", count: initialData.filter((d) => d.ageGroup === "Seasoned").length, color: "#10B981" },
  ];

  // 5. Service Breakdown
  const s10 = initialData.filter((d) => d.serviceAttended === "10AM").length;
  const s1 = initialData.filter((d) => d.serviceAttended === "1PM").length;
  const s4 = initialData.filter((d) => d.serviceAttended === "4PM").length;

  const handleApplyFilter = () => {
    const params = new URLSearchParams();
    if (startInput) params.set("startDate", startInput);
    if (endInput) params.set("endDate", endInput);
    if (ageInput !== "ALL") params.set("ageGroup", ageInput);
    if (serviceInput !== "ALL") params.set("service", serviceInput);

    startTransition(() => {
      router.push(`/analytics?${params.toString()}`);
    });
  };

  const handleReset = () => {
    const curYear = new Date().getFullYear();
    setStartInput(`${curYear}-01-01`);
    setEndInput(new Date().toISOString().split("T")[0]);
    setAgeInput("ALL");
    setServiceInput("ALL");

    startTransition(() => {
      router.push("/analytics");
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* 1. Date Range & Filter Box (Compact 2-Column Mobile Grid) */}
      <div className="bg-white rounded-[20px] sm:rounded-[24px] border border-slate-200/80 p-3.5 sm:p-5 shadow-sm space-y-3">
        <div className="text-xs font-black text-[#111827] flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-[#FF6B00]" /> Filter Date Range & Demographic
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-6 gap-2.5 sm:gap-3 items-end">
          {/* Start Date */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Start Date</label>
            <input
              type="date"
              value={startInput}
              onChange={(e) => setStartInput(e.target.value)}
              className="w-full px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#FF6B00]"
            />
          </div>

          {/* End Date */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">End Date</label>
            <input
              type="date"
              value={endInput}
              onChange={(e) => setEndInput(e.target.value)}
              className="w-full px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#FF6B00]"
            />
          </div>

          {/* Age Group */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Age Group</label>
            <select
              value={ageInput}
              onChange={(e) => setAgeInput(e.target.value)}
              className="w-full px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#FF6B00]"
            >
              {AGE_GROUPS.map((g) => (
                <option key={g} value={g}>{g === "ALL" ? "All Age Groups" : g}</option>
              ))}
            </select>
          </div>

          {/* Service Slot */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Service Slot</label>
            <select
              value={serviceInput}
              onChange={(e) => setServiceInput(e.target.value)}
              className="w-full px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#FF6B00]"
            >
              {SERVICES.map((s) => (
                <option key={s} value={s}>{s === "ALL" ? "All Services" : `${s} Service`}</option>
              ))}
            </select>
          </div>

          {/* Apply Filter Button */}
          <button
            onClick={handleApplyFilter}
            disabled={isPending}
            className="w-full py-2.5 px-3 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white text-xs font-black transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-95"
          >
            <Filter className="w-3.5 h-3.5" /> Apply
          </button>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            disabled={isPending}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>
      </div>

      {/* 2. Top 2x2 Metric Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        
        {/* Total Logged */}
        <div className="bg-white rounded-[20px] sm:rounded-[24px] border border-slate-200/80 p-3.5 sm:p-5 space-y-1.5 sm:space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Logged</span>
            <div className="p-1.5 sm:p-2.5 rounded-xl bg-orange-50 text-[#FF6B00]">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-3xl font-black text-[#111827] tracking-tight">
              {totalLogs}
            </div>
            <p className="text-[10px] sm:text-[11px] font-bold text-[#FF6B00] mt-0.5 flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" /> Selected period
            </p>
          </div>
        </div>

        {/* First Timers Rate */}
        <div className="bg-white rounded-[20px] sm:rounded-[24px] border border-slate-200/80 p-3.5 sm:p-5 space-y-1.5 sm:space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">First-Timers</span>
            <div className="p-1.5 sm:p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-3xl font-black text-[#111827] tracking-tight">
              {firstTimersCount} <span className="text-[10px] sm:text-xs font-bold text-slate-400">({firstTimersPct}%)</span>
            </div>
            <p className="text-[10px] sm:text-[11px] font-bold text-blue-600 mt-0.5">
              Pure first-time guests
            </p>
          </div>
        </div>

        {/* 1-to-1 Discipleship */}
        <div className="bg-white rounded-[20px] sm:rounded-[24px] border border-slate-200/80 p-3.5 sm:p-5 space-y-1.5 sm:space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">1-to-1 Disc.</span>
            <div className="p-1.5 sm:p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <HeartHandshake className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-3xl font-black text-[#111827] tracking-tight">
              {discipleshipCount}
            </div>
            <p className="text-[10px] sm:text-[11px] font-bold text-emerald-600 mt-0.5">
              {conversionRate}% conversion
            </p>
          </div>
        </div>

        {/* SMS Reach */}
        <div className="bg-white rounded-[20px] sm:rounded-[24px] border border-slate-200/80 p-3.5 sm:p-5 space-y-1.5 sm:space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">SMS Reach</span>
            <div className="p-1.5 sm:p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <MessageSquareCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-3xl font-black text-[#111827] tracking-tight">
              {textedCount}
            </div>
            <p className="text-[10px] sm:text-[11px] font-bold text-indigo-600 mt-0.5">
              {textedRate}% contact rate
            </p>
          </div>
        </div>

      </div>

      {/* 3. Timeline Area Chart */}
      <div className="bg-white rounded-[20px] sm:rounded-[28px] border border-slate-200/80 p-4 sm:p-6 shadow-sm space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-2.5 gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 sm:p-2 rounded-xl bg-orange-50 text-[#FF6B00]">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-[#111827] text-sm sm:text-base">Intake & Discipleship Over Time</h3>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium">Daily attendance spikes vs 1-to-1 discipleship started</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-bold">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B00]" />
              <span className="text-slate-600">Total Visitors</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-600">1-to-1 Started</span>
            </div>
          </div>
        </div>

        <div className="h-64 sm:h-72">
          {trendData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs font-semibold">
              No VIP logs found for this date period.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="themeOrange" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#FF6B00" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="themeGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94A3B8" }} />
                <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1E293B",
                    borderRadius: "14px",
                    border: "none",
                    color: "#fff",
                    fontSize: "11px",
                    fontWeight: "bold",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="visitors"
                  stroke="#FF6B00"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#themeOrange)"
                  name="Visitors"
                />
                <Area
                  type="monotone"
                  dataKey="discipleship"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#themeGreen)"
                  name="1-to-1 Discipleship"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 4. Categorical Breakdown & Demographic Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Category Share Donut */}
        <div className="bg-white rounded-[20px] sm:rounded-[28px] border border-slate-200/80 p-4 sm:p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <div className="p-1.5 sm:p-2 rounded-xl bg-orange-50 text-[#FF6B00]">
              <PieIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-[#111827] text-sm">Visitor Category</h3>
              <p className="text-[10px] text-slate-400 font-medium">Intake background</p>
            </div>
          </div>

          <div className="h-48 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={72}
                  paddingAngle={4}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-lg font-black text-[#111827]">{totalLogs}</span>
              <span className="text-[8px] font-bold text-slate-400 uppercase">LOGS</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            {categoryData.map((c) => (
              <div key={c.name} className="flex items-center justify-between text-xs font-bold">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-slate-600">{c.name}</span>
                </div>
                <span className="text-[#111827] font-black">{c.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Age Group Distribution Bar */}
        <div className="bg-white rounded-[20px] sm:rounded-[28px] border border-slate-200/80 p-4 sm:p-5 shadow-sm space-y-3 lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 sm:p-2 rounded-xl bg-orange-50 text-[#FF6B00]">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-[#111827] text-sm">Age Group Demographics</h3>
                <p className="text-[10px] text-slate-400 font-medium">Audience volume per ministry bracket</p>
              </div>
            </div>
          </div>

          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageDistData} margin={{ top: 15, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94A3B8" }} />
                <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1E293B",
                    borderRadius: "14px",
                    border: "none",
                    color: "#fff",
                    fontSize: "11px",
                    fontWeight: "bold",
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {ageDistData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-5 gap-1.5 pt-2 border-t border-slate-100 text-center">
            {ageDistData.map((d) => (
              <div key={d.name} className="p-1.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-[9px] font-bold text-slate-400 uppercase truncate">{d.name}</div>
                <div className="text-xs sm:text-sm font-black text-[#111827] mt-0.5">{d.count}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 5. Sunday Service Split */}
      <div className="bg-white rounded-[20px] sm:rounded-[24px] border border-slate-200/80 p-3.5 sm:p-5 shadow-sm space-y-2.5">
        <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400">
          Sunday Service Split
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="p-3.5 rounded-2xl bg-orange-50/60 border border-orange-200/60 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">10AM Service</div>
              <div className="text-lg font-black text-[#111827] mt-0.5">{s10} VIPs</div>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-white text-[#FF6B00] border border-orange-200 font-extrabold text-xs">
              {totalLogs > 0 ? Math.round((s10 / totalLogs) * 100) : 0}%
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/60 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">1PM Service</div>
              <div className="text-lg font-black text-[#111827] mt-0.5">{s1} VIPs</div>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-white text-amber-600 border border-amber-200 font-extrabold text-xs">
              {totalLogs > 0 ? Math.round((s1 / totalLogs) * 100) : 0}%
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-cyan-50/60 border border-cyan-200/60 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">4PM Service</div>
              <div className="text-lg font-black text-[#111827] mt-0.5">{s4} VIPs</div>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-white text-cyan-600 border border-cyan-200 font-extrabold text-xs">
              {totalLogs > 0 ? Math.round((s4 / totalLogs) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}