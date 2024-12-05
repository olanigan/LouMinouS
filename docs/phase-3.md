# Phase 3: Gamification System

## Summary
This phase implements the gamification system using:
1. Points and levels
2. Achievements and badges
3. Leaderboards
4. Streaks and rewards

**Key Components:**
- Achievement tracking
- Point calculation
- Leaderboard system
- Reward distribution

**Expected Outcome:**
A complete gamification system with:
- Automated point tracking
- Achievement unlocking
- Real-time leaderboards
- Engagement rewards

## 3.1 Points and Levels

### Configure Points Collection
Create `collections/Points.ts`:

```typescript
import { CollectionConfig } from 'payload/types'
import { isAdmin } from '../access/roles'

export const Points: CollectionConfig = {
  slug: 'points',
  admin: {
    useAsTitle: 'id',
    group: 'Gamification',
    defaultColumns: ['student', 'type', 'amount', 'createdAt'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (isAdmin(user)) return true
      if (user?.role === 'instructor') {
        return {
          'student.tenant': {
            equals: user?.tenant
          }
        }
      }
      return {
        student: {
          equals: user?.id
        }
      }
    },
    create: () => false, // Only created by system
    update: () => false,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'student',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Lesson Completion', value: 'lesson_complete' },
        { label: 'Quiz Score', value: 'quiz_score' },
        { label: 'Assignment Submit', value: 'assignment_submit' },
        { label: 'Discussion Post', value: 'discussion_post' },
        { label: 'Streak Bonus', value: 'streak_bonus' },
        { label: 'Achievement Unlock', value: 'achievement_unlock' },
      ],
    },
    {
      name: 'amount',
      type: 'number',
      required: true,
      min: 0,
    },
    {
      name: 'source',
      type: 'relationship',
      relationTo: ['lessons', 'achievements', 'streaks'],
      required: true,
    },
    {
      name: 'metadata',
      type: 'json',
      admin: {
        description: 'Additional context about the points earned',
      },
    },
  ],
  indexes: [
    {
      name: 'student_type',
      fields: ['student', 'type'],
    },
    {
      name: 'student_date',
      fields: ['student', 'createdAt'],
    },
  ],
}
```

### Configure Levels Collection
Create `collections/Levels.ts`:

```typescript
import { CollectionConfig } from 'payload/types'
import { isAdmin } from '../access/roles'

export const Levels: CollectionConfig = {
  slug: 'levels',
  admin: {
    useAsTitle: 'name',
    group: 'Gamification',
  },
  access: {
    read: () => true,
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
      name: 'level',
      type: 'number',
      required: true,
      min: 1,
      unique: true,
    },
    {
      name: 'pointsRequired',
      type: 'number',
      required: true,
      min: 0,
    },
    {
      name: 'icon',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'rewards',
      type: 'array',
      fields: [
        {
          name: 'type',
          type: 'select',
          required: true,
          options: [
            { label: 'Badge', value: 'badge' },
            { label: 'Feature Unlock', value: 'feature' },
            { label: 'Custom', value: 'custom' },
          ],
        },
        {
          name: 'reward',
          type: 'relationship',
          relationTo: 'badges',
          admin: {
            condition: (data, siblingData) => siblingData?.type === 'badge',
          },
        },
        {
          name: 'feature',
          type: 'text',
          admin: {
            condition: (data, siblingData) => siblingData?.type === 'feature',
          },
        },
        {
          name: 'customData',
          type: 'json',
          admin: {
            condition: (data, siblingData) => siblingData?.type === 'custom',
          },
        },
      ],
    },
  ],
  indexes: [
    {
      name: 'level',
      fields: ['level'],
      unique: true,
    },
  ],
}
```

## 3.2 Achievements and Badges

### Configure Achievements Collection
Create `collections/Achievements.ts`:

```typescript
import { CollectionConfig } from 'payload/types'
import { isAdmin } from '../access/roles'

export const Achievements: CollectionConfig = {
  slug: 'achievements',
  admin: {
    useAsTitle: 'name',
    group: 'Gamification',
  },
  access: {
    read: () => true,
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
      name: 'description',
      type: 'textarea',
      required: true,
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Course Progress', value: 'course_progress' },
        { label: 'Quiz Score', value: 'quiz_score' },
        { label: 'Assignment', value: 'assignment' },
        { label: 'Streak', value: 'streak' },
        { label: 'Discussion', value: 'discussion' },
        { label: 'Custom', value: 'custom' },
      ],
    },
    {
      name: 'criteria',
      type: 'group',
      fields: [
        {
          name: 'metric',
          type: 'select',
          required: true,
          options: [
            { label: 'Count', value: 'count' },
            { label: 'Score', value: 'score' },
            { label: 'Duration', value: 'duration' },
            { label: 'Custom', value: 'custom' },
          ],
        },
        {
          name: 'threshold',
          type: 'number',
          required: true,
          min: 0,
        },
        {
          name: 'timeframe',
          type: 'select',
          options: [
            { label: 'All Time', value: 'all_time' },
            { label: 'Daily', value: 'daily' },
            { label: 'Weekly', value: 'weekly' },
            { label: 'Monthly', value: 'monthly' },
          ],
          defaultValue: 'all_time',
        },
        {
          name: 'customRule',
          type: 'code',
          admin: {
            language: 'typescript',
            description: 'Custom achievement criteria logic',
            condition: (data, siblingData) => siblingData?.metric === 'custom',
          },
        },
      ],
    },
    {
      name: 'badge',
      type: 'relationship',
      relationTo: 'badges',
      required: true,
    },
    {
      name: 'points',
      type: 'number',
      required: true,
      min: 0,
    },
    {
      name: 'secret',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Hide this achievement until unlocked',
      },
    },
  ],
}
```

### Configure Badges Collection
Create `collections/Badges.ts`:

```typescript
import { CollectionConfig } from 'payload/types'
import { isAdmin } from '../access/roles'

export const Badges: CollectionConfig = {
  slug: 'badges',
  admin: {
    useAsTitle: 'name',
    group: 'Gamification',
  },
  access: {
    read: () => true,
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
      name: 'description',
      type: 'textarea',
      required: true,
    },
    {
      name: 'icon',
      type: 'upload',
      relationTo: 'media',
      required: true,
      filterOptions: {
        mimeType: {
          contains: 'image',
        },
      },
    },
    {
      name: 'rarity',
      type: 'select',
      required: true,
      options: [
        { label: 'Common', value: 'common' },
        { label: 'Uncommon', value: 'uncommon' },
        { label: 'Rare', value: 'rare' },
        { label: 'Epic', value: 'epic' },
        { label: 'Legendary', value: 'legendary' },
      ],
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Progress', value: 'progress' },
        { label: 'Performance', value: 'performance' },
        { label: 'Engagement', value: 'engagement' },
        { label: 'Special', value: 'special' },
      ],
    },
  ],
}
```

## 3.3 Leaderboards

### Configure Leaderboards Collection
Create `collections/Leaderboards.ts`:

```typescript
import { CollectionConfig } from 'payload/types'
import { isAdmin } from '../access/roles'

export const Leaderboards: CollectionConfig = {
  slug: 'leaderboards',
  admin: {
    useAsTitle: 'name',
    group: 'Gamification',
  },
  access: {
    read: ({ req: { user } }) => {
      if (isAdmin(user)) return true
      return {
        tenant: {
          equals: user?.tenant
        }
      }
    },
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
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: true,
      admin: {
        condition: (data) => !data.isGlobal,
      },
    },
    {
      name: 'isGlobal',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Make this leaderboard available to all tenants',
      },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Points', value: 'points' },
        { label: 'Course Progress', value: 'progress' },
        { label: 'Achievements', value: 'achievements' },
        { label: 'Custom', value: 'custom' },
      ],
    },
    {
      name: 'timeframe',
      type: 'select',
      required: true,
      options: [
        { label: 'All Time', value: 'all_time' },
        { label: 'Daily', value: 'daily' },
        { label: 'Weekly', value: 'weekly' },
        { label: 'Monthly', value: 'monthly' },
      ],
    },
    {
      name: 'scope',
      type: 'group',
      fields: [
        {
          name: 'course',
          type: 'relationship',
          relationTo: 'courses',
          admin: {
            condition: (data, siblingData) => siblingData?.type === 'progress',
          },
        },
        {
          name: 'pointType',
          type: 'select',
          options: [
            { label: 'All Points', value: 'all' },
            { label: 'Lesson Points', value: 'lesson' },
            { label: 'Quiz Points', value: 'quiz' },
            { label: 'Assignment Points', value: 'assignment' },
          ],
          admin: {
            condition: (data, siblingData) => siblingData?.type === 'points',
          },
        },
        {
          name: 'achievementType',
          type: 'select',
          options: [
            { label: 'All Achievements', value: 'all' },
            { label: 'Course Achievements', value: 'course' },
            { label: 'Quiz Achievements', value: 'quiz' },
            { label: 'Streak Achievements', value: 'streak' },
          ],
          admin: {
            condition: (data, siblingData) => siblingData?.type === 'achievements',
          },
        },
      ],
    },
    {
      name: 'customLogic',
      type: 'code',
      admin: {
        language: 'typescript',
        description: 'Custom ranking logic',
        condition: (data) => data.type === 'custom',
      },
    },
    {
      name: 'displayLimit',
      type: 'number',
      required: true,
      min: 1,
      max: 100,
      defaultValue: 10,
    },
    {
      name: 'refreshInterval',
      type: 'number',
      required: true,
      min: 60, // 1 minute
      defaultValue: 300, // 5 minutes
      admin: {
        description: 'Refresh interval in seconds',
      },
    },
  ],
  indexes: [
    {
      name: 'tenant_type',
      fields: ['tenant', 'type'],
    },
    {
      name: 'type_timeframe',
      fields: ['type', 'timeframe'],
    },
  ],
}
```

## 3.4 Streaks

### Configure Streaks Collection
Create `collections/Streaks.ts`:

```typescript
import { CollectionConfig } from 'payload/types'
import { isAdmin } from '../access/roles'

export const Streaks: CollectionConfig = {
  slug: 'streaks',
  admin: {
    useAsTitle: 'id',
    group: 'Gamification',
  },
  access: {
    read: ({ req: { user } }) => {
      if (isAdmin(user)) return true
      if (user?.role === 'instructor') {
        return {
          'student.tenant': {
            equals: user?.tenant
          }
        }
      }
      return {
        student: {
          equals: user?.id
        }
      }
    },
    create: () => false, // Only created by system
    update: () => false,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'student',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Daily Login', value: 'login' },
        { label: 'Course Progress', value: 'progress' },
        { label: 'Quiz Completion', value: 'quiz' },
        { label: 'Assignment Submission', value: 'assignment' },
      ],
    },
    {
      name: 'currentStreak',
      type: 'number',
      required: true,
      min: 0,
      defaultValue: 0,
    },
    {
      name: 'longestStreak',
      type: 'number',
      required: true,
      min: 0,
      defaultValue: 0,
    },
    {
      name: 'lastActivity',
      type: 'date',
      required: true,
    },
    {
      name: 'nextRequired',
      type: 'date',
      required: true,
    },
    {
      name: 'history',
      type: 'array',
      fields: [
        {
          name: 'date',
          type: 'date',
          required: true,
        },
        {
          name: 'activity',
          type: 'relationship',
          relationTo: ['courses', 'lessons', 'quizzes'],
          required: true,
        },
        {
          name: 'points',
          type: 'number',
          required: true,
          min: 0,
        },
      ],
    },
  ],
  indexes: [
    {
      name: 'student_type',
      fields: ['student', 'type'],
      unique: true,
    },
    {
      name: 'student_lastActivity',
      fields: ['student', 'lastActivity'],
    },
  ],
}
```

## 3.5 Database Optimizations

### Create Materialized Views
Create `migrations/3_create_gamification_views.sql`:

```sql
-- Points summary view
CREATE MATERIALIZED VIEW points_summary AS
SELECT 
  student_id,
  type,
  SUM(amount) as total_points,
  COUNT(*) as total_activities,
  MAX(created_at) as last_activity
FROM points
GROUP BY student_id, type;

-- Achievement progress view
CREATE MATERIALIZED VIEW achievement_progress AS
SELECT 
  u.id as user_id,
  a.id as achievement_id,
  a.type,
  a.criteria->>'metric' as metric,
  a.criteria->>'threshold' as threshold,
  CASE 
    WHEN p.total_points >= (a.criteria->>'threshold')::int THEN true 
    ELSE false 
  END as completed
FROM users u
CROSS JOIN achievements a
LEFT JOIN points_summary p ON p.student_id = u.id;

-- Leaderboard cache view
CREATE MATERIALIZED VIEW leaderboard_cache AS
SELECT 
  l.id as leaderboard_id,
  u.id as user_id,
  u.name,
  COALESCE(p.total_points, 0) as points,
  COALESCE(a.completed_count, 0) as achievements,
  ROW_NUMBER() OVER (
    PARTITION BY l.id 
    ORDER BY 
      CASE l.type 
        WHEN 'points' THEN p.total_points 
        WHEN 'achievements' THEN a.completed_count
      END DESC
  ) as rank
FROM leaderboards l
CROSS JOIN users u
LEFT JOIN points_summary p ON p.student_id = u.id
LEFT JOIN (
  SELECT user_id, COUNT(*) as completed_count
  FROM achievement_progress
  WHERE completed = true
  GROUP BY user_id
) a ON a.user_id = u.id;

-- Create indexes
CREATE UNIQUE INDEX idx_points_summary_student_type 
ON points_summary(student_id, type);

CREATE UNIQUE INDEX idx_achievement_progress_user_achievement 
ON achievement_progress(user_id, achievement_id);

CREATE UNIQUE INDEX idx_leaderboard_cache_board_user 
ON leaderboard_cache(leaderboard_id, user_id);

-- Create refresh function
CREATE OR REPLACE FUNCTION refresh_gamification_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY points_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY achievement_progress;
  REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_cache;
END;
$$ LANGUAGE plpgsql;

-- Schedule refresh
SELECT cron.schedule(
  'refresh-gamification-views',
  '*/5 * * * *', -- Every 5 minutes
  'SELECT refresh_gamification_views()'
);
```

## Next Steps
- Set up user interfaces
- Implement notifications
- Configure analytics
- Set up admin dashboards
