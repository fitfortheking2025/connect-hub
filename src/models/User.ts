// src/models/User.ts
import mongoose, { Schema, Document, models, model } from "mongoose";

export type UserRole = "ADMIN" | "TEAM_LEADER" | "FINANCE_LEADER" | "FOLLOW_UP_TEAM" | "MEMBER";

export interface IUser extends Document {
  username: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  teamMemberId?: mongoose.Types.ObjectId;
  assignedAgeGroups: ("Youth" | "Young Adult" | "River Men" | "River Women" | "Seasoned")[];
  assignedGender: number | null; // 0 = Female, 1 = Male, null = Any / Both
  isActive: boolean;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: { 
      type: String, 
      required: true, 
      trim: true, 
      lowercase: true 
    },
    passwordHash: { 
      type: String, 
      required: true 
    },
    fullName: { 
      type: String, 
      required: true, 
      trim: true 
    },
    role: { 
      type: String, 
      required: true, 
      enum: ["ADMIN", "TEAM_LEADER", "FINANCE_LEADER", "FOLLOW_UP_TEAM", "MEMBER"], 
      default: "FOLLOW_UP_TEAM" 
    },
    teamMemberId: { 
      type: Schema.Types.ObjectId, 
      ref: "TeamMember",
      default: null 
    },
    assignedAgeGroups: {
      type: [String],
      enum: ["Youth", "Young Adult", "River Men", "River Women", "Seasoned"],
      default: [],
    },
    assignedGender: {
      type: Number,
      enum: [0, 1, null],
      default: null,
    },
    isActive: { 
      type: Boolean, 
      default: true 
    },
    createdBy: { 
      type: Schema.Types.ObjectId, 
      ref: "User",
      default: null 
    },
  },
  { 
    timestamps: true 
  }
);

UserSchema.index({ username: 1 }, { unique: true });
UserSchema.index({ role: 1, isActive: 1 });

export default models.User || model<IUser>("User", UserSchema);