import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { BlocksFeature } from '@payloadcms/richtext-lexical'

// Basic editor config for nested rich text fields
export const basicEditor = lexicalEditor({})

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
              editor: basicEditor,
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
}) 