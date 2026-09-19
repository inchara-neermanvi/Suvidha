import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import Property from '../models/Property.js'
import { protect } from '../middleware/auth.js'

const router = Router()
const attempts = new Map()
function authRateLimit(req, res, next) {
  const key = req.ip
  const now = Date.now()
  const recent = (attempts.get(key) || []).filter(time => now - time < 15 * 60 * 1000)
  if (recent.length >= 20) return res.status(429).json({ message: 'Too many authentication attempts. Try again later.' })
  recent.push(now)
  attempts.set(key, recent)
  next()
}
const tokenFor = user => jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' })
const publicUser = user => ({ id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone, society: user.society, department: user.department, flat: user.flat, block: user.block, floor: user.floor, propertyIds: user.propertyIds, apartmentId: user.apartmentId, leaseStart: user.leaseStart, leaseEnd: user.leaseEnd })

async function login(req, res, role) {
  const user = await User.findOne({ email: req.body.email?.toLowerCase() })
  const allowed = role === 'owner' ? ['owner', 'admin'] : role === 'resident' ? ['resident'] : ['maintenance_staff']
  const password = req.body.password || ''
  const isBcryptHash = typeof user?.password === 'string' && /^\$2[aby]?\$\d{2}\$/.test(user.password)
  const validPassword = user && (isBcryptHash ? await bcrypt.compare(password, user.password) : user.password === password)
  if (!user || !allowed.includes(user.role) || !validPassword) throw Object.assign(new Error('Invalid credentials for this login'), { status: 401 })
  if (!isBcryptHash) {
    user.password = await bcrypt.hash(password, 12)
    await user.save()
  }
  return res.json({ token: tokenFor(user), user: publicUser(user) })
}

router.post('/owner/register', authRateLimit, async (req, res, next) => {
  try {
    const { name, email, password, phone, propertyName, propertyAddress } = req.body
    if (!name || !email || !password || !propertyName || !propertyAddress) return res.status(400).json({ message: 'Owner and property details are required' })
    if (await User.findOne({ email: email.toLowerCase() })) return res.status(409).json({ message: 'Email is already registered' })
    const owner = await User.create({ name, email, phone, password: await bcrypt.hash(password, 12), role: 'owner', society: propertyName })
    const property = await Property.create({ name: propertyName, address: propertyAddress, owner: owner._id })
    owner.propertyIds = [property._id]
    await owner.save()
    res.status(201).json({ token: tokenFor(owner), user: publicUser(owner), property })
  } catch (error) { next(error) }
})

router.post('/owner/login', authRateLimit, async (req, res, next) => { try { await login(req, res, 'owner') } catch (error) { next(error) } })
router.post('/resident/login', authRateLimit, async (req, res, next) => { try { await login(req, res, 'resident') } catch (error) { next(error) } })
router.post('/staff/login', authRateLimit, async (req, res, next) => { try { await login(req, res, 'staff') } catch (error) { next(error) } })

router.post('/resident/register', authRateLimit, async (req, res, next) => {
  try {
    const { name, email, password, phone, society, flat, block, floor } = req.body
    if (!name || !email || !password || !flat) return res.status(400).json({ message: 'Name, email, password and flat number are required' })
    if (await User.findOne({ email: email.toLowerCase() })) return res.status(409).json({ message: 'Email is already registered' })
    const resident = await User.create({ name, email, phone, password: await bcrypt.hash(password, 12), role: 'resident', society, flat, block, floor })
    res.status(201).json({ token: tokenFor(resident), user: publicUser(resident) })
  } catch (error) { next(error) }
})

router.post('/staff/register', authRateLimit, async (req, res, next) => {
  try {
    const { name, email, password, phone, society, department } = req.body
    if (!name || !email || !password || !department) return res.status(400).json({ message: 'Name, email, password and department are required' })
    if (await User.findOne({ email: email.toLowerCase() })) return res.status(409).json({ message: 'Email is already registered' })
    const staff = await User.create({ name, email, phone, password: await bcrypt.hash(password, 12), role: 'maintenance_staff', society, department, block: department })
    res.status(201).json({ token: tokenFor(staff), user: publicUser(staff) })
  } catch (error) { next(error) }
})

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, phone, society, flat, block, floor, role } = req.body
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required' })
    if (await User.findOne({ email: email.toLowerCase() })) return res.status(409).json({ message: 'Email is already registered' })
    const user = await User.create({ name, email, password: await bcrypt.hash(password, 12), phone, society, flat, block, floor, role: role === 'admin' ? 'admin' : 'resident' })
    res.status(201).json({ token: tokenFor(user), user: publicUser(user) })
  } catch (error) { next(error) }
})

router.post('/login', async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email?.toLowerCase() })
    if (!user || !(await bcrypt.compare(req.body.password || '', user.password))) return res.status(401).json({ message: 'Invalid email or password' })
    res.json({ token: tokenFor(user), user: publicUser(user) })
  } catch (error) { next(error) }
})

router.get('/me', protect, (req, res) => res.json({ user: req.user }))
export default router
