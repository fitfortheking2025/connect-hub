// src/models/TeamMember.ts
import mongoose, { Schema, Document, models, model } from "mongoose";
import crypto from "crypto";

export type TeamGroup = "Team Leaders" | "Follow Up Team" | "Members";
export type GenderType = "Male" | "Female";

export interface ITeamMember extends Document {
  name: string;
  nickname?: string;
  gender?: GenderType;
  birthdate?: Date;
  contactNumber?: string;
  email?: string;
  socialMedia?: string;
  photoUrl?: string;
  cloudinaryPublicId?: string;

  updateCode: string; // 7-char alphanumeric code

  groupName: TeamGroup;
  active: boolean;
  assignedUserId?: mongoose.Types.ObjectId;

  discipler?: string;
  disciples?: string[];
  discipleshipClasses?: string[];
  isPartOfOutreach?: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export function generateUpdateCode(): string {
  return crypto.randomBytes(6).toString("base64url").slice(0, 7).toLowerCase();
}

const TeamMemberSchema = new Schema<ITeamMember>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    nickname: { type: String, trim: true },
    gender: { type: String, enum: ["Male", "Female"] },
    birthdate: { type: Date },
    contactNumber: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    socialMedia: { type: String, trim: true },
    photoUrl: { type: String, default: "" },
    cloudinaryPublicId: { type: String, default: "" },

    updateCode: {
      type: String,
      unique: true,
      sparse: true,
      default: () => generateUpdateCode(),
    },

    groupName: {
      type: String,
      required: true,
      enum: ["Team Leaders", "Follow Up Team", "Members"],
      default: "Members",
    },
    active: { type: Boolean, default: true },
    assignedUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    discipler: { type: String, trim: true },
    disciples: { type: [String], default: [] },
    discipleshipClasses: { type: [String], default: [] },
    isPartOfOutreach: { type: Boolean, default: false },
  },
  { timestamps: true }
);

TeamMemberSchema.index({ name: 1 }, { unique: true });
TeamMemberSchema.index({ groupName: 1, active: 1 });
TeamMemberSchema.index({ updateCode: 1 }, { unique: true, sparse: true });

export default models.TeamMember || model<ITeamMember>("TeamMember", TeamMemberSchema);