import mongoose from 'mongoose'

const moveChecklistSchema = new mongoose.Schema({
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
  resident: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  apartment: { type: mongoose.Schema.Types.ObjectId, ref: 'Apartment', default: null },
  type: { type: String, enum: ['Move-in', 'Move-out'], required: true },
  residentDetails: { type: String, default: '' },
  apartmentNumber: { type: String, default: '' },
  keyHandover: { type: Boolean, default: false },
  parkingInformation: { type: String, default: '' },
  meterReading: { type: String, default: '' },
  pendingDues: { type: Number, default: 0, min: 0 },
  documents: { type: String, default: '' },
  finalInspection: { type: Boolean, default: false },
  handoverStatus: { type: String, enum: ['Draft', 'In progress', 'Complete'], default: 'Draft' },
}, { timestamps: true })

moveChecklistSchema.index({ property: 1, resident: 1, type: 1 })
export default mongoose.model('MoveChecklist', moveChecklistSchema)
