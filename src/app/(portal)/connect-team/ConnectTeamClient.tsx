"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Search, 
  ShieldCheck, 
  Users, 
  UserCheck, 
  Phone, 
  Plus, 
  Pencil, 
  CheckCircle2, 
  XCircle,
  X,
  Loader2,
  Lock
} from "lucide-react";
import { 
  createTeamMemberAction, 
  updateTeamMemberAction, 
  toggleMemberActiveStatusAction 
} from "@/app/actions/teamMemberActions";

interface ConnectTeamClientProps {
  initialData: any[];
  stats: {
    total: number;
    leaders: number;
    followUpMinisters: number;
    active: number;
  };
  users?: any[];
  isAdmin?: boolean;
}

export default function ConnectTeamClient({
  initialData,
  stats,
  users = [],
  isAdmin = false,
}: ConnectTeamClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedGroup, setSelectedGroup] = useState(searchParams.get("group") || "ALL");

  // Modal State
  const [modalMode, setModalMode] = useState<"ADD" | "EDIT" | null>(null);
  const [activeItem, setActiveItem] = useState<any>(null);
  const [formName, setFormName] = useState("");
  const [formGroup, setFormGroup] = useState<"Team Leaders" | "Members">("Members");
  const [formContact, setFormContact] = useState("");
  const [formAssignedUserId, setFormAssignedUserId] = useState<string>("");
  const [formActive, setFormActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const updateFilters = (grp: string, term: string) => {
    const params = new URLSearchParams();
    if (grp !== "ALL") params.set("group", grp);
    if (term.trim()) params.set("search", term.trim());

    startTransition(() => {
      router.push(`/connect-team?${params.toString()}`);
    });
  };

  const handleOpenAdd = () => {
    if (!isAdmin) return;
    setActiveItem(null);
    setFormName("");
    setFormGroup("Members");
    setFormContact("");
    setFormAssignedUserId("");
    setFormActive(true);
    setFormError(null);
    setModalMode("ADD");
  };

  const handleOpenEdit = (member: any) => {
    if (!isAdmin) return;
    setActiveItem(member);
    setFormName(member.name || "");
    setFormGroup(member.groupName === "Team Leaders" ? "Team Leaders" : "Members");
    setFormContact(member.contact || "");
    setFormAssignedUserId(member.assignedUserId ? String(member.assignedUserId) : "");
    setFormActive(member.active ?? true);
    setFormError(null);
    setModalMode("EDIT");
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError("Name is required.");
      return;
    }

    startTransition(async () => {
      if (modalMode === "ADD") {
        const res = await createTeamMemberAction({
          name: formName,
          groupName: formGroup,
          contact: formContact,
          assignedUserId: formAssignedUserId || null,
          active: formActive,
        });
        if (res.success) {
          setData((prev) => [...prev, res.member]);
          setModalMode(null);
          router.refresh();
        } else {
          setFormError(res.error || "Failed to add member.");
        }
      } else if (modalMode === "EDIT" && activeItem) {
        const res = await updateTeamMemberAction({
          id: activeItem._id,
          name: formName,
          groupName: formGroup,
          contact: formContact,
          assignedUserId: formAssignedUserId || null,
          active: formActive,
        });
        if (res.success) {
          setData((prev) =>
            prev.map((m) => (m._id === activeItem._id ? res.member : m))
          );
          setModalMode(null);
          router.refresh();
        } else {
          setFormError(res.error || "Failed to update member.");
        }
      }
    });
  };

  const handleToggleStatus = (id: string, currentStatus: boolean) => {
    if (!isAdmin) return;
    setData((prev) =>
      prev.map((m) => (m._id === id ? { ...m, active: !currentStatus } : m))
    );

    startTransition(async () => {
      await toggleMemberActiveStatusAction(id, currentStatus);
      router.refresh();
    });
  };

  return (
    <div className="space-y-5">
      
      {/* 1. Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-[24px] border border-slate-200/80 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Total Team</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#111827] mt-1">{stats.total}</div>
          <p className="text-[11px] font-semibold text-emerald-600 mt-0.5">{stats.active} Active ministers</p>
        </div>

        <div className="bg-white rounded-[24px] border border-slate-200/80 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Team Leaders</span>
            <div className="p-2 rounded-xl bg-orange-50 text-[#FF6B00]">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#111827] mt-1">{stats.leaders}</div>
          <p className="text-[11px] font-semibold text-slate-400 mt-0.5">Ministry Leaders</p>
        </div>

        <div className="bg-white rounded-[24px] border border-slate-200/80 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Follow-Up Ministers</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#111827] mt-1">{stats.followUpMinisters}</div>
          <p className="text-[11px] font-semibold text-indigo-600 mt-0.5">Active Portal Staff</p>
        </div>

        <div className="bg-white rounded-[24px] border border-slate-200/80 p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">
              {isAdmin ? "Admin Controls" : "Access Level"}
            </span>
            {!isAdmin && <Lock className="w-3.5 h-3.5 text-slate-400" />}
          </div>
          {isAdmin ? (
            <button
              onClick={handleOpenAdd}
              className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-[#FF6B00] hover:bg-[#e05e00] text-white text-xs font-black transition-all shadow-md shadow-orange-500/20"
            >
              <Plus className="w-4 h-4" /> Add Minister
            </button>
          ) : (
            <div className="py-2 px-3 rounded-2xl bg-slate-100 text-slate-500 font-bold text-xs text-center">
              View Only
            </div>
          )}
        </div>
      </div>

      {/* 2. Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedGroup("ALL");
              updateFilters("ALL", search);
            }}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition-all ${
              selectedGroup === "ALL"
                ? "bg-slate-800 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
            }`}
          >
            All Roles
          </button>
          <button
            onClick={() => {
              setSelectedGroup("Team Leaders");
              updateFilters("Team Leaders", search);
            }}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition-all ${
              selectedGroup === "Team Leaders"
                ? "bg-slate-800 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
            }`}
          >
            Team Leaders ({stats.leaders})
          </button>
          <button
            onClick={() => {
              setSelectedGroup("Members");
              updateFilters("Members", search);
            }}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition-all ${
              selectedGroup === "Members"
                ? "bg-slate-800 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
            }`}
          >
            Members ({stats.total - stats.leaders})
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateFilters(selectedGroup, search);
          }}
          className="relative min-w-[240px]"
        >
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search minister name, phone..."
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200/80 text-xs sm:text-sm font-medium text-[#111827] placeholder-slate-400 focus:outline-none focus:border-[#FF6B00] shadow-sm"
          />
        </form>
      </div>

      {/* 3. Mobile Cards View */}
      <div className="md:hidden space-y-3">
        {data.length === 0 ? (
          <div className="bg-white rounded-[24px] border border-slate-200/80 p-8 text-center text-slate-400 text-xs font-medium">
            No team members found matching your search.
          </div>
        ) : (
          data.map((member: any) => {
            const isLeader = member.groupName === "Team Leaders";

            return (
              <div
                key={member._id}
                className="bg-white rounded-[24px] border border-slate-200/80 p-4 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-2xl flex items-center justify-center font-black text-xs text-white shadow-sm ${
                        isLeader
                          ? "bg-gradient-to-br from-amber-500 to-orange-500 shadow-orange-500/20"
                          : "bg-slate-700"
                      }`}
                    >
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-[#111827]">{member.name}</h3>
                      <div className="mt-0.5">
                        <span
                          className={`text-[10px] font-black px-2.5 py-0.5 rounded-lg ${
                            isLeader
                              ? "bg-orange-50 text-[#FF6B00] border border-orange-200/60"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {member.groupName || "Members"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => handleOpenEdit(member)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-orange-50 text-slate-500 hover:text-[#FF6B00] transition-colors"
                      title="Edit Member (Admin)"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                  {member.contact ? (
                    <a
                      href={`tel:${member.contact}`}
                      className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-700 hover:text-emerald-600"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      {member.contact}
                    </a>
                  ) : (
                    <span className="text-xs text-slate-300 italic">No contact</span>
                  )}

                  <button
                    onClick={() => handleToggleStatus(member._id, member.active)}
                    disabled={isPending || !isAdmin}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                      member.active
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                        : "bg-rose-50 text-rose-500 border border-rose-200"
                    } ${!isAdmin ? "cursor-default opacity-80" : ""}`}
                  >
                    {member.active ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" /> Active
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" /> Inactive
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. Desktop Data Table */}
      <div className="hidden md:block bg-white rounded-[32px] border border-slate-200/80 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-4 px-6">Minister Name</th>
                <th className="py-4 px-6">Role / Group</th>
                <th className="py-4 px-6">Contact Number</th>
                <th className="py-4 px-4 text-center">Status</th>
                {isAdmin && <th className="py-4 px-4 text-center">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className="py-16 text-center text-slate-400 text-xs font-medium">
                    No team members match your criteria.
                  </td>
                </tr>
              ) : (
                data.map((member: any) => {
                  const isLeader = member.groupName === "Team Leaders";

                  return (
                    <tr key={member._id} className="hover:bg-blue-50/20 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-9 w-9 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-sm ${
                              isLeader
                                ? "bg-gradient-to-br from-amber-500 to-orange-500 shadow-orange-500/20"
                                : "bg-slate-700"
                            }`}
                          >
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-extrabold text-[#111827]">{member.name}</span>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <span
                          className={`px-3 py-1 rounded-xl text-xs font-black ${
                            isLeader
                              ? "bg-orange-50 text-[#FF6B00] border border-orange-200/60"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {member.groupName || "Members"}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        {member.contact ? (
                          <a
                            href={`tel:${member.contact}`}
                            className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-700 hover:text-emerald-600"
                          >
                            <Phone className="w-3 h-3 text-emerald-600" />
                            {member.contact}
                          </a>
                        ) : (
                          <span className="text-[11px] text-slate-300 italic">No contact</span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(member._id, member.active)}
                          disabled={isPending || !isAdmin}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                            member.active
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                              : "bg-rose-50 text-rose-500 border border-rose-200"
                          } ${!isAdmin ? "cursor-default opacity-80" : ""}`}
                        >
                          {member.active ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" /> Active
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" /> Inactive
                            </>
                          )}
                        </button>
                      </td>

                      {isAdmin && (
                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={() => handleOpenEdit(member)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-orange-50 text-slate-500 hover:text-[#FF6B00] transition-colors"
                            title="Edit Member (Admin)"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Add / Edit Member Modal (Admin Only) */}
      {modalMode && isAdmin && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-[28px] border border-slate-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-orange-50 text-[#FF6B00]">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="font-black text-lg text-[#111827]">
                  {modalMode === "ADD" ? "Add New Minister" : "Edit Minister"}
                </h3>
              </div>
              <button
                onClick={() => setModalMode(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-600">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveModal} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Full Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Bro. Cris"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-[#111827] focus:outline-none focus:border-[#FF6B00]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Role / Group</label>
                  <select
                    value={formGroup}
                    onChange={(e) => setFormGroup(e.target.value as "Team Leaders" | "Members")}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#FF6B00]"
                  >
                    <option value="Members">Members</option>
                    <option value="Team Leaders">Team Leaders</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Linked Portal Account</label>
                  <select
                    value={formAssignedUserId}
                    onChange={(e) => setFormAssignedUserId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#FF6B00]"
                  >
                    <option value="">None (Unlinked)</option>
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.fullName || u.username} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Contact Number</label>
                <input
                  type="text"
                  value={formContact}
                  onChange={(e) => setFormContact(e.target.value)}
                  placeholder="0917XXXXXXX"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#FF6B00]"
                />
              </div>

              <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  className="w-4 h-4 rounded text-[#FF6B00] focus:ring-[#FF6B00]"
                />
                <span className="text-xs font-bold text-slate-700">Active Minister</span>
              </label>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="w-1/3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-2/3 py-2.5 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-extrabold text-xs shadow-md shadow-orange-500/20 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Minister"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}