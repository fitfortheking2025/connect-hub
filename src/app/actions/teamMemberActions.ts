// src/app/actions/teamMemberActions.ts
"use server";

import dbConnect from "@/lib/mongodb";
import { TeamMember } from "@/models";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { uploadMemberPhotoAction } from "./uploadAction";
import { generateUpdateCode } from "@/models/TeamMember";

export interface TeamMemberPayload {
  name: string;
  nickname?: string;
  gender?: "Male" | "Female";
  birthdate?: string;
  contactNumber?: string;
  contact?: string; // backward compatibility
  email?: string;
  socialMedia?: string;
  base64Photo?: string;
  groupName: "Team Leaders" | "Follow Up Team" | "Members";
  assignedUserId?: string | null;
  active?: boolean;
  discipler?: string;
  disciples?: string[];
  discipleshipClasses?: string[];
  isPartOfOutreach?: boolean;
}

export async function createTeamMemberAction(data: TeamMemberPayload) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "ADMIN") {
      return { success: false, error: "Unauthorized. Admin access required." };
    }

    await dbConnect();
    if (!data.name?.trim()) {
      return { success: false, error: "Member name is required." };
    }

    let photoUrl = "";
    let cloudinaryPublicId = "";

    // Upload to Cloudinary if an image is provided
    if (data.base64Photo) {
      const uploadRes = await uploadMemberPhotoAction(data.base64Photo, data.name);
      if (uploadRes.success) {
        photoUrl = uploadRes.url || "";
        cloudinaryPublicId = uploadRes.publicId || "";
      }
    }

    const member = await TeamMember.create({
      name: data.name.trim(),
      nickname: data.nickname?.trim(),
      gender: data.gender,
      birthdate: data.birthdate ? new Date(data.birthdate) : undefined,
      contactNumber: data.contactNumber?.trim() || data.contact?.trim() || "",
      email: data.email?.trim().toLowerCase(),
      socialMedia: data.socialMedia?.trim(),
      photoUrl,
      cloudinaryPublicId,
      updateCode: generateUpdateCode(),
      groupName: data.groupName || "Members",
      assignedUserId: data.assignedUserId || null,
      active: data.active ?? true,
      discipler: data.discipler?.trim(),
      disciples: data.disciples || [],
      discipleshipClasses: data.discipleshipClasses || [],
      isPartOfOutreach: data.isPartOfOutreach || false,
    });

    revalidatePath("/connect-team");
    revalidatePath("/vips");
    revalidatePath("/");
    return { success: true, member: JSON.parse(JSON.stringify(member)) };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create team member." };
  }
}

export async function updateTeamMemberAction(data: TeamMemberPayload & { id: string }) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "ADMIN") {
      return { success: false, error: "Unauthorized. Admin access required." };
    }

    await dbConnect();
    if (!data.id) {
      return { success: false, error: "Member ID is required." };
    }

    const updateDoc: any = {
      name: data.name?.trim(),
      nickname: data.nickname?.trim(),
      gender: data.gender,
      birthdate: data.birthdate ? new Date(data.birthdate) : undefined,
      contactNumber: data.contactNumber?.trim() || data.contact?.trim() || "",
      email: data.email?.trim().toLowerCase(),
      socialMedia: data.socialMedia?.trim(),
      updateCode: generateUpdateCode(),
      groupName: data.groupName || "Members",
      assignedUserId: data.assignedUserId || null,
      active: Boolean(data.active),
      discipler: data.discipler?.trim(),
      disciples: data.disciples || [],
      discipleshipClasses: data.discipleshipClasses || [],
      isPartOfOutreach: Boolean(data.isPartOfOutreach),
    };

    // Upload new image if provided
    if (data.base64Photo) {
      const uploadRes = await uploadMemberPhotoAction(data.base64Photo, data.name);
      if (uploadRes.success) {
        updateDoc.photoUrl = uploadRes.url;
        updateDoc.cloudinaryPublicId = uploadRes.publicId;
      }
    }

    const updated = await TeamMember.findByIdAndUpdate(
      data.id,
      updateDoc,
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

export async function getMonthlyBirthdayCelebrantsAction(targetMonth?: number) {
  try {
    await dbConnect();

    // Default to current month (1-12) if not specified
    const currentMonth = targetMonth || new Date().getMonth() + 1;

    // Use MongoDB aggregation $expr with $month to match birthdate month
    const celebrants = await TeamMember.aggregate([
      {
        $match: {
          active: true,
          birthdate: { $exists: true, $ne: null },
          $expr: {
            $eq: [{ $month: "$birthdate" }, currentMonth],
          },
        },
      },
      {
        // Extract day for chronological sorting
        $addFields: {
          birthDay: { $dayOfMonth: "$birthdate" },
        },
      },
      {
        $sort: { birthDay: 1, name: 1 },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          nickname: 1,
          groupName: 1,
          photoUrl: 1,
          birthdate: 1,
          birthDay: 1,
          contactNumber: 1,
        },
      },
    ]);

    return {
      success: true,
      month: currentMonth,
      celebrants: JSON.parse(JSON.stringify(celebrants)),
    };
  } catch (error: any) {
    return { success: false, error: error.message, celebrants: [] };
  }
}