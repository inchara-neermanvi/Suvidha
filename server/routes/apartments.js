import { Router } from 'express'
import bcrypt from 'bcryptjs'
import Apartment from '../models/Apartment.js'
import Property from '../models/Property.js'
import User from '../models/User.js'
import { protect, allowRoles } from '../middleware/auth.js'

const router = Router()
router.use(protect)
const ownerProperty = (req, id) => Property.findOne({ _id: id, owner: req.user._id })

router.get('/', async (req, res, next) => {
  try {
    const properties = req.user.role === 'owner' || req.user.role === 'admin' ? await Property.find({ owner: req.user._id }).select('_id') : []
    const propertyIds = properties.map(item => item._id)
    const filter = req.user.role === 'resident' ? { resident: req.user._id } : { property: { $in: propertyIds } }
    res.json(await Apartment.find(filter).populate('resident', 'name email phone leaseStart leaseEnd').populate('property', 'name address').sort({ block: 1, flatNumber: 1 }))
  } catch (error) { next(error) }
})

router.post('/', allowRoles('owner', 'admin'), async (req, res, next) => {
  try {
    if (!req.body.property || !req.body.block || !req.body.flatNumber || req.body.monthlyRent === undefined) return res.status(400).json({ message: 'Property, block, flat number and rent are required' })
    if (!await ownerProperty(req, req.body.property)) return res.status(403).json({ message: 'Property access denied' })
    const existing = await Apartment.findOne({ property: req.body.property, flatNumber: req.body.flatNumber })
    if (existing) return res.status(409).json({ message: `Apartment ${req.body.flatNumber} already exists in this property. Use a different flat number or edit the existing apartment.` })
    const apartment = await Apartment.create({ ...req.body, status: 'Vacant', resident: null })
    res.status(201).json(apartment)
  } catch (error) { next(error) }
})

router.put('/:id', allowRoles('owner', 'admin'), async (req, res, next) => {
  try {
    const apartment = await Apartment.findById(req.params.id)
    if (!apartment || !await ownerProperty(req, apartment.property)) return res.status(404).json({ message: 'Apartment not found' })
    const allowed = ['name', 'block', 'flatNumber', 'floor', 'flatType', 'bedrooms', 'monthlyRent', 'securityDeposit', 'maintenanceCharge', 'electricityCharge', 'waterCharge', 'parkingCharge', 'otherCharges', 'rentChanges', 'status']
    for (const key of allowed) if (req.body[key] !== undefined) apartment[key] = req.body[key]
    await apartment.save()
    res.json(apartment)
  } catch (error) { next(error) }
})

router.post('/:id/assign', allowRoles('owner', 'admin'), async (req, res, next) => {
  try {
    const apartment = await Apartment.findById(req.params.id)
    if (!apartment || !await ownerProperty(req, apartment.property)) return res.status(404).json({ message: 'Apartment not found' })
    const { name, email, phone, moveInDate, leaseStart, leaseEnd, password } = req.body
    if (!name || !email || !leaseStart) return res.status(400).json({ message: 'Resident name, email and lease start are required' })
    let resident = await User.findOne({ email: email.toLowerCase() })
    if (!resident) resident = await User.create({ name, email, phone, password: await bcrypt.hash(password || 'ChangeMe123!', 12), role: 'resident', propertyIds: [apartment.property], apartmentId: apartment._id, flat: apartment.flatNumber, block: apartment.block, floor: apartment.floor, leaseStart, leaseEnd, society: (await Property.findById(apartment.property)).name })
    if (resident.role !== 'resident') return res.status(409).json({ message: 'This email belongs to another role' })
    Object.assign(resident, { propertyIds: [...new Set([...(resident.propertyIds || []).map(String), String(apartment.property)])], apartmentId: apartment._id, flat: apartment.flatNumber, block: apartment.block, floor: apartment.floor, leaseStart, leaseEnd, moveInDate })
    await resident.save()
    apartment.resident = resident._id
    apartment.status = 'Occupied'
    await apartment.save()
    res.json({ apartment, resident: { id: resident._id, name: resident.name, email: resident.email, temporaryPassword: password ? undefined : 'ChangeMe123!' } })
  } catch (error) { next(error) }
})

export default router
