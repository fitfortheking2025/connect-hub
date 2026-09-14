// src/app/(portal)/finances/FinancesClient.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Wallet,
  Coins,
  TrendingDown,
  Calendar,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  X,
  CreditCard,
  FileText,
  Clock,
} from "lucide-react";
import {
  updateFinanceSettingsAction,
  recordExpenseAction,
  updateExpenseAction,
  deleteExpenseAction,
} from "@/app/actions/financeActions";

interface FinancesClientProps {
  initialData: {
    funds2025: number;
    remainingFunds2026: number;
    totalContributions: number;
    totalContributionRecords: number;
    totalExpenses: number;
    totalExpenseRecords: number;
    expenses: any[];
  };
}

export default function FinancesClient({ initialData }: FinancesClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [data, setData] = useState(initialData);

  // Modals state
  const [isReservesModalOpen, setIsReservesModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<any | null>(null);

  // Reserve inputs
  const [formFunds2025, setFormFunds2025] = useState<number | "">(initialData.funds2025);
  const [formRemaining2026, setFormRemaining2026] = useState<number | "">(
    initialData.remainingFunds2026
  );

  // Expense form inputs
  const [expenseName, setExpenseName] = useState("");
  const [expenseAmount, setExpenseAmount] = useState<number | "">("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);
  const [expenseNotes, setExpenseNotes] = useState("");

  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      maximumFractionDigits: 0,
    }).format(val || 0);

  const formatDateString = (rawDate: any) => {
    if (!rawDate) return "—";
    const d = new Date(rawDate);
    return isNaN(d.getTime())
      ? "—"
      : d.toLocaleDateString("en-PH", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
  };

  const handleOpenCreateExpense = () => {
    setEditingExpense(null);
    setExpenseName("");
    setExpenseAmount("");
    setExpenseDate(new Date().toISOString().split("T")[0]);
    setExpenseNotes("");
    setFormError(null);
    setIsExpenseModalOpen(true);
  };

  const handleOpenEditExpense = (expense: any) => {
    setEditingExpense(expense);
    setExpenseName(expense.expenseName || "");
    setExpenseAmount(expense.amount || "");
    const dateSource = expense.expenseDate || expense.createdAt;
    const parsed = dateSource ? new Date(dateSource) : new Date();
    setExpenseDate(
      isNaN(parsed.getTime())
        ? new Date().toISOString().split("T")[0]
        : parsed.toISOString().split("T")[0]
    );
    setExpenseNotes(expense.notes || "");
    setFormError(null);
    setIsExpenseModalOpen(true);
  };

  const handleSaveReserves = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);

    const f2025 = Number(formFunds2025) || 0;
    const f2026 = Number(formRemaining2026) || 0;

    startTransition(async () => {
      const res = await updateFinanceSettingsAction({
        funds2025: f2025,
        remainingFunds2026: f2026,
      });

      if (res.success) {
        setData((prev) => ({
          ...prev,
          funds2025: f2025,
          remainingFunds2026: f2026,
        }));
        setIsReservesModalOpen(false);
        setSuccessMsg("Baseline reserve funds updated successfully.");
        router.refresh();
      } else {
        setFormError(res.error || "Failed to update reserve funds.");
      }
    });
  };

  const handleSubmitExpense = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);

    const numAmount = Number(expenseAmount);
    if (!expenseName.trim() || isNaN(numAmount) || numAmount <= 0 || !expenseDate) {
      setFormError("Please fill out all required fields with valid values.");
      return;
    }

    startTransition(async () => {
      if (editingExpense) {
        const res = await updateExpenseAction({
          expenseId: editingExpense._id,
          expenseName,
          amount: numAmount,
          expenseDate,
          notes: expenseNotes,
        });

        if (res.success) {
          setIsExpenseModalOpen(false);
          setEditingExpense(null);
          setSuccessMsg(`Updated disbursement "${expenseName}".`);
          router.refresh();
        } else {
          setFormError(res.error || "Failed to update disbursement.");
        }
      } else {
        const res = await recordExpenseAction({
          expenseName,
          amount: numAmount,
          expenseDate,
          notes: expenseNotes,
        });

        if (res.success) {
          setIsExpenseModalOpen(false);
          setSuccessMsg(`Disbursement of ${formatCurrency(numAmount)} recorded successfully.`);
          router.refresh();
        } else {
          setFormError(res.error || "Failed to record disbursement.");
        }
      }
    });
  };

  const handleConfirmDeleteExpense = () => {
    if (!deletingExpense) return;
    setFormError(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const res = await deleteExpenseAction(deletingExpense._id);
      if (res.success) {
        setSuccessMsg(`Removed disbursement "${deletingExpense.expenseName}".`);
        setDeletingExpense(null);
        router.refresh();
      } else {
        setFormError(res.error || "Failed to delete disbursement.");
        setDeletingExpense(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#111827] tracking-tight">
            Treasury & Finances
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Monitor reserve baselines, member dues collections, and ministry disbursements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setFormFunds2025(data.funds2025);
              setFormRemaining2026(data.remainingFunds2026);
              setFormError(null);
              setIsReservesModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-black border border-slate-200/80 shadow-xs transition-all active:scale-95"
          >
            <Pencil className="w-3.5 h-3.5 text-slate-500" />
            <span>Update Reserves</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreateExpense}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md shadow-rose-600/20 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* Global Alerts */}
      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-xs font-bold text-emerald-800 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-600 hover:text-emerald-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {formError && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80 text-xs font-bold text-rose-700 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{formError}</span>
          </div>
          <button
            onClick={() => setFormError(null)}
            className="text-rose-600 hover:text-rose-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Four Independent Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-[24px] border border-slate-200/80 p-4 sm:p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
              2025 Retained Funds
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg sm:text-2xl font-black text-[#111827] tracking-tight font-mono">
              {formatCurrency(data.funds2025)}
            </div>
            <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 mt-0.5">
              Historical carry-over
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[24px] border border-slate-200/80 p-4 sm:p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
              2026 Remaining Funds
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg sm:text-2xl font-black text-[#111827] tracking-tight font-mono">
              {formatCurrency(data.remainingFunds2026)}
            </div>
            <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 mt-0.5">
              Pre-October 2026 reserve
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[24px] border border-slate-200/80 p-4 sm:p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Contributions
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg sm:text-2xl font-black text-emerald-600 tracking-tight font-mono">
              {formatCurrency(data.totalContributions)}
            </div>
            <p className="text-[10px] sm:text-[11px] font-semibold text-emerald-700/80 mt-0.5">
              {data.totalContributionRecords} payments recorded (Oct 2026+)
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[24px] border border-slate-200/80 p-4 sm:p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Expenses
            </span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg sm:text-2xl font-black text-rose-600 tracking-tight font-mono">
              {formatCurrency(data.totalExpenses)}
            </div>
            <p className="text-[10px] sm:text-[11px] font-semibold text-rose-600/80 mt-0.5">
              {data.totalExpenseRecords} disbursements recorded
            </p>
          </div>
        </div>
      </div>

      {/* 3. Disbursements / Expenses Ledger Section */}
      <div className="bg-white rounded-[28px] sm:rounded-[32px] border border-slate-200/80 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-[#111827]">
                Ministry Disbursements Ledger
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400 font-medium">
                Detailed transaction records of all recorded ministry expenses.
              </p>
            </div>
          </div>

          <span className="text-xs font-extrabold text-slate-500 font-mono bg-slate-100 px-3 py-1 rounded-xl">
            {data.expenses.length} Records
          </span>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-6">Expense Date</th>
                <th className="py-3.5 px-6">Description / Item</th>
                <th className="py-3.5 px-6">Recorded By</th>
                <th className="py-3.5 px-6 text-right">Amount</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium">
              {data.expenses.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-16 text-center text-slate-400 text-xs font-medium"
                  >
                    No disbursements recorded yet. Click "Record Expense" to add your first entry.
                  </td>
                </tr>
              ) : (
                data.expenses.map((expense) => {
                  const displayDate = formatDateString(expense.expenseDate || expense.createdAt);

                  return (
                    <tr key={expense._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6 text-xs font-bold text-slate-700 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{displayDate}</span>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="font-extrabold text-slate-900 leading-tight">
                          {expense.expenseName}
                        </div>
                        {expense.notes && (
                          <div className="text-xs text-slate-400 mt-0.5">{expense.notes}</div>
                        )}
                      </td>

                      <td className="py-4 px-6 text-xs text-slate-500">
                        {expense.recordedBy?.fullName ||
                          expense.recordedBy?.username ||
                          "Admin / Leader"}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <span className="font-mono font-black text-rose-600 bg-rose-50 px-3 py-1 rounded-xl border border-rose-200/80 text-xs">
                          {formatCurrency(expense.amount)}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleOpenEditExpense(expense)}
                            className="p-2 rounded-xl text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            title="Edit disbursement"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => setDeletingExpense(expense)}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete disbursement"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="md:hidden divide-y divide-slate-100">
          {data.expenses.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs font-medium">
              No disbursements recorded yet.
            </div>
          ) : (
            data.expenses.map((expense) => {
              const displayDate = formatDateString(expense.expenseDate || expense.createdAt);

              return (
                <div key={expense._id} className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0 space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {displayDate}
                    </span>
                    <h3 className="text-xs font-extrabold text-slate-900 truncate">
                      {expense.expenseName}
                    </h3>
                    {expense.notes && (
                      <p className="text-[10px] text-slate-400 truncate">{expense.notes}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono font-black text-rose-600 text-xs bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200">
                      {formatCurrency(expense.amount)}
                    </span>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleOpenEditExpense(expense)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => setDeletingExpense(expense)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 4. Update Starting Reserves Modal */}
      {isReservesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-[28px] border border-slate-200 shadow-2xl p-5 sm:p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Pencil className="w-4 h-4" />
                </div>
                <h3 className="font-black text-base text-[#111827]">
                  Update Baseline Reserves
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsReservesModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReserves} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  2025 Retained Funds (₱)
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={formFunds2025}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormFunds2025(val === "" ? "" : Number(val));
                  }}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-mono font-extrabold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  2026 Remaining Funds Pre-Oct (₱)
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={formRemaining2026}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormRemaining2026(val === "" ? "" : Number(val));
                  }}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-mono font-extrabold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsReservesModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-1/2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Record / Edit Expense Modal (Mobile-friendly responsive grid & layout) */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-[28px] border border-slate-200 shadow-2xl p-5 sm:p-6 space-y-4 animate-in zoom-in-95 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h3 className="font-black text-base text-[#111827]">
                  {editingExpense ? "Edit Disbursement" : "Record Disbursement"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsExpenseModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitExpense} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Expense Description *
                </label>
                <input
                  type="text"
                  required
                  value={expenseName}
                  onChange={(e) => setExpenseName(e.target.value)}
                  placeholder="e.g. Sunday Fellowship Snacks"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-rose-500 focus:bg-white transition-all"
                />
              </div>

              {/* Responsive inputs: stacks on mobile screen, 2 cols on tablet/desktop */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 min-w-0">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Amount (₱) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    required
                    value={expenseAmount}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const val = e.target.value;
                      setExpenseAmount(val === "" ? "" : Number(val));
                    }}
                    placeholder="0"
                    className="w-full min-w-0 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-mono font-extrabold text-slate-900 focus:outline-none focus:border-rose-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1 min-w-0">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Expense Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full min-w-0 max-w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-rose-500 focus:bg-white transition-all appearance-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Notes / Receipt Ref (Optional)
                </label>
                <input
                  type="text"
                  value={expenseNotes}
                  onChange={(e) => setExpenseNotes(e.target.value)}
                  placeholder="e.g. Official Receipt #49382"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-rose-500 focus:bg-white transition-all"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isPending ||
                    !expenseName.trim() ||
                    !expenseAmount ||
                    Number(expenseAmount) <= 0
                  }
                  className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-600/20 flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : editingExpense ? (
                    "Save Changes"
                  ) : (
                    "Save Disbursement"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Delete Expense Confirmation Modal */}
      {deletingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-2xl p-5 space-y-4 animate-in zoom-in-95 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-black text-slate-900">Remove Disbursement?</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to remove{" "}
                <strong className="text-slate-800">"{deletingExpense.expenseName}"</strong> for{" "}
                <strong className="text-rose-600 font-mono">
                  {formatCurrency(deletingExpense.amount)}
                </strong>
                ?
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setDeletingExpense(null)}
                className="w-1/2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleConfirmDeleteExpense}
                className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-600/20 flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Yes, Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}