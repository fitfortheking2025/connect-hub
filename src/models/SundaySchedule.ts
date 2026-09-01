// src/models/SundaySchedule.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISundayAttendee {
  memberId?: string;
  name: string;
  service: "10AM" | "1PM" | "4PM" | "NOT_ATTENDING";
  reason?: string;
  editToken: string;
  isLockedByLeader?: boolean;
  assignedBy?: string;
  updatedAt: Date;
}

export interface ISundaySchedule extends Document {
  sundayDate: string;
  attendees: ISundayAttendee[];
  createdAt: Date;
  updatedAt: Date;
}

const AttendeeSchema = new Schema<ISundayAttendee>({
  memberId: { type: String, default: "" },
  name: { type: String, required: true },
  service: { 
    type: String, 
    enum: ["10AM", "1PM", "4PM", "NOT_ATTENDING"], 
    required: true 
  },
  reason: { type: String, default: "" },
  editToken: { type: String, required: true },
  isLockedByLeader: { type: Boolean, default: false },
  assignedBy: { type: String, default: "" },
  updatedAt: { type: Date, default: Date.now },
});

const SundayScheduleSchema = new Schema<ISundaySchedule>(
  {
    sundayDate: { type: String, required: true, unique: true, index: true },
    attendees: [AttendeeSchema],
  },
  { timestamps: true }
);

export const SundaySchedule: Model<ISundaySchedule> =
  mongoose.models.SundaySchedule ||
  mongoose.model<ISundaySchedule>("SundaySchedule", SundayScheduleSchema);