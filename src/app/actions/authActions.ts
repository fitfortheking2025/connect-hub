"use server";

import { signIn, signOut, auth } from "@/lib/auth";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import { User, TeamMember } from "@/models";
import { revalidatePath } from "next/cache";

export async function loginAction(formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const callbackUrl = (formData.get("callbackUrl") as string) || "/";

  try {
    await signIn("credentials", {
      username,
      password,
      redirectTo: callbackUrl,
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid username or password." };
        default:
          return { error: "Authentication failed. Please try again." };
      }
    }
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

export async function createStaffUserAction(formData: FormData) {
  try {
    const session = await auth();
    const currentUserRole = (session?.user as any)?.role;

    if (currentUserRole !== "ADMIN") {
      return { success: false, error: "Unauthorized. Only administrators can create accounts." };
    }

    await dbConnect();

    const username = (formData.get("username") as string)?.toLowerCase().trim();
    const password = formData.get("password") as string;
    const fullName = formData.get("fullName") as string;
    const role = formData.get("role") as "TEAM_LEADER" | "FOLLOW_UP_TEAM";
    const teamMemberId = formData.get("teamMemberId") as string;

    if (!username || !password || !fullName || !role) {
      return { success: false, error: "Please fill in all required fields." };
    }

    if (password.length < 6) {
      return { success: false, error: "Password must be at least 6 characters." };
    }

    const existing = await User.findOne({ username });
    if (existing) {
      return { success: false, error: "A user with this username already exists." };
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      username,
      passwordHash,
      fullName: fullName.trim(),
      role,
      teamMemberId: teamMemberId || null,
      isActive: true,
      createdBy: (session?.user as any)?.id,
    });

    if (teamMemberId) {
      await TeamMember.findByIdAndUpdate(teamMemberId, {
        assignedUserId: newUser._id,
      });
    }

    revalidatePath("/admin/users");
    revalidatePath("/team");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create user account." };
  }
}