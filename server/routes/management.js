import { Router } from 'express'
import Expense from '../models/Expense.js'
import EmergencyAlert from '../models/EmergencyAlert.js'
import Notice from '../models/Notice.js'
import Consumption from '../models/Consumption.js'
import MoveChecklist from '../models/MoveChecklist.js'
import User from '../models/User.js'
import { protect, adminOnly, allowRoles } from '../middleware/auth.js'

const router = Router()
router.use(protect)

function propertyIds(req) {
  return req.user.propertyIds || []
}
function residentProperty(req) {
  return req.user.propertyIds?.[0]
}

router.get('/staff', adminOnly, async (req, res, next) => {
  try { res.json(await User.find({ role: 'maintenance_staff', society: { $in: req.user.society ? [req.user.society] : [] } }).select('name phone department block society')) } catch (error) { next(error) }
})

router.get('/expenses', async (req, res, next) => {
  try {
    const filter = req.user.role === 'resident' ? { property: residentProperty(req), published: true } : { property: { $in: propertyIds(req) } }
    res.json(await Expense.find(filter).sort({ date: -1 }))
  } catch (error) { next(error) }
})
router.post('/expenses', adminOnly, async (req, res, next) => {
  try {
    const { property, category, amount, date, vendor, description = '', documentUrl = '', published = false } = req.body
    if (!property || !category || amount === undefined || !vendor) return res.status(400).json({ message: 'Property, category, amount and vendor are required' })
    if (!propertyIds(req).some(id => String(id) === String(property))) return res.status(403).json({ message: 'Property access denied' })
    res.status(201).json(await Expense.create({ property, category, amount, date, vendor, description, documentUrl, published, createdBy: req.user._id }))
  } catch (error) { next(error) }
})
router.patch('/expenses/:id', adminOnly, async (req, res, next) => {
  try {
    const expense = await Expense.findOneAndUpdate({ _id: req.params.id, property: { $in: propertyIds(req) } }, { $set: req.body }, { new: true, runValidators: true })
    if (!expense) return res.status(404).json({ message: 'Expense not found' })
    res.json(expense)
  } catch (error) { next(error) }
})
router.delete('/expenses/:id', adminOnly, async (req, res, next) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, property: { $in: propertyIds(req) } })
    if (!expense) return res.status(404).json({ message: 'Expense not found' })
    res.json({ message: 'Expense deleted' })
  } catch (error) { next(error) }
})

router.get('/alerts', async (req, res, next) => {
  try {
    const alerts = await EmergencyAlert.find({ property: { $in: propertyIds(req) }, ...(req.user.role === 'resident' || req.user.role === 'maintenance_staff' ? { active: true } : {}) }).sort({ createdAt: -1 })
    res.json(alerts)
  } catch (error) { next(error) }
})
router.post('/alerts', allowRoles('owner', 'admin', 'maintenance_staff'), async (req, res, next) => {
  try {
    const { property, type, title, message, target = 'Entire apartment', targetValue = '' } = req.body
    if (!property || !type || !title || !message) return res.status(400).json({ message: 'Property, type, title and message are required' })
    if (!propertyIds(req).some(id => String(id) === String(property))) return res.status(403).json({ message: 'Property access denied' })
    res.status(201).json(await EmergencyAlert.create({ property, type, title, message, target, targetValue, createdBy: req.user._id }))
  } catch (error) { next(error) }
})
router.patch('/alerts/:id', allowRoles('owner', 'admin', 'maintenance_staff'), async (req, res, next) => {
  try {
    const alert = await EmergencyAlert.findOneAndUpdate({ _id: req.params.id, property: { $in: propertyIds(req) } }, { $set: req.body }, { new: true, runValidators: true })
    if (!alert) return res.status(404).json({ message: 'Alert not found' })
    res.json(alert)
  } catch (error) { next(error) }
})

router.get('/notices', async (req, res, next) => {
  try {
    const filter = req.user.role === 'resident' ? { property: residentProperty(req), published: true } : { property: { $in: propertyIds(req) } }
    res.json(await Notice.find(filter).sort({ createdAt: -1 }))
  } catch (error) { next(error) }
})
router.post('/notices', adminOnly, async (req, res, next) => {
  try {
    const { property, title, body, translations = [], published = false } = req.body
    if (!property || !title || !body) return res.status(400).json({ message: 'Property, title and body are required' })
    if (!propertyIds(req).some(id => String(id) === String(property))) return res.status(403).json({ message: 'Property access denied' })
    res.status(201).json(await Notice.create({ property, title, body, translations, published, createdBy: req.user._id }))
  } catch (error) { next(error) }
})
router.patch('/notices/:id', adminOnly, async (req, res, next) => {
  try {
    const notice = await Notice.findOneAndUpdate({ _id: req.params.id, property: { $in: propertyIds(req) } }, { $set: req.body }, { new: true, runValidators: true })
    if (!notice) return res.status(404).json({ message: 'Notice not found' })
    res.json(notice)
  } catch (error) { next(error) }
})

router.get('/consumption', async (req, res, next) => {
  try {
    const filter = req.user.role === 'resident' ? { property: residentProperty(req), apartment: req.user.apartmentId } : { property: { $in: propertyIds(req) } }
    res.json(await Consumption.find(filter).sort({ month: 1 }))
  } catch (error) { next(error) }
})
router.post('/consumption', adminOnly, async (req, res, next) => {
  try {
    const { property, apartment = null, month, water = 0, electricity = 0 } = req.body
    if (!property || !month) return res.status(400).json({ message: 'Property and month are required' })
    if (!propertyIds(req).some(id => String(id) === String(property))) return res.status(403).json({ message: 'Property access denied' })
    res.status(201).json(await Consumption.findOneAndUpdate({ property, apartment, month: new Date(month) }, { $set: { property, apartment, month: new Date(month), water, electricity, recordedBy: req.user._id } }, { new: true, upsert: true, runValidators: true }))
  } catch (error) { next(error) }
})

router.get('/checklists', async (req, res, next) => {
  try {
    const filter = req.user.role === 'resident' ? { resident: req.user._id } : { property: { $in: propertyIds(req) } }
    res.json(await MoveChecklist.find(filter).populate('resident', 'name flat').sort({ updatedAt: -1 }))
  } catch (error) { next(error) }
})
router.post('/checklists', allowRoles('resident', 'owner', 'admin'), async (req, res, next) => {
  try {
    const property = req.user.role === 'resident' ? residentProperty(req) : req.body.property
    if (!property) return res.status(400).json({ message: 'Property is required' })
    const filter = req.user.role === 'resident' ? { resident: req.user._id, type: req.body.type } : { resident: req.body.resident, type: req.body.type, property }
    res.status(201).json(await MoveChecklist.findOneAndUpdate(filter, { ...req.body, property, resident: req.user.role === 'resident' ? req.user._id : req.body.resident }, { new: true, upsert: true, runValidators: true }))
  } catch (error) { next(error) }
})

export default router
