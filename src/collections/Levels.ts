import type { CollectionConfig, Where } from 'payload'
import type { User, Config } from '../payload-types'

type AccessArgs = {
  req: {
    user?: User | null
  }
}

type Level = Config['collections']['levels']

export const Levels: CollectionConfig = {
  slug: 'levels',
  admin: {
    useAsTitle: 'name',
    group: 'Gamification',
    defaultColumns: ['name', 'level', 'pointsRequired', 'tenant'],
    description: 'Level definitions and rewards',
  },
  access: {
    read: ({ req: { user } }: AccessArgs): boolean | Where => {
      if (!user) return false
      if (user.role === 'admin') return true
      return {
        or: [
          {
            'tenant.id': {
              equals: user.tenant
            }
          },
          {
            isGlobal: {
              equals: true
            }
          }
        ]
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
        description: 'Display name for the level',
      },
    },
    {
      name: 'level',
      type: 'number',
      required: true,
      min: 1,
      unique: false,
      admin: {
        description: 'Numeric level value (unique per tenant)',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Detailed description of the level',
      },
    },
    {
      name: 'pointsRequired',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Points needed to reach this level',
      },
    },
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: true,
      admin: {
        condition: (data) => !data.isGlobal,
        description: 'The tenant this level belongs to',
      },
    },
    {
      name: 'isGlobal',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Make this level available to all tenants',
        condition: (data) => data.user?.role === 'admin',
      },
    },
    {
      name: 'icon',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: {
        description: 'Level icon image',
      },
      filterOptions: {
        mimeType: {
          contains: 'image',
        },
      },
    },
    {
      name: 'rewards',
      type: 'array',
      admin: {
        description: 'Rewards earned at this level',
      },
      fields: [
        {
          name: 'type',
          type: 'select',
          required: true,
          options: [
            { label: 'Badge', value: 'badge' },
            { label: 'Feature Unlock', value: 'feature' },
            { label: 'Custom', value: 'custom' },
          ],
        },
        {
          name: 'badge',
          type: 'relationship',
          relationTo: 'badges',
          admin: {
            condition: (data, siblingData) => siblingData?.type === 'badge',
            description: 'Badge awarded at this level',
          },
        },
        {
          name: 'feature',
          type: 'text',
          admin: {
            condition: (data, siblingData) => siblingData?.type === 'feature',
            description: 'Feature unlocked at this level',
          },
        },
        {
          name: 'customData',
          type: 'json',
          admin: {
            condition: (data, siblingData) => siblingData?.type === 'custom',
            description: 'Custom reward data',
          },
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        if (operation === 'create' && !data.tenant && !data.isGlobal && req.user) {
          data.tenant = req.user.tenant
        }

        if (operation === 'create') {
          const existingLevel = await req.payload.find({
            collection: 'levels',
            where: {
              and: [
                {
                  level: {
                    equals: data.level,
                  },
                },
                {
                  or: [
                    {
                      'tenant.id': {
                        equals: data.tenant,
                      },
                    },
                    {
                      isGlobal: {
                        equals: true,
                      },
                    },
                  ],
                },
              ],
            },
          })

          if (existingLevel.totalDocs > 0) {
            throw new Error(`Level ${data.level} already exists for this tenant`)
          }
        }

        if (data.level > 1) {
          const previousLevel = await req.payload.find({
            collection: 'levels',
            where: {
              and: [
                {
                  level: {
                    equals: data.level - 1,
                  },
                },
                {
                  or: [
                    {
                      'tenant.id': {
                        equals: data.tenant,
                      },
                    },
                    {
                      isGlobal: {
                        equals: true,
                      },
                    },
                  ],
                },
              ],
            },
          })

          if (previousLevel.docs.length > 0) {
            const prev = previousLevel.docs[0] as Level
            if (prev.pointsRequired >= data.pointsRequired) {
              throw new Error('Points required must be greater than previous level')
            }
          }
        }

        return data
      },
    ],
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation === 'create' || operation === 'update') {
          const students = await req.payload.find({
            collection: 'progress',
            where: {
              and: [
                {
                  totalPoints: {
                    greater_than_equal: doc.pointsRequired,
                  },
                },
                {
                  or: [
                    {
                      'student.tenant.id': {
                        equals: doc.tenant,
                      },
                    },
                    {
                      isGlobal: {
                        equals: true,
                      },
                    },
                  ],
                },
              ],
            },
          })

          // TODO: Implement level up notifications
          // TODO: Award level rewards
        }
      },
    ],
  },
} 