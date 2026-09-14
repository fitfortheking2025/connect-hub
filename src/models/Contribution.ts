// src/models/Contribution.ts
import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IContribution extends Document {
  memberId: mongoose.Types.ObjectId;
  month: number; // 1 - 12
  year: number;
  amount: number;
  batchId?: string; // Groups multi-month payments paid in one go (e.g. 500 for 5 months)
  paymentMethod?: "CASH" | "GCASH" | "BANK_TRANSFER" | "OTHER";
  notes?: string;
  recordedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ContributionSchema = new Schema<IContribution>(
  {
    memberId: { 
      type: Schema.Types.ObjectId, 
      ref: "TeamMember", 
      required: true 
    },
    month: { 
      type: Number, 
      required: true, 
      min: 1, 
      max: 12 
    },
    year: { 
      type: Number, 
      required: true, 
      default: 2026 
    },
    amount: { 
      type: Number, 
      required: true, 
      default: 100.00 
    },
    batchId: {
      type: String,
      default: null,
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ["CASH", "GCASH", "BANK_TRANSFER", "OTHER"],
      default: "CASH",
    },
    notes: {
      type: String,
      trim: true,
      default: null,
    },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { 
    timestamps: true 
  }
);

// --- PERFORMANCE INDEXES ---

// 1. Unique Compound Index: Enforces exactly one contribution per member per month/year
ContributionSchema.index({ memberId: 1, year: 1, month: 1 }, { unique: true });

// 2. Compound Index for Quick Year Ledger aggregation
ContributionSchema.index({ year: 1, month: 1 });

// 3. Index for individual member payment history lookup
ContributionSchema.index({ memberId: 1, year: -1, month: -1 });

export default models.Contribution || model<IContribution>("Contribution", ContributionSchema);