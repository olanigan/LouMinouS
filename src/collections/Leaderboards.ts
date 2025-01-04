import type { CollectionConfig, Where, WhereField } from 'payload'
import type { User } from '../payload-types'

type AccessArgs = {
  req: {
    user?: User | null
  }
}

export const Leaderboards: CollectionConfig = {
  slug: 'leaderboards',
  admin: {
    useAsTitle: 'name',
    group: 'Gamification',
    defaultColumns: ['name', 'type', 'timeframe'],
    description: 'Leaderboard configurations',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Display name for the leaderboard',
      },
    },
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      admin: {
        description: 'Tenant this leaderboard belongs to',
        condition: (data) => !data?.isGlobal,
      },
      index: true,
    },
    {
      name: 'isGlobal',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Make this leaderboard available to all tenants',
      },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Points', value: 'points' },
        { label: 'Progress', value: 'progress' },
        { label: 'Achievements', value: 'achievements' },
        { label: 'Custom', value: 'custom' },
      ],
      admin: {
        description: 'What to rank users by',
      },
      index: true,
    },
    {
      name: 'timeframe',
      type: 'select',
      required: true,
      options: [
        { label: 'All Time', value: 'all_time' },
        { label: 'Daily', value: 'daily' },
        { label: 'Weekly', value: 'weekly' },
        { label: 'Monthly', value: 'monthly' },
      ],
      admin: {
        description: 'Time period to rank over',
      },
      index: true,
    },
    {
      name: 'scope',
      type: 'group',
      fields: [
        {
          name: 'course',
          type: 'relationship',
          relationTo: 'courses',
          admin: {
            description: 'Limit to specific course',
          },
          index: true,
        },
        {
          name: 'pointType',
          type: 'select',
          options: [
            { label: 'All', value: 'all' },
            { label: 'Lesson', value: 'lesson' },
            { label: 'Quiz', value: 'quiz' },
            { label: 'Assignment', value: 'assignment' },
          ],
          defaultValue: 'all',
          admin: {
            condition: (data, siblingData) => data?.type === 'points',
          },
        },
        {
          name: 'achievementType',
          type: 'select',
          options: [
            { label: 'All', value: 'all' },
            { label: 'Course', value: 'course' },
            { label: 'Quiz', value: 'quiz' },
            { label: 'Streak', value: 'streak' },
          ],
          defaultValue: 'all',
          admin: {
            condition: (data, siblingData) => data?.type === 'achievements',
          },
        },
      ],
    },
    {
      name: 'customLogic',
      type: 'code',
      admin: {
        language: 'typescript',
        description: 'Custom ranking logic',
        condition: (data) => data?.type === 'custom',
      },
    },
    {
      name: 'displayLimit',
      type: 'number',
      required: true,
      min: 1,
      max: 100,
      defaultValue: 10,
      admin: {
        description: 'Number of top ranks to display',
      },
    },
    {
      name: 'refreshInterval',
      type: 'number',
      required: true,
      min: 300,
      defaultValue: 3600,
      admin: {
        description: 'How often to refresh rankings (in seconds)',
      },
    },
  ],
  access: {
    read: ({ req: { user } }: AccessArgs): boolean | Where => {
      if (!user) return false
      if (user.role === 'admin') return true
      return {
        or: [
          {
            'tenant.id': {
              equals: user.tenant,
            } as WhereField,
          },
          {
            isGlobal: {
              equals: true,
            } as WhereField,
          },
        ],
      }
    },
    create: ({ req: { user } }: AccessArgs) => user?.role === 'admin',
    update: ({ req: { user } }: AccessArgs) => user?.role === 'admin',
    delete: ({ req: { user } }: AccessArgs) => user?.role === 'admin',
  },
  hooks: {
    beforeValidate: [
      ({ data, operation }) => {
        if (operation === 'create' || operation === 'update') {
          if (!data?.isGlobal && !data?.tenant) {
            throw new Error('Tenant is required when leaderboard is not global')
          }
        }
        return data
      },
    ],
    beforeChange: [
      async ({ data, req, operation }) => {
        if (operation === 'create' && !data.tenant && !data.isGlobal && req.user) {
          data.tenant = req.user.tenant
        }
        if (data.isGlobal) {
          data.tenant = undefined
        }
        return data
      },
    ],
  },
}
