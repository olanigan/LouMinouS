import type { CollectionConfig, PayloadRequest } from 'payload'
import type { User } from '../payload-types'
import { isAdmin, isAdminOrSelf } from '../access/roles'

type EmailTemplateArgs = {
  req?: PayloadRequest
  token?: string
  user?: User
}

interface BeforeValidateHookData {
  data?: {
    email?: string
    tenant?: string
    id?: string | number
    [key: string]: any
  }
  req: PayloadRequest
  operation: 'create' | 'update'
}

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    tokenExpiration: 7200, // 2 hours
    verify: false, // Disable email verification
    maxLoginAttempts: 5,
    lockTime: 600000, // 10 minutes
    useAPIKey: true,
    depth: 2,
    cookies: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      domain: process.env.COOKIE_DOMAIN,
    },
    forgotPassword: {
      generateEmailHTML: ({ token }: EmailTemplateArgs = { token: '' }) => {
        return `Reset your password using this token: ${token}`
      },
    },
  },
  admin: {
    useAsTitle: 'email',
    group: 'System',
    defaultColumns: ['email', 'name', 'role', 'tenant'],
    description: 'Users of the platform',
    listSearchableFields: ['email', 'name'],
    pagination: {
      defaultLimit: 10,
      limits: [10, 20, 50, 100],
    },
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return {
        tenant: {
          equals: user.tenant,
        },
      }
    },
    create: isAdmin,
    update: isAdminOrSelf,
    delete: isAdmin,
  },
  fields: [
    // Authentication Fields
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      admin: {
        description: 'Email address used for login',
      },
    },
    {
      name: 'resetPasswordToken',
      type: 'text',
      hidden: true,
      admin: {
        disabled: true,
      },
    },
    {
      name: 'resetPasswordExpiration',
      type: 'date',
      hidden: true,
      admin: {
        disabled: true,
      },
    },
    {
      name: 'loginAttempts',
      type: 'number',
      hidden: true,
      admin: {
        disabled: true,
      },
    },
    {
      name: 'lockUntil',
      type: 'date',
      hidden: true,
      admin: {
        disabled: true,
      },
    },

    // Profile Fields
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Full name of the user',
      },
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Maximum size: 4MB. Accepted formats: .jpg, .jpeg, .png, .gif',
      },
    },

    // Role & Access Fields
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
      admin: {
        description: 'User role determines permissions',
      },
    },
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: true,
      admin: {
        description: 'Organization this user belongs to',
        condition: (data) => data?.role !== 'admin',
      },
    },

    // Settings & Preferences
    {
      name: 'settings',
      type: 'relationship',
      relationTo: 'student-settings',
      admin: {
        description: 'User preferences and settings',
        condition: (data) => data?.role === 'student',
      },
    },
    {
      name: 'lastActive',
      type: 'date',
      admin: {
        description: 'Last time user was active',
        readOnly: true,
      },
    },
  ],
  hooks: {
    beforeValidate: [
      async ({ data, req, operation }) => {
        // Ensure email uniqueness within tenant
        if (operation === 'create' && data?.email && data?.tenant) {
          const existing = await req.payload.find({
            collection: 'users',
            where: {
              email: { equals: data.email },
              tenant: { equals: data.tenant },
            },
          })
          if (existing.totalDocs > 0) {
            throw new Error('Email must be unique within tenant')
          }
        }

        // Auto-generate name from email if not provided
        if (operation === 'create' && data?.email && !data?.name) {
          data.name = data.email.split('@')[0]
        }

        return data
      },
    ],
    beforeChange: [
      ({ data }) => {
        // Update lastActive timestamp
        data.lastActive = new Date().toISOString()
        return data
      },
    ],
  },
}
