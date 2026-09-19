import jwt from 'jsonwebtoken'
import User from '../models/User.js'

export async function protect(req, res, next) {
  try {
    const token = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : null
    if (!token) return res.status(401).json({ message: 'Login required' })
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = await User.findById(decoded.userId).select('-password')
    if (!req.user) return res.status(401).json({ message: 'User not found' })
    next()
  } catch { res.status(401).json({ message: 'Invalid or expired token' }) }
}

export function adminOnly(req, res, next) {
  if (!['admin', 'owner'].includes(req.user?.role)) return res.status(403).json({ message: 'Owner access required' })
  next()
}

export function allowRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) return res.status(403).json({ message: 'You do not have access to this resource' })
    next()
  }
}
