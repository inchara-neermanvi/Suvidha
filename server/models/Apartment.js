import mongoose from 'mongoose'

const apartmentSchema = new mongoose.Schema({
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
  name: { type: String, default: '', trim: true },
  block: { type: String, required: true, trim: true },
  flatNumber: { type: String, required: true, trim: true },
  floor: { type: String, default: '' },
  flatType: { type: String, default: 'Apartment' },
  bedrooms: { type: Number, default: 1, min: 0 },
  monthlyRent: { type: Number, required: true, min: 0 },
  securityDeposit: { type: Number, default: 0, min: 0 },
  maintenanceCharge: { type: Number, default: 0, min: 0 },
  electricityCharge: { type: Number, default: 0, min: 0 },
  waterCharge: { type: Number, default: 0, min: 0 },
  parkingCharge: { type: Number, default: 0, min: 0 },
  otherCharges: [{ name: String, amount: Number, frequency: { type: String, enum: ['monthly', 'one-time'], default: 'monthly' } }],
  status: { type: String, enum: ['Vacant', 'Occupied'], default: 'Vacant' },
  resident: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  rentChanges: [{ amount: Number, effectiveFrom: Date }],
}, { timestamps: true })

apartmentSchema.index({ property: 1, flatNumber: 1 }, { unique: true })
export default mongoose.model('Apartment', apartmentSchema)