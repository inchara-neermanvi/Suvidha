import { Router } from 'express'
import Apartment from '../models/Apartment.js'
import Invoice from '../models/Invoice.js'
import Property from '../models/Property.js'
import Notification from '../models/Notification.js'
import { protect, allowRoles } from '../middleware/auth.js'

const router = Router()
router.use(protect)
const ownerFilter = req => req.user.role === 'owner' || req.user.role === 'admin' ? { property: { $in: req.user.propertyIds || [] } } : { resident: req.user._id }

router.get('/', async (req, res, next) => {
  try { res.json(await Invoice.find(ownerFilter(req)).populate('apartment', 'block flatNumber').populate('resident', 'name email').populate('property', 'name paymentQrCode').sort({ dueDate: -1 })) } catch (error) { next(error) }
})

router.post('/generate', allowRoles('owner', 'admin'), async (req, res, next) => {
  try {
    const { property, period, dueDate, lateFee = 0 } = req.body
    if (!property || !period || !dueDate) return res.status(400).json({ message: 'Property, period and due date are required' })
    const propertyDoc = await Property.findOne({ _id: property, owner: req.user._id })
    if (!propertyDoc) return res.status(403).json({ message: 'Property access denied' })
    const apartments = await Apartment.find({ property, status: 'Occupied', resident: { $ne: null } })
    const invoices = []
    for (const apartment of apartments) {
      const lineItems = [
        ['Rent', apartment.monthlyRent],
        ['Maintenance', apartment.maintenanceCharge],
        ['Water', apartment.waterCharge],
        ['Electricity', apartment.electricityCharge],
        ['Parking', apartment.parkingCharge],
        ...(apartment.otherCharges || []).filter(item => item.frequency === 'monthly').map(item => [item.name, item.amount]),
      ].filter(([, amount]) => amount > 0).map(([label, amount]) => ({ label, amount }))
      try {
        const invoice = await Invoice.create({ property, apartment: apartment._id, resident: apartment.resident, period, lineItems, total: lineItems.reduce((sum, item) => sum + item.amount, 0), dueDate, lateFee })
        invoices.push(invoice)
        await Notification.create({ recipient: apartment.resident, property, type: 'INVOICE_CREATED', title: 'New rent invoice', message: `Your ${period} invoice of ₹${invoice.total.toLocaleString('en-IN')} is due on ${new Date(dueDate).toLocaleDateString('en-IN')}.` })
      } catch (error) { if (error.code !== 11000) throw error }
    }
    res.status(201).json({ generated: invoices.length, invoices })
  } catch (error) { next(error) }
})

router.put('/:id', allowRoles('owner', 'admin'), async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, property: { $in: req.user.propertyIds || [] } })
    if (!invoice || invoice.status === 'PAID') return res.status(404).json({ message: 'Editable invoice not found' })
    if (req.body.dueDate) invoice.dueDate = req.body.dueDate
    if (req.body.lateFee !== undefined) invoice.lateFee = req.body.lateFee
    await invoice.save()
    res.json(invoice)
  } catch (error) { next(error) }
})

export default router
