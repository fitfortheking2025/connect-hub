// src/models/FinanceSettings.ts
import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IFinanceSettings extends Document {
  funds2025: number;
  remainingFunds2026: number;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FinanceSettingsSchema = new Schema<IFinanceSettings>(
  {
    funds2025: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    remainingFunds2026: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default models.FinanceSettings ||
  model<IFinanceSettings>("FinanceSettings", FinanceSettingsSchema);