import type { Config } from 'drizzle-kit'
import * as dotenv from 'dotenv'
dotenv.config()

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in environment variables')
}

const connectionString = process.env.DATABASE_URL
const [protocol, rest] = connectionString.split('://')
const [credentials, hostAndDb] = rest.split('@')
const [user, password] = credentials.split(':')
const [hostWithPort, database] = hostAndDb.split('/')
const [host] = hostWithPort.split(':')

export default {
  schema: './src/lib/db/schema/*',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    host,
    user,
    password,
    database: database.split('?')[0],
    ssl: true,
  },
  verbose: true,
  strict: true,
} satisfies Config 