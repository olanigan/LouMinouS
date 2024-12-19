import { pgTable, text, timestamp, uuid, integer, jsonb, uniqueIndex } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { users } from './users'
import { lessons } from './lessons'

export const points = pgTable('points', {
  id: uuid('id').defaultRandom().primaryKey(),
  studentId: uuid('student_id').references(() => users.id).notNull(),
  type: text('type', {
    enum: [
      'lesson_complete',
      'quiz_score',
      'assignment_submit',
      'discussion_post',
      'streak_bonus',
      'achievement_unlock'
    ]
  }).notNull(),
  amount: integer('amount').notNull(),
  
  // Source reference (polymorphic)
  sourceType: text('source_type', {
    enum: ['lessons', 'achievements', 'streaks']
  }).notNull(),
  sourceId: uuid('source_id').notNull(),
  
  // Additional context
  metadata: jsonb('metadata').$type<{
    quizScore?: number
    streakDays?: number
    achievementName?: string
    [key: string]: any
  }>(),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  studentTypeIdx: uniqueIndex('points_student_type_idx').on(table.studentId, table.type),
  sourceIdx: uniqueIndex('points_source_idx').on(table.sourceType, table.sourceId),
}))

// Zod schema for validation
export const insertPointSchema = createInsertSchema(points, {
  studentId: z.string().uuid(),
  type: z.enum([
    'lesson_complete',
    'quiz_score',
    'assignment_submit',
    'discussion_post',
    'streak_bonus',
    'achievement_unlock'
  ]),
  amount: z.number().min(0),
  sourceType: z.enum(['lessons', 'achievements', 'streaks']),
  sourceId: z.string().uuid(),
  metadata: z.object({
    quizScore: z.number().min(0).max(100).optional(),
    streakDays: z.number().min(0).optional(),
    achievementName: z.string().optional(),
  }).passthrough().optional(),
})

export const selectPointSchema = createSelectSchema(points)

// TypeScript types
export type Point = typeof points.$inferSelect
export type NewPoint = typeof points.$inferInsert 