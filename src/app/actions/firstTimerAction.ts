// src/app/actions/firstTimerAction.ts
"use server";

import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/mongodb";
import { FirstTimer, TeamMember, User as UserModel } from "@/models";
import { auth } from "@/lib/auth";

function formatPhilippineContact(rawContact: string): string {
  if (!rawContact || !rawContact.trim()) return "";
  
  let cleaned = rawContact.replace(/\D/g, "");
  if (!cleaned) return "";

  if (cleaned.startsWith("63") && cleaned.length >= 12) {
    cleaned = "0" + cleaned.slice(2);
  } else if (cleaned.startsWith("9") && cleaned.length === 10) {
    cleaned = "0" + cleaned;
  } else if (!cleaned.startsWith("0")) {
    cleaned = "0" + cleaned;
  }

  return cleaned;
}

function resolveAgeGroup(age: number, gender: number): string {
  if (age <= 19) {
    return "Youth";
  }
  if (age <= 35) {
    return "Young Adult";
  }
  if (age <= 50) {
    return gender === 1 ? "River Men" : "River Women";
  }
  return "Seasoned";
}

/**
 * Public action: fetches active team members without requiring a login session.
 * Exposes ONLY safe roster info for autocomplete caching.
 */
export async function getActiveMembersPublicAction() {
  try {
    await dbConnect();
    const members = await TeamMember.find({ active: true })
      .select("name nickname")
      .lean();

    return {
      success: true,
      members: JSON.parse(JSON.stringify(members || [])),
    };
  } catch (err: any) {
    return { success: false, error: err.message, members: [] };
  }
}

/**
 * Batch-syncs offline queued VIP records into the database.
 */
export async function syncOfflineVipsBatchAction(
  records: Array<{
    clientTempId: string;
    iam: string;
    fullName: string;
    gender: number;
    age: string;
    contact?: string;
    serviceAttended: string;
    messenger?: string;
    invitedBy?: string;
    connectedWith?: string;
    lifeGroupInterest?: string;
    approachedBy: string;
    createdAtTimestamp?: number;
  }>
) {
  try {
    if (!records || records.length === 0) {
      return { success: true, syncedIds: [] };
    }

    await dbConnect();
    const syncedIds: string[] = [];

    for (const item of records) {
      const parsedAge = parseInt(String(item.age), 10) || 25;
      const computedAgeGroup = resolveAgeGroup(parsedAge, item.gender);
      const formattedContact = formatPhilippineContact(item.contact || "");

      await FirstTimer.create({
        iam: item.iam || "LOOKING FOR A CHURCH",
        fullName: item.fullName.trim(),
        gender: item.gender,
        contact: formattedContact,
        ageGroup: computedAgeGroup,
        messenger: item.messenger ? item.messenger.trim() : "",
        serviceAttended: item.serviceAttended,
        invitedBy: item.invitedBy ? item.invitedBy.trim() : "",
        connectedWith: item.connectedWith ? item.connectedWith.trim() : "",
        lifeGroupInterest: item.lifeGroupInterest === "YES" ? "YES" : "NO",
        approachedBy: item.approachedBy ? item.approachedBy.trim() : "Connect Team",
        textedAlready: false,
        startedOne2One: false,
        createdAt: item.createdAtTimestamp ? new Date(item.createdAtTimestamp) : new Date(),
      });

      syncedIds.push(item.clientTempId);
    }

    revalidatePath("/");
    revalidatePath("/intake");
    revalidatePath("/vips");
    revalidatePath("/dashboard");

    return {
      success: true,
      syncedIds,
      count: syncedIds.length,
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to batch sync offline records." };
  }
}

export async function createFirstTimerAction(formData: FormData) {
  try {
    await dbConnect();

    const iam = formData.get("iam") as string;
    const fullName = formData.get("fullName") as string;
    const gender = Number(formData.get("gender") || 0);
    const rawAge = formData.get("age");
    const rawContact = formData.get("contact") as string;
    const messenger = formData.get("messenger") as string;
    const serviceAttended = formData.get("serviceAttended") as string;
    const invitedBy = formData.get("invitedBy") as string;
    const connectedWith = formData.get("connectedWith") as string;
    const lifeGroupInterest = formData.get("lifeGroupInterest") as string;
    const approachedBy = formData.get("approachedBy") as string;

    const age = rawAge ? parseInt(String(rawAge), 10) : NaN;

    if (!fullName || !iam || isNaN(age) || age < 1 || !serviceAttended || !approachedBy) {
      return { success: false, error: "Please fill in all required fields, including a valid age." };
    }

    const computedAgeGroup = resolveAgeGroup(age, gender);
    const formattedContact = formatPhilippineContact(rawContact);

    await FirstTimer.create({
      iam,
      fullName: fullName.trim(),
      gender,
      contact: formattedContact,
      ageGroup: computedAgeGroup,
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
    revalidatePath("/vips");
    revalidatePath("/dashboard");

    return { 
      success: true, 
      message: `Successfully registered ${fullName.trim()} into First-Timers roster.` 
    };
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

    const updated = await FirstTimer.findByIdAndUpdate(id, updateData, { new: true });
    revalidatePath("/vips");
    revalidatePath("/analytics");
    revalidatePath("/dashboard");
    revalidatePath("/", "layout");

    const label = field === "textedAlready" 
      ? (value ? "marked as texted" : "marked as pending SMS")
      : (value ? "marked One2One as started" : "marked One2One as not started");

    return { 
      success: true, 
      followedUpBy: updateData.followedUpBy,
      message: `${updated?.fullName || "VIP"} ${label}.`
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update status." };
  }
}

export async function markBatchAsTextedAction(ids: string[]) {
  try {
    if (!ids || ids.length === 0) return { success: true, message: "No VIPs to update." };
    const session = await auth();
    await dbConnect();

    const updateData: Record<string, any> = { textedAlready: true };
    if (session?.user) {
      updateData.followedUpBy = session.user.name || session.user.email;
      if ((session.user as any).id) {
        updateData.followedUpByUserId = (session.user as any).id;
      }
    }

    const res = await FirstTimer.updateMany({ _id: { $in: ids } }, { $set: updateData });
    revalidatePath("/vips");
    revalidatePath("/analytics");
    revalidatePath("/dashboard");
    revalidatePath("/", "layout");

    return { 
      success: true, 
      message: `Successfully marked ${res.modifiedCount || ids.length} VIP(s) as texted.` 
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to mark batch as texted." };
  }
}

export async function updateFirstTimerAction(data: {
  id: string;
  fullName: string;
  gender?: number | string;
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

    const parsedGender =
      data.gender === 1 || data.gender === "1" || String(data.gender).toUpperCase() === "MALE" || String(data.gender).toUpperCase() === "M"
        ? 1
        : 0;

    const updated = await FirstTimer.findByIdAndUpdate(
      data.id,
      {
        fullName: data.fullName?.trim(),
        gender: parsedGender,
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
    revalidatePath("/analytics");
    revalidatePath("/dashboard");
    revalidatePath("/", "layout");

    return {
      success: true,
      message: `Changes saved for ${updated.fullName}.`,
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

    return { 
      success: true, 
      message: `Permanently removed "${deleted.fullName}" from records.` 
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete VIP record." };
  }
}