// src/models/TeamMember.ts
import mongoose, { Schema, Document, models, model } from "mongoose";

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
    groupName: { 
      type: String, 
      required: true, 
      enum: ["Team Leaders", "Follow Up Team", "Members"], 
      default: "Members" 
    },
    active: { type: Boolean, default: true },
    assignedUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null
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
TeamMemberSchema.index({ assignedUserId: 1 });
TeamMemberSchema.index({ birthdate: 1 });

export default models.TeamMember || model<ITeamMember>("TeamMember", TeamMemberSchema);