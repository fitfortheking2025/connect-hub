// src/app/api/admin/import-vips/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { FirstTimer } from "@/models";
import { auth } from "@/lib/auth";
import * as XLSX from "xlsx";

function cleanPhilippineContact(rawContact: any): string {
  if (!rawContact) return "";
  let cleaned = String(rawContact).replace(/\D/g, "");
  if (!cleaned) return "";

  if (cleaned.length === 10 && cleaned.startsWith("9")) {
    return `0${cleaned}`;
  }
  if (cleaned.startsWith("63") && cleaned.length >= 12) {
    return `0${cleaned.slice(2)}`;
  }
  if (cleaned.startsWith("0")) {
    return cleaned;
  }
  return cleaned;
}

function parseSpreadsheetDate(rawVal: any): Date {
  if (!rawVal) return new Date();
  if (rawVal instanceof Date && !isNaN(rawVal.getTime())) return rawVal;

  // Handle Excel numeric serial dates (e.g. 46201 for June 28, 2026)
  if (typeof rawVal === "number" || (!isNaN(Number(rawVal)) && !String(rawVal).includes("/") && !String(rawVal).includes("-"))) {
    const serial = Number(rawVal);
    // Excel base epoch: Dec 30, 1899
    const excelEpoch = new Date(1899, 11, 30);
    const parsed = new Date(excelEpoch.getTime() + serial * 86400000);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  const parsed = new Date(String(rawVal));
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

function normalizeAgeGroup(rawGroup?: string): "Youth" | "Young Adult" | "River Men" | "River Women" | "Seasoned" {
  if (!rawGroup) return "Young Adult";
  const s = rawGroup.toLowerCase();
  if (s.includes("youth")) return "Youth";
  if (s.includes("river men") || s.includes("men")) return "River Men";
  if (s.includes("river women") || s.includes("women")) return "River Women";
  if (s.includes("seasoned")) return "Seasoned";
  return "Young Adult";
}

function inferGender(name: string, ageGroup: string): number {
  if (ageGroup === "River Men") return 1;
  if (ageGroup === "River Women") return 0;

  const maleNames = [
    "jayson", "john", "michael", "angelo", "bruno", "bryan",
    "jeffrey", "phil-aaron", "phil", "aaron"
  ];
  const lowerName = name.toLowerCase();
  return maleNames.some((m) => lowerName.includes(m)) ? 1 : 0;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const role = String((session?.user as any)?.role || "").toUpperCase();

    if (role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file uploaded. Please select a CSV." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    // Parse with cellDates enabled and raw string formatting
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const rawRows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });

    if (!rawRows || rawRows.length === 0) {
      return NextResponse.json(
        { success: false, error: "CSV file contains no readable rows." },
        { status: 400 }
      );
    }

    await dbConnect();

    const preparedDocs = [];

    for (const row of rawRows) {
      const getField = (...keys: string[]) => {
        for (const key of keys) {
          const matched = Object.keys(row).find(
            (k) => k.trim().toLowerCase() === key.toLowerCase()
          );
          if (matched && row[matched] !== "" && row[matched] !== null && row[matched] !== undefined) {
            return row[matched];
          }
        }
        return "";
      };

      const fullName = String(getField("name", "full name", "vip name")).trim();
      if (!fullName) continue;

      const rawDate = getField("date", "created_at", "createdAt");
      const recordDate = parseSpreadsheetDate(rawDate);

      const ageGroup = normalizeAgeGroup(String(getField("age_group", "ageGroup", "age")));
      const gender = inferGender(fullName, ageGroup);

      let iam = String(getField("iam", "category", "guest type")).trim().toUpperCase();
      if (!["VISITOR", "FROM OTHER CHURCH", "LOOKING FOR A CHURCH"].includes(iam)) {
        if (iam.includes("VISITOR")) iam = "VISITOR";
        else if (iam.includes("OTHER")) iam = "FROM OTHER CHURCH";
        else iam = "LOOKING FOR A CHURCH";
      }

      const rawService = String(getField("service", "serviceAttended")).trim().toUpperCase();
      const serviceAttended = ["10AM", "1PM", "4PM"].includes(rawService) ? rawService : "10AM";

      const contact = cleanPhilippineContact(getField("contact_no", "contact", "phone"));
      const messenger = String(getField("messenger", "fb")).trim();
      const invitedBy = String(getField("invited_by", "invitedBy")).trim();
      const approachedBy = String(getField("approached_by", "approachedBy") || "Connect Team").trim();
      const connectedWith = String(getField("connected_with", "connectedWith")).trim();

      const rawLg = String(getField("life_group_interest", "lifeGroupInterest")).trim().toUpperCase();
      const lifeGroupInterest = rawLg.startsWith("Y") ? "YES" : "NO";

      preparedDocs.push({
        fullName,
        iam,
        gender,
        contact,
        ageGroup,
        messenger,
        serviceAttended,
        invitedBy,
        connectedWith,
        lifeGroupInterest,
        approachedBy,
        textedAlready: false,
        startedOne2One: false,
        createdAt: recordDate,
        updatedAt: recordDate,
      });
    }

    if (preparedDocs.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid rows found to insert." },
        { status: 400 }
      );
    }

    const result = await FirstTimer.insertMany(preparedDocs, { ordered: false });

    return NextResponse.json({
      success: true,
      count: result.length,
      message: `Successfully imported ${result.length} First-Timers with correct 2026 dates.`,
    });
  } catch (error: any) {
    console.error("import-vips API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to import CSV." },
      { status: 500 }
    );
  }
}