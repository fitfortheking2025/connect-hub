// src/app/(portal)/connect-team/discipleship/DiscipleshipMatrixClient.tsx
"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { 
  Search, 
  CheckCircle2, 
  Circle, 
  Award, 
  CheckCheck,
  Filter,
  X
} from "lucide-react";

const DISCIPLESHIP_CLASSES = [
  "One2One",
  "Spiritual Family Class",
  "River Encounter",
  "Making Disciples",
  "Empowering Leaders",
  "Prophetic & Supernatural Level 1",
];

export default function DiscipleshipMatrixClient({ initialMembers = [] }: { initialMembers: any[] }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "GRADUATES" | "IN_PROGRESS" | "NONE">("ALL");
  const [missingClassFilter, setMissingClassFilter] = useState<string>("ALL");

  const formattedMembers = useMemo(() => {
    return initialMembers.map((m) => {
      // Filter out any deprecated classes from the stored array
      const completedClasses: string[] = (m.discipleshipClasses || []).filter((c: string) =>
        DISCIPLESHIP_CLASSES.includes(c)
      );
      const count = completedClasses.length;
      const isGraduated = count === DISCIPLESHIP_CLASSES.length;
      const displayName = m.nickname?.trim() || m.name;

      return {
        ...m,
        displayName,
        completedClasses,
        completedCount: count,
        progressPercent: Math.round((count / DISCIPLESHIP_CLASSES.length) * 100),
        isGraduated,
      };
    });
  }, [initialMembers]);

  const stats = useMemo(() => {
    const total = formattedMembers.length;
    const graduates = formattedMembers.filter((m) => m.isGraduated).length;
    const inProgress = formattedMembers.filter((m) => m.completedCount > 0 && !m.isGraduated).length;
    const notStarted = formattedMembers.filter((m) => m.completedCount === 0).length;

    return { total, graduates, inProgress, notStarted };
  }, [formattedMembers]);

  const filteredMembers = useMemo(() => {
    return formattedMembers.filter((m) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.displayName.toLowerCase().includes(q) ||
        (m.discipler && m.discipler.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (filterStatus === "GRADUATES" && !m.isGraduated) return false;
      if (filterStatus === "IN_PROGRESS" && (m.completedCount === 0 || m.isGraduated)) return false;
      if (filterStatus === "NONE" && m.completedCount !== 0) return false;

      if (missingClassFilter !== "ALL") {
        const hasFinishedClass = (m.completedClasses || []).includes(missingClassFilter);
        if (hasFinishedClass) return false;
      }

      return true;
    });
  }, [formattedMembers, search, filterStatus, missingClassFilter]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <div className="bg-white rounded-[20px] sm:rounded-[24px] border border-slate-200/80 p-3.5 sm:p-5 space-y-1">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Ministers</span>
          <div className="text-xl sm:text-3xl font-black text-[#111827]">{stats.total}</div>
          <p className="text-[10px] sm:text-[11px] font-bold text-slate-500">Active Connect Team</p>
        </div>

        <div className="bg-white rounded-[20px] sm:rounded-[24px] border border-slate-200/80 p-3.5 sm:p-5 space-y-1">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-600">Graduates (6/6)</span>
          <div className="text-xl sm:text-3xl font-black text-emerald-600">{stats.graduates}</div>
          <p className="text-[10px] sm:text-[11px] font-bold text-emerald-600">
            {stats.total > 0 ? Math.round((stats.graduates / stats.total) * 100) : 0}% Fully Trained
          </p>
        </div>

        <div className="bg-white rounded-[20px] sm:rounded-[24px] border border-slate-200/80 p-3.5 sm:p-5 space-y-1">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-indigo-600">In Progress</span>
          <div className="text-xl sm:text-3xl font-black text-indigo-600">{stats.inProgress}</div>
          <p className="text-[10px] sm:text-[11px] font-bold text-indigo-600">1 to 5 classes done</p>
        </div>

        <div className="bg-white rounded-[20px] sm:rounded-[24px] border border-slate-200/80 p-3.5 sm:p-5 space-y-1">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">Not Yet Started</span>
          <div className="text-xl sm:text-3xl font-black text-slate-700">{stats.notStarted}</div>
          <p className="text-[10px] sm:text-[11px] font-bold text-rose-500">0 Classes Completed</p>
        </div>
      </div>

      {/* 2. Controls */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar select-none">
          {[
            { id: "ALL", label: `All Ministers (${stats.total})` },
            { id: "GRADUATES", label: `Completed All 6 (${stats.graduates})` },
            { id: "IN_PROGRESS", label: `In Progress (${stats.inProgress})` },
            { id: "NONE", label: `0 Classes (${stats.notStarted})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 active:scale-95 ${
                filterStatus === tab.id
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search nickname, full name, discipler..."
              className="w-full pl-11 pr-4 py-2.5 sm:py-3 rounded-2xl bg-white border border-slate-200/80 text-xs sm:text-sm font-medium text-[#111827] placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-sm"
            />
          </div>

          <div className="relative shrink-0 flex items-center gap-1.5">
            <div className="relative flex items-center">
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 pointer-events-none" />
              <select
                value={missingClassFilter}
                onChange={(e) => setMissingClassFilter(e.target.value)}
                className={`pl-9 pr-8 py-2.5 sm:py-3 rounded-2xl text-xs font-bold border transition-all cursor-pointer shadow-sm focus:outline-none ${
                  missingClassFilter !== "ALL"
                    ? "bg-amber-50 border-amber-300 text-amber-900 ring-2 ring-amber-400/20"
                    : "bg-white border-slate-200/80 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <option value="ALL">All Classes (No Specific Need)</option>
                <optgroup label="Show ministers who still need:">
                  {DISCIPLESHIP_CLASSES.map((cls) => (
                    <option key={cls} value={cls}>
                      Needs: {cls}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {missingClassFilter !== "ALL" && (
              <button
                onClick={() => setMissingClassFilter("ALL")}
                className="p-2 sm:p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
                title="Reset Class Filter"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {missingClassFilter !== "ALL" && (
          <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900 font-bold">
            <span>
              Showing ministers who <u>have not taken</u>: <strong>{missingClassFilter}</strong>
            </span>
            <span className="text-[11px] font-extrabold text-amber-700">
              {filteredMembers.length} Minister{filteredMembers.length === 1 ? "" : "s"}
            </span>
          </div>
        )}
      </div>

      {/* 3. Mobile Card List */}
      <div className="md:hidden space-y-3">
        {filteredMembers.length === 0 ? (
          <div className="bg-white rounded-[20px] p-8 text-center text-slate-400 text-xs font-medium border border-slate-200">
            No ministers match the chosen filter.
          </div>
        ) : (
          filteredMembers.map((m) => (
            <div
              key={m._id}
              className="bg-white rounded-[20px] border border-slate-200/80 p-4 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative h-10 w-10 rounded-xl overflow-hidden shrink-0 border bg-slate-100">
                    {m.photoUrl ? (
                      <Image src={m.photoUrl} alt={m.displayName} fill sizes="40px" className="object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center font-black text-xs text-white bg-slate-700">
                        {m.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-extrabold text-sm text-[#111827] truncate">
                        {m.displayName}
                      </h3>
                      {m.isGraduated && (
                        <span className="p-0.5 rounded-full bg-emerald-100 text-emerald-600" title="Completed 6/6 Classes">
                          <CheckCheck className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                    {m.nickname && m.nickname !== m.name && (
                      <span className="text-[10px] text-slate-400 block truncate">{m.name}</span>
                    )}
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-black shrink-0 ${
                    m.isGraduated
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                  }`}
                >
                  {m.completedCount} / 6 Classes
                </span>
              </div>

              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    m.isGraduated ? "bg-emerald-500" : "bg-indigo-600"
                  }`}
                  style={{ width: `${m.progressPercent}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-1">
                {DISCIPLESHIP_CLASSES.map((cls) => {
                  const done = (m.completedClasses || []).includes(cls);
                  const isHighlightedNeed = missingClassFilter === cls;

                  return (
                    <div
                      key={cls}
                      className={`flex items-center gap-1.5 p-1.5 rounded-lg text-[10px] font-bold truncate ${
                        done
                          ? "bg-emerald-50/70 text-emerald-800"
                          : isHighlightedNeed
                          ? "bg-amber-100/80 text-amber-900 border border-amber-300 ring-1 ring-amber-400/20"
                          : "bg-slate-50 text-slate-400"
                      }`}
                    >
                      {done ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                      ) : (
                        <Circle className={`w-3 h-3 shrink-0 ${isHighlightedNeed ? "text-amber-500" : "text-slate-300"}`} />
                      )}
                      <span className="truncate">{cls}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 4. Desktop Discipleship Matrix Table */}
      <div className="hidden md:block bg-white rounded-[32px] border border-slate-200/80 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-black uppercase tracking-wider text-slate-500">
                <th className="py-4 px-5">Minister</th>
                <th className="py-4 px-3 text-center">Progress</th>
                {DISCIPLESHIP_CLASSES.map((cls) => (
                  <th
                    key={cls}
                    className={`py-4 px-2 text-center max-w-[120px] leading-tight transition-colors ${
                      missingClassFilter === cls ? "bg-amber-100/60 text-amber-900 font-extrabold" : ""
                    }`}
                  >
                    {cls}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400 text-xs font-medium">
                    No team members found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((m) => (
                  <tr key={m._id} className="hover:bg-indigo-50/20 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2.5">
                        <div className="relative h-8 w-8 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                          {m.photoUrl ? (
                            <Image src={m.photoUrl} alt={m.displayName} fill sizes="32px" className="object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center font-black text-xs text-white bg-slate-700">
                              {m.displayName.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-extrabold text-[#111827] truncate flex items-center gap-1">
                            {m.displayName}
                            {m.isGraduated && (
                              <span title="Completed 6/6 Classes">
                                <Award className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              </span>
                            )}
                          </div>
                          {m.nickname && m.nickname !== m.name && (
                            <div className="text-[10px] text-slate-400 truncate">{m.name}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black ${
                          m.isGraduated
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                            : m.completedCount > 0
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {m.completedCount} / 6
                      </span>
                    </td>

                    {/* 6 Classes Columns */}
                    {DISCIPLESHIP_CLASSES.map((cls) => {
                      const completed = (m.completedClasses || []).includes(cls);
                      const isTargetedMissing = missingClassFilter === cls;

                      return (
                        <td
                          key={cls}
                          className={`py-3.5 px-2 text-center transition-colors ${
                            isTargetedMissing ? "bg-amber-50/50" : ""
                          }`}
                        >
                          {completed ? (
                            <div className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </div>
                          ) : (
                            <div
                              className={`inline-flex items-center justify-center w-6 h-6 rounded-lg ${
                                isTargetedMissing
                                  ? "bg-amber-100 text-amber-600 border border-amber-300 ring-2 ring-amber-400/20"
                                  : "bg-slate-50 text-slate-300"
                              }`}
                            >
                              <Circle className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </td>
                      );
                    })}
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