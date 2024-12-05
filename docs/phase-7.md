# Phase 7: Security and Optimization

## Summary
This phase implements security measures and performance optimizations using:
1. Next.js middleware for security
2. Neon database optimizations
3. Edge caching strategies
4. Performance monitoring
5. Automated security measures

**Key Components:**
- Security middleware
- Rate limiting
- Query optimization
- Performance monitoring
- Edge caching
- Automated backups

**Expected Outcome:**
A secure and optimized system with:
- Protected endpoints
- Improved performance
- Efficient caching
- Optimized queries
- Real-time monitoring
- Automated recovery

## 7.1 Security Configuration

### Create Security Config
Create `lib/security/config.ts`:

```typescript
export const securityConfig = {
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
  },
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  },
  csrf: {
    cookie: {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
    },
  },
  headers: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https:'],
        fontSrc: ["'self'", 'https:', 'data:'],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    xFrameOptions: 'DENY',
    xContentTypeOptions: 'nosniff',
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy: {
      features: {
        accelerometer: [],
        ambientLightSensor: [],
        autoplay: [],
        battery: [],
        camera: [],
        displayCapture: [],
        documentDomain: [],
        encryptedMedia: [],
        fullscreen: [],
        geolocation: [],
        gyroscope: [],
        magnetometer: [],
        microphone: [],
        midi: [],
        payment: [],
        pictureInPicture: [],
        usb: [],
      },
    },
  },
}
```

### Create Security Middleware
Create `middleware.ts`:

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createEdgeRateLimit } from '@/lib/security/rate-limit'
import { securityConfig } from '@/lib/security/config'

export async function middleware(request: NextRequest) {
  // Rate limiting
  const rateLimit = createEdgeRateLimit()
  const limiterResponse = await rateLimit.check(request)
  
  if (!limiterResponse.success) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': limiterResponse.reset.toString(),
      },
    })
  }

  // CORS
  const response = NextResponse.next()
  const origin = request.headers.get('origin')
  
  if (origin && securityConfig.cors.origin.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Methods', securityConfig.cors.methods.join(','))
    response.headers.set('Access-Control-Allow-Headers', securityConfig.cors.allowedHeaders.join(','))
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }

  // Security headers
  response.headers.set('X-Frame-Options', securityConfig.headers.xFrameOptions)
  response.headers.set('X-Content-Type-Options', securityConfig.headers.xContentTypeOptions)
  response.headers.set('Referrer-Policy', securityConfig.headers.referrerPolicy)
  response.headers.set(
    'Content-Security-Policy',
    Object.entries(securityConfig.headers.contentSecurityPolicy.directives)
      .map(([key, value]) => `${key} ${value.join(' ')}`)
      .join('; ')
  )
  response.headers.set(
    'Permissions-Policy',
    Object.entries(securityConfig.headers.permissionsPolicy.features)
      .map(([key, value]) => `${key}=${value.length ? `(${value.join(' ')})` : "'none'"}`)
      .join(', ')
  )

  return response
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
```

## 7.2 Rate Limiting

### Create Edge Rate Limiter
Create `lib/security/rate-limit.ts`:

```typescript
import { db } from '@/lib/db'
import { sql } from '@neondatabase/serverless'
import { securityConfig } from './config'

export function createEdgeRateLimit() {
  return {
    async check(request: Request) {
      const ip = request.headers.get('x-forwarded-for') || 'unknown'
      const now = Date.now()
      const windowStart = now - securityConfig.rateLimit.windowMs

      try {
        // Clean up old records
        await db.execute(sql`
          DELETE FROM rate_limit
          WHERE timestamp < ${windowStart}
        `)

        // Get current count
        const result = await db.execute(sql`
          SELECT COUNT(*) as count
          FROM rate_limit
          WHERE ip = ${ip}
          AND timestamp > ${windowStart}
        `)

        const count = parseInt(result.rows[0].count)

        if (count >= securityConfig.rateLimit.max) {
          return {
            success: false,
            reset: windowStart + securityConfig.rateLimit.windowMs,
          }
        }

        // Record request
        await db.execute(sql`
          INSERT INTO rate_limit (ip, timestamp)
          VALUES (${ip}, ${now})
        `)

        return {
          success: true,
          remaining: securityConfig.rateLimit.max - count - 1,
          reset: windowStart + securityConfig.rateLimit.windowMs,
        }
      } catch (error) {
        console.error('Rate limit error:', error)
        return { success: true } // Fail open if rate limiting fails
      }
    }
  }
}
```

## 7.3 Database Optimization

### Create Database Indexes
Create `lib/db/indexes.ts`:

```typescript
import { db } from '@/lib/db'
import { sql } from '@neondatabase/serverless'

export async function createIndexes() {
  // Users indexes
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS users_tenant_role ON users (tenant, role);
    CREATE INDEX IF NOT EXISTS users_email ON users (email);
  `)

  // Courses indexes
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS courses_tenant ON courses (tenant);
    CREATE INDEX IF NOT EXISTS courses_instructor ON courses (instructor);
    CREATE INDEX IF NOT EXISTS courses_status ON courses (status);
  `)

  // Progress indexes
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS progress_user_course ON progress (user_id, course_id);
    CREATE INDEX IF NOT EXISTS progress_completion ON progress (completed, completion_date);
  `)

  // Notifications indexes
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS notifications_recipient_read ON notifications (recipient, read);
    CREATE INDEX IF NOT EXISTS notifications_type_created ON notifications (type, created_at);
  `)

  // Analytics indexes
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS analytics_tenant_date ON analytics (tenant, date);
    CREATE INDEX IF NOT EXISTS analytics_type_date ON analytics (type, date);
  `)
}

export async function createMaterializedViews() {
  // Course completion stats
  await db.execute(sql`
    CREATE MATERIALIZED VIEW IF NOT EXISTS course_completion_stats AS
    SELECT 
      course_id,
      COUNT(*) as total_enrollments,
      COUNT(CASE WHEN completed THEN 1 END) as completed_count,
      AVG(CASE WHEN completed THEN completion_percentage END) as avg_completion,
      AVG(EXTRACT(EPOCH FROM (completion_date - start_date))/86400) as avg_days_to_complete
    FROM progress
    GROUP BY course_id
    WITH DATA;

    CREATE UNIQUE INDEX IF NOT EXISTS course_completion_stats_course_id 
    ON course_completion_stats (course_id);
  `)

  // User engagement stats
  await db.execute(sql`
    CREATE MATERIALIZED VIEW IF NOT EXISTS user_engagement_stats AS
    SELECT 
      user_id,
      COUNT(DISTINCT course_id) as enrolled_courses,
      COUNT(CASE WHEN completed THEN 1 END) as completed_courses,
      AVG(completion_percentage) as avg_completion,
      MAX(last_activity) as last_active
    FROM progress
    GROUP BY user_id
    WITH DATA;

    CREATE UNIQUE INDEX IF NOT EXISTS user_engagement_stats_user_id 
    ON user_engagement_stats (user_id);
  `)
}
```

### Create Query Optimizer
Create `lib/db/optimizer.ts`:

```typescript
import { db } from '@/lib/db'
import { sql } from '@neondatabase/serverless'

export async function analyzeQueries() {
  const slowQueries = await db.execute(sql`
    SELECT query, calls, total_time, mean_time
    FROM pg_stat_statements
    WHERE mean_time > 1000 -- queries taking more than 1 second on average
    ORDER BY total_time DESC
    LIMIT 10;
  `)

  return slowQueries.rows
}

export async function refreshMaterializedViews() {
  await db.execute(sql`
    REFRESH MATERIALIZED VIEW CONCURRENTLY course_completion_stats;
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_engagement_stats;
  `)
}

export async function vacuumAnalyze() {
  await db.execute(sql`VACUUM ANALYZE;`)
}
```

## 7.4 Edge Caching

### Create Edge Cache Service
Create `lib/cache/edge.ts`:

```typescript
import { kv } from '@vercel/kv'
import { Redis } from '@upstash/redis'
import { cache } from 'react'

// Initialize Redis for backward compatibility
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
})

interface CacheOptions {
  ttl?: number
  tags?: string[]
  useRedis?: boolean // Flag to use Redis instead of KV
}

export const getEdgeCache = cache(async function<T>(
  key: string,
  options?: CacheOptions
): Promise<T | null> {
  try {
    if (options?.useRedis) {
      const value = await redis.get(key)
      return value ? (JSON.parse(value) as T) : null
    }
    const value = await kv.get<T>(key)
    return value
  } catch (error) {
    console.error('Edge cache get error:', error)
    return null
  }
})

export async function setEdgeCache<T>(
  key: string,
  value: T,
  options?: CacheOptions
): Promise<void> {
  try {
    if (options?.useRedis) {
      const serialized = JSON.stringify(value)
      if (options.ttl) {
        await redis.setex(key, options.ttl, serialized)
      } else {
        await redis.set(key, serialized)
      }
      return
    }
    await kv.set(key, value, {
      ex: options?.ttl,
      tags: options?.tags,
    })
  } catch (error) {
    console.error('Edge cache set error:', error)
  }
}

export async function invalidateEdgeCache(
  key: string | string[],
  tags?: string[],
  options?: { useRedis?: boolean }
): Promise<void> {
  try {
    if (options?.useRedis) {
      if (Array.isArray(key)) {
        await Promise.all(key.map((k) => redis.del(k)))
      } else {
        await redis.del(key)
      }
      return
    }
    if (Array.isArray(key)) {
      await Promise.all(key.map((k) => kv.del(k)))
    } else {
      await kv.del(key)
    }

    if (tags?.length) {
      await Promise.all(tags.map((tag) => kv.del(`tag:${tag}`)))
    }
  } catch (error) {
    console.error('Edge cache invalidation error:', error)
  }
}
```

## 7.5 Monitoring and Logging

### Create Logger Service
Create `lib/logger/index.ts`:

```typescript
import pino from 'pino'

const transport = pino.transport({
  target: 'pino-pretty',
  options: {
    colorize: true,
    ignore: 'pid,hostname',
    translateTime: 'SYS:standard',
  },
})

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: {
    env: process.env.NODE_ENV,
  },
}, transport)

export function createRequestLogger() {
  return (req: any, res: any, next: () => void) => {
    const start = Date.now()

    res.on('finish', () => {
      const duration = Date.now() - start

      logger.info({
        type: 'request',
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      })
    })

    next()
  }
}
```

### Create Performance Monitoring
Create `lib/monitoring/performance.ts`:

```typescript
import { logger } from '@/lib/logger'
import { db } from '@/lib/db'
import { sql } from '@neondatabase/serverless'
import { context, trace } from '@opentelemetry/api'

const tracer = trace.getTracer('performance-monitoring')

export async function monitorDatabaseHealth() {
  return tracer.startActiveSpan('monitor-database-health', async (span) => {
    try {
      const result = await db.execute(sql`
        SELECT 
          numbackends as active_connections,
          xact_commit as transactions_committed,
          xact_rollback as transactions_rolled_back,
          blks_read as disk_blocks_read,
          blks_hit as buffer_blocks_hit,
          tup_returned as rows_returned,
          tup_fetched as rows_fetched,
          tup_inserted as rows_inserted,
          tup_updated as rows_updated,
          tup_deleted as rows_deleted
        FROM pg_stat_database 
        WHERE datname = current_database();
      `)

      const stats = result.rows[0]
      
      const metrics = {
        buffer_hit_ratio: (stats.blks_hit / (stats.blks_hit + stats.blks_read) * 100).toFixed(2),
        transaction_success_ratio: (stats.xact_commit / (stats.xact_commit + stats.xact_rollback) * 100).toFixed(2),
      }

      span.setAttributes(metrics)
      
      logger.info({
        type: 'database_health',
        ...stats,
        ...metrics,
      })

      return stats
    } catch (error) {
      span.recordException(error)
      logger.error('Database health check failed:', error)
      throw error
    } finally {
      span.end()
    }
  })
}

export async function monitorQueryPerformance() {
  try {
    const result = await db.execute(sql`
      SELECT 
        query,
        calls,
        total_time / 1000 as total_seconds,
        mean_time as mean_milliseconds,
        rows
      FROM pg_stat_statements
      ORDER BY total_time DESC
      LIMIT 10;
    `)

    logger.info({
      type: 'query_performance',
      slow_queries: result.rows,
    })

    return result.rows
  } catch (error) {
    logger.error('Query performance monitoring failed:', error)
    throw error
  }
}

export async function monitorCacheEffectiveness() {
  try {
    const result = await db.execute(sql`
      SELECT 
        sum(heap_blks_read) as heap_read,
        sum(heap_blks_hit) as heap_hit,
        sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read))::float * 100 as cache_hit_ratio
      FROM pg_statio_user_tables;
    `)

    logger.info({
      type: 'cache_effectiveness',
      ...result.rows[0],
    })

    return result.rows[0]
  } catch (error) {
    logger.error('Cache effectiveness monitoring failed:', error)
    throw error
  }
}
```

### Create Distributed Tracing
Create `lib/monitoring/tracing.ts`:

```typescript
import { Resource } from '@opentelemetry/resources'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { logger } from '@/lib/logger'

export function initializeTracing() {
  const sdk = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: 'lms-platform',
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV,
    }),
    traceExporter: new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
      headers: {
        'api-key': process.env.OTEL_EXPORTER_OTLP_HEADERS,
      },
    }),
    instrumentations: [getNodeAutoInstrumentations()],
  })

  sdk.start()
    .then(() => logger.info('Tracing initialized'))
    .catch((error) => logger.error('Error initializing tracing:', error))

  process.on('SIGTERM', () => {
    sdk.shutdown()
      .then(() => logger.info('Tracing terminated'))
      .catch((error) => logger.error('Error terminating tracing:', error))
      .finally(() => process.exit(0))
  })
}
```

## 7.6 Testing

### Security Testing
Create `__tests__/security/middleware.test.ts`:

```typescript
import { middleware } from '@/middleware'
import { createEdgeRateLimit } from '@/lib/security/rate-limit'
import { NextRequest } from 'next/server'

jest.mock('@/lib/security/rate-limit')

describe('Security Middleware', () => {
  it('applies rate limiting', async () => {
    const mockRateLimit = {
      check: jest.fn().mockResolvedValue({ success: true, remaining: 99 }),
    }
    ;(createEdgeRateLimit as jest.Mock).mockReturnValue(mockRateLimit)

    const request = new NextRequest(new Request('http://localhost'))
    const response = await middleware(request)

    expect(mockRateLimit.check).toHaveBeenCalledWith(request)
    expect(response.status).not.toBe(429)
  })

  it('blocks excessive requests', async () => {
    const mockRateLimit = {
      check: jest.fn().mockResolvedValue({ success: false, reset: Date.now() + 900000 }),
    }
    ;(createEdgeRateLimit as jest.Mock).mockReturnValue(mockRateLimit)

    const request = new NextRequest(new Request('http://localhost'))
    const response = await middleware(request)

    expect(response.status).toBe(429)
    expect(response.headers.get('Retry-After')).toBeDefined()
  })
})
```

### Database Testing
Create `__tests__/db/optimizer.test.ts`:

```typescript
import { analyzeQueries, refreshMaterializedViews } from '@/lib/db/optimizer'
import { db } from '@/lib/db'

jest.mock('@/lib/db')

describe('Database Optimizer', () => {
  it('analyzes slow queries', async () => {
    const mockRows = [
      {
        query: 'SELECT * FROM users',
        calls: 1000,
        total_time: 5000,
        mean_time: 5,
      },
    ]
    ;(db.execute as jest.Mock).mockResolvedValue({ rows: mockRows })

    const result = await analyzeQueries()
    expect(result).toEqual(mockRows)
  })

  it('refreshes materialized views', async () => {
    await refreshMaterializedViews()
    expect(db.execute).toHaveBeenCalled()
  })
})
```

### Cache Testing
Create `__tests__/cache/edge.test.ts`:

```typescript
import { getEdgeCache, setEdgeCache, invalidateEdgeCache } from '@/lib/cache/edge'
import { kv } from '@vercel/kv'

jest.mock('@vercel/kv')

describe('Edge Cache', () => {
  it('gets cached value', async () => {
    const mockValue = { test: true }
    ;(kv.get as jest.Mock).mockResolvedValue(mockValue)

    const result = await getEdgeCache('test-key')
    expect(result).toEqual(mockValue)
  })

  it('sets cache value with options', async () => {
    const value = { test: true }
    const options = { ttl: 3600, tags: ['test'] }

    await setEdgeCache('test-key', value, options)
    expect(kv.set).toHaveBeenCalledWith('test-key', value, {
      ex: options.ttl,
      tags: options.tags,
    })
  })

  it('invalidates cache by keys and tags', async () => {
    await invalidateEdgeCache(['key1', 'key2'], ['tag1', 'tag2'])
    expect(kv.del).toHaveBeenCalledTimes(4)
  })
})
```

## Next Steps
- Implement Web Application Firewall (WAF)
- Add DDoS protection
- Set up automated database backups
- Configure failover strategies
- Implement audit logging
- Add anomaly detection
- Set up automated security scanning
