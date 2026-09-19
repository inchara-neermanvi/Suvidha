import mongoose from 'mongoose'

const propertySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  currency: { type: String, default: 'INR' },
  paymentQrCode: { type: String, default: '' },
}, { timestamps: true })

export default mongoose.model('Property', propertySchema)