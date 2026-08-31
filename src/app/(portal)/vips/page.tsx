// src/app/(portal)/vips/page.tsx
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { FirstTimer, TeamMember } from "@/models";
import VipsTableClient from "./VipsTableClient";
import { Sparkles } from "lucide-react";

interface PageProps {
  searchParams: Promise<{
    month?: string;
    year?: string;
    ageGroup?: string;
    service?: string;
    status?: string;
    search?: string;
  }>;
}

export default async function VipsPage({ searchParams }: PageProps) {
  const session = await auth();
  await dbConnect();

  const user = session?.user as any;
  const userRole = String(user?.role || "").toUpperCase();

  const isAdmin = userRole === "ADMIN";
  const canExportPdf = isAdmin || userRole === "TEAM_LEADER" || userRole === "TEAM LEADER";

  const params = await searchParams;
  const now = new Date();
  
  const parsedYear = params.year ? parseInt(params.year, 10) : NaN;
  const parsedMonth = params.month ? parseInt(params.month, 10) : NaN;

  const selectedYear = !isNaN(parsedYear) ? parsedYear : now.getFullYear();
  const selectedMonth = !isNaN(parsedMonth) ? parsedMonth : now.getMonth() + 1;

  const startOfMonth = new Date(selectedYear, selectedMonth - 1, 1, 0, 0, 0, 0);
  const endOfMonth = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999);

  const query: any = {
    createdAt: { $gte: startOfMonth, $lte: endOfMonth },
  };

  if (params.ageGroup && params.ageGroup !== "ALL") {
    query.ageGroup = params.ageGroup;
  }

  if (params.service && params.service !== "ALL") {
    query.serviceAttended = params.service;
  }

  if (params.status === "UNTEXTED") {
    query.textedAlready = { $ne: true };
  } else if (params.status === "TEXTED") {
    query.textedAlready = true;
  } else if (params.status === "DISCIPLESHIP_YES") {
    query.startedOne2One = true;
  } else if (params.status === "DISCIPLESHIP_NO") {
    query.startedOne2One = { $ne: true };
  }

  if (params.search) {
    const s = params.search.trim();
    query.$or = [
      { fullName: { $regex: s, $options: "i" } },
      { contact: { $regex: s, $options: "i" } },
      { approachedBy: { $regex: s, $options: "i" } },
      { connectedWith: { $regex: s, $options: "i" } },
      { followedUpBy: { $regex: s, $options: "i" } },
    ];
  }

  const [vips, totalInMonth, teamMembers] = await Promise.all([
    FirstTimer.find(query).sort({ createdAt: -1 }).lean(),
    FirstTimer.countDocuments({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } }),
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
            Filter by month and age bracket, broadcast SMS, and track One2One discipleship.
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