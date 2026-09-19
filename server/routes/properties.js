import { Router } from 'express'
import Property from '../models/Property.js'
import Apartment from '../models/Apartment.js'
import { protect, allowRoles } from '../middleware/auth.js'

const router = Router()
router.use(protect)

router.get('/', async (req, res, next) => {
  try {
    const filter = req.user.role === 'owner' || req.user.role === 'admin' ? { owner: req.user._id } : { _id: { $in: req.user.propertyIds || [] } }
    res.json(await Property.find(filter).sort({ createdAt: -1 }))
  } catch (error) { next(error) }
})

router.post('/', allowRoles('owner', 'admin'), async (req, res, next) => {
  try {
    if (!req.body.name || !req.body.address) return res.status(400).json({ message: 'Property name and address are required' })
    if (req.body.paymentQrCode && (!req.body.paymentQrCode.startsWith('data:image/') || req.body.paymentQrCode.length > 5 * 1024 * 1024)) return res.status(400).json({ message: 'Payment QR must be an image smaller than 5 MB' })
    const property = await Property.create({ name: req.body.name, address: req.body.address, paymentQrCode: req.body.paymentQrCode || '', owner: req.user._id })
    await req.user.updateOne({ $addToSet: { propertyIds: property._id } })
    res.status(201).json(property)
  } catch (error) { next(error) }
})

router.put('/:id', allowRoles('owner', 'admin'), async (req, res, next) => {
  try {
    if (req.body.paymentQrCode && (!req.body.paymentQrCode.startsWith('data:image/') || req.body.paymentQrCode.length > 5 * 1024 * 1024)) return res.status(400).json({ message: 'Payment QR must be an image smaller than 5 MB' })
    const property = await Property.findOneAndUpdate({ _id: req.params.id, owner: req.user._id }, { $set: { name: req.body.name, address: req.body.address, ...(req.body.paymentQrCode !== undefined ? { paymentQrCode: req.body.paymentQrCode } : {}) } }, { new: true, runValidators: true })
    if (!property) return res.status(404).json({ message: 'Property not found' })
    res.json(property)
  } catch (error) { next(error) }
})

router.get('/:id/summary', async (req, res, next) => {
  try {
    const property = await Property.findOne({ _id: req.params.id, $or: [{ owner: req.user._id }, { _id: { $in: req.user.propertyIds || [] } }] })
    if (!property) return res.status(404).json({ message: 'Property not found' })
    const apartments = await Apartment.find({ property: property._id }).select('status monthlyRent')
    const occupied = apartments.filter(item => item.status === 'Occupied')
    res.json({ property, totalApartments: apartments.length, occupied: occupied.length, vacant: apartments.length - occupied.length, expectedRent: occupied.reduce((sum, item) => sum + item.monthlyRent, 0) })
  } catch (error) { next(error) }
})

export default router
