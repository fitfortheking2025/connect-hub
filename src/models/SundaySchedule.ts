import mongoose, { Schema, Document } from "mongoose";

export interface IAttendee {
  memberId?: string;
  name: string;
  service: "10AM" | "1PM" | "4PM" | "NOT_ATTENDING";
  reason?: string;
  isLockedByLeader?: boolean;
  assignedBy?: string;
  updatedAt: Date;
}

export interface ISundaySchedule extends Document {
  sundayDate: string;
  isRegistrationOpen?: boolean;
  attendees: IAttendee[];
  createdAt: Date;
  updatedAt: Date;
}

const AttendeeSchema = new Schema<IAttendee>(
  {
    memberId: { type: String, default: "" },
    name: { type: String, required: true },
    service: {
      type: String,
      enum: ["10AM", "1PM", "4PM", "NOT_ATTENDING"],
      required: true,
    },
    reason: { type: String, default: "" },
    isLockedByLeader: { type: Boolean, default: false },
    assignedBy: { type: String, default: "" },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const SundayScheduleSchema = new Schema<ISundaySchedule>(
  {
    sundayDate: { type: String, required: true, unique: true },
    isRegistrationOpen: { type: Boolean, default: false },
    attendees: [AttendeeSchema],
  },
  { timestamps: true }
);

export const SundaySchedule =
  mongoose.models.SundaySchedule ||
  mongoose.model<ISundaySchedule>("SundaySchedule", SundayScheduleSchema);