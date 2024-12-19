import { pgTable, text, timestamp, uuid, integer, jsonb, boolean, uniqueIndex } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { media } from './media'
import { tenants } from './tenants'

export const levels = pgTable('levels', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  level: integer('level').notNull(),
  pointsRequired: integer('points_required').notNull(),
  iconId: uuid('icon_id').references(() => media.id),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  isGlobal: boolean('is_global').default(false),
  
  // Rewards configuration
  rewards: jsonb('rewards').$type<{
    type: 'badge' | 'feature' | 'custom'
    badgeId?: string
    feature?: string
    customData?: Record<string, any>
  }[]>(),
  
  // Metadata
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  levelTenantIdx: uniqueIndex('level_tenant_unique_idx').on(table.level, table.tenantId),
}))

// Zod schema for validation
export const insertLevelSchema = createInsertSchema(levels, {
  name: z.string().min(1).max(100),
  level: z.number().min(1),
  pointsRequired: z.number().min(0),
  iconId: z.string().uuid().optional(),
  tenantId: z.string().uuid().optional(),
  isGlobal: z.boolean().default(false),
  rewards: z.array(
    z.object({
      type: z.enum(['badge', 'feature', 'custom']),
      badgeId: z.string().uuid().optional(),
      feature: z.string().optional(),
      customData: z.record(z.any()).optional(),
    })
  ).optional(),
  description: z.string().optional(),
})

export const selectLevelSchema = createSelectSchema(levels)

// TypeScript types
export type Level = typeof levels.$inferSelect
export type NewLevel = typeof levels.$inferInsert 