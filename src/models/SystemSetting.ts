// src/models/SystemSetting.ts
import mongoose, { Schema, Document, models, model } from "mongoose";

export type SettingCategory = "ATTENDANCE" | "FINANCE" | "VIP" | "GENERAL";

export interface ISystemSetting extends Document {
  key: string;
  category: SettingCategory;
  description?: string;
  value: Record<string, any>;
  isSystemLocked?: boolean;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SystemSettingSchema = new Schema<ISystemSetting>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["ATTENDANCE", "FINANCE", "VIP", "GENERAL"],
      default: "GENERAL",
      index: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    value: {
      type: Schema.Types.Mixed,
      required: true,
      default: {},
    },
    isSystemLocked: {
      type: Boolean,
      default: false,
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

SystemSettingSchema.index({ category: 1, key: 1 });

export default models.SystemSetting || model<ISystemSetting>("SystemSetting", SystemSettingSchema);