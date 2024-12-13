import type { CollectionConfig, CollectionSlug } from 'payload'
import type { User } from '../payload-types'

type AccessArgs = {
  req: {
    user?: User | null
  }
}

export const Courses: CollectionConfig = {
  slug: 'courses',
  admin: {
    useAsTitle: 'title',
    group: 'Learning',
    defaultColumns: ['title', 'instructor', 'status', 'updatedAt'],
    description: 'Course content and structure',
    listSearchableFields: ['title', 'slug'],
  },
  versions: {
    drafts: true,
  },
  access: {
    read: ({ req: { user } }: AccessArgs) => {
      if (user?.role === 'admin') return true
      return {
        tenant: {
          equals: user?.tenant,
        },
      }
    },
    create: ({ req: { user } }: AccessArgs) => 
      user?.role === 'admin' || user?.role === 'instructor',
    update: ({ req: { user } }: AccessArgs) => {
      if (user?.role === 'admin') return true
      if (user?.role === 'instructor') {
        return {
          instructor: {
            equals: user?.id,
          },
        }
      }
      return false
    },
    delete: ({ req: { user } }: AccessArgs) => user?.role === 'admin',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'The title of the course',
        placeholder: 'e.g., Introduction to Programming',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'URL-friendly version of the title (auto-generated if not provided)',
        placeholder: 'e.g., intro-to-programming',
      },
    },
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants' as CollectionSlug,
      required: true,
      admin: {
        description: 'The organization this course belongs to',
        condition: (data) => !data.isGlobal,
      },
    },
    {
      name: 'isGlobal',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Make this course available to all tenants',
        condition: (data) => data.user?.role === 'admin',
      },
    },
    {
      name: 'instructor',
      type: 'relationship',
      relationTo: 'users' as CollectionSlug,
      required: true,
      filterOptions: {
        role: {
          equals: 'instructor',
        },
      },
      admin: {
        description: 'The instructor responsible for this course',
      },
    },
    {
      name: 'description',
      type: 'richText',
      required: true,
      admin: {
        description: 'Detailed description of the course content and objectives',
      },
    },
    {
      name: 'thumbnail',
      type: 'upload',
      relationTo: 'media' as CollectionSlug,
      required: true,
      admin: {
        description: 'Course thumbnail image (16:9 ratio recommended)',
      },
    },
    {
      name: 'modules',
      type: 'relationship',
      relationTo: 'modules' as CollectionSlug,
      hasMany: true,
      admin: {
        description: 'Course modules in sequential order',
      },
    },
    {
      name: 'prerequisites',
      type: 'relationship',
      relationTo: 'courses' as CollectionSlug,
      hasMany: true,
      filterOptions: {
        tenant: {
          equals: '{{user.tenant}}',
        },
      },
    },
    {
      name: 'duration',
      type: 'group',
      fields: [
        {
          name: 'hours',
          type: 'number',
          required: true,
          min: 0,
        },
        {
          name: 'minutes',
          type: 'number',
          required: true,
          min: 0,
          max: 59,
        },
      ],
    },
    {
      name: 'schedule',
      type: 'group',
      fields: [
        {
          name: 'startDate',
          type: 'date',
          required: true,
          admin: {
            date: {
              pickerAppearance: 'dayAndTime',
            },
          },
        },
        {
          name: 'endDate',
          type: 'date',
          required: true,
          admin: {
            date: {
              pickerAppearance: 'dayAndTime',
            },
          },
        },
        {
          name: 'enrollmentDeadline',
          type: 'date',
          admin: {
            date: {
              pickerAppearance: 'dayAndTime',
            },
          },
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
    },
    {
      name: 'settings',
      type: 'group',
      fields: [
        {
          name: 'allowLateSubmissions',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'requirePrerequisites',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'showProgress',
          type: 'checkbox',
          defaultValue: true,
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, req, operation }) => {
        // Generate slug from title if not provided
        if (operation === 'create' && data.title && !data.slug) {
          data.slug = data.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
        }

        // Set tenant from user if not provided and not global
        if (operation === 'create' && !data.tenant && !data.isGlobal && req.user) {
          data.tenant = req.user.tenant
        }

        // Set instructor to current user if not provided and user is instructor
        if (operation === 'create' && !data.instructor && req.user?.role === 'instructor') {
          data.instructor = req.user.id
        }

        return data
      },
    ],
  },
} 