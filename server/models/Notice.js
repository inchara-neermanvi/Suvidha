import mongoose from 'mongoose'

const noticeSchema = new mongoose.Schema({
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
  title: { type: String, required: true, trim: true },
  body: { type: String, required: true, trim: true },
  translations: [{ language: { type: String, required: true }, title: String, body: String }],
  published: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

noticeSchema.index({ property: 1, published: 1, createdAt: -1 })
export default mongoose.model('Notice', noticeSchema)
