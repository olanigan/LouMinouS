import { pgTable, text, timestamp, uuid, boolean } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { users } from './users'
import { courses } from './courses'

export const enrollments = pgTable('enrollments', {
  id: uuid('id').defaultRandom().primaryKey(),
  studentId: uuid('student_id').references(() => users.id).notNull(),
  courseId: uuid('course_id').references(() => courses.id).notNull(),
  status: text('status', {
    enum: ['active', 'completed', 'dropped', 'pending']
  }).notNull().default('active'),
  
  // Enrollment dates
  enrolledAt: timestamp('enrolled_at').defaultNow().notNull(),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  droppedAt: timestamp('dropped_at'),
  
  // Access control
  isActive: boolean('is_active').default(true),
  expiresAt: timestamp('expires_at'),
  
  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Create indexes for common queries
export const enrollmentIndexes = {
  studentCourse: pgTable('enrollment_student_course_idx', {
    studentId: uuid('student_id').notNull(),
    courseId: uuid('course_id').notNull(),
  }).primaryKey({ columns: ['studentId', 'courseId'] }),
}

// Zod Schemas for validation
export const insertEnrollmentSchema = createInsertSchema(enrollments, {
  studentId: z.string().uuid(),
  courseId: z.string().uuid(),
  status: z.enum(['active', 'completed', 'dropped', 'pending']).default('active'),
  enrolledAt: z.date().default(() => new Date()),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
  droppedAt: z.date().optional(),
  expiresAt: z.date().optional(),
})

export const selectEnrollmentSchema = createSelectSchema(enrollments)

// TypeScript types
export type Enrollment = typeof enrollments.$inferSelect
export type NewEnrollment = typeof enrollments.$inferInsert 