import mongoose from 'mongoose'
import dns from 'node:dns'

export default async function connectDB() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is missing. Copy .env.example to .env.')
  if (process.env.MONGODB_URI.includes('<cluster>')) {
    throw new Error('MONGODB_URI still contains <cluster>. Copy the real connection string from Atlas: Connect > Drivers.')
  }
  let lastError
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 })
      console.log('MongoDB Atlas connected')
      return
    } catch (error) {
      lastError = error
      if (error.code === 'ECONNREFUSED' && error.message.includes('querySrv')) {
        const servers = (process.env.DNS_SERVERS || '8.8.8.8,1.1.1.1').split(',').map(server => server.trim()).filter(Boolean)
        dns.setServers(servers)
        console.error(`MongoDB SRV lookup refused. Retrying with DNS servers: ${servers.join(', ')}`)
      }
      if (attempt < 5) {
        console.error(`MongoDB connection attempt ${attempt} failed: ${error.message}. Retrying...`)
        await new Promise(resolve => setTimeout(resolve, attempt * 2000))
      }
    }
  }
  throw lastError
}
