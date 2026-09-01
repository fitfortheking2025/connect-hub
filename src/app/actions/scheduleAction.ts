// src/app/actions/scheduleAction.ts
"use server";

import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/mongodb";
import { SundaySchedule } from "@/models/SundaySchedule";
import TeamMember from "@/models/TeamMember";
import { auth } from "@/lib/auth";
import { getNextOrCurrentSunday } from "@/lib/sundayDate";

const MAX_PER_SERVICE = 8;

function generateEditToken(name: string): string {
  const cleanName = name.replace(/[^a-zA-Z]/g, "").slice(0, 4).toUpperCase();
  const rand = Math.floor(100 + Math.random() * 900);
  return `${cleanName}${rand}`;
}

export async function getSundayScheduleAction(customDate?: string) {
  try {
    await dbConnect();
    const sundayDate = customDate || getNextOrCurrentSunday();

    let schedule = await SundaySchedule.findOne({ sundayDate }).lean();
    if (!schedule) {
      schedule = await SundaySchedule.create({
        sundayDate,
        attendees: [],
      });
      schedule = JSON.parse(JSON.stringify(schedule));
    } else {
      schedule.attendees = schedule.attendees || [];
      schedule = JSON.parse(JSON.stringify(schedule));
    }

    const rawMembers = await TeamMember.find({ active: true })
      .select("name")
      .sort({ name: 1 })
      .lean();

    const teamMembers = rawMembers.map((m: any) => ({
      _id: String(m._id),
      name: m.name,
    }));

    return {
      success: true,
      sundayDate,
      schedule,
      teamMembers: JSON.parse(JSON.stringify(teamMembers)),
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to load schedule." };
  }
}

export async function plotSundayServiceAction(payload: {
  sundayDate: string;
  name: string;
  memberId?: string;
  service: "10AM" | "1PM" | "4PM" | "NOT_ATTENDING";
  reason?: string;
  editToken?: string;
}) {
  try {
    await dbConnect();
    const { sundayDate, name, memberId, service, reason, editToken } = payload;

    if (!name || !service) {
      return { success: false, error: "Please provide your name and select a service." };
    }

    let schedule = await SundaySchedule.findOne({ sundayDate });
    if (!schedule) {
      schedule = await SundaySchedule.create({ sundayDate, attendees: [] });
    }

    if (!Array.isArray(schedule.attendees)) schedule.attendees = [] as any;

    const trimmedName = name.trim();
    const existingIndex = schedule.attendees.findIndex(
      (a) => a.name.toLowerCase() === trimmedName.toLowerCase() || (memberId && a.memberId === memberId)
    );

    let assignedToken = editToken;

    if (existingIndex > -1) {
      const existing = schedule.attendees[existingIndex];

      if (existing.isLockedByLeader) {
        return {
          success: false,
          error: "This slot was locked by Leadership. Please contact your Team Leader to change it.",
        };
      }

      // Strictly require matching passkey for any updates to an existing slot
      const providedToken = String(editToken || "").trim().toUpperCase();
      const storedToken = String(existing.editToken || "").trim().toUpperCase();

      if (storedToken && providedToken !== storedToken) {
        return {
          success: false,
          error: "Invalid or missing Edit Passkey. Please enter the passkey you received when booking.",
        };
      }

      assignedToken = existing.editToken || generateEditToken(trimmedName);
    } else {
      assignedToken = generateEditToken(trimmedName);
    }

    if (service !== "NOT_ATTENDING") {
      const currentCount = schedule.attendees.filter(
        (a, idx) => a.service === service && idx !== existingIndex
      ).length;

      if (currentCount >= MAX_PER_SERVICE) {
        return {
          success: false,
          error: `The ${service} service has already reached 8 members limit.`,
        };
      }
    }

    const attendeeRecord = {
      memberId: memberId || "",
      name: trimmedName,
      service,
      reason: service === "NOT_ATTENDING" ? (reason?.trim() || "Not available") : "",
      editToken: assignedToken!,
      isLockedByLeader: false,
      updatedAt: new Date(),
    };

    if (existingIndex > -1) {
      schedule.attendees[existingIndex] = attendeeRecord as any;
    } else {
      schedule.attendees.push(attendeeRecord as any);
    }

    schedule.markModified("attendees");
    await schedule.save();

    revalidatePath("/schedule");
    revalidatePath("/admin/schedule");
    revalidatePath("/sunday-schedule");

    return {
      success: true,
      message: `Successfully booked for ${service}!`,
      editToken: assignedToken,
      attendee: JSON.parse(JSON.stringify(attendeeRecord)),
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to save selection." };
  }
}

export async function leaderPreAssignAction(payload: {
  sundayDate: string;
  name: string;
  memberId?: string;
  service: "10AM" | "1PM" | "4PM" | "NOT_ATTENDING";
  reason?: string;
  lock?: boolean;
}) {
  try {
    const session = await auth();
    const rawRole = String((session?.user as any)?.role || "").trim().toUpperCase();
    const userRole = rawRole.replace(/[\s-]+/g, "_");

    if (userRole !== "ADMIN" && userRole !== "TEAM_LEADER") {
      return { success: false, error: "Unauthorized. Team Leader or Admin access required." };
    }

    await dbConnect();
    const { sundayDate, name, memberId, service, reason, lock = true } = payload;
    const leaderName = session?.user?.name || "Team Leader";

    let schedule = await SundaySchedule.findOne({ sundayDate });
    if (!schedule) {
      schedule = await SundaySchedule.create({ sundayDate, attendees: [] });
    }

    if (!Array.isArray(schedule.attendees)) schedule.attendees = [] as any;

    const trimmedName = name.trim();
    const existingIndex = schedule.attendees.findIndex(
      (a) => a.name.toLowerCase() === trimmedName.toLowerCase() || (memberId && a.memberId === memberId)
    );

    if (service !== "NOT_ATTENDING") {
      const currentCount = schedule.attendees.filter(
        (a, idx) => a.service === service && idx !== existingIndex
      ).length;

      if (currentCount >= MAX_PER_SERVICE) {
        return {
          success: false,
          error: `The ${service} service has reached capacity (8 max).`,
        };
      }
    }

    const editToken = existingIndex > -1 ? schedule.attendees[existingIndex].editToken : generateEditToken(trimmedName);

    const record = {
      memberId: memberId || "",
      name: trimmedName,
      service,
      reason: reason?.trim() || "",
      editToken,
      isLockedByLeader: Boolean(lock),
      assignedBy: leaderName,
      updatedAt: new Date(),
    };

    if (existingIndex > -1) {
      schedule.attendees[existingIndex] = record as any;
    } else {
      schedule.attendees.push(record as any);
    }

    schedule.markModified("attendees");
    await schedule.save();

    revalidatePath("/schedule");
    revalidatePath("/admin/schedule");
    revalidatePath("/sunday-schedule");

    return {
      success: true,
      message: `${trimmedName} assigned to ${service} by ${leaderName}.`,
      attendee: JSON.parse(JSON.stringify(record)),
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to pre-assign slot." };
  }
}

export async function removeAttendeeAction(payload: { sundayDate: string; name: string }) {
  try {
    const session = await auth();
    const rawRole = String((session?.user as any)?.role || "").trim().toUpperCase();
    const userRole = rawRole.replace(/[\s-]+/g, "_");

    if (userRole !== "ADMIN" && userRole !== "TEAM_LEADER") {
      return { success: false, error: "Unauthorized." };
    }

    await dbConnect();

    const schedule = await SundaySchedule.findOne({ sundayDate: payload.sundayDate });

    if (schedule) {
      if (!Array.isArray(schedule.attendees)) schedule.attendees = [] as any;
      schedule.attendees = schedule.attendees.filter((a) => a.name.toLowerCase() !== payload.name.toLowerCase());

      schedule.markModified("attendees");
      await schedule.save();
    }

    revalidatePath("/schedule");
    revalidatePath("/admin/schedule");
    revalidatePath("/sunday-schedule");

    return { 
      success: true, 
      message: `Removed ${payload.name} from schedule.`
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to remove attendee." };
  }
}

export async function toggleLockAttendeeAction(payload: {
  sundayDate: string;
  name: string;
}) {
  try {
    const session = await auth();
    const rawRole = String((session?.user as any)?.role || "").trim().toUpperCase();
    const userRole = rawRole.replace(/[\s-]+/g, "_");

    if (userRole !== "ADMIN" && userRole !== "TEAM_LEADER") {
      return { success: false, error: "Unauthorized. Team Leader or Admin access required." };
    }

    await dbConnect();
    const schedule = await SundaySchedule.findOne({ sundayDate: payload.sundayDate });
    if (!schedule) {
      return { success: false, error: "Schedule not found." };
    }

    const attendee = schedule.attendees.find(
      (a: any) => a.name.toLowerCase() === payload.name.toLowerCase()
    );

    if (!attendee) {
      return { success: false, error: "Attendee not found." };
    }

    attendee.isLockedByLeader = !attendee.isLockedByLeader;
    schedule.markModified("attendees");
    await schedule.save();

    revalidatePath("/schedule");
    revalidatePath("/admin/schedule");
    revalidatePath("/sunday-schedule");

    return {
      success: true,
      isLocked: attendee.isLockedByLeader,
      message: `${payload.name} is now ${attendee.isLockedByLeader ? "locked" : "unlocked"}.`,
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update lock status." };
  }
}