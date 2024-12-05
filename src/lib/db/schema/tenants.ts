import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'

export const tenants = pgTable('tenants', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  domain: text('domain').unique(),
  status: text('status', { enum: ['active', 'suspended', 'archived'] })
    .notNull()
    .default('active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Zod Schemas for type validation
export const insertTenantSchema = createInsertSchema(tenants, {
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  domain: z.string().url().optional(),
  status: z.enum(['active', 'suspended', 'archived']).optional(),
})

export const selectTenantSchema = createSelectSchema(tenants)

// TypeScript types
export type Tenant = typeof tenants.$inferSelect
export type NewTenant = typeof tenants.$inferInsert 