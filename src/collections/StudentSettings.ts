import type { CollectionConfig } from 'payload'
import type { User } from '../payload-types'

type AccessArgs = {
  req: {
    user?: User | null
  }
}

export const StudentSettings: CollectionConfig = {
  slug: 'student-settings',
  admin: {
    useAsTitle: 'user',
    group: 'System',
  },
  access: {
    read: ({ req: { user } }: AccessArgs) => {
      if (user?.role === 'admin') return true
      return {
        user: {
          equals: user?.id
        }
      }
    },
    create: ({ req: { user } }: AccessArgs) => !!user,
    update: ({ req: { user } }: AccessArgs) => {
      if (user?.role === 'admin') return true
      return {
        user: {
          equals: user?.id
        }
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
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      ({ req, data }) => {
        if (!data.user && req.user) {
          data.user = req.user.id
        }
        return data
      }
    ]
  }
} 