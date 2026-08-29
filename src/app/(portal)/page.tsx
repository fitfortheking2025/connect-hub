import Link from "next/link";
import { 
  Users, 
  HeartHandshake, 
  Clock, 
  ShieldCheck, 
  Search, 
  Phone, 
  CheckCircle2, 
  ArrowUpRight, 
  Download, 
  MessageCircle, 
  ChevronRight 
} from "lucide-react";

// Real visitor logs from your SQL dump
const visitorLogs = [
  {
    id: 883,
    iam: "VISITOR",
    fullName: "Shyraim Mae Caberio",
    contact: "09952808382",
    messenger: "Shyraim Caberio",
    ageGroup: "Young Adult",
    serviceAttended: "1PM",
    approachedBy: "Cris Sanjuan",
    startedOne2One: 0,
    date: "Jul 27, 2026",
  },
  {
    id: 882,
    iam: "FROM OTHER CHURCH",
    fullName: "Merlinda dela calzada",
    contact: "09983857459",
    messenger: "Sat dela calzada",
    ageGroup: "Seasoned",
    serviceAttended: "1PM",
    approachedBy: "Cris San Juan",
    startedOne2One: 0,
    date: "Jul 27, 2026",
  },
  {
    id: 878,
    iam: "VISITOR",
    fullName: "Christian De La Cruz Santos",
    contact: "9655387470",
    messenger: "Christian Santos",
    ageGroup: "Seasoned",
    serviceAttended: "4PM",
    approachedBy: "Frank Balboa",
    startedOne2One: 1,
    date: "Jul 27, 2026",
  },
  {
    id: 879,
    iam: "LOOKING FOR A CHURCH",
    fullName: "Mary Nicole Cinco",
    contact: "9957838458",
    messenger: "Mary Nicole Cinco",
    ageGroup: "Young Adult",
    serviceAttended: "10AM",
    approachedBy: "Gerza Jane Carmen",
    startedOne2One: 1,
    date: "Jul 27, 2026",
  },
  {
    id: 871,
    iam: "LOOKING FOR A CHURCH",
    fullName: "Clarysse Jerardine Ramos",
    contact: "9929308743",
    messenger: "Clarysse Ramos",
    ageGroup: "Young Adult",
    serviceAttended: "10AM",
    approachedBy: "Dee Casada",
    startedOne2One: 1,
    date: "Jul 26, 2026",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="bg-white rounded-[28px] border border-slate-200/80 shadow-md shadow-slate-200/40 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <h2 className="text-2xl md:text-3xl font-black text-[#111827] tracking-tight">
            Welcome to <span className="text-[#FF6B00]">Connect Hub</span>
          </h2>
          <p className="text-xs md:text-sm text-slate-500 font-medium max-w-xl">
            Live telemetry for first-timer Sunday intakes, discipleship funnels, and approaching leaders.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all active:scale-[0.98]">
            <Download className="w-3.5 h-3.5 text-slate-500" /> Export Summary
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Logged */}
        <div className="bg-white rounded-[24px] p-5 border border-slate-200/80 shadow-md shadow-slate-200/30 hover:-translate-y-1 transition-all cursor-pointer group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Logged</span>
            <div className="p-2.5 rounded-2xl bg-orange-50 text-[#FF6B00] group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-[#111827]">208</span>
            <span className="text-xs text-slate-400 font-medium ml-1.5">visitors</span>
          </div>
          <p className="text-xs text-[#FF6B00] font-semibold mt-2 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> 100% Sunday intake
          </p>
        </div>

        {/* Discipleship */}
        <div className="bg-white rounded-[24px] p-5 border border-slate-200/80 shadow-md shadow-slate-200/30 hover:-translate-y-1 transition-all cursor-pointer group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Discipleship</span>
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
              <HeartHandshake className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-[#111827]">44</span>
            <span className="text-xs text-slate-400 font-medium ml-1.5">in 1-to-1</span>
          </div>
          <p className="text-xs text-emerald-600 font-semibold mt-2">
            21.2% Conversion Rate
          </p>
        </div>

        {/* Connect Team */}
        <div className="bg-white rounded-[24px] p-5 border border-slate-200/80 shadow-md shadow-slate-200/30 hover:-translate-y-1 transition-all cursor-pointer group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Connect Team</span>
            <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-[#111827]">27</span>
            <span className="text-xs text-slate-400 font-medium ml-1.5">members</span>
          </div>
          <p className="text-xs text-slate-500 font-semibold mt-2">
            5 Leaders • 22 Members
          </p>
        </div>

        {/* Top Service */}
        <div className="bg-white rounded-[24px] p-5 border border-slate-200/80 shadow-md shadow-slate-200/30 hover:-translate-y-1 transition-all cursor-pointer group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Top Service</span>
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-[#111827]">10AM & 4PM</span>
          </div>
          <p className="text-xs text-amber-600 font-semibold mt-2">
            Peak attendance times
          </p>
        </div>
      </div>

      {/* Visitor Log Table */}
      <div className="bg-white rounded-[32px] border border-slate-200/80 shadow-lg shadow-slate-200/40 overflow-hidden">
        
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-lg font-extrabold text-[#111827]">Recent First-Timer Logs</h3>
              <span className="text-xs font-bold text-[#FF6B00] bg-orange-50 px-2 py-0.5 rounded-full">
                Live Data
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Direct Sunday service entries & discipleship status</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search visitor, phone, approacher..."
                className="pl-10 pr-4 py-2 rounded-2xl bg-[#F8FAFC] border border-slate-200 text-xs text-[#111827] placeholder-slate-400 focus:outline-none focus:border-[#FF6B00] w-64 md:w-72 transition-all"
              />
            </div>

            <Link 
              href="/intake"
              className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-[#FF6B00] hover:text-[#e05e00] px-3 py-2 rounded-xl hover:bg-orange-50 transition-all"
            >
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-4 px-6">Visitor</th>
                <th className="py-4 px-4">Category</th>
                <th className="py-4 px-4">Service</th>
                <th className="py-4 px-4">Approached By</th>
                <th className="py-4 px-4">Contact & Reach</th>
                <th className="py-4 px-6 text-right">Discipleship Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
              {visitorLogs.map((log) => (
                <tr key={log.id} className="hover:bg-orange-50/40 transition-colors group">
                  <td className="py-4 px-6">
                    <div className="font-bold text-[#111827] text-sm group-hover:text-[#FF6B00] transition-colors">{log.fullName}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{log.ageGroup} • {log.date}</div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-[11px] font-bold ${
                      log.iam === "VISITOR"
                        ? "bg-blue-50 text-blue-600"
                        : log.iam === "LOOKING FOR A CHURCH"
                        ? "bg-orange-50 text-[#FF6B00]"
                        : "bg-purple-50 text-purple-600"
                    }`}>
                      {log.iam}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-mono font-bold bg-slate-100 px-2.5 py-1 rounded-lg text-slate-800 text-xs">
                      {log.serviceAttended}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-[#111827] font-semibold">
                    {log.approachedBy}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <a href={`tel:${log.contact}`} className="font-mono text-slate-600 hover:text-[#FF6B00] flex items-center gap-1 transition-colors">
                        <Phone className="w-3 h-3 text-[#FF6B00]" />
                        {log.contact}
                      </a>
                      {log.messenger && (
                        <span className="p-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer transition-colors" title={`Messenger: ${log.messenger}`}>
                          <MessageCircle className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    {log.startedOne2One ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" /> One-to-One
                      </span>
                    ) : (
                      <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold text-slate-500 bg-slate-100 hover:bg-[#FF6B00] hover:text-white transition-all shadow-sm">
                        + Start 1-to-1
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}