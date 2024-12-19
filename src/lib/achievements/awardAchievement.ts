import { db } from '../db'
import { userAchievements } from '../db/schema/userAchievements'
import { userBadges } from '../db/schema/userBadges'
import { points } from '../db/schema/points'
import { eq } from 'drizzle-orm'
import { createNotification } from '../notifications/createNotification'

type AwardAchievementParams = {
  achievementId: string
  userId: string
  tenantId: string
  points: number
  badgeId: string
}

export async function awardAchievement({
  achievementId,
  userId,
  tenantId,
  points: pointsToAward,
  badgeId,
}: AwardAchievementParams): Promise<void> {
  // Start a transaction
  await db.transaction(async (tx) => {
    // Record achievement completion
    await tx.insert(userAchievements).values({
      achievementId,
      userId,
      completedAt: new Date(),
    })

    // Award badge
    await tx.insert(userBadges).values({
      badgeId,
      userId,
      awardedAt: new Date(),
    })

    // Award points
    await tx.insert(points).values({
      studentId: userId,
      type: 'achievement_unlock',
      amount: pointsToAward,
      sourceType: 'achievements',
      sourceId: achievementId,
      createdAt: new Date(),
    })
  })

  // Send notification (outside transaction as it's not critical)
  await createNotification({
    userId,
    type: 'achievement_unlocked',
    data: {
      achievementId,
      badgeId,
      points: pointsToAward,
    },
  }).catch(console.error) // Non-blocking notification
} 