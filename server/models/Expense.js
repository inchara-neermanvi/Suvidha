import mongoose from 'mongoose'

const expenseSchema = new mongoose.Schema({
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
  category: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0 },
  date: { type: Date, required: true, default: Date.now },
  vendor: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  documentUrl: { type: String, default: '' },
  published: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

expenseSchema.index({ property: 1, date: -1 })
export default mongoose.model('Expense', expenseSchema)
