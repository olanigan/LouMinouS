import type { CollectionConfig, PayloadRequest } from 'payload'
import type { User } from '../payload-types'

type AccessArgs = {
  req: {
    user?: User | null
  }
}

interface BeforeChangeHookData {
  data: {
    user?: string | number
    [key: string]: any
  }
  req: PayloadRequest
}

export const StudentSettings: CollectionConfig = {
  slug: 'student-settings',
  admin: {
    useAsTitle: 'user',
    group: 'System',
    defaultColumns: ['user', 'theme', 'language'],
    description: 'Student preferences and settings',
    listSearchableFields: ['user'],
  },
  access: {
    read: ({ req: { user } }: AccessArgs) => {
      if (user?.role === 'admin') return true
      return {
        user: {
          equals: user?.id,
        },
      }
    },
    create: ({ req: { user } }: AccessArgs) => !!user,
    update: ({ req: { user } }: AccessArgs) => {
      if (user?.role === 'admin') return true
      return {
        user: {
          equals: user?.id,
        },
      }
    },
    delete: ({ req: { user } }: AccessArgs) => user?.role === 'admin',
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      unique: true,
      admin: {
        description: 'The user this settings belong to',
      },
    },
    {
      name: 'preferences',
      type: 'group',
      fields: [
        {
          name: 'theme',
          type: 'select',
          options: [
            { label: 'Light', value: 'light' },
            { label: 'Dark', value: 'dark' },
            { label: 'System', value: 'system' },
          ],
          defaultValue: 'system',
          admin: {
            description: 'The default theme for the user',
          },
        },
        {
          name: 'emailNotifications',
          type: 'group',
          fields: [
            {
              name: 'assignments',
              type: 'checkbox',
              defaultValue: true,
              label: 'Assignment notifications',
            },
            {
              name: 'courseUpdates',
              type: 'checkbox',
              defaultValue: true,
              label: 'Course update notifications',
            },
            {
              name: 'achievements',
              type: 'checkbox',
              defaultValue: true,
              label: 'Achievement notifications',
            },
          ],
          admin: {
            description: 'Email notifications for the user',
          },
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      ({ req, data }: BeforeChangeHookData) => {
        if (!data.user && req.user?.id) {
          if (typeof req.user.id === 'string' || typeof req.user.id === 'number') {
            data.user = req.user.id
          }
        }
        return data
      },
    ],
  },
}
