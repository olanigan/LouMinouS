import payload from 'payload'
import type { Progress, Streak } from '../../payload-types'

type GetProgressParams = {
  userId: string
  achievementType: string
  metric: 'count' | 'score' | 'duration' | 'custom'
  timeframe?: 'all_time' | 'daily' | 'weekly' | 'monthly'
}

type QuizAttempt = {
  lesson?: number | { id: number } | null
  score: number
  completedAt: string
  id?: string | null
}

type Discussion = {
  lesson?: number | { id: number } | null
  participatedAt: string
  id?: string | null
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
  timeframeFilter: Date,
): Promise<number> {
  const { docs, totalDocs } = await payload.find({
    collection: 'progress',
    where: {
      and: [
        { student: { equals: userId } },
        { completedAt: { greater_than: timeframeFilter.toISOString() } },
      ],
    },
  })

  switch (metric) {
    case 'count':
      return totalDocs || 0

    case 'score':
      const scores = docs.map((doc: Progress) => doc.overallProgress || 0)
      return scores.length ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : 0

    default:
      throw new Error(`Unsupported metric for course progress: ${metric}`)
  }
}

async function getQuizProgress(
  userId: string,
  metric: string,
  timeframeFilter: Date,
): Promise<number> {
  const { docs } = await payload.find({
    collection: 'progress',
    where: {
      student: { equals: userId },
    },
  })

  const quizAttempts = docs
    .flatMap((doc: Progress) => doc.quizAttempts || [])
    .filter((attempt: QuizAttempt) => new Date(attempt.completedAt) > timeframeFilter)

  switch (metric) {
    case 'count':
      return quizAttempts.length

    case 'score':
      return quizAttempts.length
        ? quizAttempts.reduce((sum: number, attempt: QuizAttempt) => sum + attempt.score, 0) /
            quizAttempts.length
        : 0

    default:
      throw new Error(`Unsupported metric for quiz progress: ${metric}`)
  }
}

async function getAssignmentProgress(
  userId: string,
  metric: string,
  timeframeFilter: Date,
): Promise<number> {
  const { docs, totalDocs } = await payload.find({
    collection: 'progress',
    where: {
      and: [
        { student: { equals: userId } },
        { completedAt: { greater_than: timeframeFilter.toISOString() } },
      ],
    },
  })

  switch (metric) {
    case 'count':
      return totalDocs || 0

    case 'score':
      const scores = docs.map((doc: Progress) => doc.overallProgress || 0)
      return scores.length ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : 0

    default:
      throw new Error(`Unsupported metric for assignment progress: ${metric}`)
  }
}

async function getStreakProgress(userId: string, metric: string): Promise<number> {
  const { docs } = await payload.find({
    collection: 'streaks',
    where: {
      student: { equals: userId },
    },
    limit: 1,
  })
  const streak = docs[0]

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
  timeframeFilter: Date,
): Promise<number> {
  const { docs } = await payload.find({
    collection: 'progress',
    where: {
      student: { equals: userId },
    },
    limit: 1,
  })
  const progress = docs[0]

  const discussions = progress?.discussions || []
  const filteredDiscussions = discussions.filter(
    (d: Discussion) => new Date(d.participatedAt) > timeframeFilter,
  )

  switch (metric) {
    case 'count':
      return filteredDiscussions.length
    default:
      throw new Error(`Unsupported metric for discussion progress: ${metric}`)
  }
}
