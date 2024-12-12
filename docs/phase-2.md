# Phase 2: Learning Content Structure

## Summary
This phase implements the core learning content structure using:
1. Payload collections for content types
2. Rich text editor configuration
3. Media handling
4. Progress tracking

**Key Components:**
- Course management
- Content organization
- Quiz system
- Progress tracking

**Expected Outcome:**
A complete content structure with:
- Course hierarchy
- Content creation tools
- Assessment system
- Progress monitoring

## 2.1 Course Management

### Configure Courses Collection
Create `collections/Courses.ts`:

```typescript
import { CollectionConfig } from 'payload/types'
import { isAdmin, isAdminOrInstructor } from '../access/roles'

export const Courses: CollectionConfig = {
  slug: 'courses',
  admin: {
    useAsTitle: 'title',
    group: 'Learning',
    defaultColumns: ['title', 'instructor', 'status', 'updatedAt'],
  },
  versions: {
    drafts: true,
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
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'URL-friendly version of the title (e.g., "intro-to-programming")',
      },
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
        description: 'Make this course available to all tenants',
        condition: (data) => isAdmin(data.user),
      },
    },
    {
      name: 'instructor',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      filterOptions: {
        role: {
          equals: 'instructor',
        },
      },
    },
    {
      name: 'description',
      type: 'richText',
      required: true,
    },
    {
      name: 'thumbnail',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'modules',
      type: 'relationship',
      relationTo: 'modules',
      hasMany: true,
      admin: {
        description: 'Course modules in sequential order',
      },
    },
    {
      name: 'prerequisites',
      type: 'relationship',
      relationTo: 'courses',
      hasMany: true,
      filterOptions: {
        tenant: {
          equals: '{{user.tenant}}',
        },
      },
    },
    {
      name: 'duration',
      type: 'group',
      fields: [
        {
          name: 'hours',
          type: 'number',
          required: true,
          min: 0,
        },
        {
          name: 'minutes',
          type: 'number',
          required: true,
          min: 0,
          max: 59,
        },
      ],
    },
    {
      name: 'schedule',
      type: 'group',
      fields: [
        {
          name: 'startDate',
          type: 'date',
          required: true,
          admin: {
            date: {
              pickerAppearance: 'dayAndTime',
            },
          },
        },
        {
          name: 'endDate',
          type: 'date',
          required: true,
          admin: {
            date: {
              pickerAppearance: 'dayAndTime',
            },
          },
        },
        {
          name: 'enrollmentDeadline',
          type: 'date',
          admin: {
            date: {
              pickerAppearance: 'dayAndTime',
            },
          },
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
    },
    {
      name: 'settings',
      type: 'group',
      fields: [
        {
          name: 'allowLateSubmissions',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'requirePrerequisites',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'showProgress',
          type: 'checkbox',
          defaultValue: true,
        },
      ],
    },
  ],
  indexes: [
    {
      name: 'tenant_status',
      fields: ['tenant', 'status'],
    },
    {
      name: 'instructor_status',
      fields: ['instructor', 'status'],
    },
    {
      name: 'slug',
      fields: ['slug'],
      unique: true,
    },
  ],
}
```

### Configure Modules Collection
Create `collections/Modules.ts`:

```typescript
import { CollectionConfig } from 'payload/types'
import { isAdmin, isAdminOrInstructor } from '../access/roles'

export const Modules: CollectionConfig = {
  slug: 'modules',
  admin: {
    useAsTitle: 'title',
    group: 'Learning',
    defaultColumns: ['title', 'course', 'status'],
  },
  versions: {
    drafts: true,
  },
  access: {
    read: ({ req: { user } }) => {
      if (isAdmin(user)) return true
      return {
        'course.tenant': {
          equals: user?.tenant
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
      name: 'course',
      type: 'relationship',
      relationTo: 'courses',
      required: true,
    },
    {
      name: 'description',
      type: 'richText',
    },
    {
      name: 'order',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Order in which this module appears in the course',
      },
    },
    {
      name: 'lessons',
      type: 'relationship',
      relationTo: 'lessons',
      hasMany: true,
    },
    {
      name: 'duration',
      type: 'group',
      fields: [
        {
          name: 'hours',
          type: 'number',
          required: true,
          min: 0,
        },
        {
          name: 'minutes',
          type: 'number',
          required: true,
          min: 0,
          max: 59,
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
    },
    {
      name: 'completionCriteria',
      type: 'group',
      fields: [
        {
          name: 'type',
          type: 'select',
          required: true,
          options: [
            { label: 'All Lessons', value: 'all_lessons' },
            { label: 'Minimum Score', value: 'min_score' },
            { label: 'Custom', value: 'custom' },
          ],
        },
        {
          name: 'minimumScore',
          type: 'number',
          min: 0,
          max: 100,
          admin: {
            condition: (data, siblingData) => siblingData?.type === 'min_score',
          },
        },
        {
          name: 'customRule',
          type: 'textarea',
          admin: {
            condition: (data, siblingData) => siblingData?.type === 'custom',
          },
        },
      ],
    },
  ],
  indexes: [
    {
      name: 'course_order',
      fields: ['course', 'order'],
    },
    {
      name: 'course_status',
      fields: ['course', 'status'],
    },
  ],
}
```

### Configure Lessons Collection
Create `collections/Lessons.ts`:

```typescript
import { CollectionConfig } from 'payload/types'
import { isAdmin, isAdminOrInstructor } from '../access/roles'

export const Lessons: CollectionConfig = {
  slug: 'lessons',
  admin: {
    useAsTitle: 'title',
    group: 'Learning',
    defaultColumns: ['title', 'module', 'type', 'status'],
  },
  versions: {
    drafts: true,
  },
  access: {
    read: ({ req: { user } }) => {
      if (isAdmin(user)) return true
      return {
        'module.course.tenant': {
          equals: user?.tenant
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
      name: 'module',
      type: 'relationship',
      relationTo: 'modules',
      required: true,
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Video', value: 'video' },
        { label: 'Reading', value: 'reading' },
        { label: 'Quiz', value: 'quiz' },
        { label: 'Assignment', value: 'assignment' },
        { label: 'Discussion', value: 'discussion' },
      ],
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
      admin: {
        condition: (data) => data.type === 'reading',
      },
    },
    {
      name: 'video',
      type: 'group',
      admin: {
        condition: (data) => data.type === 'video',
      },
      fields: [
        {
          name: 'url',
          type: 'text',
          required: true,
        },
        {
          name: 'duration',
          type: 'number',
          required: true,
          min: 0,
        },
        {
          name: 'transcript',
          type: 'textarea',
        },
      ],
    },
    {
      name: 'quiz',
      type: 'group',
      admin: {
        condition: (data) => data.type === 'quiz',
      },
      fields: [
        {
          name: 'questions',
          type: 'array',
          required: true,
          fields: [
            {
              name: 'question',
              type: 'text',
              required: true,
            },
            {
              name: 'type',
              type: 'select',
              required: true,
              options: [
                { label: 'Multiple Choice', value: 'multiple' },
                { label: 'True/False', value: 'boolean' },
                { label: 'Short Answer', value: 'text' },
              ],
            },
            {
              name: 'options',
              type: 'array',
              required: true,
              admin: {
                condition: (data, siblingData) => siblingData?.type === 'multiple',
              },
              fields: [
                {
                  name: 'text',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'correct',
                  type: 'checkbox',
                  required: true,
                },
              ],
            },
            {
              name: 'answer',
              type: 'text',
              required: true,
              admin: {
                condition: (data, siblingData) => 
                  siblingData?.type === 'boolean' || siblingData?.type === 'text',
              },
            },
            {
              name: 'points',
              type: 'number',
              required: true,
              min: 0,
            },
          ],
        },
        {
          name: 'settings',
          type: 'group',
          fields: [
            {
              name: 'timeLimit',
              type: 'number',
              min: 0,
            },
            {
              name: 'attempts',
              type: 'number',
              min: 1,
              defaultValue: 1,
            },
            {
              name: 'passingScore',
              type: 'number',
              min: 0,
              max: 100,
              required: true,
            },
          ],
        },
      ],
    },
    {
      name: 'assignment',
      type: 'group',
      admin: {
        condition: (data) => data.type === 'assignment',
      },
      fields: [
        {
          name: 'instructions',
          type: 'richText',
          required: true,
        },
        {
          name: 'dueDate',
          type: 'date',
          required: true,
          admin: {
            date: {
              pickerAppearance: 'dayAndTime',
            },
          },
        },
        {
          name: 'points',
          type: 'number',
          required: true,
          min: 0,
        },
        {
          name: 'rubric',
          type: 'array',
          fields: [
            {
              name: 'criterion',
              type: 'text',
              required: true,
            },
            {
              name: 'points',
              type: 'number',
              required: true,
              min: 0,
            },
            {
              name: 'description',
              type: 'textarea',
            },
          ],
        },
      ],
    },
    {
      name: 'discussion',
      type: 'group',
      admin: {
        condition: (data) => data.type === 'discussion',
      },
      fields: [
        {
          name: 'prompt',
          type: 'richText',
          required: true,
        },
        {
          name: 'guidelines',
          type: 'array',
          fields: [
            {
              name: 'text',
              type: 'text',
              required: true,
            },
          ],
        },
        {
          name: 'settings',
          type: 'group',
          fields: [
            {
              name: 'requireResponse',
              type: 'checkbox',
              defaultValue: true,
            },
            {
              name: 'minimumWords',
              type: 'number',
              min: 0,
            },
            {
              name: 'dueDate',
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
    },
    {
      name: 'order',
      type: 'number',
      required: true,
      min: 0,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
    },
  ],
  indexes: [
    {
      name: 'module_order',
      fields: ['module', 'order'],
    },
    {
      name: 'module_status',
      fields: ['module', 'status'],
    },
    {
      name: 'module_type',
      fields: ['module', 'type'],
    },
  ],
}
```

### Configure Progress Collection
Create `collections/Progress.ts`:

```typescript
import { CollectionConfig } from 'payload/types'
import { isAdmin } from '../access/roles'

export const Progress: CollectionConfig = {
  slug: 'progress',
  admin: {
    useAsTitle: 'id',
    group: 'Learning',
    defaultColumns: ['student', 'course', 'status', 'updatedAt'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (isAdmin(user)) return true
      if (user?.role === 'instructor') {
        return {
          'course.tenant': {
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
    update: ({ req: { user } }) => {
      if (isAdmin(user)) return true
      if (user?.role === 'instructor') {
        return {
          'course.tenant': {
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
      name: 'course',
      type: 'relationship',
      relationTo: 'courses',
      required: true,
    },
    {
      name: 'completedLessons',
      type: 'relationship',
      relationTo: 'lessons',
      hasMany: true,
    },
    {
      name: 'quizAttempts',
      type: 'array',
      fields: [
        {
          name: 'lesson',
          type: 'relationship',
          relationTo: 'lessons',
          required: true,
        },
        {
          name: 'score',
          type: 'number',
          required: true,
          min: 0,
          max: 100,
        },
        {
          name: 'answers',
          type: 'json',
        },
        {
          name: 'completedAt',
          type: 'date',
          required: true,
        },
      ],
    },
    {
      name: 'assignments',
      type: 'array',
      fields: [
        {
          name: 'lesson',
          type: 'relationship',
          relationTo: 'lessons',
          required: true,
        },
        {
          name: 'submission',
          type: 'json',
          required: true,
        },
        {
          name: 'grade',
          type: 'number',
          min: 0,
          max: 100,
        },
        {
          name: 'feedback',
          type: 'richText',
        },
        {
          name: 'submittedAt',
          type: 'date',
          required: true,
        },
        {
          name: 'gradedAt',
          type: 'date',
        },
      ],
    },
    {
      name: 'discussions',
      type: 'array',
      fields: [
        {
          name: 'lesson',
          type: 'relationship',
          relationTo: 'lessons',
          required: true,
        },
        {
          name: 'post',
          type: 'richText',
          required: true,
        },
        {
          name: 'replies',
          type: 'array',
          fields: [
            {
              name: 'author',
              type: 'relationship',
              relationTo: 'users',
              required: true,
            },
            {
              name: 'content',
              type: 'richText',
              required: true,
            },
            {
              name: 'postedAt',
              type: 'date',
              required: true,
            },
          ],
        },
        {
          name: 'postedAt',
          type: 'date',
          required: true,
        },
      ],
    },
    {
      name: 'overallProgress',
      type: 'number',
      required: true,
      min: 0,
      max: 100,
      defaultValue: 0,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'in_progress',
      options: [
        { label: 'Not Started', value: 'not_started' },
        { label: 'In Progress', value: 'in_progress' },
        { label: 'Completed', value: 'completed' },
      ],
    },
    {
      name: 'startedAt',
      type: 'date',
      required: true,
    },
    {
      name: 'completedAt',
      type: 'date',
    },
    {
      name: 'lastAccessed',
      type: 'date',
      required: true,
    },
  ],
  indexes: [
    {
      name: 'student_course',
      fields: ['student', 'course'],
      unique: true,
    },
    {
      name: 'course_status',
      fields: ['course', 'status'],
    },
    {
      name: 'student_status',
      fields: ['student', 'status'],
    },
  ],
}
```

## 2.2 Rich Text Editor Configuration

### Configure Editor
Create `lib/payload/editor.ts`:

```typescript
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { BlocksFeature } from '@payloadcms/richtext-lexical'

export const editorConfig = lexicalEditor({
  features: ({ defaultFeatures }) => [
    ...defaultFeatures,
    BlocksFeature({
      blocks: [
        {
          slug: 'callout',
          fields: [
            {
              name: 'type',
              type: 'select',
              required: true,
              options: [
                { label: 'Info', value: 'info' },
                { label: 'Warning', value: 'warning' },
                { label: 'Success', value: 'success' },
                { label: 'Error', value: 'error' },
              ],
            },
            {
              name: 'content',
              type: 'richText',
            },
          ],
        },
        {
          slug: 'code',
          fields: [
            {
              name: 'language',
              type: 'select',
              required: true,
              options: [
                { label: 'JavaScript', value: 'javascript' },
                { label: 'TypeScript', value: 'typescript' },
                { label: 'Python', value: 'python' },
                { label: 'HTML', value: 'html' },
                { label: 'CSS', value: 'css' },
                { label: 'SQL', value: 'sql' },
              ],
            },
            {
              name: 'code',
              type: 'textarea',
              required: true,
            },
          ],
        },
      ],
    }),
  ],
  admin: {
    // Default elements - can be modified as needed
    elements: [
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'blockquote',
      'ul',
      'ol',
      'link',
      'relationship',
      'upload',
    ],
    // Default leaves/formatting options
    leaves: [
      'bold',
      'italic',
      'underline',
      'strikethrough',
      'code',
    ],
    upload: {
      collections: {
        media: {
          fields: [
            {
              name: 'caption',
              type: 'text',
            },
            {
              name: 'alignment',
              type: 'select',
              options: [
                { label: 'Left', value: 'left' },
                { label: 'Center', value: 'center' },
                { label: 'Right', value: 'right' },
              ],
            },
          ],
        },
      },
    },
  },
})
```

The Lexical editor provides several advantages over Slate:
- More intuitive custom element creation
- Built-in "/" command menu
- Popup formatting toolbar
- Drag and drop support
- Ability to reuse Payload blocks within rich text
- Better developer experience
- More stable and maintained by Meta

To use this editor configuration, update your `payload.config.ts` to include:

```typescript
import { buildConfig } from 'payload/config'
import { editorConfig } from './lib/payload/editor'

export default buildConfig({
  editor: editorConfig,
  // ... rest of your config
})
```

## Next Steps
- Implement gamification system
- Set up user interfaces
- Configure analytics tracking
- Set up notification system

