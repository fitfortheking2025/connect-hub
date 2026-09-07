// src/app/actions/uploadAction.ts
"use server";

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadMemberPhotoAction(base64Data: string, memberName: string) {
  try {
    const cleanName = memberName.toLowerCase().replace(/[^a-z0-9]/g, "_");
    const result = await cloudinary.uploader.upload(base64Data, {
      folder: "connect_members/birthdays",
      public_id: `${cleanName}_${Date.now()}`,
      transformation: [
        { width: 500, height: 500, crop: "fill", gravity: "face" },
        { quality: "auto", fetch_format: "auto" },
      ],
    });

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to upload photo." };
  }
}