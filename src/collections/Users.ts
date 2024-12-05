import type { CollectionConfig } from 'payload'
import type { User } from '../payload-types'

type UserAccessArgs = {
  req: {
    user?: User | null
  }
}

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    tokenExpiration: 7200, // 2 hours
    verify: true,
    maxLoginAttempts: 5,
    lockTime: 600 * 1000, // 10 minutes
    useAPIKey: true,
    depth: 2,
  },
  admin: {
    useAsTitle: 'email',
    group: 'System',
    defaultColumns: ['email', 'role', 'tenant'],
  },
  access: {
    read: ({ req: { user } }: UserAccessArgs) => {
      if (user?.role === 'admin') return true
      return {
        tenant: {
          equals: user?.tenant
        }
      }
    },
    create: ({ req: { user } }: UserAccessArgs) => user?.role === 'admin',
    update: ({ req: { user } }: UserAccessArgs) => {
      if (user?.role === 'admin') return true
      return {
        id: {
          equals: user?.id
        }
      }
    },
    delete: ({ req: { user } }: UserAccessArgs) => user?.role === 'admin',
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
        condition: (data: { role?: string }) => data.role !== 'admin',
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
        condition: (data: { role?: string }) => data.role === 'student',
      },
    },
  ],
  hooks: {
    beforeValidate: [
      async ({ data, req, operation }) => {
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
        return data
      },
    ]
  },
}
