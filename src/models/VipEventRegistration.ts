// src/models/VipEventRegistration.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IVipEventRegistration extends Document {
  ticketCode: string;
  fullName: string;
  contactNumber: string;
  discipler: string;
  ageGroup: "Youth" | "Young Adult" | "River Men" | "River Women" | "Seasoned";
  eventDate: string; // "2026-11-07"
  status: "REGISTERED" | "ATTENDED" | "CANCELLED";
  attendedAt?: Date;
  scannedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VipEventRegistrationSchema = new Schema<IVipEventRegistration>(
  {
    ticketCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      uppercase: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    contactNumber: {
      type: String,
      required: true,
      trim: true,
    },
    discipler: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    ageGroup: {
      type: String,
      enum: ["Youth", "Young Adult", "River Men", "River Women", "Seasoned"],
      required: true,
      index: true,
    },
    eventDate: {
      type: String,
      default: "2026-11-07",
      index: true,
    },
    status: {
      type: String,
      enum: ["REGISTERED", "ATTENDED", "CANCELLED"],
      default: "REGISTERED",
      index: true,
    },
    attendedAt: {
      type: Date,
    },
    scannedBy: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const VipEventRegistration: Model<IVipEventRegistration> =
  mongoose.models.VipEventRegistration ||
  mongoose.model<IVipEventRegistration>("VipEventRegistration", VipEventRegistrationSchema);

export default VipEventRegistration;