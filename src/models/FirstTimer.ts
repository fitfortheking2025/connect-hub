import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IFirstTimer extends Document {
  iam: "VISITOR" | "FROM OTHER CHURCH" | "LOOKING FOR A CHURCH";
  fullName: string;
  gender: number; // 0 = Female, 1 = Male
  contact: string;
  ageGroup: "Youth" | "Young Adult" | "River Men" | "River Women" | "Seasoned";
  messenger?: string;
  serviceAttended: "10AM" | "1PM" | "4PM";
  invitedBy?: string;
  lifeGroupInterest: "YES" | "NO";
  connectedWith?: string;
  approachedBy: string;
  textedAlready: boolean;
  updateReport?: string;
  followedUpBy?: string;
  followedUpByUserId?: mongoose.Types.ObjectId;
  startedOne2One: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FirstTimerSchema = new Schema<IFirstTimer>(
  {
    iam: { 
      type: String, 
      required: true, 
      enum: ["VISITOR", "FROM OTHER CHURCH", "LOOKING FOR A CHURCH"],
      index: true
    },
    fullName: { 
      type: String, 
      required: true, 
      trim: true 
    },
    gender: { 
      type: Number, 
      default: 0 
    },
    contact: { 
      type: String, 
      default: "", 
      trim: true 
    },
    ageGroup: { 
      type: String, 
      required: true, 
      enum: ["Youth", "Young Adult", "River Men", "River Women", "Seasoned"],
      index: true
    },
    messenger: { 
      type: String, 
      default: "", 
      trim: true 
    },
    serviceAttended: { 
      type: String, 
      required: true, 
      enum: ["10AM", "1PM", "4PM"],
      index: true
    },
    invitedBy: { 
      type: String, 
      default: "" 
    },
    lifeGroupInterest: { 
      type: String, 
      default: "NO", 
      enum: ["YES", "NO"],
      index: true
    },
    connectedWith: { 
      type: String, 
      default: "" 
    },
    approachedBy: { 
      type: String, 
      required: true,
      index: true
    },
    textedAlready: { 
      type: Boolean, 
      default: false,
      index: true
    },
    updateReport: { 
      type: String, 
      default: "" 
    },
    followedUpBy: { 
      type: String, 
      default: "" 
    },
    followedUpByUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },
    startedOne2One: { 
      type: Boolean, 
      default: false,
      index: true
    },
  },
  { 
    timestamps: true 
  }
);

// --- PERFORMANCE INDEXES ---

// 1. Full-text search index for live search input (names, contacts, messenger, approacher)
FirstTimerSchema.index({
  fullName: "text",
  contact: "text",
  messenger: "text",
  approachedBy: "text",
  connectedWith: "text"
});

// 2. Compound index for Service Date + Service Slot filtering and sorting
FirstTimerSchema.index({ createdAt: -1, serviceAttended: 1 });

// 3. Compound index for Discipleship pipeline analytics (e.g., all visitors in 10AM who started 1-to-1)
FirstTimerSchema.index({ serviceAttended: 1, startedOne2One: 1 });

// 4. Compound index for Follow-Up Team tracking queues
FirstTimerSchema.index({ followedUpByUserId: 1, startedOne2One: 1, textedAlready: 1 });

export default models.FirstTimer || model<IFirstTimer>("FirstTimer", FirstTimerSchema);