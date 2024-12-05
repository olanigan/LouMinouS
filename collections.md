```typescript
// collections/Tenants.ts
import { CollectionConfig } from 'payload/types'

export const Tenants: CollectionConfig = {
  slug: 'tenants',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'contactEmail',
      type: 'email',
      required: true,
    },
    {
      name: 'subscriptionStatus',
      type: 'select',
      options: ['active', 'suspended', 'cancelled'],
    },
    {
      name: 'domain',
      type: 'text',
      unique: true,
    },
    {
      name: 'users',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
    },
    {
      name: 'courses',
      type: 'relationship',
      relationTo: 'courses',
      hasMany: true,
    },
    {
      name: 'settings',
      type: 'relationship',
      relationTo: 'tenant-settings',
      hasMany: false,
    },
  ],
}

// collections/Users.ts
export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
    },
    {
      name: 'role',
      type: 'select',
      options: ['admin', 'instructor', 'student'],
    },
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: true,
    },
    {
      name: 'lastActive',
      type: 'date',
    },
  ],
}

// collections/Courses.ts
export const Courses: CollectionConfig = {
  slug: 'courses',
  admin: {
    useAsTitle: 'title',
    group: 'Learning Content',
  },
  access: {
    read: ({ req: { user } }) => {
      if (user?.role === 'admin') return true;
      return {
        tenant: {
          equals: user?.tenant
        }
      };
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'instructor',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      options: ['published', 'draft', 'archived'],
    },
    {
      name: 'modules',
      type: 'relationship',
      relationTo: 'modules',
      hasMany: true,
    },
    {
      name: 'startDate',
      type: 'date',
    },
    {
      name: 'endDate',
      type: 'date',
    },
    {
      name: 'announcements',
      type: 'relationship',
      relationTo: 'announcements',
      hasMany: true,
    },
    {
      name: 'assignments',
      type: 'relationship',
      relationTo: 'assignments',
      hasMany: true,
    },
    {
      name: 'certificates',
      type: 'relationship',
      relationTo: 'certificates',
      hasMany: true,
    },
  ],
}

// collections/Modules.ts
export const Modules: CollectionConfig = {
  slug: 'modules',
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'course',
      type: 'relationship',
      relationTo: 'courses',
      required: true,
    },
    {
      name: 'order',
      type: 'number',
    },
    {
      name: 'lessons',
      type: 'relationship',
      relationTo: 'lessons',
      hasMany: true,
    },
  ],
}

// collections/Lessons.ts
export const Lessons: CollectionConfig = {
  slug: 'lessons',
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'module',
      type: 'relationship',
      relationTo: 'modules',
      required: true,
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
    },
    {
      name: 'media',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
    },
    {
      name: 'order',
      type: 'number',
    },
  ],
  hooks: {
    beforeChange: [
      // Add content validation
    ],
    afterChange: [
      // Update progress tracking
    ],
  },
}

// collections/Quizzes.ts
export const Quizzes: CollectionConfig = {
  slug: 'quizzes',
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'lesson',
      type: 'relationship',
      relationTo: 'lessons',
      required: true,
    },
    {
      name: 'questions',
      type: 'array',
      fields: [
        {
          name: 'question',
          type: 'text',
          required: true,
        },
        {
          name: 'options',
          type: 'array',
          fields: [
            {
              name: 'text',
              type: 'text',
            },
            {
              name: 'isCorrect',
              type: 'checkbox',
            },
          ],
        },
      ],
    },
    {
      name: 'attemptsAllowed',
      type: 'number',
    },
    {
      name: 'timeLimit',
      type: 'number',
      label: 'Time Limit (minutes)',
    },
  ],
}

// collections/Badges.ts
export const Badges: CollectionConfig = {
  slug: 'badges',
  admin: {
    useAsTitle: 'name',
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
    },
    {
      name: 'icon',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'requiredPoints',
      type: 'number',
    },
    {
      name: 'criteria',
      type: 'group',
      fields: [
        {
          name: 'type',
          type: 'select',
          options: ['course_completion', 'streak', 'points_threshold', 'quiz_score'],
        },
        {
          name: 'threshold',
          type: 'number',
        },
      ],
    },
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: true,
    },
    {
      name: 'levelRequired',
      type: 'number',
      min: 0,
    },
    {
      name: 'pointValues',
      type: 'group',
      fields: [
        {
          name: 'lessonCompletion',
          type: 'number',
          defaultValue: 10,
        },
        {
          name: 'quizCompletion',
          type: 'number',
          defaultValue: 20,
        },
        {
          name: 'perfectQuizScore',
          type: 'number',
          defaultValue: 50,
        },
        {
          name: 'streakBonus',
          type: 'number',
          defaultValue: 5,
        },
      ],
    },
  ],
}

// collections/Achievements.ts
export const Achievements: CollectionConfig = {
  slug: 'achievements',
  admin: {
    useAsTitle: 'user',
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'badge',
      type: 'relationship',
      relationTo: 'badges',
      required: true,
    },
    {
      name: 'dateEarned',
      type: 'date',
      required: true,
    },
    {
      name: 'progress',
      type: 'number',
      min: 0,
      max: 100,
    },
  ],
}

// collections/Leaderboard.ts
export const Leaderboard: CollectionConfig = {
  slug: 'leaderboard',
  admin: {
    useAsTitle: 'id',
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: true,
    },
    {
      name: 'points',
      type: 'number',
      required: true,
    },
    {
      name: 'level',
      type: 'number',
      required: true,
    },
    {
      name: 'currentStreak',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'longestStreak',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'lastActivityDate',
      type: 'date',
    },
    {
      name: 'timeframe',
      type: 'select',
      options: ['weekly', 'monthly', 'all-time'],
      required: true,
    },
  ],
  indexes: [
    {
      fields: ['tenant', 'points'],
    },
  ],
}

// Update Progress collection to include gamification elements
export const Progress: CollectionConfig = {
  slug: 'progress',
  admin: {
    useAsTitle: 'id',
  },
  fields: [
    {
      name: 'student',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'lesson',
      type: 'relationship',
      relationTo: 'lessons',
      required: true,
    },
    {
      name: 'completed',
      type: 'checkbox',
    },
    {
      name: 'points',
      type: 'number',
    },
    {
      name: 'quizScores',
      type: 'array',
      fields: [
        {
          name: 'quiz',
          type: 'relationship',
          relationTo: 'quizzes',
        },
        {
          name: 'score',
          type: 'number',
        },
        {
          name: 'attemptDate',
          type: 'date',
        },
        {
          name: 'pointsEarned',
          type: 'number',
        },
      ],
    },
    {
      name: 'streakData',
      type: 'group',
      fields: [
        {
          name: 'lastActivityDate',
          type: 'date',
        },
        {
          name: 'currentStreak',
          type: 'number',
          defaultValue: 0,
        },
        {
          name: 'longestStreak',
          type: 'number',
          defaultValue: 0,
        },
      ],
    },
    {
      name: 'level',
      type: 'number',
      defaultValue: 1,
    },
    {
      name: 'totalPoints',
      type: 'number',
      defaultValue: 0,
    },
  ],
  hooks: {
    beforeChange: [
      // Add points calculation
      // Update streak data
      // Check for level progression
    ],
    afterChange: [
      // Check and award badges
      // Update leaderboard
    ],
  },
}

// collections/SupportTickets.ts
export const SupportTickets: CollectionConfig = {
  slug: 'support-tickets',
  admin: {
    useAsTitle: 'id',
  },
  fields: [
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: true,
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      options: ['open', 'in-progress', 'resolved'],
    },
    {
      name: 'priority',
      type: 'select',
      options: ['low', 'medium', 'high'],
    },
  ],
}

// collections/TenantSettings.ts
export const TenantSettings: CollectionConfig = {
  slug: 'tenant-settings',
  admin: {
    useAsTitle: 'tenant',
  },
  fields: [
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: true,
    },
    {
      name: 'branding',
      type: 'group',
      fields: [
        {
          name: 'primaryColor',
          type: 'text',
        },
        {
          name: 'secondaryColor',
          type: 'text',
        },
      ],
    },
    {
      name: 'featureToggles',
      type: 'group',
      fields: [
        {
          name: 'gamification',
          type: 'checkbox',
        },
        {
          name: 'adaptiveLearning',
          type: 'checkbox',
        },
      ],
    },
    {
      name: 'notificationPreferences',
      type: 'group',
      fields: [
        {
          name: 'email',
          type: 'checkbox',
        },
        {
          name: 'sms',
          type: 'checkbox',
        },
      ],
    },
  ],
}

// collections/StudentSettings.ts
export const StudentSettings: CollectionConfig = {
  slug: 'student-settings',
  admin: {
    useAsTitle: 'user',
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'notificationPreferences',
      type: 'group',
      fields: [
        {
          name: 'email',
          type: 'checkbox',
        },
        {
          name: 'sms',
          type: 'checkbox',
        },
      ],
    },
    {
      name: 'accessibility',
      type: 'group',
      fields: [
        {
          name: 'textSize',
          type: 'select',
          options: ['small', 'medium', 'large'],
        },
        {
          name: 'highContrast',
          type: 'checkbox',
        },
      ],
    },
    {
      name: 'language',
      type: 'select',
      options: ['en', 'es', 'fr'],
    },
  ],
}

// collections/Assignments.ts
export const Assignments: CollectionConfig = {
  slug: 'assignments',
  admin: {
    useAsTitle: 'title',
    group: 'Learning Content',
  },
  access: {
    read: ({ req: { user } }) => {
      if (user?.role === 'admin') return true;
      return {
        'course.tenant': {
          equals: user?.tenant
        }
      };
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'richText',
    },
    {
      name: 'course',
      type: 'relationship',
      relationTo: 'courses',
      required: true,
    },
    {
      name: 'lesson',
      type: 'relationship',
      relationTo: 'lessons',
    },
    {
      name: 'dueDate',
      type: 'date',
    },
    {
      name: 'maxScore',
      type: 'number',
    },
    {
      name: 'submissions',
      type: 'relationship',
      relationTo: 'submissions',
      hasMany: true,
    },
  ],
}

// collections/Submissions.ts
export const Submissions: CollectionConfig = {
  slug: 'submissions',
  admin: {
    useAsTitle: 'id',
    group: 'Learning Content',
  },
  access: {
    read: ({ req: { user } }) => {
      if (user?.role === 'admin') return true;
      if (user?.role === 'instructor') {
        return {
          'assignment.course.tenant': {
            equals: user?.tenant
          }
        };
      }
      return {
        student: {
          equals: user?.id
        }
      };
    },
  },
  fields: [
    {
      name: 'student',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'assignment',
      type: 'relationship',
      relationTo: 'assignments',
      required: true,
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
    },
    {
      name: 'files',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
    },
    {
      name: 'submissionDate',
      type: 'date',
      required: true,
    },
    {
      name: 'score',
      type: 'number',
    },
    {
      name: 'feedback',
      type: 'richText',
    },
  ],
}

// collections/Announcements.ts
export const Announcements: CollectionConfig = {
  slug: 'announcements',
  admin: {
    useAsTitle: 'title',
    group: 'Learning Content',
  },
  access: {
    read: ({ req: { user } }) => {
      if (user?.role === 'admin') return true;
      return {
        'course.tenant': {
          equals: user?.tenant
        }
      };
    },
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
      name: 'course',
      type: 'relationship',
      relationTo: 'courses',
      required: true,
    },
    {
      name: 'dateCreated',
      type: 'date',
      required: true,
    },
    {
      name: 'notifyUsers',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
    },
  ],
}

// collections/Certificates.ts
export const Certificates: CollectionConfig = {
  slug: 'certificates',
  admin: {
    useAsTitle: 'id',
    group: 'Learning Content',
  },
  access: {
    read: ({ req: { user } }) => {
      if (user?.role === 'admin') return true;
      return {
        'course.tenant': {
          equals: user?.tenant
        }
      };
    },
  },
  fields: [
    {
      name: 'course',
      type: 'relationship',
      relationTo: 'courses',
      required: true,
    },
    {
      name: 'student',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'issueDate',
      type: 'date',
      required: true,
    },
    {
      name: 'certificateUrl',
      type: 'text',
      required: true,
    },
    {
      name: 'template',
      type: 'relationship',
      relationTo: 'media',
    },
  ],
}
