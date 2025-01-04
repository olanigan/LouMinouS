import type { CollectionConfig, Where, WhereField, FilterOptionsProps } from 'payload'
import type { User } from '../payload-types'

type AccessArgs = {
  req: {
    user?: User | null
  }
}

export const Achievements: CollectionConfig = {
  slug: 'achievements',
  admin: {
    useAsTitle: 'name',
    group: 'Gamification',
    defaultColumns: ['name', 'type', 'badge', 'points'],
    description: 'Achievement definitions and criteria',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Name of the achievement',
      },
      index: true,
    },
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      admin: {
        description: 'Tenant this achievement belongs to',
      },
      index: true,
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      admin: {
        description: 'Detailed description of how to earn this achievement',
      },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Course Progress', value: 'course_progress' },
        { label: 'Quiz Score', value: 'quiz_score' },
        { label: 'Assignment', value: 'assignment' },
        { label: 'Streak', value: 'streak' },
        { label: 'Discussion', value: 'discussion' },
        { label: 'Custom', value: 'custom' },
      ],
      admin: {
        description: 'Type of activity tracked',
      },
    },
    {
      name: 'criteria',
      type: 'group',
      fields: [
        {
          name: 'metric',
          type: 'select',
          required: true,
          options: [
            { label: 'Count', value: 'count' },
            { label: 'Score', value: 'score' },
            { label: 'Duration', value: 'duration' },
            { label: 'Custom', value: 'custom' },
          ],
          admin: {
            description: 'What to measure',
          },
        },
        {
          name: 'threshold',
          type: 'number',
          required: true,
          min: 0,
          admin: {
            description: 'Target value to achieve',
          },
        },
        {
          name: 'timeframe',
          type: 'select',
          options: [
            { label: 'All Time', value: 'all_time' },
            { label: 'Daily', value: 'daily' },
            { label: 'Weekly', value: 'weekly' },
            { label: 'Monthly', value: 'monthly' },
          ],
          defaultValue: 'all_time',
          admin: {
            description: 'Time period to measure over',
          },
        },
        {
          name: 'customRule',
          type: 'code',
          admin: {
            language: 'typescript',
            description: 'Custom achievement criteria logic',
            condition: (data, siblingData) => siblingData?.metric === 'custom',
          },
        },
      ],
    },
    {
      name: 'badge',
      type: 'relationship',
      relationTo: 'badges' as const,
      required: true,
      admin: {
        description: 'Badge awarded for this achievement',
      },
      filterOptions: ({ user }: FilterOptionsProps<any>): Where => {
        if (user?.role === 'admin') return {} as Where
        return {
          or: [
            {
              tenant: {
                equals: user?.tenant,
              } as WhereField,
            },
            {
              isGlobal: {
                equals: true,
              } as WhereField,
            },
          ],
        } as Where
      },
    },
    {
      name: 'points',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Points awarded for this achievement',
      },
    },
    {
      name: 'secret',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Hide this achievement until unlocked',
      },
    },
    {
      name: 'isGlobal',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Make this achievement available to all tenants',
        condition: (data) => data.user?.role === 'admin',
      },
    },
  ],
  hooks: {
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