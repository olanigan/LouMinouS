'use server'

import { pusher } from '../pusher'

type NotificationData = {
  achievementId?: string
  badgeId?: string
  points?: number
  [key: string]: any
}

type CreateNotificationParams = {
  userId: string
  type:
    | 'achievement_unlocked'
    | 'badge_awarded'
    | 'level_up'
    | 'points_awarded'
    | 'streak_milestone'
  data: NotificationData
}

export async function createNotification({
  userId,
  type,
  data,
}: CreateNotificationParams): Promise<void> {
  // Send realtime notification
  await pusher.trigger(`user-${userId}`, 'notification', {
    type,
    data,
    createdAt: new Date().toISOString(),
  })
}
