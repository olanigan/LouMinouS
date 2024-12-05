# Phase 6: Notifications and Communications

## Summary
This phase implements the notification and communication systems using:
1. Payload hooks for real-time notifications
2. Server actions for notification management
3. Email service for external communications
4. WebSocket for real-time updates
5. Shadcn UI for notification components

**Key Components:**
- In-app notifications
- Email notifications
- Real-time updates
- Announcement system
- Communication preferences
- Template management

**Expected Outcome:**
A comprehensive communication system with:
- Real-time notifications
- Email integration
- Custom templates
- User preferences
- Role-based announcements

## 6.1 Notification Collections

### Configure Notifications Collection
Create `collections/Notifications.ts`:

```typescript
import { CollectionConfig } from 'payload/types'
import { isAdmin, isAdminOrInstructor } from '../access/roles'

export const Notifications: CollectionConfig = {
  slug: 'notifications',
  admin: {
    useAsTitle: 'subject',
    group: 'Communications',
    description: 'System notifications and alerts',
  },
  access: {
    read: ({ req: { user } }) => {
      if (isAdmin(user)) return true
      return {
        recipient: {
          equals: user?.id
        }
      }
    },
    create: ({ req: { user } }) => isAdminOrInstructor(user),
    update: ({ req: { user } }) => {
      if (isAdmin(user)) return true
      return {
        recipient: {
          equals: user?.id
        }
      }
    },
    delete: isAdmin,
  },
  fields: [
    {
      name: 'subject',
      type: 'text',
      required: true,
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Course Update', value: 'course_update' },
        { label: 'Assignment', value: 'assignment' },
        { label: 'Achievement', value: 'achievement' },
        { label: 'Announcement', value: 'announcement' },
        { label: 'System', value: 'system' },
        { label: 'Quiz', value: 'quiz' },
        { label: 'Discussion', value: 'discussion' },
      ],
    },
    {
      name: 'priority',
      type: 'select',
      defaultValue: 'medium',
      options: [
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' },
      ],
    },
    {
      name: 'recipient',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      hasMany: false,
    },
    {
      name: 'read',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'reference',
      type: 'group',
      fields: [
        {
          name: 'collection',
          type: 'text',
        },
        {
          name: 'id',
          type: 'text',
        },
      ],
    },
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: true,
      admin: {
        condition: (data) => !isAdmin(data.user),
      },
    },
  ],
  indexes: [
    {
      name: 'recipient_read',
      fields: ['recipient', 'read'],
    },
    {
      name: 'tenant_type',
      fields: ['tenant', 'type'],
    },
  ],
}
```

### Configure Email Templates Collection
Create `collections/EmailTemplates.ts`:

```typescript
import { CollectionConfig } from 'payload/types'
import { isAdmin } from '../access/roles'

export const EmailTemplates: CollectionConfig = {
  slug: 'email-templates',
  admin: {
    useAsTitle: 'name',
    group: 'Communications',
    description: 'Email template management',
  },
  access: {
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Course Update', value: 'course_update' },
        { label: 'Assignment', value: 'assignment' },
        { label: 'Achievement', value: 'achievement' },
        { label: 'Announcement', value: 'announcement' },
        { label: 'Welcome', value: 'welcome' },
        { label: 'Password Reset', value: 'password_reset' },
        { label: 'Quiz Results', value: 'quiz_results' },
      ],
    },
    {
      name: 'subject',
      type: 'text',
      required: true,
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
    },
    {
      name: 'variables',
      type: 'array',
      fields: [
        {
          name: 'key',
          type: 'text',
          required: true,
        },
        {
          name: 'description',
          type: 'text',
        },
      ],
    },
  ],
}
```

### Configure Announcements Collection
Create `collections/Announcements.ts`:

```typescript
import { CollectionConfig } from 'payload/types'
import { isAdmin, isAdminOrInstructor } from '../access/roles'

export const Announcements: CollectionConfig = {
  slug: 'announcements',
  admin: {
    useAsTitle: 'title',
    group: 'Communications',
    description: 'System-wide announcements',
  },
  access: {
    read: ({ req: { user } }) => {
      if (isAdmin(user)) return true
      if (isAdminOrInstructor(user)) {
        return {
          tenant: {
            equals: user?.tenant
          }
        }
      }
      return {
        status: {
          equals: 'published'
        }
      }
    },
    create: isAdminOrInstructor,
    update: isAdminOrInstructor,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'General', value: 'general' },
        { label: 'Course', value: 'course' },
        { label: 'System', value: 'system' },
        { label: 'Maintenance', value: 'maintenance' },
      ],
    },
    {
      name: 'priority',
      type: 'select',
      defaultValue: 'medium',
      options: [
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' },
      ],
    },
    {
      name: 'audience',
      type: 'group',
      fields: [
        {
          name: 'roles',
          type: 'select',
          hasMany: true,
          options: [
            { label: 'All Users', value: 'all' },
            { label: 'Students', value: 'student' },
            { label: 'Instructors', value: 'instructor' },
            { label: 'Admins', value: 'admin' },
          ],
        },
        {
          name: 'tenants',
          type: 'relationship',
          relationTo: 'tenants',
          hasMany: true,
          admin: {
            condition: (data) => !isAdmin(data.user),
          },
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Scheduled', value: 'scheduled' },
        { label: 'Archived', value: 'archived' },
      ],
    },
    {
      name: 'schedule',
      type: 'group',
      fields: [
        {
          name: 'publishAt',
          type: 'date',
          admin: {
            date: {
              pickerAppearance: 'dayAndTime',
            },
          },
        },
        {
          name: 'expireAt',
          type: 'date',
          admin: {
            date: {
              pickerAppearance: 'dayAndTime',
            },
          },
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (data.status === 'published' && !data.schedule.publishAt) {
          data.schedule.publishAt = new Date()
        }
        return data
      },
    ],
  },
}
```

## 6.2 Communication Services

### Create Email Service
Create `lib/services/email.ts`:

```typescript
import { createTransport } from 'nodemailer'
import { compile } from 'handlebars'
import { createPayloadClient } from '@/lib/payload'

const transporter = createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendEmail({
  to,
  templateType,
  variables,
}: {
  to: string
  templateType: string
  variables: Record<string, any>
}) {
  try {
    const payload = await createPayloadClient()
    
    // Get template
    const template = await payload.findOne({
      collection: 'email-templates',
      where: {
        type: {
          equals: templateType,
        },
      },
    })

    if (!template) {
      throw new Error(`Email template not found: ${templateType}`)
    }

    // Compile template
    const compiledSubject = compile(template.subject)
    const compiledContent = compile(template.content)

    // Send email
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject: compiledSubject(variables),
      html: compiledContent(variables),
    })

    return { success: true }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error: error.message }
  }
}
```

### Create WebSocket Service
Create `lib/services/realtime.ts`:

```typescript
import { EventEmitter } from 'events'
import { db } from '@/lib/db'
import { sql } from '@neondatabase/serverless'

const eventEmitter = new EventEmitter()

// Listen for database changes using Neon's logical replication
export async function setupRealtimeListener() {
  try {
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION notify_notification()
      RETURNS trigger AS $$
      BEGIN
        PERFORM pg_notify(
          'notifications',
          json_build_object(
            'operation', TG_OP,
            'record', row_to_json(NEW)
          )::text
        );
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS notify_notification_trigger ON notifications;
      
      CREATE TRIGGER notify_notification_trigger
      AFTER INSERT OR UPDATE
      ON notifications
      FOR EACH ROW
      EXECUTE FUNCTION notify_notification();
    `)

    // Listen for notifications
    const client = await db.connect()
    await client.query('LISTEN notifications')

    client.on('notification', (msg) => {
      const payload = JSON.parse(msg.payload)
      eventEmitter.emit(`notification:${payload.record.recipient}`, payload.record)
    })

    return () => {
      client.query('UNLISTEN notifications')
      client.release()
    }
  } catch (error) {
    console.error('Error setting up realtime listener:', error)
  }
}

// Server-side subscription
export function subscribeToNotifications(userId: string, callback: (notification: any) => void) {
  const handler = (notification: any) => callback(notification)
  eventEmitter.on(`notification:${userId}`, handler)
  return () => {
    eventEmitter.off(`notification:${userId}`, handler)
  }
}

// Client-side subscription using Server-Sent Events
export function createNotificationStream(userId: string) {
  return new EventSource(`/api/notifications/stream?userId=${userId}`)
}

// API route for SSE
// Create `app/api/notifications/stream/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { subscribeToNotifications } from '@/lib/services/realtime'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return new NextResponse('Missing userId', { status: 400 })
  }

  const stream = new TransformStream()
  const writer = stream.writable.getWriter()
  const encoder = new TextEncoder()

  // Subscribe to notifications
  const unsubscribe = subscribeToNotifications(userId, (notification) => {
    const data = `data: ${JSON.stringify(notification)}\n\n`
    writer.write(encoder.encode(data))
  })

  // Clean up on disconnect
  req.signal.addEventListener('abort', () => {
    unsubscribe()
    writer.close()
  })

  return new NextResponse(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
```

// Hook for client-side subscription
Create `hooks/useNotifications.ts`:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { createNotificationStream } from '@/lib/services/realtime'

export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<any[]>([])

  useEffect(() => {
    if (!userId) return

    const eventSource = createNotificationStream(userId)

    eventSource.onmessage = (event) => {
      const notification = JSON.parse(event.data)
      setNotifications((prev) => [notification, ...prev])
    }

    return () => {
      eventSource.close()
    }
  }, [userId])

  return notifications
}
```

## 6.3 Server Actions

### Create Notification Actions
Create `app/actions/notifications.ts`:

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { createPayloadClient } from '@/lib/payload'
import { sendEmail } from '@/lib/services/email'
import { db } from '@/lib/db'
import { sql } from '@neondatabase/serverless'

export async function createNotification({
  userId,
  type,
  subject,
  content,
  reference,
  priority = 'medium',
}: {
  userId: string
  type: string
  subject: string
  content: string
  reference?: { collection: string; id: string }
  priority?: 'low' | 'medium' | 'high'
}) {
  try {
    const payload = await createPayloadClient()

    // Create notification
    const notification = await payload.create({
      collection: 'notifications',
      data: {
        recipient: userId,
        type,
        subject,
        content,
        reference,
        priority,
      },
    })

    // Get user's notification preferences
    const user = await payload.findByID({
      collection: 'users',
      id: userId,
    })

    // Send email if enabled
    if (user.notificationPreferences?.email) {
      await sendEmail({
        to: user.email,
        templateType: type,
        variables: {
          subject,
          content,
          userName: user.name,
        },
      })
    }

    revalidatePath('/notifications')
    return { success: true }
  } catch (error) {
    console.error('Error creating notification:', error)
    return { success: false, error: error.message }
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    const payload = await createPayloadClient()
    
    await payload.update({
      collection: 'notifications',
      id: notificationId,
      data: {
        read: true,
      },
    })

    revalidatePath('/notifications')
    return { success: true }
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return { success: false, error: error.message }
  }
}

### Create Announcement Actions
Create `app/actions/announcements.ts`:

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { createPayloadClient } from '@/lib/payload'
import { createNotification } from './notifications'

export async function publishAnnouncement(announcementId: string) {
  try {
    const payload = await createPayloadClient()
    
    const announcement = await payload.update({
      collection: 'announcements',
      id: announcementId,
      data: {
        status: 'published',
        'schedule.publishAt': new Date(),
      },
    })

    // Create notifications for target audience
    const users = await payload.find({
      collection: 'users',
      where: {
        role: {
          in: announcement.audience.roles,
        },
      },
    })

    await Promise.all(
      users.docs.map((user) =>
        createNotification({
          userId: user.id,
          type: 'announcement',
          subject: announcement.title,
          content: announcement.content,
          reference: {
            collection: 'announcements',
            id: announcement.id,
          },
          priority: announcement.priority,
        })
      )
    )

    revalidatePath('/announcements')
    return { success: true }
  } catch (error) {
    console.error('Error publishing announcement:', error)
    return { success: false, error: error.message }
  }
}
```

## 6.4 User Interface

### Create Notifications Page
Create `app/(dashboard)/notifications/page.tsx`:

```typescript
import { Suspense } from 'react'
import { getCurrentUser } from '@/lib/session'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NotificationList } from '@/components/notifications/notification-list'
import { NotificationFilters } from '@/components/notifications/notification-filters'
import { LoadingSkeleton } from '@/components/ui/loading'

export default async function NotificationsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/')
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-8 text-3xl font-bold">Notifications</h1>

      <Card className="p-6">
        <Tabs defaultValue="all" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">Unread</TabsTrigger>
              <TabsTrigger value="announcements">Announcements</TabsTrigger>
            </TabsList>
            <NotificationFilters />
          </div>

          <TabsContent value="all">
            <Suspense fallback={<LoadingSkeleton />}>
              <NotificationList filter="all" />
            </Suspense>
          </TabsContent>

          <TabsContent value="unread">
            <Suspense fallback={<LoadingSkeleton />}>
              <NotificationList filter="unread" />
            </Suspense>
          </TabsContent>

          <TabsContent value="announcements">
            <Suspense fallback={<LoadingSkeleton />}>
              <NotificationList filter="announcements" />
            </Suspense>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}
```

### Create Notification Components
Create `components/notifications/notification-item.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { markNotificationAsRead } from '@/app/actions/notifications'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface NotificationItemProps {
  notification: any
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const [isRead, setIsRead] = useState(notification.read)

  async function handleMarkAsRead() {
    if (!isRead) {
      const result = await markNotificationAsRead(notification.id)
      if (result.success) {
        setIsRead(true)
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card
        className={cn(
          'p-4 transition-colors hover:bg-muted/50',
          !isRead && 'bg-muted/10'
        )}
        onClick={handleMarkAsRead}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="font-medium">{notification.subject}</p>
            <div className="mt-1 text-sm text-muted-foreground">
              {notification.content}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.createdAt), {
                addSuffix: true,
              })}
            </span>
            {!isRead && (
              <motion.div
                className="h-2 w-2 rounded-full bg-primary"
                layoutId="unread-indicator"
              />
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
```

## 6.5 Testing

### Notification Service Testing
Create `__tests__/services/notifications.test.ts`:

```typescript
import { createNotification, markNotificationAsRead } from '@/app/actions/notifications'
import { createPayloadClient } from '@/lib/payload'

jest.mock('@/lib/payload', () => ({
  createPayloadClient: jest.fn(),
}))

describe('Notification Service', () => {
  it('creates notification successfully', async () => {
    const mockPayload = {
      create: jest.fn().mockResolvedValue({ id: 'test-id' }),
      findByID: jest.fn().mockResolvedValue({
        email: 'test@example.com',
        notificationPreferences: { email: true },
      }),
    }
    ;(createPayloadClient as jest.Mock).mockResolvedValue(mockPayload)

    const result = await createNotification({
      userId: 'test-user',
      type: 'test',
      subject: 'Test',
      content: 'Test content',
    })

    expect(result.success).toBe(true)
  })

  it('marks notification as read', async () => {
    const mockPayload = {
      update: jest.fn().mockResolvedValue({ id: 'test-id', read: true }),
    }
    ;(createPayloadClient as jest.Mock).mockResolvedValue(mockPayload)

    const result = await markNotificationAsRead('test-id')
    expect(result.success).toBe(true)
  })
})
```

### Email Service Testing
Create `__tests__/services/email.test.ts`:

```typescript
import { sendEmail } from '@/lib/services/email'
import { createPayloadClient } from '@/lib/payload'

jest.mock('@/lib/payload', () => ({
  createPayloadClient: jest.fn(),
}))

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue(true),
  }),
}))

describe('Email Service', () => {
  it('sends email with template', async () => {
    const mockPayload = {
      findOne: jest.fn().mockResolvedValue({
        subject: 'Test {{name}}',
        content: 'Hello {{name}}',
      }),
    }
    ;(createPayloadClient as jest.Mock).mockResolvedValue(mockPayload)

    const result = await sendEmail({
      to: 'test@example.com',
      templateType: 'test',
      variables: { name: 'Test User' },
    })

    expect(result.success).toBe(true)
  })

  it('handles missing template', async () => {
    const mockPayload = {
      findOne: jest.fn().mockResolvedValue(null),
    }
    ;(createPayloadClient as jest.Mock).mockResolvedValue(mockPayload)

    const result = await sendEmail({
      to: 'test@example.com',
      templateType: 'missing',
      variables: {},
    })

    expect(result.success).toBe(false)
  })
})
```

### Realtime Service Testing
Create `__tests__/services/realtime.test.ts`:

```typescript
import { setupRealtimeListener, subscribeToNotifications } from '@/lib/services/realtime'
import { db } from '@/lib/db'

jest.mock('@/lib/db', () => ({
  execute: jest.fn(),
  connect: jest.fn(),
}))

describe('Realtime Service', () => {
  it('sets up database trigger and listener', async () => {
    const mockClient = {
      query: jest.fn(),
      on: jest.fn(),
      release: jest.fn(),
    }
    ;(db.connect as jest.Mock).mockResolvedValue(mockClient)

    const cleanup = await setupRealtimeListener()
    
    expect(db.execute).toHaveBeenCalled()
    expect(mockClient.query).toHaveBeenCalledWith('LISTEN notifications')
    
    cleanup()
    expect(mockClient.query).toHaveBeenCalledWith('UNLISTEN notifications')
    expect(mockClient.release).toHaveBeenCalled()
  })

  it('handles subscription callbacks', (done) => {
    const testNotification = { id: 'test', subject: 'Test' }
    
    subscribeToNotifications('test-user', (notification) => {
      expect(notification).toEqual(testNotification)
      done()
    })

    // Simulate notification
    process.nextTick(() => {
      const event = new Event('notification')
      event.payload = JSON.stringify({
        record: testNotification,
      })
      mockClient.emit('notification', event)
    })
  })
})
```

## Next Steps
- Implement push notifications using web push API
- Add SMS notifications using Twilio
- Create notification categories and filtering
- Implement notification batching and digests
- Add rich media support in notifications
- Create notification preferences UI
- Implement real-time notification counter
