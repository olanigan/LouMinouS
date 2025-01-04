'use server'

import payload from 'payload'

type CheckProgressParams = {
  userId: number
  achievementId: number
  tenantId: number
}

export async function checkProgress({
  userId,
  achievementId,
  tenantId,
}: CheckProgressParams): Promise<boolean> {
  // Get achievement criteria
  const achievement = await payload.findByID({
    collection: 'achievements',
    id: achievementId,
  })

  if (!achievement) {
    throw new Error('Achievement not found')
  }

  // Get user's progress
  const {
    docs: [userProgress],
  } = await payload.find({
    collection: 'progress',
    where: {
      student: { equals: userId },
    },
    limit: 1,
  })

  if (!userProgress) {
    return false
  }

  // Check criteria based on type
  switch (achievement.type) {
    case 'course_progress':
      return userProgress.overallProgress >= achievement.criteria.threshold
    case 'quiz_score': {
      const quizScores = userProgress.quizAttempts?.map((attempt) => attempt.score) || []
      const averageScore =
        quizScores.length > 0
          ? quizScores.reduce((a: number, b: number) => a + b, 0) / quizScores.length
          : 0
      return averageScore >= achievement.criteria.threshold
    }
    case 'streak': {
      const {
        docs: [userStreak],
      } = await payload.find({
        collection: 'streaks',
        where: {
          student: { equals: userId },
        },
        limit: 1,
      })
      return (userStreak?.currentStreak || 0) >= achievement.criteria.threshold
    }
    case 'custom':
      // Custom criteria would be handled here
      return false
    default:
      return false
  }
}
