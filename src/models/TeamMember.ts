import mongoose, { Schema, Document, models, model } from "mongoose";

export type TeamGroup = "Team Leaders" | "Follow Up Team" | "Members";

export interface ITeamMember extends Document {
  name: string;
  groupName: TeamGroup;
  active: boolean;
  assignedUserId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TeamMemberSchema = new Schema<ITeamMember>(
  {
    name: { 
      type: String, 
      required: true, 
      unique: true, 
      trim: true 
    },
    groupName: { 
      type: String, 
      required: true, 
      enum: ["Team Leaders", "Follow Up Team", "Members"], 
      default: "Members" 
    },
    active: { 
      type: Boolean, 
      default: true 
    },
    assignedUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  { 
    timestamps: true 
  }
);

// --- PERFORMANCE INDEXES ---

// 1. Unique index for Member Name lookups
TeamMemberSchema.index({ name: 1 }, { unique: true });

// 2. Compound index for Group Filtering and Active Roster queries
TeamMemberSchema.index({ groupName: 1, active: 1 });

// 3. Index for linked User accounts
TeamMemberSchema.index({ assignedUserId: 1 });

export default models.TeamMember || model<ITeamMember>("TeamMember", TeamMemberSchema);