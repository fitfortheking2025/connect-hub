
import { redirect } from "next/navigation";
import dbConnect from "@/lib/mongodb";
import { User, TeamMember } from "@/models";;
import { ShieldCheck, UserCheck, KeyRound, Clock } from "lucide-react";
import CreateUserModal from "./CreateUserModal";
import { auth } from "@/lib/auth";

export default async function AdminUsersPage() {
  const session = await auth();
  const userRole = (session?.user as any)?.role;

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
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-[#FF6B00] text-[11px] font-bold">
            <KeyRound className="w-3.5 h-3.5" /> Security & Account Provisioning
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-[#111827] tracking-tight mt-1.5">
            Ministry Leader Accounts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Manage system access for Team Leaders and Follow-Up Team ministers.
          </p>
        </div>

        {/* Trigger Modal to Create User */}
        <CreateUserModal teamMembers={JSON.parse(JSON.stringify(teamMembers))} />
      </div>

      {/* Users Roster Table */}
      <div className="bg-white rounded-[32px] border border-slate-200/80 shadow-xl shadow-slate-200/40 overflow-hidden">
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
              {users.map((u: any) => (
                <tr key={u._id.toString()} className="hover:bg-orange-50/30 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#FF6B00] to-amber-400 text-white font-bold flex items-center justify-center text-xs shadow-sm shadow-orange-500/20">
                        {u.fullName?.charAt(0) || "U"}
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
                      <ShieldCheck className="w-3 h-3" />
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

                  <td className="py-4 px-6 text-xs text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(u.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
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