import { Router } from 'express'
import Complaint from '../models/Complaint.js'
import Expense from '../models/Expense.js'
import Notification from '../models/Notification.js'
import { protect, adminOnly } from '../middleware/auth.js'

const router = Router()
router.use(protect, adminOnly)

const slaHours = { Low: 72, Medium: 48, High: 24, Emergency: 4 }
function safeDate(value, fallback = new Date()) {
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? fallback : date
}
function addSla(complaint) {
  const created = safeDate(complaint.createdAt)
  const expected = safeDate(complaint.expectedResolutionAt, new Date(created.getTime() + (slaHours[complaint.priority] || 48) * 3600000))
  const closed = ['Resolved', 'Closed'].includes(complaint.status)
  const overdue = !closed && expected < new Date()
  return { ...complaint, expectedResolutionAt: expected, status: overdue && complaint.status !== 'Overdue' ? 'Overdue' : complaint.status, timeRemainingMs: expected.getTime() - Date.now() }
}

router.get('/', async (req, res, next) => {
  try {
    const propertyFilter = { property: { $in: req.user.propertyIds || [] } }
    const sourceComplaints = await Complaint.find(propertyFilter).populate('resident', 'flat block society').sort({ createdAt: -1 })
    const overdueComplaints = sourceComplaints.filter(complaint => !['Resolved', 'Closed'].includes(complaint.status) && (complaint.expectedResolutionAt && complaint.expectedResolutionAt < new Date()))
    for (const complaint of overdueComplaints.filter(item => !item.escalationSentAt)) {
      await Notification.create({ recipient: req.user._id, property: complaint.property, type: 'COMPLAINT_ESCALATED', title: 'Overdue complaint escalated', message: `${complaint.complaintId} · ${complaint.title} is overdue and needs attention.` })
      complaint.escalationSentAt = new Date()
      await complaint.save()
    }
    const complaints = sourceComplaints.map(addSla)
    const category = {}
    const blocks = {}
    const recurringMap = {}
    const monthly = {}
    let resolutionTotal = 0
    let resolvedCount = 0
    for (const complaint of complaints) {
      category[complaint.category] = (category[complaint.category] || 0) + 1
      const block = complaint.block || complaint.resident?.block || complaint.flat?.split('-')[0] || 'Unspecified'
      blocks[block] = blocks[block] || {}
      blocks[block][complaint.category] = (blocks[block][complaint.category] || 0) + 1
      const recurringKey = `${block}|${complaint.category}`
      recurringMap[recurringKey] = recurringMap[recurringKey] || []
      recurringMap[recurringKey].push(complaint.createdAt)
      const month = safeDate(complaint.createdAt).toISOString().slice(0, 7)
      monthly[month] = (monthly[month] || 0) + 1
      if (['Resolved', 'Closed'].includes(complaint.status)) {
        resolvedCount += 1
        resolutionTotal += safeDate(complaint.updatedAt).getTime() - safeDate(complaint.createdAt).getTime()
      }
    }
    const recurring = Object.entries(recurringMap).filter(([, dates]) => dates.length >= 3).map(([key, dates]) => {
      const [block, complaintCategory] = key.split('|')
      return { block, category: complaintCategory, occurrences: dates.length, dates }
    }).sort((a, b) => b.occurrences - a.occurrences)
    const expenses = await Expense.find(propertyFilter).sort({ date: -1 })
    const recentAlerts = await Notification.find({ property: { $in: req.user.propertyIds || [] } }).sort({ createdAt: -1 }).limit(5)
    const counts = complaints.reduce((result, complaint) => {
      result.total += 1
      if (!['Resolved', 'Closed'].includes(complaint.status)) result.open += 1
      if (['Resolved', 'Closed'].includes(complaint.status)) result.resolved += 1
      if (complaint.status === 'Overdue' || complaint.timeRemainingMs < 0 && !['Resolved', 'Closed'].includes(complaint.status)) result.overdue += 1
      if (complaint.priority === 'Emergency') result.emergency += 1
      return result
    }, { total: 0, open: 0, resolved: 0, overdue: 0, emergency: 0 })
    res.json({ counts, complaints, category, blocks, monthly, recurring, expenses, recentAlerts, averageResolutionHours: resolvedCount ? Math.round(resolutionTotal / resolvedCount / 3600000) : 0, slaHours })
  } catch (error) { next(error) }
})

export default router
