import { Router } from 'express'
import ServiceProvider from '../models/ServiceProvider.js'
import { protect, allowRoles } from '../middleware/auth.js'

const router = Router()
router.use(protect, allowRoles('resident', 'owner', 'admin'))
const phonePattern = /^[+\d][\d\s().-]{7,19}$/

function propertyFilter(req) {
  return req.user.role === 'resident' ? { property: req.user.propertyIds?.[0] } : { property: { $in: req.user.propertyIds || [] } }
}

router.get('/', async (req, res, next) => {
  try {
    const filter = { ...propertyFilter(req) }
    if (req.query.category) filter.category = req.query.category
    if (req.query.search) filter.$or = [{ name: { $regex: req.query.search, $options: 'i' } }, { category: { $regex: req.query.search, $options: 'i' } }]
    res.json(await ServiceProvider.find(filter).populate('addedBy', 'name flat').sort({ createdAt: -1 }))
  } catch (error) { next(error) }
})

router.post('/', allowRoles('resident'), async (req, res, next) => {
  try {
    const { name, phone, category, areaServed = '', description = '', rating, review = '' } = req.body
    if (!name || !phone || !category) return res.status(400).json({ message: 'Provider name, phone and category are required' })
    if (!phonePattern.test(phone)) return res.status(400).json({ message: 'Enter a valid phone number' })
    if (!req.user.propertyIds?.[0]) return res.status(409).json({ message: 'Your account is not assigned to a property' })
    const provider = await ServiceProvider.create({ property: req.user.propertyIds[0], name, phone, category, areaServed, description, rating: rating || undefined, review, addedBy: req.user._id })
    res.status(201).json(await provider.populate('addedBy', 'name flat'))
  } catch (error) { next(error) }
})

router.put('/:id', allowRoles('resident'), async (req, res, next) => {
  try {
    const provider = await ServiceProvider.findOne({ _id: req.params.id, ...propertyFilter(req), addedBy: req.user._id })
    if (!provider) return res.status(404).json({ message: 'Provider not found or you do not own this listing' })
    for (const key of ['name', 'phone', 'category', 'areaServed', 'description', 'rating', 'review']) if (req.body[key] !== undefined) provider[key] = req.body[key]
    if (!phonePattern.test(provider.phone)) return res.status(400).json({ message: 'Enter a valid phone number' })
    await provider.save()
    res.json(provider)
  } catch (error) { next(error) }
})

router.delete('/:id', allowRoles('resident', 'owner', 'admin'), async (req, res, next) => {
  try {
    const filter = req.user.role === 'resident' ? { _id: req.params.id, ...propertyFilter(req), addedBy: req.user._id } : { _id: req.params.id, ...propertyFilter(req) }
    const provider = await ServiceProvider.findOneAndDelete(filter)
    if (!provider) return res.status(404).json({ message: 'Provider not found or you do not have permission to delete it' })
    res.json({ message: 'Provider deleted' })
  } catch (error) { next(error) }
})

router.post('/:id/report', allowRoles('resident'), async (req, res, next) => {
  try {
    const provider = await ServiceProvider.findOneAndUpdate({ _id: req.params.id, ...propertyFilter(req) }, { $push: { reports: { reporter: req.user._id, reason: req.body.reason || 'Reported by resident' } } }, { new: true })
    if (!provider) return res.status(404).json({ message: 'Provider not found' })
    res.json({ message: 'Report submitted for review' })
  } catch (error) { next(error) }
})

export default router