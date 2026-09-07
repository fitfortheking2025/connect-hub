// src/app/api/team/birthdays/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getMonthlyBirthdayCelebrantsAction } from "@/app/actions/teamMemberActions";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const month = parseInt(searchParams.get("month") || "", 10) || new Date().getMonth() + 1;

  const result = await getMonthlyBirthdayCelebrantsAction(month);
  return NextResponse.json(result);
}