// src/app/(portal)/finances/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getFinanceOverviewAction } from "@/app/actions/financeActions";
import FinancesClient from "./FinancesClient";

export const metadata = {
  title: "Finances & Treasury | Connect Hub",
  description: "Manage ministry reserves, collections, and disbursements.",
};

export default async function FinancesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const role = String((session.user as any).role || "").toUpperCase().replace(/[\s-]+/g, "_");
  const isAuthorized = role === "ADMIN" || role === "FINANCE_LEADER";

  if (!isAuthorized) {
    redirect("/dashboard");
  }

  const res = await getFinanceOverviewAction();

  if (!res.success || !res.data) {
    return (
      <div className="p-6 text-center text-xs font-bold text-rose-600 bg-rose-50 rounded-2xl border border-rose-200">
        {res.error || "Failed to load financial records."}
      </div>
    );
  }

  return <FinancesClient initialData={res.data} />;
}