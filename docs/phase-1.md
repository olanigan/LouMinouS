# Phase 1: Project Setup and Core Infrastructure

## Summary
This phase establishes the foundation of our multi-tenant LMS platform using:
1. Next.js 15 with App Router (Updated from 14)
2. Payload CMS 3.4.0
3. Neon Database
4. TypeScript
5. pnpm

**Key Components:**
- ✅ Project initialization
- ✅ Database setup
- ✅ Authentication system (using Payload built-in auth)
- 🚧 Core collections

**Current Status:**
A configured development environment with:
- ✅ Working Next.js application
- ✅ Connected Payload CMS
- ✅ Configured database
- ✅ Basic authentication
- ✅ Email system with Resend

## 1.1 Project Setup

### Initialize Project
```bash
# Create a new Payload + Next.js project
pnpm create payload-app@latest --no-src -t blank

# Follow the prompts:
# - Choose "Custom Template"
# - Select Next.js as the framework
# - Choose TypeScript
# - Select Postgres as the database
# - Choose pnpm as the package manager
```

### Additional Dependencies
```bash
cd lms-mvp

# UI Components
pnpm add @radix-ui/react-icons @radix-ui/themes
pnpm add class-variance-authority clsx tailwind-merge
pnpm add @aceternity/ui @magic-ui/core vaul sonner cmdk

# Forms and Validation
pnpm add react-hook-form @hookform/resolvers zod nuqs

# Animation
pnpm add framer-motion @legendapp/motion @formkit/auto-animate

# Utilities
pnpm add date-fns nanoid slugify
```

### Update Next.js Config
The `create-payload-app` command will create a basic `next.config.js`, but we need to update it with our specific requirements:

```typescript:next.config.mjs
import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    reactCompiler: false
  },
  images: {
    domains: [
      'localhost',
      // Add your production domains here
    ],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
}

export default withPayload(nextConfig)
```

### Environment Setup
Current working environment variables:

```bash
# Database
DATABASE_URI=postgres://postgres:postgres@localhost:5432/lms_mvp
POSTGRES_URL=postgres://postgres:postgres@localhost:5432/lms_mvp
DIRECT_URL=${DATABASE_URI}

# Payload
PAYLOAD_SECRET=your-secret-key
PAYLOAD_CONFIG_PATH=payload.config.ts
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000

# Email
RESEND_API_KEY=your-resend-key
EMAIL_FROM=noreply@yourdomain.com

# Site Config
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME="LMS Platform"
```

### Project Structure
Current working project structure:

```
lms-mvp/
├── src/
│   ├── access/
│   │   └── roles.ts
│   ├── collections/
│   │   ├── Media.ts
│   │   ├── Tenants.ts
│   │   ├── Users.ts
│   │   ├── StudentSettings.ts
│   │   └── index.ts
│   ├── lib/
│   │   └── db/
│   │       ├── index.ts
│   │       ├── migrate.ts
│   │       └── schema/
│   └── payload.config.ts
├── docs/
│   └── phase-1.md
├── next.config.mjs
├── package.json
└── .env
```

## 1.2 Database Configuration

### Configure Neon Connection
Create `lib/db/index.ts`:
```typescript
import { Pool } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-serverless'

// Configure connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URI,
  maxSize: 10,
  idleTimeout: 30,
  connectionTimeoutMillis: 10_000,
})

// Create Drizzle instance
export const db = drizzle(pool)

// Healthcheck function
export async function checkDatabaseConnection() {
  try {
    const client = await pool.connect()
    await client.query('SELECT 1')
    client.release()
    return true
  } catch (error) {
    console.error('Database connection error:', error)
    return false
  }
}
```

## 1.3 Authentication System

### Configure Payload Auth (✅ Completed)
The Users collection has been implemented with built-in Payload authentication, including:
- Email/password authentication
- Role-based access control
- Multi-tenant isolation
- Email verification
- Password reset flow

## 1.4 Core Collections

### Configure Media Collection (✅ Completed)
The Media collection has been implemented with:
- Multi-tenant file isolation
- Image resizing with Sharp
- Proper access control
- File type validation

### Configure Tenants Collection (✅ Completed)
The Tenants collection has been implemented with:
- Basic tenant information
- Domain customization
- Logo management
- Status tracking

### Configure Settings Collections (✅ Completed)
The StudentSettings collection has been implemented with:
- User preferences
- Learning path settings
- UI preferences

## Next Steps
1. 🚧 Set up remaining collections:
   - Courses
   - Modules
   - Lessons
   - Assignments
2. 🚧 Implement tenant isolation for file uploads
3. 📝 Set up course management system
4. 📝 Configure progress tracking
5. 📝 Set up gamification system

## Current Dependencies
```json
{
  "dependencies": {
    "@payloadcms/db-postgres": "^3.4.0",
    "@payloadcms/email-resend": "^3.4.0",
    "@payloadcms/next": "^3.4.0",
    "@payloadcms/richtext-slate": "^3.4.0",
    "next": "15.0.3",
    "payload": "^3.4.0",
    "drizzle-orm": "^0.37.0",
    "sharp": "0.32.6"
  }
}
```
