// src/app/connect-member/[code]/page.tsx
import dbConnect from "@/lib/mongodb";
import { TeamMember } from "@/models";
import { notFound } from "next/navigation";
import MemberSelfEditForm from "./MemberSelfEditForm";
import Image from "next/image";
import { Sparkles } from "lucide-react";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function MemberSelfPage({ params }: PageProps) {
  const { code } = await params;
  await dbConnect();

  const member = await TeamMember.findOne({ updateCode: code }).lean();
  if (!member) notFound();

  return (
    <main className="min-h-screen bg-slate-50 py-8 px-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-lg space-y-4">
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200/80 text-[#FF6B00] text-[11px] font-bold">
            <Sparkles className="w-3.5 h-3.5" /> Connect Hub Portal
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Update Your Details
          </h1>
          <p className="text-xs text-slate-500">
            Keep your contact and discipleship milestones updated for our team roster.
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3.5">
          <div className="relative h-12 w-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
            {member.photoUrl ? (
              <Image
                src={member.photoUrl}
                alt={member.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center font-black text-white bg-slate-700">
                {member.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h2 className="font-black text-sm text-slate-900 truncate">{member.name}</h2>
            <p className="text-xs font-semibold text-slate-400">
              {member.groupName === "Team Leaders" ? "Leader" : "Member"}
            </p>
          </div>
        </div>

        <MemberSelfEditForm member={JSON.parse(JSON.stringify(member))} />
      </div>
    </main>
  );
}