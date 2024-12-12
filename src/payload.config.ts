import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Tenants } from './collections/Tenants'
import { StudentSettings } from './collections/StudentSettings'
import sharp from 'sharp'

export default buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000',
  secret: process.env.PAYLOAD_SECRET || 'YOUR-SECRET-KEY',
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: '- LMS Admin',
    },
    components: {
      beforeDashboard: [],
      afterDashboard: [],
      beforeLogin: [],
      afterLogin: [],
    },
    dateFormat: 'MMMM do yyyy, h:mm a',
  },
  editor: lexicalEditor({}),
  collections: [
    Users,
    Media,
    Tenants,
    StudentSettings,
  ],
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
      max: 10,
    }
  }),
  typescript: {
    outputFile: 'src/payload-types.ts',
  },
  graphQL: {
    schemaOutputFile: 'src/generated-schema.graphql',
  },
  upload: {
    limits: {
      fileSize: 5000000, // 5MB
    }
  },
  csrf: [process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000'],
  cors: [process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000'],
  sharp,
})
