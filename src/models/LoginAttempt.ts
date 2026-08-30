import mongoose, { Schema, Document } from "mongoose";

export interface ILoginAttempt extends Document {
  identifier: string;
  count: number;
  lastAttempt: Date;
  blockedUntil?: Date;
}

const LoginAttemptSchema = new Schema<ILoginAttempt>(
  {
    identifier: { type: String, required: true, unique: true, index: true },
    count: { type: Number, default: 0 },
    lastAttempt: { type: Date, default: Date.now },
    blockedUntil: { type: Date, default: null },
  },
  { timestamps: true }
);

// Auto-delete records after 24 hours of inactivity
LoginAttemptSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 86400 });

export const LoginAttempt =
  mongoose.models.LoginAttempt ||
  mongoose.model<ILoginAttempt>("LoginAttempt", LoginAttemptSchema);