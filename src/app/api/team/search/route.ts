import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { TeamMember } from "@/models";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    const filter: any = { active: true };
    if (query.trim()) {
      filter.name = { $regex: query.trim(), $options: "i" };
    }

    const members = await TeamMember.find(filter)
      .select("name")
      .sort({ name: 1 })
      .limit(8)
      .lean();

    return NextResponse.json({ members });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}