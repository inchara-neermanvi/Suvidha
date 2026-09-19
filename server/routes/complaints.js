import { Router } from 'express'
import Complaint from '../models/Complaint.js'
import Notification from '../models/Notification.js'
import { protect, allowRoles } from '../middleware/auth.js'

const router = Router()
router.use(protect)

router.get('/', async (req, res, next) => {
  try {
    const filter = req.user.role === 'resident' ? { resident: req.user._id } : req.user.role === 'maintenance_staff' ? { assignedStaffUser: req.user._id } : { property: { $in: req.user.propertyIds || [] } }
    res.json(await Complaint.find(filter).populate('resident', 'name email phone flat').sort({ createdAt: -1 }))
  } catch (error) { next(error) }
})
router.post('/', async (req, res, next) => {
  try {
    const property = req.user.role === 'resident' ? req.user.propertyIds?.[0] : req.body.property
    const apartment = req.user.role === 'resident' ? req.user.apartmentId : req.body.apartment
    if (req.user.role === 'resident' && !property) return res.status(409).json({ message: 'Your account is not assigned to a property yet' })
    const similar = await Complaint.findOne({ property, location: req.body.location, status: { $nin: ['Resolved', 'Closed'] }, title: { $regex: String(req.body.title || '').split(' ')[0], $options: 'i' } }).sort({ createdAt: -1 })
    if (similar && req.body.followExisting) return res.json({ followed: true, complaint: similar })
    const complaint = await Complaint.create({ ...req.body, property, apartment, resident: req.user._id, followers: [] })
    res.status(201).json(complaint)
  } catch (error) { next(error) }
})
router.get('/:id', async (req, res, next) => {
  try {
    const complaint = await Complaint.findOne({ _id: req.params.id, ...(req.user.role === 'resident' ? { resident: req.user._id } : req.user.role === 'maintenance_staff' ? { assignedStaffUser: req.user._id } : { property: { $in: req.user.propertyIds || [] } }) }).populate('resident', 'name email phone flat')
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' })
    res.json(complaint)
  } catch (error) { next(error) }
})
router.patch('/:id', allowRoles('owner', 'admin', 'maintenance_staff'), async (req, res, next) => {
  try {
    const filter = req.user.role === 'maintenance_staff' ? { _id: req.params.id, assignedStaffUser: req.user._id } : { _id: req.params.id, property: { $in: req.user.propertyIds || [] } }
    const before = await Complaint.findOne(filter)
    const complaint = await Complaint.findOneAndUpdate(filter, { $set: req.body }, { new: true, runValidators: true })
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' })
    if (before && req.body.status && req.body.status !== before.status) await Notification.create({ recipient: complaint.resident, property: complaint.property, type: 'COMPLAINT_UPDATE', title: 'Complaint status updated', message: `${complaint.complaintId} is now ${complaint.status}.` })
    res.json(complaint)
  } catch (error) { next(error) }
})
router.post('/:id/updates', allowRoles('owner', 'admin', 'maintenance_staff', 'resident'), async (req, res, next) => {
  try {
    const complaint = await Complaint.findOneAndUpdate({ _id: req.params.id, ...(req.user.role === 'resident' ? { resident: req.user._id } : { property: { $in: req.user.propertyIds || [] } }) }, { $push: { updates: { text: req.body.text, author: req.user.name } } }, { new: true })
    res.json(complaint)
  } catch (error) { next(error) }
})
export default router
