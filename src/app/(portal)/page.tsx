import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { FirstTimer, TeamMember } from "@/models";
import Link from "next/link";
import { 
  Users, 
  HeartHandshake, 
  ShieldCheck, 
  Clock, 
  ArrowUpRight, 
  Phone, 
  MessageSquare,
  Sparkles,
  Download,
  UserCheck,
  ChevronRight
} from "lucide-react";

export default async function DashboardPage() {
  await auth();
  await dbConnect();

  const [vips, teamMembers, totalVips, discipleshipCount] = await Promise.all([
    FirstTimer.find({}).sort({ createdAt: -1 }).limit(10).lean(),
    TeamMember.find({ active: true }).lean(),
    FirstTimer.countDocuments({}),
    FirstTimer.countDocuments({ startedOne2One: true }),
  ]);

  // Dynamic Connect Team statistics
  const totalTeam = teamMembers.length;
  const leadersCount = teamMembers.filter((m) => m.groupName === "Team Leaders").length;
  const membersCount = teamMembers.filter((m) => m.groupName !== "Team Leaders").length;

  const conversionRate = totalVips > 0 ? ((discipleshipCount / totalVips) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      
      {/* 1. Header Banner */}
      <div className="bg-white rounded-[32px] border border-slate-200/80 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-[#111827] tracking-tight">
            Welcome to <span className="text-[#FF6B00]">Connect Hub</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Live telemetry for first-timer Sunday intakes, discipleship funnels, and approaching leaders.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all w-fit"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" /> Export Summary
        </button>
      </div>

      {/* 2. Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Logged */}
        <div className="bg-white rounded-[28px] border border-slate-200/80 p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Logged</span>
            <div className="p-2.5 rounded-2xl bg-orange-50 text-[#FF6B00]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-[#111827]">
              {totalVips} <span className="text-xs font-semibold text-slate-400">visitors</span>
            </div>
            <p className="text-[11px] font-bold text-[#FF6B00] mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> 100% Sunday intake
            </p>
          </div>
        </div>

        {/* Discipleship */}
        <div className="bg-white rounded-[28px] border border-slate-200/80 p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Discipleship</span>
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600">
              <HeartHandshake className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-[#111827]">
              {discipleshipCount} <span className="text-xs font-semibold text-slate-400">in 1-to-1</span>
            </div>
            <p className="text-[11px] font-bold text-emerald-600 mt-1">
              {conversionRate}% Conversion Rate
            </p>
          </div>
        </div>

        {/* Connect Team (Live Dynamic Count) */}
        <div className="bg-white rounded-[28px] border border-slate-200/80 p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Connect Team</span>
            <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-[#111827]">
              {totalTeam} <span className="text-xs font-semibold text-slate-400">members</span>
            </div>
            <p className="text-[11px] font-bold text-slate-500 mt-1">
              {leadersCount} Leaders • {membersCount} Members
            </p>
          </div>
        </div>

        {/* Top Service */}
        <div className="bg-white rounded-[28px] border border-slate-200/80 p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Top Service</span>
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-[#111827] mt-1">
              10AM & 4PM
            </div>
            <p className="text-[11px] font-bold text-amber-600 mt-2">
              Peak attendance times
            </p>
          </div>
        </div>

      </div>

      {/* 3. Recent VIP Logs Container */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-[#111827]">Recent First-Timer Logs</h2>
              <span className="px-2 py-0.5 rounded-full bg-orange-50 text-[#FF6B00] border border-orange-200/60 text-[10px] font-extrabold">
                Live Data
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Direct Sunday service entries & discipleship status
            </p>
          </div>

          <Link
            href="/vips"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-black text-[#FF6B00] hover:bg-orange-50 hover:border-orange-200 transition-all shadow-sm"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile Cards View (Hidden on Desktop) */}
        <div className="md:hidden space-y-3">
          {vips.length === 0 ? (
            <div className="bg-white rounded-[24px] border border-slate-200/80 p-8 text-center text-slate-400 text-xs font-medium">
              No recent VIP records found.
            </div>
          ) : (
            vips.map((item: any) => {
              const isStartedOne2One = Boolean(item.startedOne2One ?? item.startedOne2one);

              return (
                <div
                  key={item._id.toString()}
                  className="bg-white rounded-[24px] border border-slate-200/80 p-4 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`h-9 w-9 rounded-xl flex items-center justify-center font-black text-xs text-white shrink-0 ${
                          item.gender === 1 ? "bg-blue-500 shadow-blue-500/20" : "bg-rose-400 shadow-rose-400/20"
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

                    <span
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold border shrink-0 ${
                        isStartedOne2One
                          ? "bg-emerald-50 text-emerald-600 border-emerald-300"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}
                    >
                      1-to-1: {isStartedOne2One ? "YES" : "NO"}
                    </span>
                  </div>

                  {/* Category Badges */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {item.ageGroup && (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-orange-50 text-[#FF6B00] border border-orange-200/60">
                        {item.ageGroup}
                      </span>
                    )}
                    {item.serviceAttended && (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-600">
                        {item.serviceAttended}
                      </span>
                    )}
                    {item.iam && (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 text-slate-500">
                        {item.iam}
                      </span>
                    )}
                  </div>

                  {/* Approached & Connected */}
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

                  {/* Phone & Messenger */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    {item.contact ? (
                      <div className="flex-1 flex items-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs font-mono">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        {item.contact}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-300 italic px-2">No contact</span>
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
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table View (Hidden on Mobile) */}
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
                  <th className="py-4 px-4 text-center">1-to-1 Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium">
                {vips.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-400 text-xs font-medium">
                      No recent VIP records found.
                    </td>
                  </tr>
                ) : (
                  vips.map((item: any) => {
                    const isStartedOne2One = Boolean(item.startedOne2One ?? item.startedOne2one);

                    return (
                      <tr key={item._id.toString()} className="hover:bg-orange-50/30 transition-colors">
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
                            {item.ageGroup || "N/A"}
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
                          {item.contact ? (
                            <span className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-700">
                              <Phone className="w-3 h-3 text-emerald-600" />
                              {item.contact}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-300 italic">No contact</span>
                          )}
                        </td>

                        <td className="py-4 px-4 text-center">
                          <span
                            className={`inline-block px-3.5 py-1.5 rounded-xl text-xs font-extrabold border ${
                              isStartedOne2One
                                ? "bg-emerald-50 text-emerald-600 border-emerald-300 shadow-sm"
                                : "bg-slate-100 text-slate-500 border-slate-200"
                            }`}
                          >
                            {isStartedOne2One ? "YES" : "NO"}
                          </span>
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

    </div>
  );
}