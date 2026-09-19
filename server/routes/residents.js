import { Router } from 'express'
import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import Apartment from '../models/Apartment.js'
import Property from '../models/Property.js'
import { protect, allowRoles } from '../middleware/auth.js'

const router = Router()
router.use(protect, allowRoles('owner', 'admin'))

router.get('/', async (req, res, next) => {
  try {
    const properties = await Property.find({ owner: req.user._id }).select('_id')
    const apartments = await Apartment.find({ property: { $in: properties.map(item => item._id) }, resident: { $ne: null } }).populate('resident', 'name email phone flat block floor leaseStart leaseEnd moveInDate').populate('property', 'name')
    res.json(apartments.map(item => ({ ...item.resident.toObject(), apartment: item })))
  } catch (error) { next(error) }
})

router.post('/', async (req, res, next) => {
  try {
    const apartment = await Apartment.findById(req.body.apartment)
    const property = apartment && await Property.findOne({ _id: apartment.property, owner: req.user._id })
    if (!apartment || !property) return res.status(404).json({ message: 'Apartment not found in your property' })
    if (apartment.resident) return res.status(409).json({ message: 'Apartment is already occupied' })
    const { name, email, phone, password, leaseStart, leaseEnd, moveInDate } = req.body
    if (!name || !email || !leaseStart) return res.status(400).json({ message: 'Name, email and lease start are required' })
    if (await User.findOne({ email: email.toLowerCase() })) return res.status(409).json({ message: 'Email is already registered' })
    const resident = await User.create({ name, email, phone, password: await bcrypt.hash(password || 'ChangeMe123!', 12), role: 'resident', propertyIds: [property._id], apartmentId: apartment._id, flat: apartment.flatNumber, block: apartment.block, floor: apartment.floor, leaseStart, leaseEnd, moveInDate, society: property.name })
    apartment.resident = resident._id
    apartment.status = 'Occupied'
    await apartment.save()
    res.status(201).json({ resident: { id: resident._id, name, email, temporaryPassword: password ? undefined : 'ChangeMe123!' }, apartment })
  } catch (error) { next(error) }
})

router.put('/:id', async (req, res, next) => {
  try {
    const resident = await User.findOne({ _id: req.params.id, role: 'resident' })
    if (!resident || !req.user.propertyIds?.some(id => String(id) === String(resident.propertyIds?.[0]))) return res.status(404).json({ message: 'Resident not found' })
    for (const key of ['name', 'phone', 'leaseStart', 'leaseEnd', 'moveInDate']) if (req.body[key] !== undefined) resident[key] = req.body[key]
    await resident.save()
    res.json({ id: resident._id, name: resident.name, email: resident.email, leaseStart: resident.leaseStart, leaseEnd: resident.leaseEnd })
  } catch (error) { next(error) }
})

export default router
