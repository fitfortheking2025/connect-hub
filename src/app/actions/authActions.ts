"use server";

import { signIn, signOut, auth } from "@/lib/auth";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import { User, TeamMember } from "@/models";
import { revalidatePath } from "next/cache";
import { checkRateLimit, recordFailedAttempt, clearLoginAttempts } from "@/lib/rateLimit";

export async function changePasswordAction(formData: FormData) {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return { success: false, error: "Unauthorized. Please log in first." };
    }

    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return { success: false, error: "Please fill in all password fields." };
    }

    if (newPassword.length < 6) {
      return { success: false, error: "New password must be at least 6 characters." };
    }

    if (newPassword !== confirmPassword) {
      return { success: false, error: "New password and confirmation do not match." };
    }

    await dbConnect();

    const user = await User.findById(userId);
    if (!user || !user.passwordHash) {
      return { success: false, error: "User account not found." };
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return { success: false, error: "Current password is incorrect." };
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update password." };
  }
}

export async function loginAction(formData: FormData) {
  const username = (formData.get("username") as string) || "";
  const password = (formData.get("password") as string) || "";
  const callbackUrl = (formData.get("callbackUrl") as string) || "/";

  if (!username.trim() || !password) {
    return { error: "Please enter both username and password." };
  }

  // 1. Check rate limit
  const rateLimitStatus = await checkRateLimit(username);
  if (!rateLimitStatus.allowed) {
    return { error: rateLimitStatus.error };
  }

  try {
    // 2. Attempt authentication
    await signIn("credentials", {
      username,
      password,
      redirectTo: callbackUrl,
    });

    // 3. Clear failed attempts on successful sign-in
    await clearLoginAttempts(username);
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      // 4. Record failed attempt on bad credentials
      await recordFailedAttempt(username);

      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid username or password." };
        default:
          return { error: "Authentication error. Please try again." };
      }
    }

    // Rethrow Next.js redirect exceptions
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

export async function createStaffUserAction(formData: FormData) {
  try {
    const session = await auth();
    const currentUserRole = String((session?.user as any)?.role || "").toUpperCase();

    if (currentUserRole !== "ADMIN") {
      return { success: false, error: "Unauthorized. Only Admins can create accounts." };
    }

    await dbConnect();

    const username = (formData.get("username") as string)?.toLowerCase().trim();
    const password = "connect2026";
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
      assignedAgeGroups: [],
      assignedGender: null,
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

export async function updateUserAssignmentAction(data: {
  userId: string;
  role: "ADMIN" | "TEAM_LEADER" | "FOLLOW_UP_TEAM";
  assignedAgeGroups: string[];
  assignedGender: number | null;
}) {
  try {
    const session = await auth();
    const currentUserRole = String((session?.user as any)?.role || "").toUpperCase();

    if (currentUserRole !== "ADMIN") {
      return { success: false, error: "Unauthorized. Only Admins can create accounts." };
    }

    await dbConnect();

    const updatePayload: Record<string, any> = {
      role: data.role,
      assignedAgeGroups: data.role === "FOLLOW_UP_TEAM" ? data.assignedAgeGroups : [],
      assignedGender: data.role === "FOLLOW_UP_TEAM" ? data.assignedGender : null,
    };

    const updatedUser = await User.findByIdAndUpdate(data.userId, updatePayload, { new: true });
    if (!updatedUser) {
      return { success: false, error: "User account not found." };
    }

    revalidatePath("/admin/users");
    revalidatePath("/vips");

    return { success: true, message: `Updated permissions for ${updatedUser.fullName}.` };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update account." };
  }
}