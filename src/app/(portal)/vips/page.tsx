import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { FirstTimer, TeamMember, User } from "@/models";
import VipsTableClient from "./VipsTableClient";
import { Sparkles } from "lucide-react";
import { getVipScopeFilter } from "@/lib/vipScope";

interface PageProps {
  searchParams: Promise<{
    month?: string;
    year?: string;
    service?: string;
    status?: string;
    search?: string;
  }>;
}

export default async function VipsPage({ searchParams }: PageProps) {
  const session = await auth();
  await dbConnect();

  const sessionUser = session?.user as any;
  const userRole = String(sessionUser?.role || "").toUpperCase().replace(/[\s-]+/g, "_");

  const isAdmin = userRole === "ADMIN";
  const isTeamLeader = userRole === "TEAM_LEADER";
  const canExportPdf = isAdmin || isTeamLeader;

  // 1. Fetch current user from DB to get their latest dynamic demographic scope
  const currentUser = await User.findById(sessionUser?.id || sessionUser?._id).lean();

  const scopeFilter = getVipScopeFilter({
    role: currentUser?.role || userRole,
    assignedAgeGroups: currentUser?.assignedAgeGroups || [],
    assignedGender: currentUser?.assignedGender,
  });

  const params = await searchParams;
  const now = new Date();
  
  const parsedYear = params.year ? parseInt(params.year, 10) : NaN;
  const parsedMonth = params.month ? parseInt(params.month, 10) : NaN;

  const selectedYear = !isNaN(parsedYear) ? parsedYear : now.getFullYear();
  const selectedMonth = !isNaN(parsedMonth) ? parsedMonth : now.getMonth() + 1;

  const startOfMonth = new Date(selectedYear, selectedMonth - 1, 1, 0, 0, 0, 0);
  const endOfMonth = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999);

  // 2. Build URL param filters (age group filtering is handled by demographic scoping)
  const paramFilter: any = {
    createdAt: { $gte: startOfMonth, $lte: endOfMonth },
  };

  if (params.service && params.service !== "ALL") {
    paramFilter.serviceAttended = params.service;
  }

  if (params.status === "UNTEXTED") {
    paramFilter.textedAlready = { $ne: true };
  } else if (params.status === "TEXTED") {
    paramFilter.textedAlready = true;
  } else if (params.status === "DISCIPLESHIP_YES") {
    paramFilter.startedOne2One = true;
  } else if (params.status === "DISCIPLESHIP_NO") {
    paramFilter.startedOne2One = { $ne: true };
  }

  if (params.search) {
    const s = params.search.trim();
    paramFilter.$or = [
      { fullName: { $regex: s, $options: "i" } },
      { contact: { $regex: s, $options: "i" } },
      { approachedBy: { $regex: s, $options: "i" } },
      { connectedWith: { $regex: s, $options: "i" } },
      { followedUpBy: { $regex: s, $options: "i" } },
    ];
  }

  // 3. Combine URL filters with user's demographic scope
  const finalQuery: any = {
    $and: [
      scopeFilter,
      paramFilter,
    ],
  };

  const monthCountQuery: any = {
    $and: [
      scopeFilter,
      { createdAt: { $gte: startOfMonth, $lte: endOfMonth } },
    ],
  };

  const [vips, totalInMonth, teamMembers] = await Promise.all([
    FirstTimer.find(finalQuery).sort({ createdAt: -1 }).lean(),
    FirstTimer.countDocuments(monthCountQuery),
    TeamMember.find({ active: true }).select("_id name groupName").sort({ name: 1 }).lean(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-[#FF6B00] text-[11px] font-bold">
            <Sparkles className="w-3.5 h-3.5" /> Follow-Up Team Ministry
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-[#111827] tracking-tight mt-1.5">
            VIPs & First-Timers
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Review your assigned demographic focus, broadcast welcome SMS, and track One2One discipleship.
          </p>
        </div>
      </div>

      <VipsTableClient
        initialData={JSON.parse(JSON.stringify(vips))}
        totalInMonth={totalInMonth}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        teamMembers={JSON.parse(JSON.stringify(teamMembers))}
        canExportPdf={canExportPdf}
        canEditCoreDetails={canExportPdf}
        isAdmin={isAdmin}
      />
    </div>
  );
}