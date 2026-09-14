// src/app/actions/financeActions.ts
"use server";

import dbConnect from "@/lib/mongodb";
import { auth } from "@/lib/auth";
import FinanceSettings from "@/models/FinanceSettings";
import Expense from "@/models/Expense";
import Contribution from "@/models/Contribution";
import User from "@/models/User";
import { revalidatePath } from "next/cache";

function isAuthorizedUser(roleRaw?: string) {
  const role = String(roleRaw || "").toUpperCase().replace(/[\s-]+/g, "_");
  return role === "ADMIN" || role === "FINANCE_LEADER";
}

async function getSessionUserId(sessionUser: any) {
  if (sessionUser?.id) return sessionUser.id;
  if (sessionUser?._id) return sessionUser._id;

  if (sessionUser?.email) {
    const found = await User.findOne({ email: sessionUser.email }).select("_id").lean();
    if (found) return found._id;
  }

  if (sessionUser?.username || sessionUser?.name) {
    const found = await User.findOne({
      $or: [
        { username: sessionUser.username || sessionUser.name },
        { fullName: sessionUser.name },
      ],
    }).select("_id").lean();
    if (found) return found._id;
  }

  return null;
}

export async function getFinanceOverviewAction() {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized." };
    }

    if (!isAuthorizedUser((session.user as any).role)) {
      return { success: false, error: "Insufficient permissions to view finances." };
    }

    await dbConnect();

    // 1. Fetch or initialize baseline settings
    let settings = await FinanceSettings.findOne().lean();
    if (!settings) {
      const created = await FinanceSettings.create({ funds2025: 0, remainingFunds2026: 0 });
      settings = created.toObject();
    }

    // 2. Aggregate total contributions (Oct 2026 onwards)
    const contribAggregation = await Contribution.aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          totalCount: { $sum: 1 },
        },
      },
    ]);

    const totalContributions = contribAggregation[0]?.totalAmount || 0;
    const totalContributionRecords = contribAggregation[0]?.totalCount || 0;

    // 3. Aggregate total expenses
    const expenseAggregation = await Expense.aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          totalCount: { $sum: 1 },
        },
      },
    ]);

    const totalExpenses = expenseAggregation[0]?.totalAmount || 0;
    const totalExpenseRecords = expenseAggregation[0]?.totalCount || 0;

    // 4. Fetch chronological expenses list
    const expenses = await Expense.find()
      .sort({ expenseDate: -1, createdAt: -1 })
      .populate("recordedBy", "fullName username role")
      .lean();

    // Normalize legacy records missing expenseDate
    const normalizedExpenses = expenses.map((exp: any) => ({
      ...exp,
      expenseDate: exp.expenseDate || exp.createdAt,
    }));

    return {
      success: true,
      data: {
        funds2025: Number(settings.funds2025) || 0,
        remainingFunds2026: Number(settings.remainingFunds2026) || 0,
        totalContributions,
        totalContributionRecords,
        totalExpenses,
        totalExpenseRecords,
        expenses: JSON.parse(JSON.stringify(normalizedExpenses)),
      },
    };
  } catch (err: any) {
    console.error("getFinanceOverviewAction error:", err);
    return { success: false, error: err.message || "Failed to fetch finance overview." };
  }
}

export async function updateFinanceSettingsAction(payload: {
  funds2025: number;
  remainingFunds2026: number;
}) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized." };
    }

    if (!isAuthorizedUser((session.user as any).role)) {
      return { success: false, error: "Insufficient permissions." };
    }

    const { funds2025, remainingFunds2026 } = payload;
    if (isNaN(funds2025) || funds2025 < 0 || isNaN(remainingFunds2026) || remainingFunds2026 < 0) {
      return { success: false, error: "Reserve funds must be valid non-negative numbers." };
    }

    await dbConnect();

    const resolvedUserId = await getSessionUserId(session.user);

    const updated = await FinanceSettings.findOneAndUpdate(
      {},
      {
        $set: {
          funds2025,
          remainingFunds2026,
          updatedBy: resolvedUserId || null,
        },
      },
      { new: true, upsert: true }
    ).lean();

    revalidatePath("/finances");
    return { success: true, settings: JSON.parse(JSON.stringify(updated)) };
  } catch (err: any) {
    console.error("updateFinanceSettingsAction error:", err);
    return { success: false, error: err.message || "Failed to update reserve funds." };
  }
}

export async function recordExpenseAction(payload: {
  expenseName: string;
  amount: number;
  expenseDate: string;
  notes?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized." };
    }

    if (!isAuthorizedUser((session.user as any).role)) {
      return { success: false, error: "Insufficient permissions." };
    }

    const { expenseName, amount, expenseDate, notes } = payload;

    if (!expenseName || !expenseName.trim()) {
      return { success: false, error: "Expense description is required." };
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return { success: false, error: "Amount must be greater than zero." };
    }

    if (!expenseDate) {
      return { success: false, error: "Transaction date is required." };
    }

    const parsedDate = new Date(expenseDate);
    if (isNaN(parsedDate.getTime())) {
      return { success: false, error: "Invalid transaction date provided." };
    }

    await dbConnect();

    const resolvedUserId = await getSessionUserId(session.user);

    const expense = await Expense.create({
      expenseName: expenseName.trim(),
      amount: numericAmount,
      expenseDate: parsedDate,
      notes: notes?.trim() || "",
      recordedBy: resolvedUserId || null,
    });

    revalidatePath("/finances");
    return { success: true, expense: JSON.parse(JSON.stringify(expense)) };
  } catch (err: any) {
    console.error("recordExpenseAction error:", err);
    return { success: false, error: err.message || "Failed to record disbursement." };
  }
}

export async function updateExpenseAction(payload: {
  expenseId: string;
  expenseName: string;
  amount: number;
  expenseDate: string;
  notes?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized." };
    }

    if (!isAuthorizedUser((session.user as any).role)) {
      return { success: false, error: "Insufficient permissions." };
    }

    const { expenseId, expenseName, amount, expenseDate, notes } = payload;

    if (!expenseId) {
      return { success: false, error: "Expense ID is required." };
    }

    if (!expenseName || !expenseName.trim()) {
      return { success: false, error: "Expense description is required." };
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return { success: false, error: "Amount must be greater than zero." };
    }

    const parsedDate = new Date(expenseDate);
    if (isNaN(parsedDate.getTime())) {
      return { success: false, error: "Invalid transaction date provided." };
    }

    await dbConnect();

    const resolvedUserId = await getSessionUserId(session.user);

    const updateDoc: any = {
      expenseName: expenseName.trim(),
      amount: numericAmount,
      expenseDate: parsedDate,
      notes: notes?.trim() || "",
    };

    if (resolvedUserId) {
      updateDoc.recordedBy = resolvedUserId;
    }

    const updated = await Expense.findByIdAndUpdate(
      expenseId,
      { $set: updateDoc },
      { new: true }
    )
      .populate("recordedBy", "fullName username role")
      .lean();

    if (!updated) {
      return { success: false, error: "Disbursement record not found." };
    }

    revalidatePath("/finances");
    return { success: true, expense: JSON.parse(JSON.stringify(updated)) };
  } catch (err: any) {
    console.error("updateExpenseAction error:", err);
    return { success: false, error: err.message || "Failed to update disbursement." };
  }
}

export async function deleteExpenseAction(expenseId: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized." };
    }

    if (!isAuthorizedUser((session.user as any).role)) {
      return { success: false, error: "Insufficient permissions." };
    }

    if (!expenseId) {
      return { success: false, error: "Expense ID is required." };
    }

    await dbConnect();

    const deleted = await Expense.findByIdAndDelete(expenseId);
    if (!deleted) {
      return { success: false, error: "Expense record not found or already deleted." };
    }

    revalidatePath("/finances");
    return { success: true };
  } catch (err: any) {
    console.error("deleteExpenseAction error:", err);
    return { success: false, error: err.message || "Failed to remove disbursement record." };
  }
}