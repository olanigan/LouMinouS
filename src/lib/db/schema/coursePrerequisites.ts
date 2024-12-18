import { pgTable, uuid, primaryKey } from 'drizzle-orm/pg-core'
import { courses } from './courses'

export const coursePrerequisites = pgTable('course_prerequisites', {
  courseId: uuid('course_id').references(() => courses.id).notNull(),
  prerequisiteId: uuid('prerequisite_id').references(() => courses.id).notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.courseId, table.prerequisiteId] }),
}))

export type CoursePrerequisite = typeof coursePrerequisites.$inferSelect
export type NewCoursePrerequisite = typeof coursePrerequisites.$inferInsert 