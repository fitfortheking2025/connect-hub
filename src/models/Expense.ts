import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IExpense extends Document {
  expenseName: string;
  amount: number;
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
      required: true 
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

// 1. Index for Sorting chronological disbursements
ExpenseSchema.index({ createdAt: -1 });

// 2. Text index for search by expense name/notes
ExpenseSchema.index({ expenseName: "text" });

export default models.Expense || model<IExpense>("Expense", ExpenseSchema);