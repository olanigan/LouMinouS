import type { CollectionConfig, Where, WhereField } from 'payload'
import type { User } from '../payload-types'

type AccessArgs = {
  req: {
    user?: User | null
  }
}

export const Streaks: CollectionConfig = {
  slug: 'streaks',
  admin: {
    useAsTitle: 'id',
    group: 'Gamification',
    defaultColumns: ['student', 'type', 'currentStreak', 'longestStreak', 'lastActivity'],
    description: 'User activity streaks and history',
  },
  access: {
    read: ({ req: { user } }: AccessArgs): boolean | Where => {
      if (!user) return false
      if (user.role === 'admin') return true
      if (user.role === 'instructor') {
        return {
          'student.tenant': {
            equals: user.tenant,
          } as WhereField,
        }
      }
      return {
        student: {
          equals: user.id,
        } as WhereField,
      }
    },
    create: () => false, // Only created by system
    update: () => false,
    delete: ({ req: { user } }: AccessArgs) => user?.role === 'admin',
  },
  fields: [
    {
      name: 'student',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        description: 'The student this streak belongs to',
      },
      index: true,
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Daily Login', value: 'login' },
        { label: 'Course Progress', value: 'progress' },
        { label: 'Quiz Completion', value: 'quiz' },
        { label: 'Assignment Submission', value: 'assignment' },
      ],
      admin: {
        description: 'Type of activity being tracked',
      },
      index: true,
    },
    {
      name: 'currentStreak',
      type: 'number',
      required: true,
      min: 0,
      defaultValue: 0,
      admin: {
        description: 'Current consecutive days of activity',
      },
    },
    {
      name: 'longestStreak',
      type: 'number',
      required: true,
      min: 0,
      defaultValue: 0,
      admin: {
        description: 'Longest streak achieved',
      },
    },
    {
      name: 'lastActivity',
      type: 'date',
      required: true,
      admin: {
        description: 'Last time this streak was updated',
      },
      index: true,
    },
    {
      name: 'nextRequired',
      type: 'date',
      required: true,
      admin: {
        description: 'When the next activity is required to maintain streak',
      },
    },
    {
      name: 'history',
      type: 'array',
      fields: [
        {
          name: 'date',
          type: 'date',
          required: true,
        },
        {
          name: 'activity',
          type: 'relationship',
          relationTo: ['courses', 'lessons', 'modules'],
          required: true,
          admin: {
            description: 'The activity that contributed to this streak',
          },
        },
        {
          name: 'points',
          type: 'number',
          required: true,
          min: 0,
        },
      ],
      admin: {
        description: 'History of activities that contributed to this streak',
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, operation }) => {
        if (operation === 'update') {
          // Update longest streak if current streak is higher
          if (data.currentStreak > data.longestStreak) {
            data.longestStreak = data.currentStreak
          }
        }
        return data
      },
    ],
  },
} 