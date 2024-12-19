import { db } from '../db'
import { courseProgress } from '../db/schema/courseProgress'
import { quizAttempts } from '../db/schema/quizAttempts'
import { assignments } from '../db/schema/assignments'
import { streaks } from '../db/schema/streaks'
import { discussions } from '../db/schema/discussions'
import { eq, and, gte } from 'drizzle-orm'
import { sql } from 'drizzle-orm'

type GetProgressParams = {
  userId: string
  achievementType: string
  metric: 'count' | 'score' | 'duration' | 'custom'
  timeframe?: 'all_time' | 'daily' | 'weekly' | 'monthly'
}

export async function getProgress({
  userId,
  achievementType,
  metric,
  timeframe = 'all_time',
}: GetProgressParams): Promise<number> {
  const timeframeFilter = getTimeframeFilter(timeframe)

  switch (achievementType) {
    case 'course_progress':
      return await getCourseProgress(userId, metric, timeframeFilter)
    case 'quiz_score':
      return await getQuizProgress(userId, metric, timeframeFilter)
    case 'assignment':
      return await getAssignmentProgress(userId, metric, timeframeFilter)
    case 'streak':
      return await getStreakProgress(userId, metric)
    case 'discussion':
      return await getDiscussionProgress(userId, metric, timeframeFilter)
    case 'custom':
      throw new Error('Custom achievement progress must be handled separately')
    default:
      throw new Error(`Unknown achievement type: ${achievementType}`)
  }
}

function getTimeframeFilter(timeframe: string): Date {
  const now = new Date()
  switch (timeframe) {
    case 'daily':
      return new Date(now.setHours(0, 0, 0, 0))
    case 'weekly':
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - now.getDay())
      startOfWeek.setHours(0, 0, 0, 0)
      return startOfWeek
    case 'monthly':
      return new Date(now.getFullYear(), now.getMonth(), 1)
    default:
      return new Date(0) // Beginning of time for 'all_time'
  }
}

async function getCourseProgress(
  userId: string,
  metric: string,
  timeframeFilter: Date
): Promise<number> {
  switch (metric) {
    case 'count':
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(courseProgress)
        .where(
          and(
            eq(courseProgress.userId, userId),
            gte(courseProgress.completedAt, timeframeFilter)
          )
        )
      return result[0]?.count || 0

    case 'score':
      const avgResult = await db
        .select({
          average: sql<number>`avg(score)`,
        })
        .from(courseProgress)
        .where(
          and(
            eq(courseProgress.userId, userId),
            gte(courseProgress.completedAt, timeframeFilter)
          )
        )
      return avgResult[0]?.average || 0

    default:
      throw new Error(`Unsupported metric for course progress: ${metric}`)
  }
}

async function getQuizProgress(
  userId: string,
  metric: string,
  timeframeFilter: Date
): Promise<number> {
  switch (metric) {
    case 'count':
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(quizAttempts)
        .where(
          and(
            eq(quizAttempts.userId, userId),
            gte(quizAttempts.completedAt, timeframeFilter)
          )
        )
      return result[0]?.count || 0

    case 'score':
      const avgResult = await db
        .select({
          average: sql<number>`avg(score)`,
        })
        .from(quizAttempts)
        .where(
          and(
            eq(quizAttempts.userId, userId),
            gte(quizAttempts.completedAt, timeframeFilter)
          )
        )
      return avgResult[0]?.average || 0

    default:
      throw new Error(`Unsupported metric for quiz progress: ${metric}`)
  }
}

async function getAssignmentProgress(
  userId: string,
  metric: string,
  timeframeFilter: Date
): Promise<number> {
  switch (metric) {
    case 'count':
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(assignments)
        .where(
          and(
            eq(assignments.userId, userId),
            gte(assignments.submittedAt, timeframeFilter)
          )
        )
      return result[0]?.count || 0

    case 'score':
      const avgResult = await db
        .select({
          average: sql<number>`avg(score)`,
        })
        .from(assignments)
        .where(
          and(
            eq(assignments.userId, userId),
            gte(assignments.submittedAt, timeframeFilter)
          )
        )
      return avgResult[0]?.average || 0

    default:
      throw new Error(`Unsupported metric for assignment progress: ${metric}`)
  }
}

async function getStreakProgress(
  userId: string,
  metric: string
): Promise<number> {
  const streak = await db.query.streaks.findFirst({
    where: eq(streaks.userId, userId),
  })

  switch (metric) {
    case 'count':
      return streak?.currentStreak || 0
    case 'duration':
      return streak?.longestStreak || 0
    default:
      throw new Error(`Unsupported metric for streak progress: ${metric}`)
  }
}

async function getDiscussionProgress(
  userId: string,
  metric: string,
  timeframeFilter: Date
): Promise<number> {
  switch (metric) {
    case 'count':
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(discussions)
        .where(
          and(
            eq(discussions.userId, userId),
            gte(discussions.createdAt, timeframeFilter)
          )
        )
      return result[0]?.count || 0

    default:
      throw new Error(`Unsupported metric for discussion progress: ${metric}`)
  }
} 