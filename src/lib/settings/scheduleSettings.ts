// src/lib/settings/scheduleSettings.ts
import { unstable_cache } from "next/cache";
import SystemSetting from "@/models/SystemSetting";
import dbConnect from "../mongodb";

export interface SundayScheduleConfig {
  maxMembersPerService: number;
  maxLeadersPerService: number;
}

export const SUNDAY_SCHEDULE_SETTING_KEY = "SUNDAY_SCHEDULE_CONFIG";

export const DEFAULT_SUNDAY_SCHEDULE_CONFIG: SundayScheduleConfig = {
  maxMembersPerService: 8,
  maxLeadersPerService: 2,
};

export const getCachedSundayScheduleConfig = unstable_cache(
  async (): Promise<SundayScheduleConfig> => {
    try {
      await dbConnect();
      const doc = await SystemSetting.findOne({
        key: SUNDAY_SCHEDULE_SETTING_KEY,
      }).lean();

      if (!doc?.value) return DEFAULT_SUNDAY_SCHEDULE_CONFIG;

      return {
        maxMembersPerService:
          typeof doc.value.maxMembersPerService === "number"
            ? doc.value.maxMembersPerService
            : DEFAULT_SUNDAY_SCHEDULE_CONFIG.maxMembersPerService,
        maxLeadersPerService:
          typeof doc.value.maxLeadersPerService === "number"
            ? doc.value.maxLeadersPerService
            : DEFAULT_SUNDAY_SCHEDULE_CONFIG.maxLeadersPerService,
      };
    } catch (err) {
      console.error("Failed to load schedule config from DB, using defaults:", err);
      return DEFAULT_SUNDAY_SCHEDULE_CONFIG;
    }
  },
  ["sunday-schedule-config"],
  {
    tags: ["system-settings", "schedule-config"],
    revalidate: 86400,
  }
);