"use server";

import dbConnect from "@/lib/mongodb";
import { TeamMember } from "@/models";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createTeamMemberAction(data: {
  name: string;
  groupName: "Team Leaders" | "Members";
  contact?: string;
  assignedUserId?: string | null;
  active?: boolean;
}) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "ADMIN") {
      return { success: false, error: "Unauthorized. Admin access required." };
    }

    await dbConnect();
    if (!data.name?.trim()) {
      return { success: false, error: "Member name is required." };
    }

    const member = await TeamMember.create({
      name: data.name.trim(),
      groupName: data.groupName || "Members",
      contact: data.contact?.trim() || "",
      assignedUserId: data.assignedUserId || null,
      active: data.active ?? true,
    });

    revalidatePath("/connect-team");
    revalidatePath("/vips");
    revalidatePath("/");
    return { success: true, member: JSON.parse(JSON.stringify(member)) };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create team member." };
  }
}

export async function updateTeamMemberAction(data: {
  id: string;
  name: string;
  groupName: "Team Leaders" | "Members";
  contact?: string;
  assignedUserId?: string | null;
  active: boolean;
}) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "ADMIN") {
      return { success: false, error: "Unauthorized. Admin access required." };
    }

    await dbConnect();
    if (!data.id) {
      return { success: false, error: "Member ID is required." };
    }

    const updated = await TeamMember.findByIdAndUpdate(
      data.id,
      {
        name: data.name?.trim(),
        groupName: data.groupName,
        contact: data.contact?.trim() || "",
        assignedUserId: data.assignedUserId || null,
        active: Boolean(data.active),
      },
      { returnDocument: "after" }
    ).lean();

    if (!updated) {
      return { success: false, error: "Member not found." };
    }

    revalidatePath("/connect-team");
    revalidatePath("/vips");
    revalidatePath("/");
    return { success: true, member: JSON.parse(JSON.stringify(updated)) };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update team member." };
  }
}

export async function toggleMemberActiveStatusAction(id: string, currentStatus: boolean) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "ADMIN") {
      return { success: false, error: "Unauthorized. Admin access required." };
    }

    await dbConnect();
    await TeamMember.findByIdAndUpdate(id, { active: !currentStatus });
    revalidatePath("/connect-team");
    revalidatePath("/vips");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}