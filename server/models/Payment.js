import mongoose from 'mongoose'

const paymentSchema = new mongoose.Schema({
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true, index: true },
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  resident: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  provider: { type: String, enum: ['TEST', 'RAZORPAY'], default: 'TEST' },
  orderId: { type: String, required: true, unique: true },
  paymentId: { type: String, default: '' },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['CREATED', 'PAID', 'FAILED'], default: 'CREATED' },
  method: { type: String, default: '' },
  paidAt: Date,
}, { timestamps: true })

export default mongoose.model('Payment', paymentSchema)