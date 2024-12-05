import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { slateEditor } from '@payloadcms/richtext-slate'
import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Tenants } from './collections/Tenants'
import { StudentSettings } from './collections/StudentSettings'
import nodemailer from 'nodemailer'
import { resendAdapter } from '@payloadcms/email-resend'


export default buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || '',
  secret: process.env.PAYLOAD_SECRET || 'YOUR-SECRET-KEY',
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: '- LMS Admin',
    },
  },
  editor: slateEditor({}),
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),
  collections: [Users, Media, Tenants, StudentSettings],
  typescript: {
    outputFile: 'src/payload-types.ts',
  },
  graphQL: {
    schemaOutputFile: 'src/generated-schema.graphql',
  },
  upload: {
    limits: {
      fileSize: 5000000, // 5MB
    },
  },
  email: resendAdapter({
    defaultFromAddress: process.env.EMAIL_FROM || 'noreply@lms.com',
    defaultFromName: 'LMS Platform',
    apiKey: process.env.RESEND_API_KEY || '',
  }),
})
