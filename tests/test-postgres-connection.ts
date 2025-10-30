import { Client } from 'pg'
import * as dotenv from 'dotenv'

dotenv.config()

async function testPostgresConnection() {
  const DATABASE_URL = process.env.DATABASE_URL

  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set in environment variables')
    process.exit(1)
  }

  console.log('🔍 Testing PostgreSQL connection...')
  console.log(`📍 Database URL: ${DATABASE_URL.replace(/:[^:@]+@/, ':****@')}`) // Hide password

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false, // Common for managed Postgres services
    },
  })

  try {
    // Connect to the database
    await client.connect()
    console.log('✅ Successfully connected to PostgreSQL database')

    // Test query
    const result = await client.query('SELECT version(), current_database(), current_user')
    console.log('\n📊 Database Information:')
    console.log(`   Version: ${result.rows[0].version}`)
    console.log(`   Database: ${result.rows[0].current_database}`)
    console.log(`   User: ${result.rows[0].current_user}`)

    // Check if we can create tables (for Payload)
    const permissionTest = await client.query(`
      SELECT has_database_privilege(current_user, current_database(), 'CREATE') as can_create
    `)
    console.log(`   Can create tables: ${permissionTest.rows[0].can_create ? '✅ Yes' : '❌ No'}`)

    console.log('\n✨ PostgreSQL connection test passed!')
  } catch (error) {
    console.error('\n❌ PostgreSQL connection failed:')
    if (error instanceof Error) {
      console.error(`   Error: ${error.message}`)
      if ('code' in error) {
        console.error(`   Error Code: ${error.code}`)
      }
    } else {
      console.error(error)
    }
    process.exit(1)
  } finally {
    await client.end()
  }
}

testPostgresConnection()
