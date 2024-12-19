import { pgTable, uuid, timestamp } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { users } from './users'
import { achievements } from './achievements'

export const userAchievements = pgTable('user_achievements', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  achievementId: uuid('achievement_id').references(() => achievements.id).notNull(),
  completedAt: timestamp('completed_at').defaultNow().notNull(),
})

export const insertUserAchievementSchema = createInsertSchema(userAchievements)
export const selectUserAchievementSchema = createSelectSchema(userAchievements)

export type UserAchievement = typeof userAchievements.$inferSelect
export type NewUserAchievement = typeof userAchievements.$inferInsert 