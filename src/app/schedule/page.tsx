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

  const initialSchedule = res.success ? res.schedule : { attendees: [] };
  const sundayDate = res.success && res.sundayDate ? res.sundayDate : targetDate;
  const teamMembers = res.success && res.teamMembers ? res.teamMembers : [];

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-3 sm:px-6">
      <div className="max-w-xl mx-auto space-y-5">
        <ScheduleClientView
          initialSchedule={initialSchedule}
          sundayDate={sundayDate}
          teamMembers={teamMembers}
        />
      </div>
    </div>
  );
}