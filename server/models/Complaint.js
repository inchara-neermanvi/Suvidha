import mongoose from 'mongoose'

const complaintSchema = new mongoose.Schema({
  complaintId: { type: String, unique: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  flat: { type: String, required: true },
  block: { type: String, default: '' },
  floor: { type: String, default: '' },
  location: { type: String, default: '' },
  media: [{ name: String, type: String, url: String }],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  affectedResidents: { type: Number, default: 1 },
  suggestedStaff: { type: String, default: '' },
  aiSuggestion: { category: String, priority: String, staff: String },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Emergency'], default: 'Low' },
  status: { type: String, enum: ['Pending', 'Assigned', 'In Progress', 'Resolved', 'Closed'], default: 'Pending' },
  contactMethod: { type: String, default: 'Phone' },
  resident: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', index: true },
  apartment: { type: mongoose.Schema.Types.ObjectId, ref: 'Apartment' },
  assignedStaffUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  assignedStaff: { type: String, default: 'Unassigned' },
  updates: [{ text: String, author: String, createdAt: { type: Date, default: Date.now } }],
}, { timestamps: true })

complaintSchema.pre('save', async function assignComplaintId() {
  if (!this.complaintId) {
    const count = await mongoose.model('Complaint').countDocuments()
    this.complaintId = `SUV-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`
  }
})

export default mongoose.model('Complaint', complaintSchema)
