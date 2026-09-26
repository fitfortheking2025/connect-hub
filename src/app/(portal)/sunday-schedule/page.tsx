// src/app/(portal)/admin/schedule/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSundayScheduleAction } from "@/app/actions/scheduleAction";
import { getNextOrCurrentSunday } from "@/lib/sundayDate";
import { getCachedSundayScheduleConfig } from "@/lib/settings/scheduleSettings";
import AdminScheduleClientView from "./AdminScheduleClientView";

export const dynamic = "force-dynamic";

export default async function AdminSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await auth();
  const rawRole = String((session?.user as any)?.role || "").trim().toUpperCase();
  const userRole = rawRole.replace(/[\s-]+/g, "_");

  if (userRole !== "ADMIN" && userRole !== "TEAM_LEADER" && userRole !== "FINANCE_LEADER") {
    redirect("/");
  }

  const resolvedParams = await searchParams;
  const targetDate = resolvedParams?.date || getNextOrCurrentSunday();
  const res = await getSundayScheduleAction(targetDate);
  const scheduleConfig = await getCachedSundayScheduleConfig();

  const initialSchedule = res.success && res.schedule ? res.schedule : { attendees: [] };
  const sundayDate = res.success && res.sundayDate ? res.sundayDate : targetDate;
  const teamMembers = res.success && res.teamMembers ? res.teamMembers : [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <AdminScheduleClientView
        initialSchedule={initialSchedule}
        sundayDate={sundayDate}
        teamMembers={teamMembers}
        userRole={userRole}
        maxMembers={scheduleConfig.maxMembersPerService}
        maxLeaders={scheduleConfig.maxLeadersPerService}
      />
    </div>
  );
}