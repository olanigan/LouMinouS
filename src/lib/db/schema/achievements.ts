import { pgTable, text, timestamp, uuid, boolean, jsonb, integer } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { tenants } from './tenants'
import { badges } from './badges'

// Type definitions for achievement criteria
type AchievementCriteria = {
  metric: 'count' | 'score' | 'duration' | 'custom'
  threshold: number
  timeframe?: 'all_time' | 'daily' | 'weekly' | 'monthly'
  customRule?: string
}

export const achievements = pgTable('achievements', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  
  type: text('type', {
    enum: ['course_progress', 'quiz_score', 'assignment', 'streak', 'discussion', 'custom']
  }).notNull(),
  
  criteria: jsonb('criteria').$type<AchievementCriteria>().notNull(),
  
  badgeId: uuid('badge_id').references(() => badges.id).notNull(),
  points: integer('points').notNull(),
  secret: boolean('secret').default(false).notNull(),
  
  tenantId: uuid('tenant_id').references(() => tenants.id),
  isGlobal: boolean('is_global').default(false).notNull(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Zod schema for validation
const criteriaSchema = z.object({
  metric: z.enum(['count', 'score', 'duration', 'custom']),
  threshold: z.number().min(0),
  timeframe: z.enum(['all_time', 'daily', 'weekly', 'monthly']).optional(),
  customRule: z.string().optional(),
})

export const insertAchievementSchema = createInsertSchema(achievements, {
  name: z.string().min(1),
  description: z.string().min(1),
  type: z.enum(['course_progress', 'quiz_score', 'assignment', 'streak', 'discussion', 'custom']),
  criteria: criteriaSchema,
  badgeId: z.string().uuid(),
  points: z.number().min(0),
  secret: z.boolean().default(false),
  tenantId: z.string().uuid().nullish(),
  isGlobal: z.boolean().default(false),
})

export const selectAchievementSchema = createSelectSchema(achievements)

// TypeScript types
export type Achievement = typeof achievements.$inferSelect
export type NewAchievement = typeof achievements.$inferInsert 