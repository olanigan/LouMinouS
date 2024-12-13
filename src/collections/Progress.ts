import type { CollectionConfig, Access, Where, WhereField } from 'payload'
import type { User } from '../payload-types'
import { basicEditor } from '../lib/payload/editor'

type AccessArgs = {
  req: {
    user?: User | null
  }
}

export const Progress: CollectionConfig = {
  slug: 'progress',
  admin: {
    useAsTitle: 'id',
    group: 'Learning',
    defaultColumns: ['student', 'course', 'status', 'overallProgress'],
    description: 'Student progress tracking',
    listSearchableFields: ['student', 'course'],
  },
  access: {
    read: async ({ req: { user } }: AccessArgs): Promise<boolean | Where> => {
      if (!user) return false
      if (user.role === 'admin') return true
      if (user.role === 'instructor') {
        return {
          'course.tenant': {
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
    update: async ({ req: { user } }: AccessArgs): Promise<boolean | Where> => {
      if (!user) return false
      if (user.role === 'admin') return true
      if (user.role === 'instructor') {
        return {
          'course.tenant': {
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
    delete: ({ req: { user } }: AccessArgs) => {
      if (!user) return false
      return user.role === 'admin'
    },
  },
  fields: [
    {
      name: 'student',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        description: 'The student whose progress is being tracked',
      },
    },
    {
      name: 'course',
      type: 'relationship',
      relationTo: 'courses',
      required: true,
      admin: {
        description: 'The course being tracked',
      },
    },
    {
      name: 'completedLessons',
      type: 'relationship',
      relationTo: ['lessons'],
      hasMany: true,
      admin: {
        description: 'Lessons that have been completed',
      },
    },
    {
      name: 'quizAttempts',
      type: 'array',
      admin: {
        description: 'Quiz attempts and scores',
      },
      fields: [
        {
          name: 'lesson',
          type: 'relationship',
          relationTo: ['lessons'],
          required: true,
        },
        {
          name: 'score',
          type: 'number',
          required: true,
          min: 0,
          max: 100,
        },
        {
          name: 'answers',
          type: 'json',
          required: true,
        },
        {
          name: 'completedAt',
          type: 'date',
          required: true,
        },
      ],
    },
    {
      name: 'assignments',
      type: 'array',
      admin: {
        description: 'Assignment submissions and grades',
      },
      fields: [
        {
          name: 'lesson',
          type: 'relationship',
          relationTo: ['lessons'],
          required: true,
        },
        {
          name: 'submission',
          type: 'json',
          required: true,
        },
        {
          name: 'grade',
          type: 'number',
          min: 0,
          max: 100,
        },
        {
          name: 'feedback',
          type: 'richText',
          editor: basicEditor,
        },
        {
          name: 'submittedAt',
          type: 'date',
          required: true,
        },
        {
          name: 'gradedAt',
          type: 'date',
        },
      ],
    },
    {
      name: 'discussions',
      type: 'array',
      admin: {
        description: 'Discussion participation',
      },
      fields: [
        {
          name: 'lesson',
          type: 'relationship',
          relationTo: ['lessons'],
          required: true,
        },
        {
          name: 'post',
          type: 'richText',
          editor: basicEditor,
          required: true,
        },
        {
          name: 'replies',
          type: 'array',
          fields: [
            {
              name: 'author',
              type: 'relationship',
              relationTo: 'users',
              required: true,
            },
            {
              name: 'content',
              type: 'richText',
              editor: basicEditor,
              required: true,
            },
            {
              name: 'postedAt',
              type: 'date',
              required: true,
            },
          ],
        },
        {
          name: 'postedAt',
          type: 'date',
          required: true,
        },
      ],
    },
    {
      name: 'overallProgress',
      type: 'number',
      required: true,
      min: 0,
      max: 100,
      defaultValue: 0,
      admin: {
        description: 'Overall course completion percentage',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'not_started',
      options: [
        { label: 'Not Started', value: 'not_started' },
        { label: 'In Progress', value: 'in_progress' },
        { label: 'Completed', value: 'completed' },
      ],
    },
    {
      name: 'startedAt',
      type: 'date',
      required: true,
      admin: {
        description: 'When the student started the course',
      },
    },
    {
      name: 'lastAccessed',
      type: 'date',
      required: true,
      admin: {
        description: 'Last time the student accessed the course',
      },
    },
    {
      name: 'completedAt',
      type: 'date',
      admin: {
        description: 'When the student completed the course',
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, operation }) => {
        // Update lastAccessed on every change
        data.lastAccessed = new Date()
        
        // Set startedAt on creation if not provided
        if (operation === 'create' && !data.startedAt) {
          data.startedAt = new Date()
        }
        
        return data
      },
    ],
  },
} 