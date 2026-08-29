import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { FirstTimer, TeamMember } from "@/models";
import FirstTimersTableClient from "./FirstTimersTableClient";
import { Sparkles } from "lucide-react";

interface PageProps {
  searchParams: Promise<{
    month?: string;
    year?: string;
    service?: string;
    search?: string;
  }>;
}

export default async function FirstTimersPage({ searchParams }: PageProps) {
  await auth();
  await dbConnect();

  const params = await searchParams;
  const now = new Date();
  const selectedYear = parseInt(params.year || String(now.getFullYear()), 10);
  const selectedMonth = parseInt(params.month || String(now.getMonth() + 1), 10); // 1-indexed

  // Month Date Range
  const startOfMonth = new Date(selectedYear, selectedMonth - 1, 1);
  const endOfMonth = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999);

  const query: any = {
    createdAt: { $gte: startOfMonth, $lte: endOfMonth },
  };

  if (params.service && params.service !== "ALL") {
    query.serviceAttended = params.service;
  }

  if (params.search) {
    const s = params.search.trim();
    query.$or = [
      { fullName: { $regex: s, $options: "i" } },
      { contact: { $regex: s, $options: "i" } },
      { approachedBy: { $regex: s, $options: "i" } },
      { messenger: { $regex: s, $options: "i" } },
    ];
  }

  const [firstTimers, totalInMonth, teamMembers] = await Promise.all([
    FirstTimer.find(query).sort({ createdAt: -1 }).lean(),
    FirstTimer.countDocuments({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } }),
    TeamMember.find({ active: true }).select("_id name groupName").sort({ name: 1 }).lean(),
  ]);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-[#FF6B00] text-[11px] font-bold">
            <Sparkles className="w-3.5 h-3.5" /> First-Timer Ministry Roster
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-[#111827] tracking-tight mt-1.5">
            Sunday Visitors & Follow-Up
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Track visitors, Sunday service attendance, and 1-on-1 discipleship connections.
          </p>
        </div>
      </div>

      {/* Interactive Table with Month Selector & Quick Filters */}
      <FirstTimersTableClient
        initialData={JSON.parse(JSON.stringify(firstTimers))}
        totalInMonth={totalInMonth}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        teamMembers={JSON.parse(JSON.stringify(teamMembers))}
      />

    </div>
  );
}