import { db } from '../db'
import { notifications } from '../db/schema/notifications'
import { pusher } from '../pusher'

type NotificationData = {
  achievementId?: string
  badgeId?: string
  points?: number
  [key: string]: any
}

type CreateNotificationParams = {
  userId: string
  type: 'achievement_unlocked' | 'badge_awarded' | 'level_up' | 'points_awarded' | 'streak_milestone'
  data: NotificationData
}

export async function createNotification({
  userId,
  type,
  data,
}: CreateNotificationParams): Promise<void> {
  // Store notification in database
  const [notification] = await db.insert(notifications).values({
    userId,
    type,
    data,
    createdAt: new Date(),
    readAt: null,
  }).returning()

  // Send realtime notification
  await pusher.trigger(`user-${userId}`, 'notification', {
    id: notification.id,
    type,
    data,
    createdAt: notification.createdAt,
  })
} 