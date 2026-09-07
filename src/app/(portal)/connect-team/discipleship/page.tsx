// src/app/(portal)/connect-team/discipleship/page.tsx
import dbConnect from "@/lib/mongodb";
import { TeamMember } from "@/models";
import DiscipleshipMatrixClient from "./DiscipleshipMatrixClient";
import Link from "next/link";
import { ChevronLeft, GraduationCap } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DiscipleshipOverviewPage() {
  await dbConnect();

  const members = await TeamMember.find({ active: true })
    .select("name nickname groupName photoUrl discipleshipClasses discipler isPartOfOutreach")
    .sort({ groupName: 1, nickname: 1, name: 1 })
    .lean();

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <Link
            href="/connect-team"
            className="p-2 rounded-2xl bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-600 transition-all shadow-sm active:scale-95"
            title="Back to Team Roster"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-black uppercase tracking-wider">
              <GraduationCap className="w-3.5 h-3.5" /> Discipleship Classes
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#111827] tracking-tight mt-0.5">
              Team Training & Classes Matrix
            </h1>
          </div>
        </div>
      </div>

      <DiscipleshipMatrixClient initialMembers={JSON.parse(JSON.stringify(members))} />
    </div>
  );
}