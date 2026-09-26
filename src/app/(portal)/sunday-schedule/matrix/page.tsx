// src/app/(portal)/admin/schedule/matrix/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getYearlyAttendanceMatrixAction } from "@/app/actions/scheduleMatrixAction";
import ScheduleMatrixClient from "./ScheduleMatrixClient";

export const dynamic = "force-dynamic";

export default async function ScheduleMatrixPage() {
  const session = await auth();
  const rawRole = String((session?.user as any)?.role || "").toUpperCase().replace(/[\s-]+/g, "_");

  // Admin Only Guard
  if (rawRole !== "ADMIN") {
    redirect("/admin/schedule");
  }

  const currentYear = new Date().getFullYear();
  const res = await getYearlyAttendanceMatrixAction(currentYear);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <ScheduleMatrixClient
        year={res.year || currentYear}
        sundayDates={res.sundayDates || []}
        initialRows={res.memberRows || []}
      />
    </div>
  );
}