// src/app/actions/vipDayAction.ts
"use server";

import dbConnect from "@/lib/mongodb";
import VipEventRegistration from "@/models/VipEventRegistration";
import { customAlphabet } from "nanoid";

const generateTicketSuffix = customAlphabet("23456789ABCDEFGHJKLMNPQRSTUVWXYZ", 5);

// Default event credentials (can be overridden via environment variables)
const SCANNER_PIN = process.env.VIP_SCANNER_PIN || "2026";
const MONITOR_PASSCODE = process.env.VIP_MONITOR_PASSCODE || "VIP-LEAD-88";

// --- EXISTING REGISTRATION ACTIONS ---
export async function registerVipDayAction(payload: {
  fullName: string;
  contactNumber: string;
  discipler: string;
}) {
  try {
    await dbConnect();
    const { fullName, contactNumber, discipler } = payload;

    if (!fullName?.trim() || !contactNumber?.trim() || !discipler?.trim()) {
      return { success: false, error: "Please fill out all required fields." };
    }

    const trimmedName = fullName.trim();
    const trimmedDiscipler = discipler.trim();
    const cleanedContact = contactNumber.replace(/\D/g, "");

    if (cleanedContact.length !== 11) {
      return {
        success: false,
        error: "Contact number must be exactly 11 digits (e.g. 09171234567).",
      };
    }

    const existing = await VipEventRegistration.findOne({
      eventDate: "2026-11-07",
      $or: [
        { fullName: { $regex: new RegExp(`^${trimmedName}$`, "i") } },
        { contactNumber: cleanedContact },
      ],
    }).lean();

    if (existing) {
      return {
        success: true,
        isExisting: true,
        ticketCode: existing.ticketCode,
        message: "You are already registered for VIP Day 2026!",
      };
    }

    let ticketCode = `VIP-26-${generateTicketSuffix()}`;
    let isUnique = false;

    while (!isUnique) {
      const found = await VipEventRegistration.findOne({ ticketCode }).lean();
      if (!found) isUnique = true;
      else ticketCode = `VIP-26-${generateTicketSuffix()}`;
    }

    const newRecord = await VipEventRegistration.create({
      ticketCode,
      fullName: trimmedName,
      contactNumber: cleanedContact,
      discipler: trimmedDiscipler,
      eventDate: "2026-11-07",
      status: "REGISTERED",
    });

    return {
      success: true,
      ticketCode: newRecord.ticketCode,
      message: "Registration successful!",
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to register." };
  }
}

export async function getVipPassAction(ticketCode: string) {
  try {
    await dbConnect();
    const registration = await VipEventRegistration.findOne({
      ticketCode: ticketCode.toUpperCase().trim(),
    }).lean();

    if (!registration) {
      return { success: false, error: "Ticket not found." };
    }

    return {
      success: true,
      data: JSON.parse(JSON.stringify(registration)),
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to retrieve pass." };
  }
}

// --- SCANNER ACTIONS ---

export async function verifyScannerPinAction(pin: string) {
  if (pin?.trim() === SCANNER_PIN) {
    return { success: true };
  }
  return { success: false, error: "Invalid Event PIN." };
}

export async function checkInVipGuestAction(params: {
  ticketCode: string;
  stationName: string;
  pin: string;
}) {
  try {
    const { ticketCode, stationName, pin } = params;

    if (pin?.trim() !== SCANNER_PIN) {
      return { status: "UNAUTHORIZED", error: "Invalid scanner credentials." };
    }

    await dbConnect();
    const cleanCode = ticketCode.toUpperCase().trim();

    // 1. Atomic Check-in: Only updates if status is still "REGISTERED"
    const updated = await VipEventRegistration.findOneAndUpdate(
      { ticketCode: cleanCode, status: "REGISTERED" },
      {
        $set: {
          status: "ATTENDED",
          attendedAt: new Date(),
          scannedBy: stationName || "Door Scanner",
        },
      },
      { new: true }
    ).lean();

    if (updated) {
      return {
        status: "SUCCESS",
        guest: JSON.parse(JSON.stringify(updated)),
      };
    }

    // 2. If atomic update returned null, check why:
    const existing = await VipEventRegistration.findOne({ ticketCode: cleanCode }).lean();

    if (!existing) {
      return { status: "NOT_FOUND", error: "Unregistered or invalid QR pass." };
    }

    if (existing.status === "ATTENDED") {
      return {
        status: "ALREADY_CHECKED_IN",
        guest: JSON.parse(JSON.stringify(existing)),
      };
    }

    return { status: "ERROR", error: "Unable to process pass status." };
  } catch (error: any) {
    return { status: "ERROR", error: error.message || "Scanner check-in failed." };
  }
}

export async function searchVipGuestAction(query: string, pin: string) {
  try {
    if (pin?.trim() !== SCANNER_PIN) {
      return { success: false, error: "Unauthorized." };
    }

    await dbConnect();
    const clean = query.trim();
    if (!clean) return { success: true, results: [] };

    const results = await VipEventRegistration.find({
      eventDate: "2026-11-07",
      $or: [
        { fullName: { $regex: clean, $options: "i" } },
        { contactNumber: { $regex: clean.replace(/\D/g, "") } },
        { ticketCode: { $regex: clean, $options: "i" } },
      ],
    })
      .limit(10)
      .lean();

    return {
      success: true,
      results: JSON.parse(JSON.stringify(results)),
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// --- MONITOR ACTIONS (OPTION B) ---

export async function verifyMonitorPasscodeAction(passcode: string) {
  if (passcode?.trim() === MONITOR_PASSCODE) {
    return { success: true };
  }
  return { success: false, error: "Invalid Coordinator Passcode." };
}

export async function getVipMonitorDataAction(passcode: string) {
  try {
    if (passcode?.trim() !== MONITOR_PASSCODE) {
      return { success: false, error: "Unauthorized." };
    }

    await dbConnect();

    const registrations = await VipEventRegistration.find({
      eventDate: "2026-11-07",
    })
      .sort({ createdAt: -1 })
      .lean();

    const totalRegistered = registrations.length;
    const totalAttended = registrations.filter((r) => r.status === "ATTENDED").length;

    // Discipler summary breakdown
    const disciplerMap: Record<string, { total: number; attended: number }> = {};
    for (const reg of registrations) {
      const d = reg.discipler || "Unassigned";
      if (!disciplerMap[d]) disciplerMap[d] = { total: 0, attended: 0 };
      disciplerMap[d].total += 1;
      if (reg.status === "ATTENDED") disciplerMap[d].attended += 1;
    }

    return {
      success: true,
      stats: {
        totalRegistered,
        totalAttended,
        turnoutRate: totalRegistered > 0 ? Math.round((totalAttended / totalRegistered) * 100) : 0,
      },
      disciplers: Object.entries(disciplerMap)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.total - a.total),
      attendees: JSON.parse(JSON.stringify(registrations)),
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to load monitor data." };
  }
}

export async function manualToggleCheckInAction(ticketCode: string, passcode: string) {
  try {
    if (passcode?.trim() !== MONITOR_PASSCODE) {
      return { success: false, error: "Unauthorized." };
    }

    await dbConnect();
    const current = await VipEventRegistration.findOne({ ticketCode }).lean();
    if (!current) return { success: false, error: "Ticket not found." };

    const newStatus = current.status === "ATTENDED" ? "REGISTERED" : "ATTENDED";
    const updateData: any = {
      status: newStatus,
      attendedAt: newStatus === "ATTENDED" ? new Date() : null,
      scannedBy: newStatus === "ATTENDED" ? "Manual Lead Override" : null,
    };

    const updated = await VipEventRegistration.findOneAndUpdate(
      { ticketCode },
      { $set: updateData },
      { new: true }
    ).lean();

    return { success: true, updated: JSON.parse(JSON.stringify(updated)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}