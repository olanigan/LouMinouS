import { pgTable, text, timestamp, uuid, boolean, integer, jsonb } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { tenants } from './tenants'
import { users } from './users'
import { media } from './media'

export const courses = pgTable('courses', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description').notNull(),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  instructorId: uuid('instructor_id').references(() => users.id).notNull(),
  thumbnailId: uuid('thumbnail_id').references(() => media.id).notNull(),
  isGlobal: boolean('is_global').default(false),
  status: text('status', { 
    enum: ['draft', 'published', 'archived'] 
  }).notNull().default('draft'),
  
  // Duration
  durationHours: integer('duration_hours').notNull().default(0),
  durationMinutes: integer('duration_minutes').notNull().default(0),
  
  // Schedule
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  enrollmentDeadline: timestamp('enrollment_deadline'),
  
  // Settings
  settings: jsonb('settings').$type<{
    allowLateSubmissions: boolean
    requirePrerequisites: boolean
    showProgress: boolean
  }>().notNull().default({
    allowLateSubmissions: true,
    requirePrerequisites: true,
    showProgress: true
  }),
  
  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  publishedAt: timestamp('published_at'),
  archivedAt: timestamp('archived_at'),
  version: integer('version').notNull().default(1),
})

// Zod Schemas for validation
export const insertCourseSchema = createInsertSchema(courses, {
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  description: z.string().min(1),
  tenantId: z.string().uuid().optional(),
  instructorId: z.string().uuid(),
  thumbnailId: z.string().uuid(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  durationHours: z.number().min(0).default(0),
  durationMinutes: z.number().min(0).max(59).default(0),
  startDate: z.date(),
  endDate: z.date(),
  enrollmentDeadline: z.date().optional(),
  settings: z.object({
    allowLateSubmissions: z.boolean().default(true),
    requirePrerequisites: z.boolean().default(true),
    showProgress: z.boolean().default(true),
  }).default({
    allowLateSubmissions: true,
    requirePrerequisites: true,
    showProgress: true,
  }),
})

export const selectCourseSchema = createSelectSchema(courses)

// TypeScript types
export type Course = typeof courses.$inferSelect
export type NewCourse = typeof courses.$inferInsert 