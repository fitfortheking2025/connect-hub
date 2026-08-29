"use server";

import dbConnect from "@/lib/mongodb";
import { User } from "@/models";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function changePasswordAction(data: {
  currentPassword: string;
  newPassword: string;
}) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    await dbConnect();
    const userId = (session.user as any).id || (session.user as any)._id;
    const user = await User.findById(userId);

    if (!user) {
      return { success: false, error: "User record not found." };
    }

    const isValid = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!isValid) {
      return { success: false, error: "Incorrect current password." };
    }

    const newHash = await bcrypt.hash(data.newPassword, 10);
    user.passwordHash = newHash;
    await user.save();

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update password." };
  }
}