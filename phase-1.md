# Phase 1: Project Setup and Core Infrastructure

## Summary
This phase establishes the foundation of our multi-tenant LMS platform using:
1. Next.js 14 with App Router
2. Payload CMS
3. Neon Database
4. TypeScript
5. pnpm

**Key Components:**
- Project initialization
- Database setup
- Authentication system
- Core collections

**Expected Outcome:**
A configured development environment with:
- Working Next.js application
- Connected Payload CMS
- Configured database
- Basic authentication

## 1.1 Project Setup

### Initialize Project
```bash
# Create a new Payload + Next.js project
npx create-payload-app@latest --no-src --use-pnpm  -t blank

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

```typescript:next.config.js
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
The `create-payload-app` command will create a `.env` file, but we should add our additional variables:

```bash
# Database (created by create-payload-app)
DATABASE_URL=postgres://${NEON_USER}:${NEON_PASSWORD}@${NEON_HOST}/${NEON_DATABASE}?sslmode=require
PAYLOAD_SECRET=your-payload-secret

# Email (Resend)
RESEND_API_KEY=your-resend-key

# Upload (Uploadthing)
UPLOADTHING_SECRET=your-uploadthing-secret
UPLOADTHING_APP_ID=your-uploadthing-app-id

# Stripe
STRIPE_SECRET_KEY=your-stripe-secret
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable

# Pusher
NEXT_PUBLIC_PUSHER_APP_KEY=your-pusher-key
PUSHER_APP_ID=your-pusher-app-id
PUSHER_SECRET=your-pusher-secret

# Site Config
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME="LMS Platform"
```

### Project Structure
The `create-payload-app` command will create a basic project structure, but we'll need to organize our additional features. Here's the recommended structure:

```
lms-mvp/
│   ├── app/
│   │   ├── (auth)/
│   │   ├── (dashboard)/
│   │   ├── api/
│   │   └── layout.tsx
│   ├── collections/
│   │   ├── Media.ts
│   │   ├── Tenants.ts
│   │   ├── Users.ts
│   │   └── index.ts
│   ├── components/
│   │   ├── ui/
│   │   ├── forms/
│   │   └── layouts/
│   ├── lib/
│   │   ├── auth/
│   │   ├── db/
│   │   └── utils/
│   └── types/
├── public/
├── payload.config.ts
└── next.config.js
```

## 1.2 Database Configuration

### Configure Neon Connection
Create `lib/db/index.ts`:
```typescript
import { Pool } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-serverless'

// Configure connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
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

### Configure Environment Variables
Create `.env`:
```bash
# Database
DATABASE_URL=postgres://${NEON_USER}:${NEON_PASSWORD}@${NEON_HOST}/${NEON_DATABASE}?sslmode=require
DIRECT_URL=${DIRECT_URL} # For Neon serverless driver

# Payload
PAYLOAD_SECRET=your-dev-secret
PAYLOAD_CONFIG_PATH=payload.config.ts

# Email (Resend)
RESEND_API_KEY=your-resend-key

# Upload (Uploadthing)
UPLOADTHING_SECRET=your-uploadthing-secret
UPLOADTHING_APP_ID=your-uploadthing-app-id

# Stripe
STRIPE_SECRET_KEY=your-stripe-secret
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable

# Pusher
NEXT_PUBLIC_PUSHER_APP_KEY=your-pusher-key
PUSHER_APP_ID=your-pusher-app-id
PUSHER_SECRET=your-pusher-secret

# Site Config
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME="LMS Platform"
```

## 1.3 Authentication System

### Configure Payload Auth
Create `collections/Users.ts`:
```typescript
import { CollectionConfig } from 'payload/types'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    tokenExpiration: 7200, // 2 hours
    verify: true,
    maxLoginAttempts: 5,
    lockTime: 600 * 1000, // 10 minutes
  },
  admin: {
    useAsTitle: 'email',
    group: 'System',
  },
  access: {
    read: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      return {
        tenant: {
          equals: user?.tenant
        }
      }
    },
    create: ({ req: { user } }) => user?.role === 'admin',
    update: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      return {
        id: {
          equals: user?.id
        }
      }
    },
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      required: true,
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Instructor', value: 'instructor' },
        { label: 'Student', value: 'student' },
      ],
      defaultValue: 'student',
    },
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: true,
      admin: {
        condition: (data) => data.role !== 'admin',
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Maximum size: 4MB. Accepted formats: .jpg, .jpeg, .png, .gif',
      },
    },
    {
      name: 'settings',
      type: 'relationship',
      relationTo: 'student-settings',
      admin: {
        condition: (data) => data.role === 'student',
      },
    },
  ],
  indexes: [
    {
      name: 'email_tenant',
      fields: ['email', 'tenant'],
      unique: true,
    },
    {
      name: 'role_tenant',
      fields: ['role', 'tenant'],
    },
  ],
}
```

### Configure Next Auth
Create `lib/auth/index.ts`:
```typescript
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { createPayloadClient } from '../payload'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const payload = await createPayloadClient()
        
        try {
          const { user, token } = await payload.login({
            collection: 'users',
            data: {
              email: credentials.email,
              password: credentials.password,
            },
          })

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            tenant: user.tenant,
            token,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          id: user.id,
          role: user.role,
          tenant: user.tenant,
          accessToken: user.token,
        }
      }
      return token
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          role: token.role,
          tenant: token.tenant,
          accessToken: token.accessToken,
        },
      }
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
    verifyRequest: '/auth/verify',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7200, // 2 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
}
```

## 1.4 Core Collections

### Configure Media Collection
Create `collections/Media.ts`:
```typescript
import { CollectionConfig } from 'payload/types'
import { isAdmin } from '../access/roles'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    useAsTitle: 'filename',
    group: 'Content',
  },
  access: {
    read: ({ req: { user } }) => {
      if (isAdmin(user)) return true
      return {
        tenant: {
          equals: user?.tenant
        }
      }
    },
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => {
      if (isAdmin(user)) return true
      return {
        tenant: {
          equals: user?.tenant
        }
      }
    },
    delete: ({ req: { user } }) => {
      if (isAdmin(user)) return true
      return {
        tenant: {
          equals: user?.tenant
        }
      }
    },
  },
  upload: {
    staticURL: '/media',
    staticDir: 'media',
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        position: 'centre',
      },
      {
        name: 'card',
        width: 768,
        height: 1024,
        position: 'centre',
      },
    ],
    adminThumbnail: 'thumbnail',
    mimeTypes: ['image/*', 'application/pdf'],
  },
  fields: [
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: true,
      admin: {
        condition: (data) => !data.isGlobal,
      },
    },
    {
      name: 'isGlobal',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Make this media available to all tenants',
        condition: (data, siblingData) => isAdmin(data.user),
      },
    },
    {
      name: 'alt',
      type: 'text',
      admin: {
        condition: (data) => data.mimeType?.includes('image'),
      },
    },
  ],
  indexes: [
    {
      name: 'tenant_filename',
      fields: ['tenant', 'filename'],
    },
  ],
}
```

### Configure Tenants Collection
Create `collections/Tenants.ts`:
```typescript
import { CollectionConfig } from 'payload/types'
import { isAdmin } from '../access/roles'

export const Tenants: CollectionConfig = {
  slug: 'tenants',
  admin: {
    useAsTitle: 'name',
    group: 'System',
  },
  access: {
    read: ({ req: { user } }) => {
      if (isAdmin(user)) return true
      return {
        id: {
          equals: user?.tenant
        }
      }
    },
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'URL-friendly version of the name (e.g., "acme-corp")',
      },
    },
    {
      name: 'domain',
      type: 'text',
      unique: true,
      admin: {
        description: 'Custom domain (e.g., "learn.acme-corp.com")',
      },
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Tenant logo (recommended size: 200x200)',
      },
    },
    {
      name: 'settings',
      type: 'relationship',
      relationTo: 'tenant-settings',
      admin: {
        description: 'Tenant-specific settings and configurations',
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Suspended', value: 'suspended' },
        { label: 'Archived', value: 'archived' },
      ],
      defaultValue: 'active',
      required: true,
    },
  ],
  indexes: [
    {
      name: 'domain',
      fields: ['domain'],
      unique: true,
    },
    {
      name: 'slug',
      fields: ['slug'],
      unique: true,
    },
  ],
}
```

### Configure Settings Collections
Create `collections/TenantSettings.ts`:
```typescript
import { CollectionConfig } from 'payload/types'
import { isAdmin } from '../access/roles'

export const TenantSettings: CollectionConfig = {
  slug: 'tenant-settings',
  admin: {
    useAsTitle: 'tenant',
    group: 'System',
  },
  access: {
    read: ({ req: { user } }) => {
      if (isAdmin(user)) return true
      return {
        tenant: {
          equals: user?.tenant
        }
      }
    },
    create: isAdmin,
    update: ({ req: { user } }) => {
      if (isAdmin(user)) return true
      return {
        tenant: {
          equals: user?.tenant
        }
      }
    },
    delete: isAdmin,
  },
  fields: [
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: true,
      unique: true,
    },
    {
      name: 'theme',
      type: 'group',
      fields: [
        {
          name: 'primaryColor',
          type: 'text',
          required: true,
          defaultValue: '#000000',
        },
        {
          name: 'secondaryColor',
          type: 'text',
          required: true,
          defaultValue: '#ffffff',
        },
        {
          name: 'fontFamily',
          type: 'select',
          options: [
            { label: 'Inter', value: 'inter' },
            { label: 'Roboto', value: 'roboto' },
            { label: 'Open Sans', value: 'open-sans' },
          ],
          defaultValue: 'inter',
        },
      ],
    },
    {
      name: 'features',
      type: 'group',
      fields: [
        {
          name: 'gamification',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'adaptiveLearning',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'certificates',
          type: 'checkbox',
          defaultValue: true,
        },
      ],
    },
    {
      name: 'limits',
      type: 'group',
      fields: [
        {
          name: 'maxUsers',
          type: 'number',
          min: 1,
          defaultValue: 100,
        },
        {
          name: 'maxStorage',
          type: 'number',
          min: 1,
          defaultValue: 5, // GB
        },
        {
          name: 'maxCourses',
          type: 'number',
          min: 1,
          defaultValue: 10,
        },
      ],
    },
  ],
}
```

## Next Steps
- Set up course management system
- Implement content structure
- Configure progress tracking
- Set up gamification system
