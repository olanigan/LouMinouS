import { pgTable, text, boolean, timestamp, uuid, integer, jsonb } from 'drizzle-orm/pg-core'
import type { ImageSizes, FocalPoint } from './types'
import { tenants } from './tenants'

export const media = pgTable('media', {
  id: uuid('id').primaryKey().defaultRandom(),
  filename: text('filename').notNull(),
  mimeType: text('mime_type').notNull(),
  filesize: integer('filesize').notNull(),
  width: integer('width'),
  height: integer('height'),
  url: text('url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  alt: text('alt'),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  isGlobal: boolean('is_global').default(false),
  sizes: jsonb('sizes').$type<ImageSizes>(),
  focalPoint: jsonb('focal_point').$type<FocalPoint>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export type Media = typeof media.$inferSelect
export type NewMedia = typeof media.$inferInsert 