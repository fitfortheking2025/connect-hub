"use server";

import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/mongodb";
import { FirstTimer } from "@/models";

// Helper to normalize Philippine mobile numbers to 09XXXXXXXXX when provided
function formatPhilippineContact(rawContact: string): string {
  if (!rawContact || !rawContact.trim()) return "";
  
  // Strip all non-numeric characters
  let cleaned = rawContact.replace(/\D/g, "");

  if (!cleaned) return "";

  // If starts with 63 (e.g. 639060979218), remove 63 and prepend 0
  if (cleaned.startsWith("63") && cleaned.length >= 12) {
    cleaned = "0" + cleaned.slice(2);
  }
  // If starts with 9 (e.g. 9060979218), prepend 0 -> 09060979218
  else if (cleaned.startsWith("9") && cleaned.length === 10) {
    cleaned = "0" + cleaned;
  }
  // If already starts with 0 (e.g. 09060979218), keep as is
  else if (!cleaned.startsWith("0")) {
    cleaned = "0" + cleaned;
  }

  return cleaned;
}

export async function createFirstTimerAction(formData: FormData) {
  try {
    await dbConnect();

    const iam = formData.get("iam") as string;
    const fullName = formData.get("fullName") as string;
    const gender = Number(formData.get("gender") || 0);
    const rawContact = formData.get("contact") as string;
    const ageGroup = formData.get("ageGroup") as string;
    const messenger = formData.get("messenger") as string;
    const serviceAttended = formData.get("serviceAttended") as string;
    const invitedBy = formData.get("invitedBy") as string;
    const connectedWith = formData.get("connectedWith") as string;
    const lifeGroupInterest = formData.get("lifeGroupInterest") as string;
    const approachedBy = formData.get("approachedBy") as string;

    // Contact is now optional, only verifying essential core identity
    if (!fullName || !iam || !ageGroup || !serviceAttended || !approachedBy) {
      return { success: false, error: "Please fill in all required fields." };
    }

    const formattedContact = formatPhilippineContact(rawContact);

    await FirstTimer.create({
      iam,
      fullName: fullName.trim(),
      gender,
      contact: formattedContact,
      ageGroup,
      messenger: messenger ? messenger.trim() : "",
      serviceAttended,
      invitedBy: invitedBy ? invitedBy.trim() : "",
      connectedWith: connectedWith ? connectedWith.trim() : "",
      lifeGroupInterest: lifeGroupInterest === "YES" ? "YES" : "NO",
      approachedBy: approachedBy.trim(),
      textedAlready: false,
      startedOne2One: false,
      createdAt: new Date(),
    });

    revalidatePath("/");
    revalidatePath("/first-timers/new");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to submit intake." };
  }
}