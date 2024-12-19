import { pgTable, uuid, timestamp } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { users } from './users'
import { badges } from './badges'

export const userBadges = pgTable('user_badges', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  badgeId: uuid('badge_id').references(() => badges.id).notNull(),
  awardedAt: timestamp('awarded_at').defaultNow().notNull(),
})

export const insertUserBadgeSchema = createInsertSchema(userBadges)
export const selectUserBadgeSchema = createSelectSchema(userBadges)

export type UserBadge = typeof userBadges.$inferSelect
export type NewUserBadge = typeof userBadges.$inferInsert 