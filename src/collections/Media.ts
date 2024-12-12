import { CollectionConfig } from 'payload'
import type { User } from '../payload-types'

type MediaAccessArgs = {
  req: {
    user?: User | null
  }
}

type MediaData = {
  isGlobal?: boolean
  mimeType?: string
  user?: User
  tenant?: string | { id: string }
}

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    useAsTitle: 'filename',
    group: 'Content',
    defaultColumns: ['filename', 'mimeType', 'tenant'],
    description: 'Media files and images',
    listSearchableFields: ['filename', 'alt'],
  },
  access: {
    read: ({ req: { user } }: MediaAccessArgs) => {
      if (user?.role === 'admin') return true
      return {
        tenant: {
          equals: user?.tenant,
        },
      }
    },
    create: ({ req: { user } }: MediaAccessArgs) => !!user,
    update: ({ req: { user } }: MediaAccessArgs) => {
      if (user?.role === 'admin') return true
      return {
        tenant: {
          equals: user?.tenant,
        },
      }
    },
    delete: ({ req: { user } }: MediaAccessArgs) => {
      if (user?.role === 'admin') return true
      return {
        tenant: {
          equals: user?.tenant,
        },
      }
    },
  },
  upload: {
    staticDir: 'media',
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        position: 'centre',
      },
      {
        name: 'card',
        width: 768,
        height: 1024,
        position: 'centre',
      },
    ],
    adminThumbnail: 'thumbnail',
    mimeTypes: ['image/*', 'application/pdf'],
  },
  fields: [
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: true,
      admin: {
        description: 'The tenant this media belongs to',
        condition: (data: MediaData): boolean => Boolean(!data.isGlobal),
      },
    },
    {
      name: 'isGlobal',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Make this media available to all tenants',
        condition: (data: MediaData): boolean => Boolean(data.user?.role === 'admin'),
      },
    },
    {
      name: 'alt',
      type: 'text',
      admin: {
        description: 'Alternative text for the image',
        condition: (data: MediaData): boolean => Boolean(data.mimeType?.includes('image')),
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ req, data }: { req: any; data: any }) => {
        if (!data.tenant && !data.isGlobal && req.user) {
          data.tenant = req.user.tenant
        }
        return data
      },
    ],
  },
}
