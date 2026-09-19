import mongoose from 'mongoose'

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, unique: true, index: true },
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
  apartment: { type: mongoose.Schema.Types.ObjectId, ref: 'Apartment', required: true },
  resident: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  period: { type: String, required: true },
  lineItems: [{ label: String, amount: { type: Number, min: 0 } }],
  total: { type: Number, required: true, min: 0 },
  dueDate: { type: Date, required: true },
  lateFee: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ['PENDING', 'PAID', 'OVERDUE', 'CANCELLED'], default: 'PENDING' },
  paidAt: Date,
}, { timestamps: true })

invoiceSchema.pre('save', async function setInvoiceNumber() {
  if (!this.invoiceNumber) this.invoiceNumber = `SUV-INV-${new Date().getFullYear()}-${String(await mongoose.model('Invoice').countDocuments() + 1).padStart(6, '0')}`
})

invoiceSchema.index({ apartment: 1, period: 1 }, { unique: true })
export default mongoose.model('Invoice', invoiceSchema)