// src/app/(portal)/connect-team/page.tsx
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { TeamMember, User } from "@/models";
import ConnectTeamClient from "./ConnectTeamClient";
import { ShieldCheck } from "lucide-react";

interface PageProps {
  searchParams: Promise<{
    group?: string;
    status?: string;
    search?: string;
  }>;
}

export default async function ConnectTeamPage({ searchParams }: PageProps) {
  const session = await auth();
  await dbConnect();

  const userRole = String((session?.user as any)?.role || "").toUpperCase();
  const isAdmin = userRole === "ADMIN";
  const isFinanceLeader = userRole === "FINANCE_LEADER";

  const params = await searchParams;
  const query: any = {};

  if (params.group && params.group !== "ALL") {
    query.groupName = params.group;
  }

  if (params.status === "ACTIVE") {
    query.active = true;
  } else if (params.status === "INACTIVE") {
    query.active = false;
  }

  if (params.search) {
    const s = params.search.trim();
    query.$or = [
      { name: { $regex: s, $options: "i" } },
      { nickname: { $regex: s, $options: "i" } },
      { contactNumber: { $regex: s, $options: "i" } },
      { contact: { $regex: s, $options: "i" } }, // Backward compatibility with older records
    ];
  }

  const [members, allMembers, followUpUsersCount, allUsers] = await Promise.all([
    TeamMember.find(query).sort({ groupName: 1, name: 1 }).lean(),
    TeamMember.find({}).lean(),
    User.countDocuments({ role: "FOLLOW_UP_TEAM", isActive: true }),
    User.find({ isActive: true }).select("_id fullName username role").sort({ fullName: 1 }).lean(),
  ]);

  const totalCount = allMembers.length;
  const leadersCount = allMembers.filter((m) => m.groupName === "Team Leaders").length;
  const activeCount = allMembers.filter((m) => m.active).length;

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-600 text-[11px] font-bold">
          <ShieldCheck className="w-3.5 h-3.5" /> Ministry Leadership & Connect Roster
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-[#111827] tracking-tight mt-1.5">
          Connect Team Roster
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          Manage ministry team leaders, members, contact directories, and active status.
        </p>
      </div>

      <ConnectTeamClient
        initialData={JSON.parse(JSON.stringify(members))}
        stats={{
          total: totalCount,
          leaders: leadersCount,
          followUpMinisters: followUpUsersCount,
          active: activeCount,
        }}
        users={JSON.parse(JSON.stringify(allUsers))}
        isAdmin={isAdmin}
        isFinanceLeader={isFinanceLeader}
      />
    </div>
  );
}