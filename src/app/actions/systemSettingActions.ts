// src/app/actions/systemSettingActions.ts
"use server";

import dbConnect from "@/lib/mongodb";
import { auth } from "@/lib/auth";
import SystemSetting from "@/models/SystemSetting";
import User from "@/models/User";
import { revalidateTag, revalidatePath } from "next/cache";
import {
  SUNDAY_SCHEDULE_SETTING_KEY,
  DEFAULT_SUNDAY_SCHEDULE_CONFIG,
  getCachedSundayScheduleConfig,
} from "@/lib/settings/scheduleSettings";

function isAuthorizedLeader(roleRaw?: string) {
  const role = String(roleRaw || "").toUpperCase().replace(/[\s-]+/g, "_");
  return role === "ADMIN" || role === "TEAM_LEADER";
}

async function getSessionUserId(sessionUser: any) {
  if (sessionUser?.id) return sessionUser.id;
  if (sessionUser?._id) return sessionUser._id;
  if (sessionUser?.email) {
    const found = await User.findOne({ email: sessionUser.email }).select("_id").lean();
    if (found) return found._id;
  }
  return null;
}

export async function getScheduleConfigAction() {
  try {
    const config = await getCachedSundayScheduleConfig();
    return { success: true, config };
  } catch (err: any) {
    return { success: false, error: err.message, config: DEFAULT_SUNDAY_SCHEDULE_CONFIG };
  }
}

export async function updateScheduleCapacityAction(payload: {
  maxMembersPerService: number;
  maxLeadersPerService?: number;
}) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized." };
    }

    if (!isAuthorizedLeader((session.user as any).role)) {
      return { success: false, error: "Only Team Leaders or Admins can adjust capacities." };
    }

    const { maxMembersPerService, maxLeadersPerService = 2 } = payload;
    const members = Number(maxMembersPerService);
    const leaders = Number(maxLeadersPerService);

    if (isNaN(members) || members < 1 || members > 50) {
      return { success: false, error: "Member slots must be between 1 and 50." };
    }

    await dbConnect();
    const resolvedUserId = await getSessionUserId(session.user);

    await SystemSetting.findOneAndUpdate(
      { key: SUNDAY_SCHEDULE_SETTING_KEY },
      {
        $set: {
          category: "ATTENDANCE",
          description: "Capacity limits and configuration for Sunday Service slots",
          value: {
            maxMembersPerService: members,
            maxLeadersPerService: leaders,
          },
          updatedBy: resolvedUserId || null,
        },
      },
      { upsert: true, new: true }
    );

    // Bust Next.js memory cache tag and revalidate schedule pages
    revalidatePath("/schedule");
    revalidatePath("/sunday-schedule");

    return { success: true, message: `Capacity updated to ${members} members per service.` };
  } catch (err: any) {
    console.error("updateScheduleCapacityAction error:", err);
    return { success: false, error: err.message || "Failed to update configuration." };
  }
}