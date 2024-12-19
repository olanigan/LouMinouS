import { pgTable, text, timestamp, uuid, integer, jsonb } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { users } from './users'
import { courses } from './courses'
import { lessons } from './lessons'

// Type definitions for progress tracking
type QuizAttempt = {
  lessonId: string
  score: number
  answers: Record<string, any>
  completedAt: string
}

type AssignmentSubmission = {
  lessonId: string
  submission: any
  grade?: number
  feedback?: string
  submittedAt: string
  gradedAt?: string
}

type DiscussionParticipation = {
  lessonId: string
  post: any
  replies: {
    authorId: string
    content: any
    postedAt: string
  }[]
  postedAt: string
}

export const progress = pgTable('progress', {
  id: uuid('id').defaultRandom().primaryKey(),
  studentId: uuid('student_id').references(() => users.id).notNull(),
  courseId: uuid('course_id').references(() => courses.id).notNull(),
  
  // Completion tracking
  completedLessons: jsonb('completed_lessons').$type<string[]>(), // Array of lesson IDs
  quizAttempts: jsonb('quiz_attempts').$type<QuizAttempt[]>(),
  assignments: jsonb('assignments').$type<AssignmentSubmission[]>(),
  discussions: jsonb('discussions').$type<DiscussionParticipation[]>(),
  
  // Progress metrics
  overallProgress: integer('overall_progress').notNull().default(0), // Percentage
  pointsEarned: integer('points_earned').notNull().default(0),
  status: text('status', { 
    enum: ['not_started', 'in_progress', 'completed'] 
  }).notNull().default('not_started'),
  
  // Time tracking
  startedAt: timestamp('started_at').notNull(),
  lastAccessed: timestamp('last_accessed').notNull(),
  completedAt: timestamp('completed_at'),
  
  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Zod schemas for validation
const quizAttemptSchema = z.object({
  lessonId: z.string().uuid(),
  score: z.number().min(0).max(100),
  answers: z.record(z.any()),
  completedAt: z.string(),
})

const assignmentSubmissionSchema = z.object({
  lessonId: z.string().uuid(),
  submission: z.any(),
  grade: z.number().min(0).max(100).optional(),
  feedback: z.string().optional(),
  submittedAt: z.string(),
  gradedAt: z.string().optional(),
})

const discussionParticipationSchema = z.object({
  lessonId: z.string().uuid(),
  post: z.any(),
  replies: z.array(z.object({
    authorId: z.string().uuid(),
    content: z.any(),
    postedAt: z.string(),
  })),
  postedAt: z.string(),
})

export const insertProgressSchema = createInsertSchema(progress, {
  studentId: z.string().uuid(),
  courseId: z.string().uuid(),
  completedLessons: z.array(z.string().uuid()).optional(),
  quizAttempts: z.array(quizAttemptSchema).optional(),
  assignments: z.array(assignmentSubmissionSchema).optional(),
  discussions: z.array(discussionParticipationSchema).optional(),
  overallProgress: z.number().min(0).max(100).default(0),
  status: z.enum(['not_started', 'in_progress', 'completed']).default('not_started'),
  startedAt: z.date(),
  lastAccessed: z.date(),
  completedAt: z.date().optional(),
})

export const selectProgressSchema = createSelectSchema(progress)

// TypeScript types
export type Progress = typeof progress.$inferSelect
export type NewProgress = typeof progress.$inferInsert 