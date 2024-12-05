# Phase 5: Analytics and Reporting

## Summary
This phase implements the analytics and reporting system using:
1. Payload hooks for data tracking
2. Server actions for data aggregation
3. Shadcn UI for visualization
4. Framer Motion for chart animations

**Key Components:**
- User engagement tracking
- Course completion analytics
- Performance metrics
- Custom reports
- Data visualization

**Expected Outcome:**
A comprehensive analytics system with:
- Real-time tracking
- Interactive dashboards
- Custom report generation
- Data export capabilities
- Role-based analytics

## 5.1 Analytics Collections

### Configure Analytics Collection
Create `collections/Analytics.ts`:

```typescript
import { CollectionConfig } from 'payload/types'
import { isAdmin, isAdminOrInstructor } from '../access/roles'

export const Analytics: CollectionConfig = {
  slug: 'analytics',
  admin: {
    useAsTitle: 'id',
    group: 'Analytics',
    description: 'System-wide analytics data',
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
      return false
    },
    create: () => false, // Only created by system
    update: () => false,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Page View', value: 'page_view' },
        { label: 'Course Progress', value: 'course_progress' },
        { label: 'Quiz Attempt', value: 'quiz_attempt' },
        { label: 'Assignment Submit', value: 'assignment_submit' },
        { label: 'User Login', value: 'user_login' },
        { label: 'Search Query', value: 'search_query' },
      ],
    },
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
      name: 'metadata',
      type: 'json',
      required: true,
    },
    {
      name: 'courseMetrics',
      type: 'group',
      admin: {
        condition: (data) => data.type === 'course_progress',
      },
      fields: [
        {
          name: 'course',
          type: 'relationship',
          relationTo: 'courses',
          required: true,
        },
        {
          name: 'completionRate',
          type: 'number',
          min: 0,
          max: 100,
          required: true,
        },
        {
          name: 'averageScore',
          type: 'number',
          min: 0,
          max: 100,
          required: true,
        },
        {
          name: 'timeSpent',
          type: 'number',
          required: true,
          min: 0,
        },
      ],
    },
    {
      name: 'timestamp',
      type: 'date',
      required: true,
      defaultValue: () => new Date(),
    },
  ],
  indexes: [
    {
      name: 'tenant_type_timestamp',
      fields: ['tenant', 'type', 'timestamp'],
    },
    {
      name: 'user_type_timestamp',
      fields: ['user', 'type', 'timestamp'],
    },
    {
      name: 'course_metrics',
      fields: ['courseMetrics.course', 'timestamp'],
    },
  ],
}
```

### Configure Reports Collection
Create `collections/Reports.ts`:

```typescript
import { CollectionConfig } from 'payload/types'
import { isAdmin, isAdminOrInstructor } from '../access/roles'

export const Reports: CollectionConfig = {
  slug: 'reports',
  admin: {
    useAsTitle: 'name',
    group: 'Analytics',
    description: 'Custom generated reports',
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
      return false
    },
    create: isAdminOrInstructor,
    update: isAdminOrInstructor,
    delete: isAdminOrInstructor,
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
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'User Progress', value: 'user_progress' },
        { label: 'Course Performance', value: 'course_performance' },
        { label: 'Quiz Analysis', value: 'quiz_analysis' },
        { label: 'Engagement Metrics', value: 'engagement_metrics' },
        { label: 'Custom', value: 'custom' },
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
    {
      name: 'filters',
      type: 'group',
      fields: [
        {
          name: 'dateRange',
          type: 'group',
          fields: [
            {
              name: 'start',
              type: 'date',
              required: true,
            },
            {
              name: 'end',
              type: 'date',
              required: true,
            },
          ],
        },
        {
          name: 'courses',
          type: 'relationship',
          relationTo: 'courses',
          hasMany: true,
        },
        {
          name: 'metrics',
          type: 'select',
          hasMany: true,
          options: [
            { label: 'Completion Rate', value: 'completion_rate' },
            { label: 'Average Score', value: 'average_score' },
            { label: 'Time Spent', value: 'time_spent' },
            { label: 'Active Users', value: 'active_users' },
            { label: 'Quiz Performance', value: 'quiz_performance' },
          ],
        },
      ],
    },
    {
      name: 'exportFormat',
      type: 'select',
      required: true,
      defaultValue: 'pdf',
      options: [
        { label: 'PDF', value: 'pdf' },
        { label: 'Excel', value: 'excel' },
        { label: 'CSV', value: 'csv' },
      ],
    },
    {
      name: 'schedule',
      type: 'group',
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'frequency',
          type: 'select',
          options: [
            { label: 'Daily', value: 'daily' },
            { label: 'Weekly', value: 'weekly' },
            { label: 'Monthly', value: 'monthly' },
          ],
          admin: {
            condition: (data, siblingData) => siblingData?.enabled,
          },
        },
        {
          name: 'recipients',
          type: 'array',
          fields: [
            {
              name: 'email',
              type: 'email',
              required: true,
            },
          ],
          admin: {
            condition: (data, siblingData) => siblingData?.enabled,
          },
        },
      ],
    },
    {
      name: 'lastGenerated',
      type: 'date',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'data',
      type: 'json',
      admin: {
        readOnly: true,
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ req, data }) => {
        if (req.user?.role !== 'admin') {
          data.tenant = req.user?.tenant
        }
        return data
      },
    ],
  },
}
```

## 5.2 Analytics Hooks

### Create Analytics Tracking Hook
Create `hooks/useAnalytics.ts`:

```typescript
'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { trackEvent } from '@/lib/analytics'

export function useAnalytics() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const track = async () => {
      await trackEvent('page_view', {
        path: pathname,
        query: Object.fromEntries(searchParams.entries()),
        timestamp: new Date().toISOString(),
      })
    }

    track()
  }, [pathname, searchParams])
}
```

### Create Analytics Server Actions
Create `app/actions/analytics.ts`:

```typescript
'use server'

import { createPayloadClient } from '@/lib/payload'
import { revalidatePath } from 'next/cache'
import { generatePDF, generateExcel, generateCSV } from '@/lib/services/exports'

export async function generateReport(reportId: string) {
  try {
    const payload = await createPayloadClient()
    const report = await payload.findByID({
      collection: 'reports',
      id: reportId,
    })

    if (!report) throw new Error('Report not found')

    const data = await generateReportData(report)
    
    // Generate export file
    let exportFile
    switch (report.exportFormat) {
      case 'pdf':
        exportFile = await generatePDF(data)
        break
      case 'excel':
        exportFile = await generateExcel(data)
        break
      case 'csv':
        exportFile = await generateCSV(data)
        break
    }

    await payload.update({
      collection: 'reports',
      id: reportId,
      data: {
        lastGenerated: new Date(),
        data,
      },
    })

    // Handle scheduled reports
    if (report.schedule?.enabled) {
      await sendScheduledReport(report, exportFile)
    }

    revalidatePath('/analytics')
    return { success: true, data, file: exportFile }
  } catch (error) {
    return { error: 'Failed to generate report' }
  }
}

async function generateReportData(report: any) {
  const payload = await createPayloadClient()
  const { type, filters } = report

  switch (type) {
    case 'user_progress':
      return await generateUserProgressReport(payload, filters)
    case 'course_performance':
      return await generateCoursePerformanceReport(payload, filters)
    case 'quiz_analysis':
      return await generateQuizAnalysisReport(payload, filters)
    case 'engagement_metrics':
      return await generateEngagementReport(payload, filters)
    default:
      throw new Error('Invalid report type')
  }
}
```

## 5.3 Analytics Dashboard

### Create Analytics Overview Page
Create `app/(dashboard)/analytics/page.tsx`:

```typescript
import { Suspense } from 'react'
import { getCurrentUser } from '@/lib/session'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { OverviewMetrics } from '@/components/analytics/overview-metrics'
import { UserEngagement } from '@/components/analytics/user-engagement'
import { CoursePerformance } from '@/components/analytics/course-performance'
import { QuizAnalytics } from '@/components/analytics/quiz-analytics'
import { LoadingSkeleton } from '@/components/ui/loading'

export default async function AnalyticsPage() {
  const user = await getCurrentUser()

  if (!user || !['admin', 'instructor'].includes(user.role)) {
    redirect('/')
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-8 text-3xl font-bold">Analytics Dashboard</h1>

      <Tabs defaultValue="overview" className="space-y-8">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="engagement">User Engagement</TabsTrigger>
          <TabsTrigger value="courses">Course Performance</TabsTrigger>
          <TabsTrigger value="quizzes">Quiz Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Suspense fallback={<LoadingSkeleton />}>
              <OverviewMetrics />
            </Suspense>
          </div>
        </TabsContent>

        <TabsContent value="engagement">
          <Card className="p-6">
            <Suspense fallback={<LoadingSkeleton />}>
              <UserEngagement />
            </Suspense>
          </Card>
        </TabsContent>

        <TabsContent value="courses">
          <Card className="p-6">
            <Suspense fallback={<LoadingSkeleton />}>
              <CoursePerformance />
            </Suspense>
          </Card>
        </TabsContent>

        <TabsContent value="quizzes">
          <Card className="p-6">
            <Suspense fallback={<LoadingSkeleton />}>
              <QuizAnalytics />
            </Suspense>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

### Create Report Generation Page
Create `app/(dashboard)/analytics/reports/page.tsx`:

```typescript
import { Suspense } from 'react'
import { getCurrentUser } from '@/lib/session'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ReportsList } from '@/components/analytics/reports-list'
import { CreateReportDialog } from '@/components/analytics/create-report-dialog'
import { LoadingSkeleton } from '@/components/ui/loading'

export default async function ReportsPage() {
  const user = await getCurrentUser()

  if (!user || !['admin', 'instructor'].includes(user.role)) {
    redirect('/')
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Custom Reports</h1>
        <CreateReportDialog />
      </div>

      <Card className="p-6">
        <Suspense fallback={<LoadingSkeleton />}>
          <ReportsList />
        </Suspense>
      </Card>
    </div>
  )
}
```

## 5.4 Testing

### Analytics Hook Testing
Create `__tests__/hooks/useAnalytics.test.ts`:

```typescript
import { renderHook } from '@testing-library/react'
import { useAnalytics } from '@/hooks/useAnalytics'
import { trackEvent } from '@/lib/analytics'

jest.mock('@/lib/analytics', () => ({
  trackEvent: jest.fn(),
}))

describe('useAnalytics', () => {
  it('tracks page view on mount', () => {
    renderHook(() => useAnalytics())
    expect(trackEvent).toHaveBeenCalledWith('page_view', expect.any(Object))
  })

  it('tracks page view on pathname change', () => {
    const { rerender } = renderHook(() => useAnalytics())
    rerender()
    expect(trackEvent).toHaveBeenCalledTimes(2)
  })
})
```

### Analytics Actions Testing
Create `__tests__/actions/analytics.test.ts`:

```typescript
import { generateReport } from '@/app/actions/analytics'
import { createPayloadClient } from '@/lib/payload'

jest.mock('@/lib/payload', () => ({
  createPayloadClient: jest.fn(),
}))

describe('Analytics Actions', () => {
  it('generates report successfully', async () => {
    const mockPayload = {
      findByID: jest.fn().mockResolvedValue({
        type: 'user_progress',
        filters: {},
      }),
      update: jest.fn(),
    }
    ;(createPayloadClient as jest.Mock).mockResolvedValue(mockPayload)

    const result = await generateReport('test-id')
    expect(result.success).toBe(true)
  })

  it('handles report generation failure', async () => {
    const mockPayload = {
      findByID: jest.fn().mockRejectedValue(new Error('Test error')),
    }
    ;(createPayloadClient as jest.Mock).mockResolvedValue(mockPayload)

    const result = await generateReport('test-id')
    expect(result.error).toBe('Failed to generate report')
  })
})
```

## 5.5 Visualization Components

### Create Chart Components
Create `components/analytics/charts/line-chart.tsx`:

```typescript
'use client'

import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface LineChartProps {
  data: ChartData<'line'>
  title: string
  height?: number
}

export function LineChart({ data, title, height = 300 }: LineChartProps) {
  return (
    <Line
      data={data}
      height={height}
      options={{
        responsive: true,
        plugins: {
          legend: {
            position: 'top' as const,
          },
          title: {
            display: true,
            text: title,
          },
        },
        interaction: {
          mode: 'index' as const,
          intersect: false,
        },
      }}
    />
  )
}
```

Create `components/analytics/charts/bar-chart.tsx`:

```typescript
'use client'

import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface BarChartProps {
  data: ChartData<'bar'>
  title: string
  height?: number
}

export function BarChart({ data, title, height = 300 }: BarChartProps) {
  return (
    <Bar
      data={data}
      height={height}
      options={{
        responsive: true,
        plugins: {
          legend: {
            position: 'top' as const,
          },
          title: {
            display: true,
            text: title,
          },
        },
      }}
    />
  )
}
```

### Create Metric Cards
Create `components/analytics/metric-card.tsx`:

```typescript
'use client'

import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: number | string
  change?: number
  icon?: React.ReactNode
  className?: string
}

export function MetricCard({
  title,
  value,
  change,
  icon,
  className,
}: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn('p-6', className)}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {icon}
        </div>
        <div className="mt-2 flex items-baseline">
          <p className="text-2xl font-semibold">{value}</p>
          {change && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                'ml-2 text-sm',
                change >= 0 ? 'text-green-600' : 'text-red-600'
              )}
            >
              {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
            </motion.span>
          )}
        </div>
      </Card>
    </motion.div>
  )
}
```

## 5.6 Export Utilities

### Create Export Service
Create `lib/services/exports.ts`:

```typescript
import { jsPDF } from 'jspdf'
import * as XLSX from 'xlsx'
import { Parser } from 'json2csv'

export async function generatePDF(data: any) {
  const doc = new jsPDF()
  
  // Add report header
  doc.setFontSize(20)
  doc.text(data.title, 20, 20)
  
  // Add metadata
  doc.setFontSize(12)
  doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 40)
  
  // Add tables and charts
  let y = 60
  Object.entries(data.metrics).forEach(([key, value]) => {
    doc.text(`${key}: ${value}`, 20, y)
    y += 10
  })
  
  return doc.output('blob')
}

export async function generateExcel(data: any) {
  const wb = XLSX.utils.book_new()
  
  // Convert data to worksheet format
  const ws = XLSX.utils.json_to_sheet(data.rows)
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Report')
  
  // Generate buffer
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

export async function generateCSV(data: any) {
  const parser = new Parser({
    fields: Object.keys(data.rows[0]),
  })
  
  const csv = parser.parse(data.rows)
  
  return new Blob([csv], { type: 'text/csv' })
}
```

### Create Email Service
Create `lib/services/email.ts`:

```typescript
import { createTransport } from 'nodemailer'

const transporter = createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendScheduledReport(report: any, file: Blob) {
  const { recipients } = report.schedule
  const buffer = Buffer.from(await file.arrayBuffer())
  
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: recipients.map((r: any) => r.email).join(', '),
    subject: `${report.name} - ${new Date().toLocaleDateString()}`,
    text: `Please find attached your scheduled report: ${report.name}`,
    attachments: [
      {
        filename: `${report.name}.${report.exportFormat}`,
        content: buffer,
      },
    ],
  }
  
  await transporter.sendMail(mailOptions)
}
```

## 5.7 Testing

### Chart Component Testing
Create `__tests__/components/analytics/charts/line-chart.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { LineChart } from '@/components/analytics/charts/line-chart'

const mockData = {
  labels: ['January', 'February', 'March'],
  datasets: [
    {
      label: 'Dataset 1',
      data: [10, 20, 30],
      borderColor: 'rgb(75, 192, 192)',
    },
  ],
}

describe('LineChart', () => {
  it('renders with title', () => {
    render(<LineChart data={mockData} title="Test Chart" />)
    expect(screen.getByText('Test Chart')).toBeInTheDocument()
  })

  it('applies custom height', () => {
    render(<LineChart data={mockData} title="Test Chart" height={400} />)
    const canvas = screen.getByRole('img')
    expect(canvas).toHaveAttribute('height', '400')
  })
})
```

### Export Service Testing
Create `__tests__/services/exports.test.ts`:

```typescript
import { generatePDF, generateExcel, generateCSV } from '@/lib/services/exports'

describe('Export Services', () => {
  const mockData = {
    title: 'Test Report',
    metrics: {
      total: 100,
      average: 50,
    },
    rows: [
      { id: 1, name: 'Test 1', value: 10 },
      { id: 2, name: 'Test 2', value: 20 },
    ],
  }

  it('generates PDF blob', async () => {
    const result = await generatePDF(mockData)
    expect(result).toBeInstanceOf(Blob)
    expect(result.type).toBe('application/pdf')
  })

  it('generates Excel blob', async () => {
    const result = await generateExcel(mockData)
    expect(result).toBeInstanceOf(Blob)
    expect(result.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  })

  it('generates CSV blob', async () => {
    const result = await generateCSV(mockData)
    expect(result).toBeInstanceOf(Blob)
    expect(result.type).toBe('text/csv')
  })
})
```

## Next Steps
- Implement real-time analytics updates using WebSocket
- Add more chart types and visualizations
- Create automated report scheduling system
- Implement data archiving for historical analytics
- Add custom metric tracking and alerts
- Enhance export templates and formatting
- Add more interactive dashboard features
