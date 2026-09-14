// src/app/actions/contributionActions.ts
"use server";

import dbConnect from "@/lib/mongodb";
import Contribution from "@/models/Contribution";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

const BASELINE_YEAR = 2026;
const BASELINE_MONTH = 10; // October 2026 baseline

// Helper: Calculate next month and handle year overflow
function getNextMonth(year: number, month: number) {
  if (month === 12) {
    return { year: year + 1, month: 1 };
  }
  return { year, month: month + 1 };
}

// Fetch member's contribution history and current coverage status
export async function getMemberContributionHistoryAction(memberId: string) {
  try {
    const session = await auth();
    const userRole = String((session?.user as any)?.role || "").toUpperCase();

    if (userRole !== "ADMIN" && userRole !== "FINANCE_LEADER") {
      return { success: false, error: "Unauthorized access." };
    }

    await dbConnect();

    const history = await Contribution.find({ memberId })
      .sort({ year: -1, month: -1 })
      .populate("recordedBy", "fullName username")
      .lean();

    // Determine the latest paid month
    let latestPaidYear: number | null = null;
    let latestPaidMonth: number | null = null;

    if (history.length > 0) {
      latestPaidYear = history[0].year;
      latestPaidMonth = history[0].month;
    }

    // Determine next month that needs to be paid
    let nextDueYear = BASELINE_YEAR;
    let nextDueMonth = BASELINE_MONTH;

    if (latestPaidYear !== null && latestPaidMonth !== null) {
      // If latest paid is at or after baseline, start from month after latest paid
      if (
        latestPaidYear > BASELINE_YEAR ||
        (latestPaidYear === BASELINE_YEAR && latestPaidMonth >= BASELINE_MONTH)
      ) {
        const next = getNextMonth(latestPaidYear, latestPaidMonth);
        nextDueYear = next.year;
        nextDueMonth = next.month;
      }
    }

    return {
      success: true,
      history: JSON.parse(JSON.stringify(history)),
      latestPaid: latestPaidYear
        ? { year: latestPaidYear, month: latestPaidMonth }
        : null,
      nextDue: { year: nextDueYear, month: nextDueMonth },
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to load contributions." };
  }
}

// Record a new contribution payment
export async function recordContributionAction(data: {
  memberId: string;
  amount: number;
  paymentMethod?: "CASH" | "GCASH" | "BANK_TRANSFER" | "OTHER";
  notes?: string;
}) {
  try {
    const session = await auth();
    const user = session?.user as any;
    const userRole = String(user?.role || "").toUpperCase();

    if (userRole !== "ADMIN" && userRole !== "FINANCE_LEADER") {
      return { success: false, error: "Unauthorized. Admin or Finance Leader role required." };
    }

    const { memberId, amount, paymentMethod = "CASH", notes } = data;

    if (!memberId) {
      return { success: false, error: "Member ID is required." };
    }

    if (!amount || amount <= 0 || amount % 100 !== 0) {
      return { success: false, error: "Contribution amount must be a positive multiple of ₱100." };
    }

    await dbConnect();

    // 1. Find the latest paid month for this member
    const latestContribution = await Contribution.findOne({ memberId })
      .sort({ year: -1, month: -1 })
      .lean();

    let startYear = BASELINE_YEAR;
    let startMonth = BASELINE_MONTH;

    if (latestContribution) {
      if (
        latestContribution.year > BASELINE_YEAR ||
        (latestContribution.year === BASELINE_YEAR && latestContribution.month >= BASELINE_MONTH)
      ) {
        const next = getNextMonth(latestContribution.year, latestContribution.month);
        startYear = next.year;
        startMonth = next.month;
      }
    }

    // 2. Generate documents for each ₱100 increment
    const monthsCount = amount / 100;
    const batchId = crypto.randomUUID();
    const recordsToInsert = [];

    let currentYear = startYear;
    let currentMonth = startMonth;

    for (let i = 0; i < monthsCount; i++) {
      recordsToInsert.push({
        memberId,
        year: currentYear,
        month: currentMonth,
        amount: 100.0,
        batchId,
        paymentMethod,
        notes: notes?.trim() || null,
        recordedBy: user.id || null,
      });

      const next = getNextMonth(currentYear, currentMonth);
      currentYear = next.year;
      currentMonth = next.month;
    }

    await Contribution.insertMany(recordsToInsert);

    revalidatePath("/connect-team");

    return {
      success: true,
      monthsCovered: monthsCount,
      startPeriod: { year: startYear, month: startMonth },
      endPeriod: {
        year: recordsToInsert[recordsToInsert.length - 1].year,
        month: recordsToInsert[recordsToInsert.length - 1].month,
      },
    };
  } catch (error: any) {
    if (error.code === 11000) {
      return {
        success: false,
        error: "A payment for one of these months has already been recorded.",
      };
    }
    return { success: false, error: error.message || "Failed to record contribution." };
  }
}