import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Tenants } from './collections/Tenants'
import { StudentSettings } from './collections/StudentSettings'
import { Courses } from './collections/Courses'
import { Modules } from './collections/Modules'
import { Lessons } from './collections/Lessons'
import { editorConfig } from './lib/payload/editor'
import sharp from 'sharp'
import { Progress } from './collections/Progress'
import { Enrollments } from './collections/Enrollments'
import { Levels } from './collections/Levels'
import { Points } from './collections/Points'
import { Badges } from './collections/Badges'
import { Achievements } from './collections/Achievements'
import { Leaderboards } from './collections/Leaderboards'
import { Streaks } from './collections/Streaks'

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
  editor: editorConfig,
  collections: [
    Tenants,
    StudentSettings,
    Users,
    Progress,
    Points,
    Levels,
    Achievements,
    Badges,
    Streaks,
    Leaderboards,
    Enrollments,
    Courses,
    Modules,
    Lessons,
    Media,
  ],
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
      max: 10,
    },
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
    },
  },
  csrf: [process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000'],
  cors: [process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000'],
  sharp,
})
