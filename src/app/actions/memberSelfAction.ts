// src/app/actions/memberSelfAction.ts
"use server";

import dbConnect from "@/lib/mongodb";
import { TeamMember } from "@/models";
import { revalidatePath } from "next/cache";

export async function updateMemberSelfAction(data: {
  code: string;
  name: string;
  nickname?: string;
  gender?: "Male" | "Female";
  birthdate?: string;
  contactNumber?: string;
  email?: string;
  socialMedia?: string;
  discipler?: string;
  disciples?: string[];
  discipleshipClasses?: string[];
  isPartOfOutreach?: boolean;
}) {
  try {
    await dbConnect();

    if (!data.code) {
      return { success: false, error: "Invalid link or missing access code." };
    }
    if (!data.name?.trim()) {
      return { success: false, error: "Name is required." };
    }

    const member = await TeamMember.findOne({ updateCode: data.code });
    if (!member) {
      return { success: false, error: "Member record not found." };
    }

    // Update member details
    member.name = data.name.trim();
    member.nickname = data.nickname?.trim();
    member.gender = data.gender;
    member.birthdate = data.birthdate ? new Date(data.birthdate) : undefined;
    member.contactNumber = data.contactNumber?.trim();
    member.email = data.email?.trim().toLowerCase();
    member.socialMedia = data.socialMedia?.trim();
    member.discipler = data.discipler?.trim();
    member.disciples = data.disciples || [];
    member.discipleshipClasses = data.discipleshipClasses || [];
    member.isPartOfOutreach = Boolean(data.isPartOfOutreach);

    await member.save();

    revalidatePath("/connect-team");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update profile." };
  }
}