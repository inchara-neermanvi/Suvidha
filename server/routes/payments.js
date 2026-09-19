import { Router } from 'express'
import crypto from 'crypto'
import Payment from '../models/Payment.js'
import Invoice from '../models/Invoice.js'
import Notification from '../models/Notification.js'
import { protect, allowRoles } from '../middleware/auth.js'

const router = Router()
router.use(protect)
const testMode = process.env.PAYMENT_MODE !== 'RAZORPAY'

router.get('/history', async (req, res, next) => {
  try {
    const filter = req.user.role === 'resident' ? { resident: req.user._id } : { property: { $in: req.user.propertyIds || [] } }
    res.json(await Payment.find(filter).populate({ path: 'invoice', populate: { path: 'apartment', select: 'block flatNumber' } }).populate('resident', 'name email').sort({ createdAt: -1 }))
  } catch (error) { next(error) }
})
router.get('/', async (req, res, next) => { req.url = '/history'; next() })

router.post('/create', async (req, res, next) => {
  try {
    if (req.user.role !== 'resident') return res.status(403).json({ message: 'Only residents can create payment orders' })
    const invoice = await Invoice.findOne({ _id: req.body.invoiceId, resident: req.user._id })
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' })
    if (invoice.status === 'PAID') return res.status(409).json({ message: 'Invoice is already paid' })
    const orderId = `${testMode ? 'test' : 'rzp'}_${crypto.randomBytes(10).toString('hex')}`
    const payment = await Payment.create({ invoice: invoice._id, property: invoice.property, resident: req.user._id, provider: testMode ? 'TEST' : 'RAZORPAY', orderId, amount: invoice.total + (invoice.status === 'OVERDUE' ? invoice.lateFee : 0) })
    res.status(201).json({ payment, mode: testMode ? 'TEST' : 'RAZORPAY', message: testMode ? 'Test mode order created. Verify through the server test endpoint.' : 'Gateway order created.' })
  } catch (error) { next(error) }
})

router.post('/verify', async (req, res, next) => {
  try {
    const payment = await Payment.findOne({ orderId: req.body.orderId, resident: req.user._id }).populate('invoice')
    if (!payment) return res.status(404).json({ message: 'Payment order not found' })
    if (payment.status === 'PAID') return res.json(payment)
    if (payment.provider === 'TEST') {
      if (req.body.testConfirmation !== 'NIVASA_TEST_PAYMENT') return res.status(400).json({ message: 'Test payment confirmation is required' })
    } else {
      const payload = `${req.body.razorpay_order_id}|${req.body.razorpay_payment_id}`
      const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(payload).digest('hex')
      if (expected !== req.body.razorpay_signature) return res.status(400).json({ message: 'Payment signature verification failed' })
    }
    payment.status = 'PAID'
    payment.paymentId = req.body.razorpay_payment_id || `test_pay_${crypto.randomBytes(8).toString('hex')}`
    payment.method = req.body.method || (payment.provider === 'TEST' ? 'TEST_MODE' : 'RAZORPAY')
    payment.paidAt = new Date()
    await payment.save()
    await Invoice.findByIdAndUpdate(payment.invoice._id, { status: 'PAID', paidAt: payment.paidAt })
    await Notification.create({ recipient: req.user._id, property: payment.property, type: 'PAYMENT_CONFIRMED', title: 'Payment confirmed', message: `Payment of ₹${payment.amount.toLocaleString('en-IN')} was confirmed.` })
    res.json(payment)
  } catch (error) { next(error) }
})

router.post('/webhook', async (req, res, next) => {
  try {
    if (!process.env.RAZORPAY_WEBHOOK_SECRET) return res.status(503).json({ message: 'Webhook secret is not configured' })
    const signature = req.headers['x-razorpay-signature']
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET).update(JSON.stringify(req.body)).digest('hex')
    if (signature !== expected) return res.status(400).json({ message: 'Invalid webhook signature' })
    res.json({ received: true })
  } catch (error) { next(error) }
})

router.post('/:id/simulate', allowRoles('owner', 'admin'), async (_req, res) => res.status(410).json({ message: 'Client-side payment simulation is disabled. Create and verify a TEST_MODE order on the server.' }))
export default router
