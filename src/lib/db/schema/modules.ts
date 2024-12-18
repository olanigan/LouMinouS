import { pgTable, text, timestamp, uuid, integer, jsonb } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { courses } from './courses'

export const modules = pgTable('modules', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  courseId: uuid('course_id').references(() => courses.id).notNull(),
  order: integer('order').notNull().default(0),
  status: text('status', { 
    enum: ['draft', 'published', 'archived'] 
  }).notNull().default('draft'),
  
  // Duration
  durationHours: integer('duration_hours').notNull().default(0),
  durationMinutes: integer('duration_minutes').notNull().default(0),
  
  // Completion Criteria
  completionCriteria: jsonb('completion_criteria').$type<{
    type: 'all_lessons' | 'min_score' | 'custom'
    minimumScore?: number
    customRule?: string
  }>().notNull().default({
    type: 'all_lessons'
  }),
  
  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  publishedAt: timestamp('published_at'),
  archivedAt: timestamp('archived_at'),
  version: integer('version').notNull().default(1),
})

// Zod Schemas for validation
export const insertModuleSchema = createInsertSchema(modules, {
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  courseId: z.string().uuid(),
  order: z.number().min(0).default(0),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  durationHours: z.number().min(0).default(0),
  durationMinutes: z.number().min(0).max(59).default(0),
  completionCriteria: z.object({
    type: z.enum(['all_lessons', 'min_score', 'custom']),
    minimumScore: z.number().min(0).max(100).optional(),
    customRule: z.string().optional(),
  }).default({
    type: 'all_lessons'
  }),
})

export const selectModuleSchema = createSelectSchema(modules)

// TypeScript types
export type Module = typeof modules.$inferSelect
export type NewModule = typeof modules.$inferInsert 