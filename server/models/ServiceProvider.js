import mongoose from 'mongoose'

const serviceProviderSchema = new mongoose.Schema({
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  phone: { type: String, required: true, trim: true },
  category: { type: String, required: true, enum: ['Plumber', 'Electrician', 'Carpenter', 'Painter', 'AC Technician', 'Washing Machine Technician', 'Refrigerator Technician', 'Internet/Wi-Fi Technician', 'Pest Control', 'Cleaning Service', 'Security/Other'] },
  areaServed: { type: String, default: '', trim: true, maxlength: 120 },
  description: { type: String, default: '', trim: true, maxlength: 500 },
  rating: { type: Number, min: 1, max: 5 },
  review: { type: String, default: '', trim: true, maxlength: 500 },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reports: [{ reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, reason: { type: String, maxlength: 300 }, createdAt: { type: Date, default: Date.now } }],
}, { timestamps: true })

serviceProviderSchema.index({ property: 1, category: 1 })
export default mongoose.model('ServiceProvider', serviceProviderSchema)