// src/lib/vipScope.ts
import { IFirstTimer } from "@/models/FirstTimer";

export interface UserScopeContext {
  role?: string;
  assignedAgeGroups?: string[];
  assignedGender?: number | null;
}

export function getVipScopeFilter(user?: UserScopeContext): Record<string, any> {
  if (!user) return { _id: null };

  const role = (user.role || "").toUpperCase();

  // Team Leader & Admin see all records
  if (role === "TEAM_LEADER" || role === "ADMIN" || role === "FINANCE_LEADER") {
    return {};
  }

  // Follow-Up Team: apply assigned age brackets & gender
  const conditions: Record<string, any>[] = [];

  if (user.assignedAgeGroups && user.assignedAgeGroups.length > 0) {
    conditions.push({ ageGroup: { $in: user.assignedAgeGroups } });
  }

  if (user.assignedGender === 0 || user.assignedGender === 1) {
    conditions.push({ gender: user.assignedGender });
  }

  if (conditions.length === 0) {
    return { _id: null };
  }

  return conditions.length === 1 ? conditions[0] : { $and: conditions };
}