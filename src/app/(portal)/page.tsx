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
  Download
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
      
      {/* Header Banner */}
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

      {/* Metric Cards */}
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

      {/* Recent First-Timer Logs Section */}
      <div className="bg-white rounded-[32px] border border-slate-200/80 shadow-xl shadow-slate-200/40 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-[#111827]">Recent First-Timer Logs</h2>
              <span className="px-2 py-0.5 rounded-full bg-orange-50 text-[#FF6B00] border border-orange-200/60 text-[10px] font-bold">
                Live Data
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Direct Sunday service entries & discipleship status
            </p>
          </div>

          <Link
            href="/vips"
            className="text-xs font-bold text-[#FF6B00] hover:text-[#e05e00] transition-colors"
          >
            View All →
          </Link>
        </div>

        {/* Desktop Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="pb-3 px-3">Visitor</th>
                <th className="pb-3 px-3">Category</th>
                <th className="pb-3 px-3">Service</th>
                <th className="pb-3 px-3">Approached By</th>
                <th className="pb-3 px-3">Contact & Reach</th>
                <th className="pb-3 px-3 text-right">Discipleship Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {vips.map((item: any) => (
                <tr key={item._id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-extrabold text-[#111827]">{item.fullName}</div>
                    <div className="text-[10px] text-slate-400">
                      {item.ageGroup} • {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-600 font-extrabold text-[10px]">
                      {item.iam}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-bold text-[10px]">
                      {item.serviceAttended}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-bold text-[#111827]">
                    {item.approachedBy}
                  </td>
                  <td className="py-3 px-3">
                    {item.contact ? (
                      <span className="font-mono text-slate-600 flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-orange-500" /> {item.contact}
                      </span>
                    ) : (
                      <span className="text-slate-300 italic">No contact</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span
                      className={`inline-block px-3 py-1 rounded-xl font-extrabold text-[11px] ${
                        item.startedOne2One
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {item.startedOne2One ? "✓ One-to-One" : "+ Start 1-to-1"}
                    </span>
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