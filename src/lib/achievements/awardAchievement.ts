'use server'

import payload from 'payload'
import { createNotification } from '../notifications/createNotification'

type AwardAchievementParams = {
  achievementId: number
  userId: number
  tenantId: number
  points: number
  badgeId: number
}

export async function awardAchievement({
  achievementId,
  userId,
  tenantId,
  points: pointsToAward,
  badgeId,
}: AwardAchievementParams): Promise<void> {
  // Award points
  await payload.create({
    collection: 'points',
    data: {
      student: userId,
      type: 'achievement_unlock',
      amount: pointsToAward,
      source: {
        type: 'achievements',
        achievement: achievementId,
      },
      metadata: {
        badgeId,
      },
    },
  })

  // Send notification (non-blocking)
  await createNotification({
    userId: userId.toString(),
    type: 'achievement_unlocked',
    data: {
      achievementId: achievementId.toString(),
      badgeId: badgeId.toString(),
      points: pointsToAward,
    },
  }).catch(console.error)
}
