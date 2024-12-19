import { db } from '../db'
import { achievements } from '../db/schema/achievements'
import { userAchievements } from '../db/schema/userAchievements'
import { eq } from 'drizzle-orm'

type CheckPrerequisitesParams = {
  userId: string
  achievementId: string
  tenantId: string
}

export async function checkPrerequisites({
  userId,
  achievementId,
  tenantId,
}: CheckPrerequisitesParams): Promise<boolean> {
  // Get achievement with prerequisites
  const achievement = await db.query.achievements.findFirst({
    where: eq(achievements.id, achievementId),
    with: {
      prerequisites: true,
    },
  })

  if (!achievement || !achievement.prerequisites?.length) {
    // No prerequisites means automatically satisfied
    return true
  }

  // Get user's completed achievements
  const completed = await db.query.userAchievements.findMany({
    where: eq(userAchievements.userId, userId),
  })

  const completedIds = completed.map(c => c.achievementId)

  // Check if all prerequisites are completed
  return achievement.prerequisites.every(prereq => 
    completedIds.includes(prereq.id)
  )
} 