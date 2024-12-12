import type { CollectionConfig } from 'payload'
import type { User } from '../payload-types'

type AccessArgs = {
  req: {
    user?: User | null
  }
}

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
    defaultColumns: ['name', 'slug', 'status'],
    description: 'Organizations using the platform',
    listSearchableFields: ['name', 'slug', 'domain'],
  },
  access: {
    read: ({ req: { user } }: AccessArgs) => {
      if (user?.role === 'admin') return true
      return {
        id: {
          equals: user?.tenant,
        },
      }
    },
    create: ({ req: { user } }: AccessArgs) => user?.role === 'admin',
    update: ({ req: { user } }: AccessArgs) => user?.role === 'admin',
    delete: ({ req: { user } }: AccessArgs) => user?.role === 'admin',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        disableBulkEdit: false,
        description: 'The display name of the tenant',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        disableBulkEdit: false,
        description: 'URL-friendly identifier for the tenant',
      },
    },
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
  },
}
