import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access/roles'

interface BeforeValidateHookData {
  data?: {
    name?: string
    slug?: string
    [key: string]: any
  }
}

export const Tenants: CollectionConfig = {
  slug: 'tenants',
  admin: {
    useAsTitle: 'name',
    group: 'System',
    defaultColumns: ['name', 'status', 'plan', 'domain'],
    description: 'Organizations using the platform',
    listSearchableFields: ['name', 'slug', 'domain'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return {
        id: {
          equals: user.tenant,
        },
      }
    },
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    // Basic Info
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'The display name of the tenant',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'URL-friendly identifier for the tenant',
      },
    },
    {
      name: 'domain',
      type: 'text',
      unique: true,
      admin: {
        description: 'Custom domain for the tenant',
      },
    },

    // Status & Plan
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Suspended', value: 'suspended' },
        { label: 'Pending', value: 'pending' },
      ],
      admin: {
        description: 'Current status of the tenant',
      },
    },
    {
      name: 'plan',
      type: 'select',
      required: true,
      defaultValue: 'basic',
      options: [
        { label: 'Basic', value: 'basic' },
        { label: 'Pro', value: 'pro' },
        { label: 'Enterprise', value: 'enterprise' },
      ],
      admin: {
        description: 'Subscription plan level',
      },
    },
    {
      name: 'subscription',
      type: 'group',
      admin: {
        description: 'Subscription details',
      },
      fields: [
        {
          name: 'startDate',
          type: 'date',
          admin: {
            description: 'When the subscription started',
          },
        },
        {
          name: 'renewalDate',
          type: 'date',
          admin: {
            description: 'When the subscription renews',
          },
        },
        {
          name: 'stripeCustomerId',
          type: 'text',
          admin: {
            description: 'Stripe customer ID',
            readOnly: true,
          },
        },
      ],
    },

    // Branding & UI
    {
      name: 'settings',
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
          name: 'logo',
          type: 'upload',
          relationTo: 'media',
          filterOptions: {
            mimeType: { contains: 'image' },
          },
        },
        {
          name: 'colors',
          type: 'group',
          fields: [
            {
              name: 'primary',
              type: 'text',
              defaultValue: '#000000',
            },
            {
              name: 'secondary',
              type: 'text',
              defaultValue: '#ffffff',
            },
          ],
        },
      ],
    },

    // Feature Flags
    {
      name: 'features',
      type: 'group',
      fields: [
        {
          name: 'gamification',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description: 'Enable gamification features',
          },
        },
        {
          name: 'adaptiveLearning',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Enable adaptive learning features',
          },
        },
        {
          name: 'analytics',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description: 'Enable analytics tracking',
          },
        },
        {
          name: 'api',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Enable API access',
          },
        },
      ],
    },

    // Analytics & Metrics
    {
      name: 'analytics',
      type: 'group',
      admin: {
        description: 'Usage metrics and analytics',
      },
      fields: [
        {
          name: 'totalUsers',
          type: 'number',
          admin: {
            description: 'Total number of users',
            readOnly: true,
          },
        },
        {
          name: 'totalCourses',
          type: 'number',
          admin: {
            description: 'Total number of courses',
            readOnly: true,
          },
        },
        {
          name: 'storageUsed',
          type: 'number',
          admin: {
            description: 'Storage space used in bytes',
            readOnly: true,
          },
        },
        {
          name: 'lastActivityAt',
          type: 'date',
          admin: {
            description: 'Last activity in the tenant',
            readOnly: true,
          },
        },
      ],
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data = {} }: BeforeValidateHookData) => {
        if (data?.name && !data?.slug) {
          data.slug = data.name.toLowerCase().replace(/\s+/g, '-')
        }
        return data
      },
    ],
    beforeChange: [
      async ({ data, operation, req }) => {
        // Set subscription start date on creation
        if (operation === 'create') {
          if (!data.subscription) data.subscription = {}
          data.subscription.startDate = new Date().toISOString()
          data.subscription.renewalDate = new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000,
          ).toISOString() // 30 days
        }
        return data
      },
    ],
  },
}
