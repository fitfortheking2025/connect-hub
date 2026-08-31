import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { FirstTimer } from "@/models";
import AnalyticsClient from "./AnalyticsClient";
import { BarChart3 } from "lucide-react";

interface PageProps {
  searchParams: Promise<{
    startDate?: string;
    endDate?: string;
    ageGroup?: string;
    service?: string;
  }>;
}

export default async function AnalyticsPage({ searchParams }: PageProps) {
  await auth();
  await dbConnect();

  const params = await searchParams;
  const currentYear = new Date().getFullYear();

  // Default: Start of year to today
  const defaultStartDate = `${currentYear}-01-01`;
  const defaultEndDate = new Date().toISOString().split("T")[0];

  const startDateStr = params.startDate || defaultStartDate;
  const endDateStr = params.endDate || defaultEndDate;
  const selectedAge = params.ageGroup || "ALL";
  const selectedService = params.service || "ALL";

  const start = new Date(`${startDateStr}T00:00:00.000Z`);
  const end = new Date(`${endDateStr}T23:59:59.999Z`);

  const query: any = {
    createdAt: { $gte: start, $lte: end },
  };

  if (selectedAge !== "ALL") {
    query.ageGroup = selectedAge;
  }

  if (selectedService !== "ALL") {
    query.serviceAttended = selectedService;
  }

  const records = await FirstTimer.find(query).sort({ createdAt: 1 }).lean();

  return (
    <div className="space-y-6">
      {/* Header matching Dashboard / VIPs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200/60 text-[#FF6B00] text-[11px] font-bold">
            <BarChart3 className="w-3.5 h-3.5" /> Ministry Telemetry & Growth Funnels
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-[#111827] tracking-tight mt-1.5">
            Ministry Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Track Sunday intake trends, One2One conversion funnels, and age demographics over custom date ranges.
          </p>
        </div>
      </div>

      <AnalyticsClient
        initialData={JSON.parse(JSON.stringify(records))}
        startDate={startDateStr}
        endDate={endDateStr}
        selectedAge={selectedAge}
        selectedService={selectedService}
      />
    </div>
  );
}