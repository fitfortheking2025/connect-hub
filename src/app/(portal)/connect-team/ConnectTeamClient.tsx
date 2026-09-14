// src/app/(portal)/connect-team/ConnectTeamClient.tsx
"use client";

import { useState, useTransition, useEffect, ChangeEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
  Activity,
  UploadCloud,
  Mail,
  Award,
  Link2,
  Check,
  GraduationCap,
  CircleDollarSign,
  CalendarCheck,
  CreditCard
} from "lucide-react";
import { 
  createTeamMemberAction, 
  updateTeamMemberAction, 
  toggleMemberActiveStatusAction 
} from "@/app/actions/teamMemberActions";
import {
  getMemberContributionHistoryAction,
  recordContributionAction
} from "@/app/actions/contributionActions";

const DISCIPLESHIP_CLASSES = [
  "One2One",
  "Spiritual Family Class",
  "River Encounter",
  "Making Disciples",
  "Empowering Leaders",
  "Prophetic & Supernatural Level 1",
];

const MONTH_NAMES = [
  "",
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

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
  isFinanceLeader?: boolean;
}

export default function ConnectTeamClient({
  initialData,
  stats,
  users = [],
  isAdmin = false,
  isFinanceLeader = false,
}: ConnectTeamClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedGroup, setSelectedGroup] = useState(searchParams.get("group") || "ALL");

  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal Navigation
  const [modalMode, setModalMode] = useState<"ADD" | "EDIT" | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "discipleship" | "contributions">("info");
  const [activeItem, setActiveItem] = useState<any>(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formNickname, setFormNickname] = useState("");
  const [formGender, setFormGender] = useState<"Male" | "Female">("Male");
  const [formBirthdate, setFormBirthdate] = useState("");
  const [formContactNumber, setFormContactNumber] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formSocialMedia, setFormSocialMedia] = useState("");
  const [formGroup, setFormGroup] = useState<"Team Leaders" | "Follow Up Team" | "Members">("Members");
  const [formAssignedUserId, setFormAssignedUserId] = useState<string>("");
  const [formActive, setFormActive] = useState(true);

  // Discipleship
  const [formDiscipler, setFormDiscipler] = useState("");
  const [formDisciples, setFormDisciples] = useState("");
  const [formClasses, setFormClasses] = useState<string[]>([]);
  const [formIsPartOfOutreach, setFormIsPartOfOutreach] = useState(false);

  // Photo
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [base64Photo, setBase64Photo] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Contribution State
  const [contribHistory, setContribHistory] = useState<any[]>([]);
  const [latestPaid, setLatestPaid] = useState<{ year: number; month: number } | null>(null);
  const [nextDue, setNextDue] = useState<{ year: number; month: number }>({ year: 2026, month: 10 });
  const [contribAmount, setContribAmount] = useState<number>(100);
  const [contribMethod, setContribMethod] = useState<"CASH" | "GCASH" | "BANK_TRANSFER" | "OTHER">("CASH");
  const [contribNotes, setContribNotes] = useState("");
  const [contribLoading, setContribLoading] = useState(false);
  const [contribSuccessMsg, setContribSuccessMsg] = useState<string | null>(null);

  const canEditMember = isAdmin || isFinanceLeader;

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

  const handleCopyLink = (member: any) => {
    const targetCode = member.updateCode || member._id;
    if (!targetCode) return;
    const url = `${window.location.origin}/connect-member/${targetCode}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(targetCode);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handlePhotoSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (!isAdmin) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setFormError("File size exceeds 8MB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setPhotoPreview(result);
      setBase64Photo(result);
    };
    reader.readAsDataURL(file);
  };

  const loadContributions = async (memberId: string) => {
    setContribLoading(true);
    setContribSuccessMsg(null);
    const res = await getMemberContributionHistoryAction(memberId);
    if (res.success) {
      setContribHistory(res.history || []);
      if (res.latestPaid && typeof res.latestPaid.year === "number" && typeof res.latestPaid.month === "number") {
        setLatestPaid({ year: res.latestPaid.year, month: res.latestPaid.month });
      } else {
        setLatestPaid(null);
      }
      if (res.nextDue) setNextDue(res.nextDue);
    }
    setContribLoading(false);
  };

  const handleOpenAdd = () => {
    if (!isAdmin) return;
    setActiveItem(null);
    setFormName("");
    setFormNickname("");
    setFormGender("Male");
    setFormBirthdate("");
    setFormContactNumber("");
    setFormEmail("");
    setFormSocialMedia("");
    setFormGroup("Members");
    setFormAssignedUserId("");
    setFormActive(true);
    setFormDiscipler("");
    setFormDisciples("");
    setFormClasses([]);
    setFormIsPartOfOutreach(false);
    setPhotoPreview(null);
    setBase64Photo(null);
    setFormError(null);
    setActiveTab("info");
    setModalMode("ADD");
  };

  const handleOpenEdit = (member: any) => {
    if (!canEditMember) return;
    setActiveItem(member);
    setFormName(member.name || "");
    setFormNickname(member.nickname || "");
    setFormGender(member.gender || "Male");
    setFormBirthdate(member.birthdate ? new Date(member.birthdate).toISOString().split("T")[0] : "");
    setFormContactNumber(member.contactNumber || member.contact || "");
    setFormEmail(member.email || "");
    setFormSocialMedia(member.socialMedia || "");
    setFormGroup(member.groupName || "Members");
    setFormAssignedUserId(member.assignedUserId ? String(member.assignedUserId) : "");
    setFormActive(member.active ?? true);
    setFormDiscipler(member.discipler || "");
    setFormDisciples((member.disciples || []).join("\n"));
    setFormClasses(member.discipleshipClasses || []);
    setFormIsPartOfOutreach(member.isPartOfOutreach || false);
    setPhotoPreview(member.photoUrl || null);
    setBase64Photo(null);
    setFormError(null);
    setContribAmount(100);
    setContribNotes("");
    setContribSuccessMsg(null);

    if (isFinanceLeader && !isAdmin) {
      setActiveTab("contributions");
    } else {
      setActiveTab("info");
    }

    setModalMode("EDIT");
    loadContributions(member._id);
  };

  const toggleClassCheckbox = (clsName: string) => {
    if (!isAdmin) return;
    setFormClasses((prev) =>
      prev.includes(clsName) ? prev.filter((c) => c !== clsName) : [...prev, clsName]
    );
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!formName.trim()) {
      setFormError("Full Name is required.");
      return;
    }

    const disciplesArray = formDisciples
      .split("\n")
      .map((d) => d.trim())
      .filter(Boolean);

    startTransition(async () => {
      const payload = {
        name: formName,
        nickname: formNickname,
        gender: formGender,
        birthdate: formBirthdate || undefined,
        contactNumber: formContactNumber,
        email: formEmail,
        socialMedia: formSocialMedia,
        base64Photo: base64Photo || undefined,
        groupName: formGroup,
        assignedUserId: formAssignedUserId || null,
        active: formActive,
        discipler: formDiscipler,
        disciples: disciplesArray,
        discipleshipClasses: formClasses,
        isPartOfOutreach: formIsPartOfOutreach,
      };

      if (modalMode === "ADD") {
        const res = await createTeamMemberAction(payload);
        if (res.success) {
          setData((prev) => [...prev, res.member]);
          setModalMode(null);
          router.refresh();
        } else {
          setFormError(res.error || "Failed to add member.");
        }
      } else if (modalMode === "EDIT" && activeItem) {
        const res = await updateTeamMemberAction({ ...payload, id: activeItem._id });
        if (res.success) {
          setData((prev) => prev.map((m) => (m._id === activeItem._id ? res.member : m)));
          setModalMode(null);
          router.refresh();
        } else {
          setFormError(res.error || "Failed to update member.");
        }
      }
    });
  };

  const calculateCoveredMonths = (amount: number, startYear: number, startMonth: number) => {
    if (amount < 100 || amount % 100 !== 0) return [];
    const count = amount / 100;
    const months = [];
    let curYear = startYear;
    let curMonth = startMonth;

    for (let i = 0; i < count; i++) {
      months.push({ year: curYear, month: curMonth });
      if (curMonth === 12) {
        curYear += 1;
        curMonth = 1;
      } else {
        curMonth += 1;
      }
    }
    return months;
  };

  const projectedMonths = calculateCoveredMonths(contribAmount, nextDue.year, nextDue.month);

  const handleRecordContribution = () => {
    if (!activeItem || contribAmount < 100 || contribAmount % 100 !== 0) {
      setFormError("Amount must be a valid multiple of ₱100.");
      return;
    }
    setFormError(null);
    setContribSuccessMsg(null);

    startTransition(async () => {
      const res = await recordContributionAction({
        memberId: activeItem._id,
        amount: contribAmount,
        paymentMethod: contribMethod,
        notes: contribNotes,
      });

      if (res.success && res.endPeriod) {
        setContribSuccessMsg(
          `Recorded ₱${contribAmount} successfully! Covered through ${MONTH_NAMES[res.endPeriod.month]} ${res.endPeriod.year}.`
        );
        setContribNotes("");
        await loadContributions(activeItem._id);
        router.refresh();
      } else {
        setFormError(res.error || "Failed to record contribution.");
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
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Header Action & Statistics */}
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Roster Overview
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/connect-team/discipleship"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-black border border-indigo-200/80 transition-all active:scale-95 shadow-xs"
          >
            <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
            <span>Discipleship Matrix</span>
          </Link>

          {isAdmin && (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl bg-[#FF6B00] hover:bg-[#e05e00] text-white text-xs font-black shadow-md shadow-orange-500/20 transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" /> Add Minister
            </button>
          )}
        </div>
      </div>

      {/* 2. Metric Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <div className="bg-white rounded-[20px] sm:rounded-[24px] border border-slate-200/80 p-3.5 sm:p-5 space-y-1.5 sm:space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Team</span>
            <div className="p-1.5 sm:p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-3xl font-black text-[#111827] tracking-tight">{stats.total}</div>
            <p className="text-[10px] sm:text-[11px] font-bold text-emerald-600 mt-0.5 flex items-center gap-0.5">
              <Activity className="w-3 h-3" /> {stats.active} active
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[20px] sm:rounded-[24px] border border-slate-200/80 p-3.5 sm:p-5 space-y-1.5 sm:space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">Team Leaders</span>
            <div className="p-1.5 sm:p-2.5 rounded-xl bg-orange-50 text-[#FF6B00]">
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-3xl font-black text-[#111827] tracking-tight">{stats.leaders}</div>
            <p className="text-[10px] sm:text-[11px] font-bold text-[#FF6B00] mt-0.5">Leaders</p>
          </div>
        </div>

        <div className="bg-white rounded-[20px] sm:rounded-[24px] border border-slate-200/80 p-3.5 sm:p-5 space-y-1.5 sm:space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">Follow-Up Staff</span>
            <div className="p-1.5 sm:p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-3xl font-black text-[#111827] tracking-tight">{stats.followUpMinisters}</div>
            <p className="text-[10px] sm:text-[11px] font-bold text-indigo-600 mt-0.5">Portal staff</p>
          </div>
        </div>

        <div className="bg-white rounded-[20px] sm:rounded-[24px] border border-slate-200/80 p-3.5 sm:p-5 space-y-1.5 sm:space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Rate</span>
            <div className="p-1.5 sm:p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-3xl font-black text-[#111827] tracking-tight">
              {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%
            </div>
            <p className="text-[10px] sm:text-[11px] font-bold text-emerald-600 mt-0.5">
              {stats.active}/{stats.total} serving
            </p>
          </div>
        </div>
      </div>

      {/* 3. Filter Pills & Search Bar */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar select-none">
          {["ALL", "Team Leaders", "Members"].map((group) => (
            <button
              key={group}
              onClick={() => {
                setSelectedGroup(group);
                updateFilters(group, search);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 active:scale-95 ${
                selectedGroup === group
                  ? "bg-[#FF6B00] text-white shadow-md shadow-orange-500/20"
                  : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
              }`}
            >
              {group === "ALL" ? "All Roles" : group}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateFilters(selectedGroup, search);
          }}
          className="relative"
        >
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search minister name, nickname, contact..."
            className="w-full pl-11 pr-4 py-2.5 sm:py-3 rounded-[20px] bg-white border border-slate-200/80 text-xs sm:text-sm font-medium text-[#111827] placeholder-slate-400 focus:outline-none focus:border-[#FF6B00] shadow-sm"
          />
        </form>
      </div>

      {/* 4. Mobile Cards */}
      <div className="md:hidden space-y-2">
        {data.length === 0 ? (
          <div className="bg-white rounded-[20px] border border-slate-200/80 p-8 text-center text-slate-400 text-xs font-medium">
            No team members found.
          </div>
        ) : (
          data.map((member: any) => {
            const isLeader = member.groupName === "Team Leaders";
            const contact = member.contactNumber || member.contact;
            const targetCode = member.updateCode || member._id;

            return (
              <div
                key={member._id}
                className="bg-white rounded-[18px] border border-slate-200/80 p-3 shadow-sm flex items-center justify-between gap-2.5"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative h-10 w-10 rounded-xl overflow-hidden shrink-0 border border-slate-100 bg-slate-100">
                    {member.photoUrl ? (
                      <Image
                        src={member.photoUrl}
                        alt={member.name}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    ) : (
                      <div className={`h-full w-full flex items-center justify-center font-black text-xs text-white ${
                        isLeader ? "bg-gradient-to-br from-amber-500 to-orange-500" : "bg-slate-700"
                      }`}>
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-extrabold text-xs text-[#111827] truncate">
                        {member.name}
                      </h3>
                      {isLeader ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-50 to-amber-50 text-[#FF6B00] border border-orange-200/70 whitespace-nowrap shrink-0">
                          <ShieldCheck className="w-2.5 h-2.5 text-[#FF6B00]" />
                          Leader
                        </span>
                      ) : (
                        member.nickname && (
                          <span className="text-[10px] text-slate-400 font-semibold truncate">
                            ({member.nickname})
                          </span>
                        )
                      )}
                    </div>
                    {contact ? (
                      <a
                        href={`tel:${contact}`}
                        className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-slate-500 hover:text-emerald-600 mt-0.5"
                      >
                        <Phone className="w-2.5 h-2.5 text-emerald-600" />
                        {contact}
                      </a>
                    ) : (
                      <span className="text-[10px] text-slate-300 italic">No contact</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {isAdmin && (
                    <button
                      onClick={() => handleCopyLink(member)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
                      title="Copy Profile Update Link"
                    >
                      {copiedCode === targetCode ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Link2 className="w-3 h-3" />
                      )}
                    </button>
                  )}

                  <button
                    onClick={() => handleToggleStatus(member._id, member.active)}
                    disabled={isPending || !isAdmin}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all ${
                      member.active
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                        : "bg-rose-50 text-rose-500 border border-rose-200"
                    } ${!isAdmin ? "cursor-default opacity-80" : "active:scale-95"}`}
                  >
                    {member.active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {member.active ? "Active" : "Inactive"}
                  </button>

                  {canEditMember && (
                    <button
                      onClick={() => handleOpenEdit(member)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-orange-50 text-slate-500 hover:text-[#FF6B00] transition-colors"
                      title={isFinanceLeader && !isAdmin ? "Contributions" : "Edit Member"}
                    >
                      {isFinanceLeader && !isAdmin ? (
                        <CircleDollarSign className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Pencil className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. Desktop Data Table */}
      <div className="hidden md:block bg-white rounded-[32px] border border-slate-200/80 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-4 px-6">Minister</th>
                <th className="py-4 px-6">Role / Group</th>
                <th className="py-4 px-6">Contact & Email</th>
                <th className="py-4 px-6">Discipleship</th>
                <th className="py-4 px-4 text-center">Status</th>
                {canEditMember && <th className="py-4 px-4 text-center">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={canEditMember ? 6 : 5} className="py-16 text-center text-slate-400 text-xs font-medium">
                    No team members match your criteria.
                  </td>
                </tr>
              ) : (
                data.map((member: any) => {
                  const isLeader = member.groupName === "Team Leaders";
                  const isFollowUp = member.groupName === "Follow Up Team";
                  const contact = member.contactNumber || member.contact;
                  const targetCode = member.updateCode || member._id;

                  return (
                    <tr key={member._id} className="hover:bg-blue-50/20 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 rounded-xl overflow-hidden shrink-0 border border-slate-200 bg-slate-100 shadow-sm">
                            {member.photoUrl ? (
                              <Image
                                src={member.photoUrl}
                                alt={member.name}
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            ) : (
                              <div className={`h-full w-full flex items-center justify-center font-black text-xs text-white ${
                                isLeader ? "bg-gradient-to-br from-amber-500 to-orange-500" : "bg-slate-700"
                              }`}>
                                {member.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="font-extrabold text-[#111827] block leading-tight">{member.name}</span>
                            {member.nickname && (
                              <span className="text-xs text-slate-400 font-semibold">"{member.nickname}"</span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        {isLeader ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wide uppercase bg-gradient-to-r from-orange-50 to-amber-50 text-[#FF6B00] border border-orange-200/80 whitespace-nowrap shadow-xs">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#FF6B00] shrink-0" />
                            Team Leader
                          </span>
                        ) : isFollowUp ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 whitespace-nowrap">
                            <UserCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            Follow Up Team
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200/70 whitespace-nowrap">
                            Member
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6">
                        <div className="space-y-0.5">
                          {contact ? (
                            <a
                              href={`tel:${contact}`}
                              className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-700 hover:text-emerald-600"
                            >
                              <Phone className="w-3 h-3 text-emerald-600" />
                              {contact}
                            </a>
                          ) : (
                            <span className="text-[11px] text-slate-300 italic block">No phone</span>
                          )}
                          {member.email && (
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {member.email}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="text-xs">
                          {member.discipler && (
                            <span className="text-slate-600 font-medium block">
                              <strong className="text-slate-400 font-bold">Discipler:</strong> {member.discipler}
                            </span>
                          )}
                          {member.discipleshipClasses?.length > 0 && (
                            <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                              {member.discipleshipClasses.length}/6 workshops completed
                            </span>
                          )}
                        </div>
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

                      {canEditMember && (
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {isAdmin && (
                              <button
                                onClick={() => handleCopyLink(member)}
                                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
                                title="Copy Profile Update Link"
                              >
                                {copiedCode === targetCode ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Link2 className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}

                            <button
                              onClick={() => handleOpenEdit(member)}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-orange-50 text-slate-500 hover:text-[#FF6B00] transition-colors"
                              title={isFinanceLeader && !isAdmin ? "Manage Contributions" : "Edit Member"}
                            >
                              {isFinanceLeader && !isAdmin ? (
                                <CircleDollarSign className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Pencil className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
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

      {/* 6. Add / Edit Member Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl max-h-[90vh] bg-white rounded-[28px] border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${isFinanceLeader && !isAdmin ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-[#FF6B00]"}`}>
                  {isFinanceLeader && !isAdmin ? (
                    <CircleDollarSign className="w-4 h-4" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                </div>
                <h3 className="font-black text-lg text-[#111827]">
                  {modalMode === "ADD" 
                    ? "Register Connect Member" 
                    : isFinanceLeader && !isAdmin 
                    ? `Contributions: ${activeItem?.name}` 
                    : "Edit Member Profile"}
                </h3>
              </div>
              <button
                onClick={() => setModalMode(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Read-Only Notice for Finance Leader */}
            {isFinanceLeader && !isAdmin && activeTab !== "contributions" && (
              <div className="px-5 py-2 bg-amber-50 border-b border-amber-200/80 text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
                <span>View-only mode: Only administrators can modify member details and assignments.</span>
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-100 bg-slate-50/60 px-5 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab("info")}
                className={`pb-2 px-3 text-xs font-extrabold border-b-2 transition-all ${
                  activeTab === "info"
                    ? "border-[#FF6B00] text-[#FF6B00]"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                Personal & Contact Info
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("discipleship")}
                className={`pb-2 px-3 text-xs font-extrabold border-b-2 transition-all ${
                  activeTab === "discipleship"
                    ? "border-[#FF6B00] text-[#FF6B00]"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                Discipleship
              </button>
              {modalMode === "EDIT" && (
                <button
                  type="button"
                  onClick={() => setActiveTab("contributions")}
                  className={`pb-2 px-3 text-xs font-extrabold border-b-2 flex items-center gap-1.5 transition-all ${
                    activeTab === "contributions"
                      ? "border-emerald-600 text-emerald-600"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <CircleDollarSign className="w-3.5 h-3.5" />
                  Contributions
                </button>
              )}
            </div>

            {/* Modal Body */}
            {activeTab === "contributions" ? (
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
                {formError && (
                  <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-600">
                    {formError}
                  </div>
                )}
                {contribSuccessMsg && (
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{contribSuccessMsg}</span>
                  </div>
                )}

                {/* 1. Clear Current Status Banner */}
                <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between shadow-sm">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Current Standing
                    </span>
                    <div className="text-sm sm:text-base font-black text-white">
                      {latestPaid 
                        ? `Paid through ${MONTH_NAMES[latestPaid.month]} ${latestPaid.year}`
                        : "No contributions recorded yet (starts Oct 2026)"}
                    </div>
                    <div className="text-xs text-emerald-400 font-semibold">
                      Next due month: <strong>{MONTH_NAMES[nextDue.month]} {nextDue.year}</strong>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Total Contributed
                    </span>
                    <span className="text-base font-black text-emerald-400 font-mono">
                      ₱{(contribHistory.length * 100).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Contribution Action Card */}
                <div className="p-4 rounded-2xl border border-slate-200/90 bg-white space-y-3.5 shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <label className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-emerald-600" /> Record New Payment
                    </label>
                    <span className="text-[10px] font-bold text-slate-400">Fixed rate: ₱100 / mo</span>
                  </div>

                  {/* Preset Amount Chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { amt: 100, label: "+₱100 (1 mo)" },
                      { amt: 300, label: "+₱300 (3 mos)" },
                      { amt: 500, label: "+₱500 (5 mos)" },
                      { amt: 1000, label: "+₱1,000 (10 mos)" },
                    ].map((chip) => (
                      <button
                        key={chip.amt}
                        type="button"
                        onClick={() => setContribAmount(chip.amt)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all active:scale-95 ${
                          contribAmount === chip.amt
                            ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                            : "bg-slate-50 border border-slate-200 text-slate-700 hover:bg-emerald-50/50 hover:border-emerald-200"
                        }`}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>

                  {/* Amount & Method Inputs */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Amount to Pay (₱) *
                      </label>
                      <input
                        type="number"
                        step={100}
                        min={100}
                        value={contribAmount}
                        onChange={(e) => setContribAmount(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-extrabold text-[#111827] focus:outline-none focus:border-emerald-600 focus:bg-white transition-all font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Payment Method
                      </label>
                      <select
                        value={contribMethod}
                        onChange={(e) => setContribMethod(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all"
                      >
                        <option value="CASH">Cash</option>
                        <option value="GCASH">GCash</option>
                        <option value="BANK_TRANSFER">Bank Transfer</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* 2. Renamed & Clearer New Payment Preview */}
                  {projectedMonths.length > 0 && (
                    <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/90 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 font-bold">New Payment Preview (+₱{contribAmount.toLocaleString()}):</span>
                        <span className="text-emerald-800 font-black">
                          Will advance to: {MONTH_NAMES[projectedMonths[projectedMonths.length - 1].month]} {projectedMonths[projectedMonths.length - 1].year}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {projectedMonths.map((m, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-lg bg-white text-emerald-900 border border-emerald-300 text-[10px] font-mono font-black shadow-2xs"
                          >
                            + {MONTH_NAMES[m.month]} {m.year}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes / Reference */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Notes / Reference (Optional)
                    </label>
                    <input
                      type="text"
                      value={contribNotes}
                      onChange={(e) => setContribNotes(e.target.value)}
                      placeholder="e.g. GCash Ref #123456"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-[#111827] focus:outline-none focus:border-emerald-600 focus:bg-white transition-all"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={isPending || contribAmount < 100 || contribAmount % 100 !== 0}
                    onClick={handleRecordContribution}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/25 flex items-center justify-center gap-1.5 transition-all active:scale-[0.99] disabled:opacity-50"
                  >
                    {isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CircleDollarSign className="w-4 h-4" />
                        Record ₱{contribAmount.toLocaleString()} Contribution
                      </>
                    )}
                  </button>
                </div>

                {/* Recorded Months Ledger Header with Count & Subtotal */}
                <div className="space-y-2 pt-1 pb-2">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 px-0.5">
                    <span className="flex items-center gap-1.5">
                      <CalendarCheck className="w-3.5 h-3.5 text-slate-400" /> Recorded Months Ledger
                    </span>
                    {contribHistory.length > 0 && (
                      <span className="text-emerald-700 font-bold lowercase tracking-normal">
                        {contribHistory.length} {contribHistory.length === 1 ? "month" : "months"} (₱{(contribHistory.length * 100).toLocaleString()})
                      </span>
                    )}
                  </div>

                  {contribLoading ? (
                    <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5 bg-slate-50 rounded-2xl border border-slate-100">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-600" /> Loading payment ledger...
                    </div>
                  ) : contribHistory.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-1">
                      <CircleDollarSign className="w-5 h-5 text-slate-300" />
                      <span>No contributions recorded for this member yet.</span>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden max-h-48 overflow-y-auto shadow-2xs">
                      {contribHistory.map((entry) => (
                        <div key={entry._id} className="p-2.5 px-3.5 bg-white flex items-center justify-between text-xs hover:bg-slate-50/80 transition-colors">
                          <div>
                            <span className="font-extrabold text-slate-900 block">
                              {MONTH_NAMES[entry.month]} {entry.year}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              By {entry.recordedBy?.fullName || "Leader"} • {entry.paymentMethod}
                              {entry.notes && ` • ${entry.notes}`}
                            </span>
                          </div>
                          <span className="font-mono font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 text-xs">
                            ₱{entry.amount}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveModal} className="flex-1 overflow-y-auto p-5 space-y-4">
                {formError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-600">
                    {formError}
                  </div>
                )}

                {activeTab === "info" ? (
                  <div className="space-y-3.5">
                    <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <div className="relative h-16 w-16 rounded-2xl overflow-hidden border bg-white shrink-0 flex items-center justify-center shadow-sm">
                        {photoPreview ? (
                          <Image src={photoPreview} alt="Preview" fill className="object-cover" />
                        ) : (
                          <Users className="w-6 h-6 text-slate-300" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block">
                          Birthday / Greeting Picture
                        </label>
                        {isAdmin && (
                          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-[11px] font-bold text-slate-700 cursor-pointer hover:bg-slate-100 shadow-sm transition-all">
                            <UploadCloud className="w-3.5 h-3.5 text-[#FF6B00]" /> Choose Photo
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handlePhotoSelect}
                              className="hidden"
                            />
                          </label>
                        )}
                        <span className="text-[10px] text-slate-400 block">Square photos recommended (Max 8MB)</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Full Name *</label>
                        <input
                          type="text"
                          value={formName}
                          disabled={!isAdmin}
                          onChange={(e) => setFormName(e.target.value)}
                          placeholder="Juan Dela Cruz"
                          required
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#FF6B00] disabled:bg-slate-100 disabled:text-slate-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nickname</label>
                        <input
                          type="text"
                          value={formNickname}
                          disabled={!isAdmin}
                          onChange={(e) => setFormNickname(e.target.value)}
                          placeholder="e.g. Bro Juan"
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#FF6B00] disabled:bg-slate-100 disabled:text-slate-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gender</label>
                        <select
                          value={formGender}
                          disabled={!isAdmin}
                          onChange={(e) => setFormGender(e.target.value as "Male" | "Female")}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#FF6B00] disabled:bg-slate-100 disabled:text-slate-500"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Birthdate</label>
                        <input
                          type="date"
                          value={formBirthdate}
                          disabled={!isAdmin}
                          onChange={(e) => setFormBirthdate(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#FF6B00] disabled:bg-slate-100 disabled:text-slate-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Contact Number</label>
                        <input
                          type="text"
                          value={formContactNumber}
                          disabled={!isAdmin}
                          onChange={(e) => setFormContactNumber(e.target.value)}
                          placeholder="0917XXXXXXX"
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#FF6B00] disabled:bg-slate-100 disabled:text-slate-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Address</label>
                        <input
                          type="email"
                          value={formEmail}
                          disabled={!isAdmin}
                          onChange={(e) => setFormEmail(e.target.value)}
                          placeholder="juan@gmail.com"
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#FF6B00] disabled:bg-slate-100 disabled:text-slate-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Social Media (FB / IG)</label>
                      <input
                        type="text"
                        value={formSocialMedia}
                        disabled={!isAdmin}
                        onChange={(e) => setFormSocialMedia(e.target.value)}
                        placeholder="e.g. facebook.com/juandelacruz"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#FF6B00] disabled:bg-slate-100 disabled:text-slate-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Roster Role</label>
                        <select
                          value={formGroup}
                          disabled={!isAdmin}
                          onChange={(e) => setFormGroup(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#FF6B00] disabled:bg-slate-100 disabled:text-slate-500"
                        >
                          <option value="Members">Members</option>
                          <option value="Team Leaders">Team Leaders</option>
                          <option value="Follow Up Team">Follow Up Team</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Portal User Link</label>
                        <select
                          value={formAssignedUserId}
                          disabled={!isAdmin}
                          onChange={(e) => setFormAssignedUserId(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#FF6B00] disabled:bg-slate-100 disabled:text-slate-500"
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

                    <label className="flex items-center gap-2 pt-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formActive}
                        disabled={!isAdmin}
                        onChange={(e) => setFormActive(e.target.checked)}
                        className="w-4 h-4 rounded text-[#FF6B00] focus:ring-[#FF6B00] disabled:opacity-50"
                      />
                      <span className="text-xs font-bold text-slate-700">Active Connect Member</span>
                    </label>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Discipler</label>
                      <input
                        type="text"
                        value={formDiscipler}
                        disabled={!isAdmin}
                        onChange={(e) => setFormDiscipler(e.target.value)}
                        placeholder="Name of your discipler"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#FF6B00] disabled:bg-slate-100 disabled:text-slate-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Disciple(s)</label>
                      <textarea
                        rows={2}
                        value={formDisciples}
                        disabled={!isAdmin}
                        onChange={(e) => setFormDisciples(e.target.value)}
                        placeholder="Put each disciple on a new line..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#FF6B00] disabled:bg-slate-100 disabled:text-slate-500"
                      />
                    </div>

                    <div className="space-y-2 pt-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Award className="w-3 h-3 text-indigo-500" /> Discipleship Classes & Workshops
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                        {DISCIPLESHIP_CLASSES.map((cls) => {
                          const checked = formClasses.includes(cls);
                          return (
                            <label
                              key={cls}
                              className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-bold transition-all ${
                                !isAdmin ? "cursor-default opacity-80" : "cursor-pointer"
                              } ${
                                checked
                                  ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                                  : "bg-white border-slate-200/70 text-slate-600 hover:bg-slate-100"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={!isAdmin}
                                onChange={() => toggleClassCheckbox(cls)}
                                className="w-3.5 h-3.5 rounded text-indigo-600 disabled:opacity-50"
                              />
                              <span className="truncate">{cls}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <label className="flex items-center gap-2 pt-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formIsPartOfOutreach}
                        disabled={!isAdmin}
                        onChange={(e) => setFormIsPartOfOutreach(e.target.checked)}
                        className="w-4 h-4 rounded text-[#FF6B00] focus:ring-[#FF6B00] disabled:opacity-50"
                      />
                      <span className="text-xs font-bold text-slate-700">Part of an Outreach Ministry</span>
                    </label>
                  </div>
                )}

                {/* Submit Action only for Admin on Info / Discipleship tabs */}
                <div className="pt-4 border-t border-slate-100 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setModalMode(null)}
                    className={`${isAdmin ? "w-1/3" : "w-full"} py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all`}
                  >
                    {isAdmin ? "Cancel" : "Close"}
                  </button>
                  {isAdmin && (
                    <button
                      type="submit"
                      disabled={isPending}
                      className="w-2/3 py-2.5 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-extrabold text-xs shadow-md shadow-orange-500/20 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Minister"}
                    </button>
                  )}
                </div>
              </form>
            )}

          </div>
        </div>
      )}
    </div>
  );
}