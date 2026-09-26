// src/app/actions/scheduleAction.ts
"use server";

import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/mongodb";
import { SundaySchedule } from "@/models/SundaySchedule";
import TeamMember from "@/models/TeamMember";
import { auth } from "@/lib/auth";
import { getNextOrCurrentSunday } from "@/lib/sundayDate";
import { getCachedSundayScheduleConfig } from "@/lib/settings/scheduleSettings";

const MAX_MEMBERS_PER_SERVICE = 8;

function checkIsMemberBookingAllowed(manualOpen?: boolean): { allowed: boolean; message?: string } {
  if (manualOpen) return { allowed: true };

  // Convert server time to Philippine Time (UTC+8) to prevent UTC day mismatch on Vercel
  const phDateString = new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" });
  const phDate = new Date(phDateString);
  const dayOfWeek = phDate.getDay(); // 0 = Sun, 1 = Mon, 2 = Tue, ... 6 = Sat

  if (dayOfWeek === 1 || dayOfWeek === 2) {
    return {
      allowed: false,
      message: "Member booking opens Wednesday. Monday and Tuesday are reserved for Team Leaders.",
    };
  }

  if (dayOfWeek === 0) {
    return {
      allowed: false,
      message: "Booking is closed on Sundays for service operations.",
    };
  }

  return { allowed: true };
}

export async function getSundayScheduleAction(customDate?: string) {
  try {
    await dbConnect();
    const sundayDate = customDate || getNextOrCurrentSunday();

    let schedule = await SundaySchedule.findOne({ sundayDate }).lean();
    if (!schedule) {
      schedule = await SundaySchedule.create({
        sundayDate,
        isRegistrationOpen: false,
        attendees: [],
      });
      schedule = JSON.parse(JSON.stringify(schedule));
    } else {
      schedule.attendees = schedule.attendees || [];
      schedule = JSON.parse(JSON.stringify(schedule));
    }

    // Include nickname in selection and sort primarily by nickname
    const rawMembers = await TeamMember.find({ active: true })
      .select("name nickname groupName")
      .sort({ nickname: 1, name: 1 })
      .lean();

    const teamMembers = rawMembers.map((m: any) => ({
      _id: String(m._id),
      name: m.name,
      nickname: m.nickname?.trim() || "",
      displayName: m.nickname?.trim() || m.name,
      groupName: m.groupName || "Members",
      isLeader: m.groupName === "Team Leaders",
    }));

    // Check leadership against both name and nickname
    const leaderIdentifierSet = new Set(
      teamMembers
        .filter((m: any) => m.isLeader)
        .flatMap((m: any) => [m.name.toLowerCase(), m.displayName.toLowerCase()])
    );

    const annotatedAttendees = (schedule.attendees || []).map((att: any) => ({
      ...att,
      isLeader: leaderIdentifierSet.has(att.name?.toLowerCase()),
    }));

    const bookingStatus = checkIsMemberBookingAllowed(schedule.isRegistrationOpen);

    return {
      success: true,
      sundayDate,
      schedule: {
        ...schedule,
        attendees: annotatedAttendees,
      },
      isMemberBookingOpen: bookingStatus.allowed,
      bookingStatusMessage: bookingStatus.message || "",
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
}) {
  try {
    await dbConnect();
    const { sundayDate, name, memberId, service, reason } = payload;

    if (!name || !service) {
      return { success: false, error: "Please choose your name and service time." };
    }

    let schedule = await SundaySchedule.findOne({ sundayDate });
    if (!schedule) {
      schedule = await SundaySchedule.create({ sundayDate, attendees: [] });
    }

    const session = await auth();
    const isLeaderOrAdmin = ["ADMIN", "TEAM_LEADER"].includes(
      String((session?.user as any)?.role || "").toUpperCase()
    );

    const trimmedInputName = name.trim();

    // Look up member by nickname or name to standardize
    const matchedMember = await TeamMember.findOne({
      active: true,
      $or: [{ nickname: trimmedInputName }, { name: trimmedInputName }],
    }).lean();

    const finalDisplayName = matchedMember?.nickname?.trim() || matchedMember?.name || trimmedInputName;
    const finalMemberId = memberId || (matchedMember ? String(matchedMember._id) : "");

    // Check leader list by nickname and name
    const rawMembers = await TeamMember.find({ active: true }).select("name nickname groupName").lean();
    const leaderIdentifiers = rawMembers
      .filter((m: any) => m.groupName === "Team Leaders")
      .flatMap((m: any) => [m.name.toLowerCase(), (m.nickname || "").toLowerCase()])
      .filter(Boolean);

    const isCurrentPersonLeader =
      leaderIdentifiers.includes(trimmedInputName.toLowerCase()) ||
      leaderIdentifiers.includes(finalDisplayName.toLowerCase());

    if (!isLeaderOrAdmin && !isCurrentPersonLeader) {
      const checkWindow = checkIsMemberBookingAllowed(schedule.isRegistrationOpen);
      if (!checkWindow.allowed) {
        return { success: false, error: checkWindow.message };
      }
    }

    if (!Array.isArray(schedule.attendees)) schedule.attendees = [];

    // Find existing entry matching either nickname, full name, or memberId
    const existingIndex = schedule.attendees.findIndex((a: any) => {
      const attName = (a.name || "").toLowerCase();
      return (
        attName === trimmedInputName.toLowerCase() ||
        attName === finalDisplayName.toLowerCase() ||
        (finalMemberId && a.memberId === finalMemberId)
      );
    });

    if (existingIndex > -1) {
      const existing = schedule.attendees[existingIndex];
      if (existing.isLockedByLeader && !isLeaderOrAdmin) {
        return {
          success: false,
          error: "This slot is locked by Leadership. Please speak with your Team Leader to adjust.",
        };
      }
    }

    if (service !== "NOT_ATTENDING") {
      const scheduleConfig = await getCachedSundayScheduleConfig();
      const maxMembersLimit = scheduleConfig.maxMembersPerService || 8;
      const maxLeadersLimit = scheduleConfig.maxLeadersPerService || 2;

      // 1. Leader capacity check
      if (isCurrentPersonLeader) {
        const currentLeadersInService = schedule.attendees.filter(
          (a: any, idx: number) =>
            a.service === service &&
            leaderIdentifiers.includes(a.name.toLowerCase()) &&
            idx !== existingIndex
        ).length;

        if (currentLeadersInService >= maxLeadersLimit) {
          return {
            success: false,
            error: `The ${service} service already has ${maxLeadersLimit} Team Leaders assigned.`,
          };
        }
      }

      // 2. Member capacity check
      const currentMembersInService = schedule.attendees.filter(
        (a: any, idx: number) =>
          a.service === service &&
          !leaderIdentifiers.includes(a.name.toLowerCase()) &&
          idx !== existingIndex
      ).length;

      if (!isCurrentPersonLeader && currentMembersInService >= maxMembersLimit) {
        return {
          success: false,
          error: `The ${service} service has reached its ${maxMembersLimit}-member limit.`,
        };
      }
    }

    const attendeeRecord = {
      memberId: finalMemberId,
      name: finalDisplayName,
      service,
      reason: service === "NOT_ATTENDING" ? (reason?.trim() || "Not available") : "",
      isLockedByLeader: existingIndex > -1 ? schedule.attendees[existingIndex].isLockedByLeader : false,
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
    revalidatePath("/sunday-schedule");
    revalidatePath("/admin/schedule");

    return {
      success: true,
      message: `Successfully set slot for ${service}!`,
      attendee: JSON.parse(JSON.stringify(attendeeRecord)),
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to save slot." };
  }
}

export async function toggleMemberBookingWindowAction(payload: {
  sundayDate: string;
  open: boolean;
}) {
  try {
    const session = await auth();
    const role = String((session?.user as any)?.role || "").toUpperCase();
    if (!["ADMIN", "TEAM_LEADER"].includes(role)) {
      return { success: false, error: "Unauthorized." };
    }

    await dbConnect();
    const schedule = await SundaySchedule.findOne({ sundayDate: payload.sundayDate });
    if (!schedule) return { success: false, error: "Schedule not found." };

    schedule.isRegistrationOpen = payload.open;
    await schedule.save();

    revalidatePath("/schedule");
    revalidatePath("/sunday-schedule");
    revalidatePath("/admin/schedule");

    return {
      success: true,
      isOpen: schedule.isRegistrationOpen,
      message: schedule.isRegistrationOpen
        ? "Member booking is now officially open!"
        : "Member booking reverted to standard schedule window.",
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update booking window." };
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

    if (!Array.isArray(schedule.attendees)) schedule.attendees = [];

    const trimmedInputName = name.trim();
    const matchedMember = await TeamMember.findOne({
      active: true,
      $or: [{ nickname: trimmedInputName }, { name: trimmedInputName }],
    }).lean();

    const finalDisplayName = matchedMember?.nickname?.trim() || matchedMember?.name || trimmedInputName;
    const finalMemberId = memberId || (matchedMember ? String(matchedMember._id) : "");

    const existingIndex = schedule.attendees.findIndex((a: any) => {
      const attName = (a.name || "").toLowerCase();
      return (
        attName === trimmedInputName.toLowerCase() ||
        attName === finalDisplayName.toLowerCase() ||
        (finalMemberId && a.memberId === finalMemberId)
      );
    });

    const record = {
      memberId: finalMemberId,
      name: finalDisplayName,
      service,
      reason: reason?.trim() || "",
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
    revalidatePath("/sunday-schedule");
    revalidatePath("/admin/schedule");

    return {
      success: true,
      message: `${finalDisplayName} assigned to ${service} by ${leaderName}.`,
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
      if (!Array.isArray(schedule.attendees)) schedule.attendees = [];
      const target = payload.name.toLowerCase();
      schedule.attendees = schedule.attendees.filter(
        (a: any) => a.name.toLowerCase() !== target
      );

      schedule.markModified("attendees");
      await schedule.save();
    }

    revalidatePath("/schedule");
    revalidatePath("/sunday-schedule");
    revalidatePath("/admin/schedule");

    return {
      success: true,
      message: `Removed ${payload.name} from schedule.`,
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

    const target = payload.name.toLowerCase();
    const attendee = schedule.attendees.find(
      (a: any) => a.name.toLowerCase() === target
    );

    if (!attendee) {
      return { success: false, error: "Attendee not found." };
    }

    attendee.isLockedByLeader = !attendee.isLockedByLeader;
    schedule.markModified("attendees");
    await schedule.save();

    revalidatePath("/schedule");
    revalidatePath("/sunday-schedule");
    revalidatePath("/admin/schedule");

    return {
      success: true,
      isLocked: attendee.isLockedByLeader,
      message: `${payload.name} is now ${attendee.isLockedByLeader ? "locked" : "unlocked"}.`,
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update lock status." };
  }
}

export async function swapAttendeesAction(payload: {
  sundayDate: string;
  sourceName: string;
  targetName: string;
}) {
  try {
    const session = await auth();
    const rawRole = String((session?.user as any)?.role || "").trim().toUpperCase();
    const userRole = rawRole.replace(/[\s-]+/g, "_");

    if (userRole !== "ADMIN" && userRole !== "TEAM_LEADER") {
      return { success: false, error: "Unauthorized. Team Leader or Admin access required." };
    }

    await dbConnect();
    const { sundayDate, sourceName, targetName } = payload;
    const leaderName = session?.user?.name || "Team Leader";

    const schedule = await SundaySchedule.findOne({ sundayDate });
    if (!schedule || !Array.isArray(schedule.attendees)) {
      return { success: false, error: "Schedule not found." };
    }

    const sLower = sourceName.trim().toLowerCase();
    const tLower = targetName.trim().toLowerCase();

    const sourceIdx = schedule.attendees.findIndex((a: any) => (a.name || "").toLowerCase() === sLower);
    const targetIdx = schedule.attendees.findIndex((a: any) => (a.name || "").toLowerCase() === tLower);

    if (sourceIdx === -1 || targetIdx === -1) {
      return { success: false, error: "One or both attendees could not be found." };
    }

    // Direct swap of service slots
    const sourceService = schedule.attendees[sourceIdx].service;
    const targetService = schedule.attendees[targetIdx].service;

    schedule.attendees[sourceIdx].service = targetService;
    schedule.attendees[sourceIdx].isLockedByLeader = true;
    schedule.attendees[sourceIdx].assignedBy = leaderName;
    schedule.attendees[sourceIdx].updatedAt = new Date();

    schedule.attendees[targetIdx].service = sourceService;
    schedule.attendees[targetIdx].isLockedByLeader = true;
    schedule.attendees[targetIdx].assignedBy = leaderName;
    schedule.attendees[targetIdx].updatedAt = new Date();

    schedule.markModified("attendees");
    await schedule.save();

    revalidatePath("/schedule");
    revalidatePath("/sunday-schedule");

    return {
      success: true,
      message: `Swapped ${sourceName} (${targetService}) with ${targetName} (${sourceService}).`,
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to swap attendees." };
  }
}