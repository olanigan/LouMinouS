import { pgTable, uuid, timestamp, text, jsonb } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { users } from './users'
import { z } from 'zod'

export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  type: text('type', {
    enum: ['achievement_unlocked', 'badge_awarded', 'level_up', 'points_awarded', 'streak_milestone']
  }).notNull(),
  data: jsonb('data').notNull().$type<{
    achievementId?: string
    badgeId?: string
    points?: number
    [key: string]: any
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  readAt: timestamp('read_at'),
})

const notificationDataSchema = z.object({
  achievementId: z.string().uuid().optional(),
  badgeId: z.string().uuid().optional(),
  points: z.number().optional(),
}).passthrough()

export const insertNotificationSchema = createInsertSchema(notifications, {
  type: z.enum(['achievement_unlocked', 'badge_awarded', 'level_up', 'points_awarded', 'streak_milestone']),
  data: notificationDataSchema,
})

export const selectNotificationSchema = createSelectSchema(notifications)

export type Notification = typeof notifications.$inferSelect
export type NewNotification = typeof notifications.$inferInsert 