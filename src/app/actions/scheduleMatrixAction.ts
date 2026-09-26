// src/app/actions/scheduleMatrixAction.ts
"use server";

import dbConnect from "@/lib/mongodb";
import { SundaySchedule } from "@/models/SundaySchedule";
import TeamMember from "@/models/TeamMember";
import { auth } from "@/lib/auth";

export interface MemberMatrixRow {
  memberId: string;
  name: string;
  nickname: string;
  displayName: string;
  groupName: string;
  isLeader: boolean;
  attendanceMap: Record<string, { service: "10AM" | "1PM" | "4PM" | "NOT_ATTENDING"; reason?: string }>;
  stats: {
    totalSundaysRecorded: number;
    attendedCount: number;
    absentCount: number;
    attendanceRate: number; // 0 to 100
    slotCounts: { "10AM": number; "1PM": number; "4PM": number };
    preferredSlot: string; // "10AM", "1PM", "4PM", or "Rotating"
    consecutiveAbsences: number;
    trendLabel: "Consistent" | "Fixed Slot" | "Rotating" | "Needs Follow-up" | "Inactive";
    trendColor: string;
  };
}

export async function getYearlyAttendanceMatrixAction(year: number = 2026) {
  try {
    const session = await auth();
    const userRole = String((session?.user as any)?.role || "").toUpperCase().replace(/[\s-]+/g, "_");

    if (userRole !== "ADMIN") {
      return { success: false, error: "Unauthorized. Admin access required." };
    }

    await dbConnect();

    // 1. Fetch all Sunday schedules for this year
    const schedules = await SundaySchedule.find({
      sundayDate: { $regex: `^${year}-` },
    })
      .sort({ sundayDate: 1 })
      .lean();

    // Distinct list of Sundays sorted chronologically
    const sundayDates = schedules.map((s: any) => s.sundayDate);

    // 2. Fetch all active members
    const members = await TeamMember.find({ active: true })
      .select("_id name nickname displayName groupName")
      .sort({ name: 1 })
      .lean();

    // 3. Build lookup maps for nickname/name normalization
    const memberRows: MemberMatrixRow[] = members.map((m: any) => {
      const memberId = String(m._id);
      const nickname = m.nickname?.trim() || "";
      const displayName = nickname || m.displayName?.trim() || m.name;
      const isLeader = m.groupName === "Team Leaders";

      const validNames = new Set([
        m.name?.toLowerCase().trim(),
        nickname?.toLowerCase(),
        m.displayName?.toLowerCase().trim(),
      ].filter(Boolean));

      const attendanceMap: Record<string, { service: "10AM" | "1PM" | "4PM" | "NOT_ATTENDING"; reason?: string }> = {};

      let attendedCount = 0;
      let absentCount = 0;
      const slotCounts = { "10AM": 0, "1PM": 0, "4PM": 0 };

      // Map through all Sundays
      sundayDates.forEach((sDate: string) => {
        const sched = schedules.find((s: any) => s.sundayDate === sDate);
        if (!sched || !Array.isArray(sched.attendees)) return;

        const attendeeRecord = sched.attendees.find((att: any) => {
          if (att.memberId && String(att.memberId) === memberId) return true;
          const attName = (att.name || "").toLowerCase().trim();
          return validNames.has(attName);
        });

        if (attendeeRecord) {
          attendanceMap[sDate] = {
            service: attendeeRecord.service,
            reason: attendeeRecord.reason,
          };

          if (attendeeRecord.service === "NOT_ATTENDING") {
            absentCount++;
          } else if (["10AM", "1PM", "4PM"].includes(attendeeRecord.service)) {
            attendedCount++;
            slotCounts[attendeeRecord.service as "10AM" | "1PM" | "4PM"]++;
          }
        }
      });

      const totalSundaysRecorded = attendedCount + absentCount;
      const attendanceRate = totalSundaysRecorded > 0 ? Math.round((attendedCount / totalSundaysRecorded) * 100) : 0;

      // Calculate recent consecutive absences (from most recent Sunday backwards)
      let consecutiveAbsences = 0;
      for (let i = sundayDates.length - 1; i >= 0; i--) {
        const sDate = sundayDates[i];
        const status = attendanceMap[sDate];
        if (status?.service === "NOT_ATTENDING") {
          consecutiveAbsences++;
        } else if (status) {
          break; // attended a service
        }
      }

      // Determine Preferred Service Slot & Rotation
      let preferredSlot = "Rotating";
      const totalServices = attendedCount;
      if (totalServices > 0) {
        if (slotCounts["10AM"] / totalServices >= 0.7) preferredSlot = "10AM Fixed";
        else if (slotCounts["1PM"] / totalServices >= 0.7) preferredSlot = "1PM Fixed";
        else if (slotCounts["4PM"] / totalServices >= 0.7) preferredSlot = "4PM Fixed";
      }

      // Calculate Trend Label
      let trendLabel: MemberMatrixRow["stats"]["trendLabel"] = "Consistent";
      let trendColor = "bg-emerald-50 text-emerald-700 border-emerald-200";

      if (totalSundaysRecorded === 0) {
        trendLabel = "Inactive";
        trendColor = "bg-slate-50 text-slate-400 border-slate-200";
      } else if (consecutiveAbsences >= 3 || attendanceRate < 50) {
        trendLabel = "Needs Follow-up";
        trendColor = "bg-rose-50 text-rose-600 border-rose-200";
      } else if (preferredSlot.includes("Fixed")) {
        trendLabel = "Fixed Slot";
        trendColor = "bg-blue-50 text-blue-700 border-blue-200";
      } else {
        trendLabel = "Rotating";
        trendColor = "bg-purple-50 text-purple-700 border-purple-200";
      }

      return {
        memberId,
        name: m.name,
        nickname,
        displayName,
        groupName: m.groupName || "Members",
        isLeader,
        attendanceMap,
        stats: {
          totalSundaysRecorded,
          attendedCount,
          absentCount,
          attendanceRate,
          slotCounts,
          preferredSlot,
          consecutiveAbsences,
          trendLabel,
          trendColor,
        },
      };
    });

    return {
      success: true,
      year,
      sundayDates,
      memberRows,
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to load yearly matrix." };
  }
}