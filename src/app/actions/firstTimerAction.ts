"use server";

import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/mongodb";
import { FirstTimer } from "@/models";
import { auth } from "@/lib/auth";

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
    revalidatePath("/intake");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to submit intake." };
  }
}

export async function toggleDiscipleshipStatusAction(
  id: string,
  field: "textedAlready" | "startedOne2One",
  value: boolean
) {
  try {
    const session = await auth();
    await dbConnect();

    const updateData: Record<string, any> = { [field]: value };
    if (session?.user) {
      updateData.followedUpBy = session.user.name || session.user.email;
      if ((session.user as any).id) {
        updateData.followedUpByUserId = (session.user as any).id;
      }
    }

    await FirstTimer.findByIdAndUpdate(id, updateData);
    revalidatePath("/vips");
    revalidatePath("/", "layout");
    return { success: true, followedUpBy: updateData.followedUpBy };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function markBatchAsTextedAction(ids: string[]) {
  try {
    if (!ids || ids.length === 0) return { success: true };
    const session = await auth();
    await dbConnect();

    const updateData: Record<string, any> = { textedAlready: true };
    if (session?.user) {
      updateData.followedUpBy = session.user.name || session.user.email;
      if ((session.user as any).id) {
        updateData.followedUpByUserId = (session.user as any).id;
      }
    }

    await FirstTimer.updateMany({ _id: { $in: ids } }, { $set: updateData });
    revalidatePath("/vips");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to mark batch." };
  }
}

export async function updateFirstTimerAction(data: {
  id: string;
  fullName: string;
  contact?: string;
  messenger?: string;
  iam?: string;
  ageGroup?: string;
  serviceAttended?: string;
  approachedBy?: string;
  invitedBy?: string;
  connectedWith?: string;
  startedOne2One?: boolean;
  textedAlready?: boolean;
  updateReport?: string;
}) {
  try {
    const session = await auth();
    await dbConnect();

    if (!data.id) {
      return { success: false, error: "Record ID is missing." };
    }

    const updaterName = session?.user?.name || session?.user?.email || "Follow-Up Team";
    const updaterId = (session?.user as any)?.id || null;

    const updated = await FirstTimer.findByIdAndUpdate(
      data.id,
      {
        fullName: data.fullName?.trim(),
        contact: data.contact?.trim(),
        messenger: data.messenger?.trim(),
        iam: data.iam,
        ageGroup: data.ageGroup,
        serviceAttended: data.serviceAttended,
        approachedBy: data.approachedBy?.trim(),
        invitedBy: data.invitedBy?.trim(),
        connectedWith: data.connectedWith?.trim() || "",
        startedOne2One: Boolean(data.startedOne2One),
        textedAlready: Boolean(data.textedAlready),
        updateReport: data.updateReport?.trim() || "",
        followedUpBy: updaterName,
        followedUpByUserId: updaterId,
      },
      { returnDocument: "after" }
    ).lean();

    if (!updated) {
      return { success: false, error: "Document not found in database." };
    }

    revalidatePath("/vips");
    revalidatePath("/", "layout");

    return {
      success: true,
      updated: JSON.parse(JSON.stringify(updated)),
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update record." };
  }
}

export async function deleteFirstTimerAction(id: string) {
  try {
    const session = await auth();
    const userRole = String((session?.user as any)?.role || "").toUpperCase();

    // Strict Admin Gate
    if (userRole !== "ADMIN") {
      return { success: false, error: "Unauthorized. Only Admins can delete VIP records." };
    }

    await dbConnect();
    const deleted = await FirstTimer.findByIdAndDelete(id);

    if (!deleted) {
      return { success: false, error: "Record not found." };
    }

    revalidatePath("/vips");
    revalidatePath("/dashboard");
    revalidatePath("/analytics");

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete VIP record." };
  }
}