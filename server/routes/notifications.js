import { Router } from 'express'
import Notification from '../models/Notification.js'
import { protect } from '../middleware/auth.js'

const router = Router()
router.use(protect)
router.get('/', async (req, res, next) => {
  try { res.json(await Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 })) } catch (error) { next(error) }
})
router.put('/:id/read', async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate({ _id: req.params.id, recipient: req.user._id }, { readAt: new Date() }, { new: true })
    if (!notification) return res.status(404).json({ message: 'Notification not found' })
    res.json(notification)
  } catch (error) { next(error) }
})
export default router
