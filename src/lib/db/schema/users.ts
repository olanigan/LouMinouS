import { pgTable, text, timestamp, uuid, integer, boolean } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { tenants } from './tenants'

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  role: text('role', { enum: ['admin', 'instructor', 'student'] })
    .notNull()
    .default('student'),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  avatarId: uuid('avatar_id'),  // Will be linked in relations.ts
  lastActive: timestamp('last_active'),
  resetPasswordToken: text('reset_password_token'),
  resetPasswordExpiry: timestamp('reset_password_expiry'),
  verificationToken: text('verification_token'),
  verified: boolean('verified').default(false),
  loginAttempts: integer('login_attempts').default(0),
  lockUntil: timestamp('lock_until'),
  apiKey: text('api_key'),
  apiKeyIndex: text('api_key_index'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Zod Schemas for validation
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).max(100),
  role: z.enum(['admin', 'instructor', 'student']).default('student'),
  tenantId: z.string().uuid().optional(),
})

export const selectUserSchema = createSelectSchema(users)

// TypeScript types
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert 