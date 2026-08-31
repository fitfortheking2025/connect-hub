// src/app/(portal)/admin/users/page.tsx
import { redirect } from "next/navigation";
import dbConnect from "@/lib/mongodb";
import { User, TeamMember } from "@/models";
import { ShieldCheck, UserCheck, KeyRound, Clock, AtSign, Shield } from "lucide-react";
import CreateUserModal from "./CreateUserModal";
import { auth } from "@/lib/auth";

export default async function AdminUsersPage() {
  const session = await auth();
  const user = session?.user as any;
  const userRole = String(user?.role || "").toUpperCase();

  // Strict Admin Gate
  if (userRole !== "ADMIN") {
    redirect("/");
  }

  await dbConnect();

  // Load all users and active team members
  const [users, teamMembers] = await Promise.all([
    User.find({ role: { $in: ["ADMIN", "TEAM_LEADER", "FOLLOW_UP_TEAM"] } })
      .populate("teamMemberId", "name groupName")
      .sort({ createdAt: -1 })
      .lean(),
    TeamMember.find({ active: true }).select("_id name groupName").sort({ name: 1 }).lean(),
  ]);

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-[#FF6B00] text-[10px] sm:text-[11px] font-bold">
            <KeyRound className="w-3 h-3" /> Security & Access
          </div>
          <h1 className="text-xl sm:text-3xl font-black text-[#111827] tracking-tight mt-1">
            Leader <span className="text-[#FF6B00]">Accounts</span>
          </h1>
        </div>

        {/* Trigger Modal to Create User */}
        <CreateUserModal teamMembers={JSON.parse(JSON.stringify(teamMembers))} />
      </div>

      {/* 1. Mobile Cards View */}
      <div className="md:hidden space-y-2.5">
        {users.length === 0 ? (
          <div className="bg-white rounded-[20px] border border-slate-200/80 p-8 text-center text-slate-400 text-xs font-medium">
            No leader accounts found.
          </div>
        ) : (
          users.map((u: any) => {
            const roleFormatted = u.role ? u.role.replace("_", " ") : "MINISTER";

            return (
              <div
                key={u._id.toString()}
                className="bg-white rounded-[20px] border border-slate-200/80 p-3.5 shadow-sm space-y-2.5"
              >
                {/* Header: Avatar, Name, Created Date & Role Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-[#FF6B00] to-amber-400 text-white font-black flex items-center justify-center text-xs shadow-sm shadow-orange-500/20 shrink-0">
                      {u.fullName?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-[#111827] leading-tight">
                        {u.fullName}
                      </h3>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {new Date(u.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  </div>

                  {/* System Role Badge */}
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-extrabold border shrink-0 ${
                      u.role === "ADMIN"
                        ? "bg-rose-50 text-rose-600 border-rose-200/60"
                        : u.role === "TEAM_LEADER"
                        ? "bg-orange-50 text-[#FF6B00] border-orange-200/60"
                        : "bg-blue-50 text-blue-600 border-blue-200/60"
                    }`}
                  >
                    <Shield className="w-2.5 h-2.5" />
                    {roleFormatted}
                  </span>
                </div>

                {/* Linked Roster Details Card */}
                <div className="text-xs text-slate-600 bg-slate-50/80 rounded-xl p-2 border border-slate-100 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Linked Minister</span>
                    {u.teamMemberId ? (
                      <span className="font-extrabold text-[#111827] flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-emerald-600" />
                        {u.teamMemberId.name}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic text-[10px]">Not Linked</span>
                    )}
                  </div>
                  {u.teamMemberId?.groupName && (
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold pt-1 border-t border-slate-200/60">
                      <span className="uppercase font-bold text-slate-400 text-[9px]">Group:</span>
                      <span>{u.teamMemberId.groupName}</span>
                    </div>
                  )}
                </div>

                {/* Username Bottom Row */}
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <div className="flex-1 flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl bg-slate-100 text-slate-700 font-mono font-bold text-xs">
                    <AtSign className="w-3 h-3 text-[#FF6B00]" />
                    {u.username}
                  </div>

                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/60 text-[10px] font-extrabold shrink-0">
                    Active
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 2. Desktop Data Table */}
      <div className="hidden md:block bg-white rounded-[32px] border border-slate-200/80 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-4 px-6">User / Minister</th>
                <th className="py-4 px-6">Username</th>
                <th className="py-4 px-6">System Role</th>
                <th className="py-4 px-6">Linked Roster</th>
                <th className="py-4 px-6">Date Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400 text-xs font-medium">
                    No leader accounts found.
                  </td>
                </tr>
              ) : (
                users.map((u: any) => (
                  <tr key={u._id.toString()} className="hover:bg-orange-50/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#FF6B00] to-amber-400 text-white font-bold flex items-center justify-center text-xs shadow-sm shadow-orange-500/20">
                          {u.fullName?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div>
                          <div className="font-extrabold text-[#111827]">{u.fullName}</div>
                          <span className="text-[11px] text-slate-400">Account Active</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6 font-mono text-xs font-bold text-slate-700">
                      @{u.username}
                    </td>

                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-extrabold ${
                          u.role === "ADMIN"
                            ? "bg-rose-50 text-rose-600 border border-rose-200/60"
                            : u.role === "TEAM_LEADER"
                            ? "bg-orange-50 text-[#FF6B00] border border-orange-200/60"
                            : "bg-blue-50 text-blue-600 border border-blue-200/60"
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {u.role.replace("_", " ")}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-xs">
                      {u.teamMemberId ? (
                        <span className="inline-flex items-center gap-1.5 text-slate-700 font-bold">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                          {u.teamMemberId.name}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Not Linked</span>
                      )}
                    </td>

                    <td className="py-4 px-6 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(u.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}