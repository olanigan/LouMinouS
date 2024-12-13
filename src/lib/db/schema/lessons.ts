import { pgTable, text, timestamp, uuid, integer, jsonb, boolean } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { modules } from './modules'

// Type definitions for lesson content
type VideoContent = {
  url: string
  duration: number
  transcript?: string
}

type QuizQuestion = {
  question: string
  type: 'multiple' | 'boolean' | 'text'
  options?: { text: string; correct: boolean }[]
  answer?: string
  points: number
  explanation?: string
}

type QuizSettings = {
  timeLimit?: number
  attempts: number
  passingScore: number
  randomizeQuestions: boolean
  showCorrectAnswers: 'never' | 'after_each' | 'after_submit' | 'after_all'
}

type AssignmentRubric = {
  criterion: string
  points: number
  description?: string
}

type DiscussionSettings = {
  requireResponse: boolean
  requireReplies: number
  minimumWords?: number
  dueDate?: string
}

export const lessons = pgTable('lessons', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  moduleId: uuid('module_id').references(() => modules.id).notNull(),
  order: integer('order').notNull().default(0),
  type: text('type', {
    enum: ['video', 'reading', 'quiz', 'assignment', 'discussion']
  }).notNull(),
  description: text('description'),
  status: text('status', { 
    enum: ['draft', 'published', 'archived'] 
  }).notNull().default('draft'),

  // Content fields for different types
  content: text('content'), // For reading type
  videoContent: jsonb('video_content').$type<VideoContent>(), // For video type
  quizContent: jsonb('quiz_content').$type<{
    questions: QuizQuestion[]
    settings: QuizSettings
  }>(), // For quiz type
  assignmentContent: jsonb('assignment_content').$type<{
    instructions: string
    dueDate: string
    points: number
    rubric: AssignmentRubric[]
    allowedFileTypes: string[]
  }>(), // For assignment type
  discussionContent: jsonb('discussion_content').$type<{
    prompt: string
    guidelines: string[]
    settings: DiscussionSettings
  }>(), // For discussion type

  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  publishedAt: timestamp('published_at'),
  archivedAt: timestamp('archived_at'),
  version: integer('version').notNull().default(1),
})

// Zod schema for content validation
const videoContentSchema = z.object({
  url: z.string().url(),
  duration: z.number().min(0),
  transcript: z.string().optional(),
})

const quizQuestionSchema = z.object({
  question: z.string(),
  type: z.enum(['multiple', 'boolean', 'text']),
  options: z.array(z.object({
    text: z.string(),
    correct: z.boolean(),
  })).optional(),
  answer: z.string().optional(),
  points: z.number().min(0),
  explanation: z.string().optional(),
})

const quizSettingsSchema = z.object({
  timeLimit: z.number().min(0).optional(),
  attempts: z.number().min(1),
  passingScore: z.number().min(0).max(100),
  randomizeQuestions: z.boolean(),
  showCorrectAnswers: z.enum(['never', 'after_each', 'after_submit', 'after_all']),
})

const assignmentRubricSchema = z.object({
  criterion: z.string(),
  points: z.number().min(0),
  description: z.string().optional(),
})

const discussionSettingsSchema = z.object({
  requireResponse: z.boolean(),
  requireReplies: z.number().min(0),
  minimumWords: z.number().min(0).optional(),
  dueDate: z.string().optional(),
})

// Main insert schema
export const insertLessonSchema = createInsertSchema(lessons, {
  title: z.string().min(1).max(200),
  moduleId: z.string().uuid(),
  order: z.number().min(0).default(0),
  type: z.enum(['video', 'reading', 'quiz', 'assignment', 'discussion']),
  description: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  content: z.string().optional(),
  videoContent: videoContentSchema.optional(),
  quizContent: z.object({
    questions: z.array(quizQuestionSchema),
    settings: quizSettingsSchema,
  }).optional(),
  assignmentContent: z.object({
    instructions: z.string(),
    dueDate: z.string(),
    points: z.number().min(0),
    rubric: z.array(assignmentRubricSchema),
    allowedFileTypes: z.array(z.string()),
  }).optional(),
  discussionContent: z.object({
    prompt: z.string(),
    guidelines: z.array(z.string()),
    settings: discussionSettingsSchema,
  }).optional(),
})

export const selectLessonSchema = createSelectSchema(lessons)

// TypeScript types
export type Lesson = typeof lessons.$inferSelect
export type NewLesson = typeof lessons.$inferInsert 