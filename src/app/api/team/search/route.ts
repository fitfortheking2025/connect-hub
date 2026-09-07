// src/app/api/team/search/route.ts
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
      const q = query.trim();
      filter.$or = [
        { nickname: { $regex: q, $options: "i" } },
        { name: { $regex: q, $options: "i" } },
      ];
    }

    const members = await TeamMember.find(filter)
      .select("_id name nickname groupName")
      .sort({ nickname: 1, name: 1 })
      .limit(10)
      .lean();

    return NextResponse.json({ members });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}