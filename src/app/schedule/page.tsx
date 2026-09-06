// src/app/schedule/page.tsx
import { getSundayScheduleAction } from "@/app/actions/scheduleAction";
import { getNextOrCurrentSunday } from "@/lib/sundayDate";
import ScheduleClientView from "./ScheduleClientView";

export const dynamic = "force-dynamic";

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const resolvedParams = await searchParams;
  const targetDate = resolvedParams?.date || getNextOrCurrentSunday();
  const res = await getSundayScheduleAction(targetDate);

  const initialSchedule = res.success && res.schedule 
    ? res.schedule 
    : { sundayDate: targetDate, attendees: [] };
  const teamMembers = res.success && res.teamMembers ? res.teamMembers : [];
  const isMemberBookingOpen = Boolean(res.isMemberBookingOpen);

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC]">
      <ScheduleClientView
        initialSchedule={initialSchedule}
        teamMembers={teamMembers}
        isMemberBookingOpen={isMemberBookingOpen}
      />
    </div>
  );
}