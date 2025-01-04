'use server'

import payload from 'payload'

type CheckPrerequisitesParams = {
  userId: number
  achievementId: number
  tenantId: number
}

export async function checkPrerequisites({
  userId,
  achievementId,
  tenantId,
}: CheckPrerequisitesParams): Promise<boolean> {
  // Get user's completed achievements
  const { docs } = await payload.find({
    collection: 'points',
    where: {
      and: [{ student: { equals: userId } }, { type: { equals: 'achievement_unlock' } }],
    },
  })

  const unlockedAchievements = docs.map((doc) => doc.source?.achievement).filter(Boolean)
  return unlockedAchievements.length > 0
}
