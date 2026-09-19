import mongoose from 'mongoose'

const emergencyAlertSchema = new mongoose.Schema({
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
  type: { type: String, enum: ['Fire', 'Water supply', 'Electrical issue', 'Security', 'Lift emergency', 'Other'], required: true },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  target: { type: String, enum: ['Entire apartment', 'Block', 'Floor/area'], default: 'Entire apartment' },
  targetValue: { type: String, default: '' },
  active: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

emergencyAlertSchema.index({ property: 1, active: 1, createdAt: -1 })
export default mongoose.model('EmergencyAlert', emergencyAlertSchema)
