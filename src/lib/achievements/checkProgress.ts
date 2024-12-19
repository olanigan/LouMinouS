import { db } from '../db'
import { achievements } from '../db/schema/achievements'
import { userProgress } from '../db/schema/userProgress'
import { eq } from 'drizzle-orm'

type CheckProgressParams = {
  userId: string
  achievementId: string
  tenantId: string
}

export async function checkProgress({
  userId,
  achievementId,
  tenantId,
}: CheckProgressParams): Promise<boolean> {
  // Get achievement criteria
  const achievement = await db.query.achievements.findFirst({
    where: eq(achievements.id, achievementId),
  })

  if (!achievement) {
    throw new Error('Achievement not found')
  }

  // Get user's progress
  const progress = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
  })

  if (!progress) {
    return false
  }

  // Check criteria based on type
  switch (achievement.type) {
    case 'course_progress':
      return progress.overallProgress >= achievement.threshold
    case 'quiz_score':
      return progress.averageQuizScore >= achievement.threshold
    case 'streak':
      return progress.currentStreak >= achievement.threshold
    case 'custom':
      // Custom criteria would be handled here
      return false
    default:
      return false
  }
} 