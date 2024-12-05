# Phase 9: Deployment, Scaling, and Monitoring

## Summary
This phase focuses on deploying and scaling the LMS platform using:
1. Vercel for Next.js deployment
2. Neon for serverless Postgres
3. Payload Cloud for CMS hosting
4. Monitoring and observability
5. Backup and disaster recovery

**Key Components:**
- Production deployment
- Database scaling
- Performance monitoring
- Security hardening
- Backup strategies

**Expected Outcome:**
A production-ready platform with:
- Automated deployments
- Scalable infrastructure
- Comprehensive monitoring
- Disaster recovery
- Performance optimization

## 9.1 Vercel Deployment Setup

### Configure Vercel Project
Create `vercel.json`:

```json
{
  "buildCommand": "pnpm run build",
  "devCommand": "pnpm run dev",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "git": {
    "deploymentEnabled": {
      "main": true,
      "dev": true,
      "preview": true
    }
  },
  "crons": [
    {
      "path": "/api/cron/refresh-materialized-views",
      "schedule": "*/15 * * * *"
    },
    {
      "path": "/api/cron/analytics-rollup",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

### Environment Configuration
Update `.env.production`:

```bash
# Database
DATABASE_URL=postgres://${NEON_USER}:${NEON_PASSWORD}@${NEON_HOST}/${NEON_DATABASE}?sslmode=require
DIRECT_URL=${DIRECT_URL} # For Neon serverless driver

# Payload
PAYLOAD_SECRET=your-production-secret
PAYLOAD_CONFIG_PATH=src/payload.config.ts
PAYLOAD_CLOUD_API=https://api.payloadcms.com/v1

# Storage
S3_BUCKET_NAME=your-bucket-name
S3_REGION=your-region
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key

# Redis
REDIS_URL=your-redis-url

# Security
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-nextauth-secret

# Monitoring
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials.json
```

## 9.2 Neon Database Setup

### Configure Connection Pool
Create `src/lib/db/pool.ts`:

```typescript
import { Pool } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-serverless'

// Configure connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  maxSize: 10,
  idleTimeout: 30,
  connectionTimeoutMillis: 10_000,
})

// Create Drizzle instance
export const db = drizzle(pool)

// Healthcheck function
export async function checkDatabaseConnection() {
  try {
    const client = await pool.connect()
    await client.query('SELECT 1')
    client.release()
    return true
  } catch (error) {
    console.error('Database connection error:', error)
    return false
  }
}
```

### Configure Read Replicas
Create `src/lib/db/replicas.ts`:

```typescript
import { Pool } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-serverless'

// Read replica pool
const readPool = new Pool({
  connectionString: process.env.DATABASE_READ_URL,
  maxSize: 20,
  idleTimeout: 30,
})

export const readDb = drizzle(readPool)

// Query router
export function getQueryDb(operation: 'read' | 'write') {
  return operation === 'read' ? readDb : db
}
```

## 9.3 Payload Cloud Configuration

### Update Payload Config
Update `src/payload.config.ts`:

```typescript
import { buildConfig } from 'payload/config'
import { cloudStorage } from '@payloadcms/plugin-cloud-storage'
import { s3Adapter } from '@payloadcms/plugin-cloud-storage/s3'

const adapter = s3Adapter({
  config: {
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    },
    region: process.env.S3_REGION,
    bucket: process.env.S3_BUCKET_NAME,
  },
  prefix: 'media',
})

export default buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL,
  collections: [/* ... existing collections ... */],
  plugins: [
    cloudStorage({
      collections: {
        media: {
          adapter,
          generateFileURL: (file) => `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/media/${file.filename}`,
        },
      },
    }),
  ],
  db: {
    pool: {
      min: 2,
      max: 10,
    },
  },
  rateLimit: {
    window: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per window
  },
  graphQL: {
    schemaOutputFile: path.resolve(__dirname, 'generated-schema.graphql'),
    disablePlaygroundInProduction: true,
  },
  cors: [
    'https://your-domain.com',
    'https://admin.your-domain.com',
  ],
})
```

## 9.4 Monitoring and Observability

### Configure Application Monitoring
Create `src/lib/monitoring/index.ts`:

```typescript
import { Logging } from '@google-cloud/logging'
import { MetricsExporter } from '@google-cloud/opentelemetry-cloud-monitoring-exporter'
import { TraceExporter } from '@google-cloud/opentelemetry-cloud-trace-exporter'
import { Resource } from '@opentelemetry/resources'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'

// Configure logging
const logging = new Logging()
const log = logging.log('lms-application')

// Configure metrics
const metricsExporter = new MetricsExporter()

// Configure tracing
const traceExporter = new TraceExporter()

// Resource configuration
const resource = new Resource({
  [SemanticResourceAttributes.SERVICE_NAME]: 'lms-platform',
  [SemanticResourceAttributes.SERVICE_VERSION]: process.env.NEXT_PUBLIC_APP_VERSION,
  environment: process.env.NODE_ENV,
})

export async function logEvent(
  severity: 'INFO' | 'WARNING' | 'ERROR',
  event: string,
  metadata: Record<string, any>
) {
  const entry = log.entry(
    {
      resource: {
        type: 'global',
      },
      severity,
    },
    {
      event,
      ...metadata,
      timestamp: new Date().toISOString(),
    }
  )

  await log.write(entry)
}

export async function recordMetric(
  name: string,
  value: number,
  labels: Record<string, string> = {}
) {
  await metricsExporter.export({
    resource,
    metrics: [
      {
        name,
        value,
        labels,
        timestamp: new Date(),
      },
    ],
  })
}

export async function recordTrace(
  name: string,
  duration: number,
  attributes: Record<string, string> = {}
) {
  await traceExporter.export({
    resource,
    spans: [
      {
        name,
        duration,
        attributes,
        startTime: new Date(),
      },
    ],
  })
}
```

### Create Health Check API
Create `app/api/health/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { checkDatabaseConnection } from '@/lib/db/pool'
import { redis } from '@/lib/redis'
import { logEvent } from '@/lib/monitoring'

export async function GET() {
  try {
    // Check database connection
    const dbHealthy = await checkDatabaseConnection()
    
    // Check Redis connection
    const redisHealthy = await redis.ping()
    
    // Check Payload CMS
    const payloadHealthy = await fetch(
      `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/api/health`
    ).then((res) => res.ok)
    
    const status = dbHealthy && redisHealthy && payloadHealthy
      ? 'healthy'
      : 'unhealthy'
    
    await logEvent('INFO', 'health_check', {
      database: dbHealthy,
      redis: redisHealthy,
      payload: payloadHealthy,
    })
    
    return NextResponse.json(
      {
        status,
        checks: {
          database: dbHealthy,
          redis: redisHealthy,
          payload: payloadHealthy,
        },
      },
      {
        status: status === 'healthy' ? 200 : 503,
      }
    )
  } catch (error) {
    await logEvent('ERROR', 'health_check_failed', { error })
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    )
  }
}
```

## 9.5 Scaling Configuration

### Configure Auto-scaling
Create `src/lib/scaling/index.ts`:

```typescript
import { redis } from '@/lib/redis'
import { logEvent } from '@/lib/monitoring'

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX = 100 // requests per window

export async function checkRateLimit(ip: string): Promise<boolean> {
  const key = `rate_limit:${ip}`
  const count = await redis.incr(key)
  
  if (count === 1) {
    await redis.expire(key, RATE_LIMIT_WINDOW / 1000)
  }
  
  if (count > RATE_LIMIT_MAX) {
    await logEvent('WARNING', 'rate_limit_exceeded', { ip })
    return false
  }
  
  return true
}

// Connection pool scaling
export async function adjustPoolSize(metrics: {
  activeConnections: number
  waitingRequests: number
}) {
  const { activeConnections, waitingRequests } = metrics
  
  // Scale up if we have waiting requests
  if (waitingRequests > 0 && activeConnections >= pool.maxSize) {
    await pool.resize(pool.maxSize + 5)
    await logEvent('INFO', 'pool_scaled_up', metrics)
  }
  
  // Scale down if we have idle connections
  if (waitingRequests === 0 && activeConnections < pool.maxSize / 2) {
    await pool.resize(Math.max(pool.minSize, pool.maxSize - 5))
    await logEvent('INFO', 'pool_scaled_down', metrics)
  }
}
```

## 9.6 Backup and Disaster Recovery

### Configure Database Backups
Create `src/lib/backup/database.ts`:

```typescript
import { exec } from 'child_process'
import { promisify } from 'util'
import { S3 } from 'aws-sdk'
import { logEvent } from '@/lib/monitoring'

const execAsync = promisify(exec)
const s3 = new S3()

export async function createDatabaseBackup() {
  try {
    // Create backup using pg_dump
    const timestamp = new Date().toISOString()
    const filename = `backup-${timestamp}.sql`
    
    await execAsync(
      `pg_dump ${process.env.DATABASE_URL} > /tmp/${filename}`
    )
    
    // Upload to S3
    await s3
      .upload({
        Bucket: process.env.BACKUP_BUCKET_NAME,
        Key: `database/${filename}`,
        Body: require('fs').createReadStream(`/tmp/${filename}`),
      })
      .promise()
    
    await logEvent('INFO', 'database_backup_created', {
      filename,
      timestamp,
    })
    
    // Cleanup
    await execAsync(`rm /tmp/${filename}`)
  } catch (error) {
    await logEvent('ERROR', 'database_backup_failed', { error })
    throw error
  }
}

export async function restoreFromBackup(backupFile: string) {
  try {
    // Download from S3
    const { Body } = await s3
      .getObject({
        Bucket: process.env.BACKUP_BUCKET_NAME,
        Key: `database/${backupFile}`,
      })
      .promise()
    
    // Save to temp file
    await require('fs').promises.writeFile(
      `/tmp/${backupFile}`,
      Body
    )
    
    // Restore using pg_restore
    await execAsync(
      `pg_restore -d ${process.env.DATABASE_URL} /tmp/${backupFile}`
    )
    
    await logEvent('INFO', 'database_restored', { backupFile })
    
    // Cleanup
    await execAsync(`rm /tmp/${backupFile}`)
  } catch (error) {
    await logEvent('ERROR', 'database_restore_failed', { error })
    throw error
  }
}
```

### Configure Media Backups
Create `src/lib/backup/media.ts`:

```typescript
import { S3 } from 'aws-sdk'
import { logEvent } from '@/lib/monitoring'

const sourceS3 = new S3({
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
})

const backupS3 = new S3({
  region: process.env.BACKUP_S3_REGION,
  credentials: {
    accessKeyId: process.env.BACKUP_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.BACKUP_S3_SECRET_ACCESS_KEY,
  },
})

export async function backupMediaFiles() {
  try {
    const timestamp = new Date().toISOString()
    
    // List all objects in source bucket
    const { Contents } = await sourceS3
      .listObjectsV2({
        Bucket: process.env.S3_BUCKET_NAME,
      })
      .promise()
    
    // Copy each object to backup bucket
    await Promise.all(
      Contents.map((object) =>
        backupS3
          .copyObject({
            Bucket: process.env.BACKUP_BUCKET_NAME,
            CopySource: `${process.env.S3_BUCKET_NAME}/${object.Key}`,
            Key: `media/${timestamp}/${object.Key}`,
          })
          .promise()
      )
    )
    
    await logEvent('INFO', 'media_backup_created', {
      timestamp,
      fileCount: Contents.length,
    })
  } catch (error) {
    await logEvent('ERROR', 'media_backup_failed', { error })
    throw error
  }
}
```

## 9.7 Testing

1. Test deployment:
- Verify build process
- Check environment variables
- Test deployment hooks
- Validate domain configuration
- Monitor deployment logs
- Test rollback procedures

2. Test scaling:
- Load test application
- Monitor auto-scaling
- Test connection pooling
- Verify rate limiting
- Check resource utilization
- Test failover scenarios

3. Test monitoring:
- Verify logging setup
- Check metrics collection
- Test tracing functionality
- Monitor error reporting
- Validate alerts
- Test dashboard access

4. Test backup/recovery:
- Verify backup creation
- Test backup integrity
- Validate restore process
- Check backup scheduling
- Test disaster recovery
- Verify data consistency

## Next Steps
- Set up CI/CD pipelines
- Configure automated testing
- Implement security scanning
- Set up performance monitoring
- Create runbooks
- Document operations procedures
- Train support team
