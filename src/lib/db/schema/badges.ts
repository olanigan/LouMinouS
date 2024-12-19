import { pgTable, text, timestamp, uuid, boolean, uniqueIndex } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { tenants } from './tenants'
import { media } from './media'

export const badges = pgTable('badges', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  iconId: uuid('icon_id').references(() => media.id).notNull(),
  
  rarity: text('rarity', {
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary']
  }).notNull(),
  
  category: text('category', {
    enum: ['progress', 'performance', 'engagement', 'special']
  }).notNull(),
  
  tenantId: uuid('tenant_id').references(() => tenants.id),
  isGlobal: boolean('is_global').default(false).notNull(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantRarityIdx: uniqueIndex('badges_tenant_rarity_idx').on(table.tenantId, table.rarity),
  categoryRarityIdx: uniqueIndex('badges_category_rarity_idx').on(table.category, table.rarity),
}))

// Zod schema for validation
export const insertBadgeSchema = createInsertSchema(badges, {
  name: z.string().min(1),
  description: z.string().min(1),
  iconId: z.string().uuid(),
  rarity: z.enum(['common', 'uncommon', 'rare', 'epic', 'legendary']),
  category: z.enum(['progress', 'performance', 'engagement', 'special']),
  tenantId: z.string().uuid().nullish(),
  isGlobal: z.boolean().default(false),
})

export const selectBadgeSchema = createSelectSchema(badges)

// TypeScript types
export type Badge = typeof badges.$inferSelect
export type NewBadge = typeof badges.$inferInsert 