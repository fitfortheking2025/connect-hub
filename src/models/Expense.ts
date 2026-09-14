// src/models/Expense.ts
import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IExpense extends Document {
  expenseName: string;
  amount: number;
  expenseDate: Date;
  notes?: string;
  recordedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    expenseName: { 
      type: String, 
      required: true, 
      trim: true 
    },
    amount: { 
      type: Number, 
      required: true,
      min: 0 
    },
    expenseDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    notes: {
      type: String,
      trim: true,
      default: ""
    },
    recordedBy: {
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

// 1. Primary sort index by transaction date
ExpenseSchema.index({ expenseDate: -1 });

// 2. Chronological audit index
ExpenseSchema.index({ createdAt: -1 });

// 3. Text search by expense name
ExpenseSchema.index({ expenseName: "text" });

export default models.Expense || model<IExpense>("Expense", ExpenseSchema);