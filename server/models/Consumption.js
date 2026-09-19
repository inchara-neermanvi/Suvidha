import mongoose from 'mongoose'

const consumptionSchema = new mongoose.Schema({
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
  apartment: { type: mongoose.Schema.Types.ObjectId, ref: 'Apartment', default: null },
  month: { type: Date, required: true },
  water: { type: Number, min: 0, default: 0 },
  electricity: { type: Number, min: 0, default: 0 },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

consumptionSchema.index({ property: 1, apartment: 1, month: -1 }, { unique: true })
export default mongoose.model('Consumption', consumptionSchema)
