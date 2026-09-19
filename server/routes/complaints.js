import { Router } from 'express'
import Complaint from '../models/Complaint.js'
import Notification from '../models/Notification.js'
import User from '../models/User.js'
import { protect, allowRoles } from '../middleware/auth.js'

const router = Router()
router.use(protect)
const slaHours = { Low: 72, Medium: 48, High: 24, Emergency: 4 }
const categoryKeywords = {
  Plumbing: /leak|pipe|tap|toilet|drain|plumb/i,
  Electrical: /power|switch|light|wire|electric|socket/i,
  Lift: /lift|elevator/i,
  Cleaning: /clean|garbage|waste|dirty/i,
  Security: /security|guard|lock|theft/i,
  Water: /water|supply|tank/i,
  Parking: /park|vehicle|car|bike/i,
}

function suggestedCategory(title, description, selected) {
  if (selected && selected !== 'Other') return selected
  const text = `${title || ''} ${description || ''}`
  return Object.entries(categoryKeywords).find(([, pattern]) => pattern.test(text))?.[0] || selected || 'Other'
}

function departmentPattern(department) {
  const value = String(department || '').trim()
  return value.toLowerCase() === 'cleaning' ? 'clean|general' : value || 'general'
}

async function claimPendingComplaints(staff) {
  const pending = await Complaint.find({ assignedStaffUser: null, status: 'Pending' }).populate('resident', 'society')
  const pattern = departmentPattern(staff.department || staff.block)
  const matches = pending.filter(complaint => complaint.resident?.society === staff.society && new RegExp(pattern, 'i').test(complaint.category))
  for (const complaint of matches) {
    complaint.assignedStaffUser = staff._id
    complaint.assignedStaff = staff.name
    complaint.assignedStaffPhone = staff.phone
    complaint.assignedAt = new Date()
    complaint.expectedResolutionAt = complaint.expectedResolutionAt || new Date(complaint.createdAt.getTime() + (slaHours[complaint.priority] || 48) * 3600000)
    complaint.status = 'Assigned'
    await complaint.save()
    await Notification.create({
      recipient: staff._id,
      property: complaint.property,
      type: 'COMPLAINT_ASSIGNED',
      title: `New ${complaint.category} task assigned`,
      message: `${complaint.complaintId}: ${complaint.title} at flat ${complaint.flat}. Location: ${complaint.location || 'Not specified'}. Priority: ${complaint.priority}.`,
    })
  }
}

router.get('/', async (req, res, next) => {
  try {
    if (req.user.role === 'maintenance_staff') await claimPendingComplaints(req.user)
    const filter = req.user.role === 'resident' ? { resident: req.user._id } : req.user.role === 'maintenance_staff' ? { assignedStaffUser: req.user._id } : { property: { $in: req.user.propertyIds || [] } }
    const complaints = await Complaint.find(filter).populate('resident', 'name email phone flat block society').populate('assignedStaffUser', 'name phone').sort({ createdAt: -1 })
    const now = Date.now()
    res.json(complaints.map(complaint => {
      const overdue = complaint.expectedResolutionAt && complaint.expectedResolutionAt < now && !['Resolved', 'Closed'].includes(complaint.status)
      return overdue ? { ...complaint.toObject(), status: 'Overdue' } : complaint
    }))
  } catch (error) { next(error) }
})
router.post('/', async (req, res, next) => {
  try {
    const property = req.user.role === 'resident' ? req.user.propertyIds?.[0] : req.body.property
    const apartment = req.user.role === 'resident' ? req.user.apartmentId : req.body.apartment
    if (req.user.role === 'resident' && !property) return res.status(409).json({ message: 'Your account is not assigned to a property yet' })
    const similar = await Complaint.findOne({ property, location: req.body.location, status: { $nin: ['Resolved', 'Closed'] }, title: { $regex: String(req.body.title || '').split(' ')[0], $options: 'i' } }).sort({ createdAt: -1 })
    if (similar && req.body.followExisting) return res.json({ followed: true, complaint: similar })
    const category = suggestedCategory(req.body.title, req.body.description, String(req.body.category || ''))
    const categoryPattern = departmentPattern(category)
    const staffFilter = {
      role: 'maintenance_staff',
      society: req.user.society,
      $or: [
        { department: { $regex: categoryPattern, $options: 'i' } },
        { block: { $regex: categoryPattern, $options: 'i' } },
      ],
    }
    const staff = await User.findOne(staffFilter).sort({ updatedAt: 1 })
      || await User.findOne({ role: 'maintenance_staff', society: req.user.society }).sort({ updatedAt: 1 })
    const priority = req.body.priority || 'Medium'
    const assignment = staff ? { assignedStaffUser: staff._id, assignedStaff: staff.name, assignedStaffPhone: staff.phone, assignedAt: new Date(), status: 'Assigned' } : {}
    const complaint = await Complaint.create({ ...req.body, category, priority, expectedResolutionAt: new Date(Date.now() + (slaHours[priority] || 48) * 3600000), aiSuggestion: { category, priority, staff: staff?.name || 'Pending assignment' }, property, apartment, resident: req.user._id, followers: [], ...assignment })
    if (staff) {
      await Notification.create({
        recipient: staff._id,
        property,
        type: 'COMPLAINT_ASSIGNED',
        title: `New ${category} task assigned`,
        message: `${complaint.complaintId}: ${complaint.title} at flat ${complaint.flat}. Location: ${complaint.location || 'Not specified'}. Priority: ${complaint.priority}.`,
      })
    }
    res.status(201).json(complaint)
  } catch (error) { next(error) }
})
  router.post('/:id/rating', allowRoles('resident'), async (req, res, next) => {
    try {
      const rating = Number(req.body.rating)
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ message: 'Rating must be between 1 and 5' })
      const complaint = await Complaint.findOneAndUpdate(
        { _id: req.params.id, resident: req.user._id, assignedStaffUser: { $ne: null } },
        { $set: { staffRating: rating, staffReview: String(req.body.review || '').trim() } },
        { new: true, runValidators: true },
      )
      if (!complaint) return res.status(404).json({ message: 'Assigned complaint not found' })
      res.json(complaint)
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
