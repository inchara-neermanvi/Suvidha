import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import connectDB from './server/config/db.js'
import authRoutes from './server/routes/auth.js'
import complaintRoutes from './server/routes/complaints.js'
import paymentRoutes from './server/routes/payments.js'
import propertyRoutes from './server/routes/properties.js'
import apartmentRoutes from './server/routes/apartments.js'
import invoiceRoutes from './server/routes/invoices.js'
import notificationRoutes from './server/routes/notifications.js'
import residentRoutes from './server/routes/residents.js'
import serviceProviderRoutes from './server/routes/serviceProviders.js'

const app = express()
const port = process.env.PORT || 5000

const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173'
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin === allowedOrigin || /^https?:\/\/localhost:\d+$/.test(origin)) return callback(null, true)
    callback(new Error('Origin is not allowed by CORS'))
  },
}))
app.use(express.json({ limit: '6mb' }))
app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'Suvidha API' }))
app.use('/api/auth', authRoutes)
app.use('/api/complaints', complaintRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/properties', propertyRoutes)
app.use('/api/apartments', apartmentRoutes)
app.use('/api/invoices', invoiceRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/residents', residentRoutes)
app.use('/api/service-providers', serviceProviderRoutes)
app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(err.status || 500).json({ message: err.message || 'Server error' })
})

connectDB().then(() => {
  app.listen(port, () => console.log(`Suvidha API running on http://localhost:${port}`))
}).catch(error => {
  console.error('MongoDB connection failed:', error.message)
  process.exit(1)
})
