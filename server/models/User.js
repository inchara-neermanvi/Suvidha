import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['owner', 'resident', 'maintenance_staff', 'admin'], default: 'resident' },
  phone: { type: String, default: '' },
  society: { type: String, default: 'Aster Heights' },
  flat: { type: String, default: '' },
  block: { type: String, default: '' },
  floor: { type: String, default: '' },
  propertyIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Property' }],
  apartmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Apartment', default: null },
  leaseStart: { type: Date },
  leaseEnd: { type: Date },
  moveInDate: { type: Date },
}, { timestamps: true })

export default mongoose.model('User', userSchema)
