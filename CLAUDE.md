# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LouMinouS is a multi-tenant Learning Management System (LMS) built with Next.js 15 and Payload CMS 3.0. The platform includes gamification features (points, badges, achievements, leaderboards), course management, and tenant-based access control.

## Development Commands

### Core Commands
```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Generate TypeScript types from Payload collections
npm generate:types

# Generate GraphQL schema
npm run generate:schema

# Generate import map
npm run generate:importmap

# Database seed (fresh migration)
npm run seed

# Direct Payload CLI access
npm run payload
```

### Environment Setup
Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string (using Neon/Postgres)
- `PAYLOAD_SECRET` - Secret key for Payload CMS
- `PAYLOAD_PUBLIC_SERVER_URL` - Public server URL (default: http://localhost:3000)

## Architecture

### Technology Stack
- **Framework**: Next.js 15 (App Router with React Server Components)
- **CMS**: Payload CMS 3.0
- **Database**: PostgreSQL via `@payloadcms/db-postgres`
- **ORM**: Drizzle ORM (configured but database logic primarily through Payload)
- **Rich Text**: Lexical editor (`@payloadcms/richtext-lexical`)
- **Realtime**: Pusher for live updates
- **TypeScript**: Strict mode enabled

### Multi-Tenancy Architecture

The system is built around a tenant-based access control model:

1. **Tenants Collection** ([src/collections/Tenants.ts](src/collections/Tenants.ts)) - Root organizational entity
   - Each tenant has subscriptions, branding, feature flags, and analytics
   - Admin-only access for tenant management
   - Auto-generates slug from name via `beforeValidate` hook

2. **User-Tenant Relationship** ([src/collections/Users.ts](src/collections/Users.ts))
   - Users belong to a tenant via `tenant` relationship field
   - Roles: `admin`, `instructor`, `student`
   - Access control patterns in [src/access/roles.ts](src/access/roles.ts)

3. **Access Control Patterns**
   - `isAdmin` - System-wide admin access
   - `isSameTenant` - Restrict data to user's tenant
   - `isAdminOrInstructor` - Combined role checks
   - Most collections filter by tenant automatically via access control

### Collections Structure

**Core Learning Collections:**
- `Courses` → `Modules` → `Lessons` (hierarchical course structure)
- `Enrollments` - Links students to courses
- `Progress` - Tracks lesson completion and timestamps

**Gamification Collections:**
- `Points` - Point transactions (earned/spent)
- `Badges` - Badge definitions
- `Achievements` - Achievement definitions with prerequisites
- `Levels` - User level progression
- `Streaks` - Login/activity streaks
- `Leaderboards` - Competitive rankings

**Supporting Collections:**
- `Users` - Multi-role users with tenant association
- `Media` - File uploads
- `StudentSettings` - Per-student preferences

### State Management Philosophy

From [.cursorrules](.cursorrules):

1. **Prefer server-side state** - Use React Server Components for data fetching
2. **URL state with nuqs** - For shareable/bookmarkable UI state (filters, pagination, modals)
3. **Minimize client-side state** - Only for ephemeral UI interactions
4. **Server Actions** - Preferred over API routes for mutations

### Key Library Utilities

**Achievements System** ([src/lib/achievements/](src/lib/achievements/))
- `awardAchievement.ts` - Award achievement to user
- `checkPrerequisites.ts` - Validate achievement prerequisites
- `checkProgress.ts` - Monitor progress toward achievements
- `getProgress.ts` - Retrieve achievement progress

**Notifications** ([src/lib/notifications/createNotification.ts](src/lib/notifications/createNotification.ts))
- Notification creation with Pusher integration

**Payload Configuration** ([src/lib/payload/editor.ts](src/lib/payload/editor.ts))
- Lexical editor configuration

### Payload CMS Integration

**Configuration**: [src/payload.config.ts](src/payload.config.ts)
- Collections array defines all data models
- PostgreSQL adapter with connection pooling (max: 10)
- Auto-generates TypeScript types to `src/payload-types.ts`
- GraphQL schema output to `src/generated-schema.graphql`
- Upload size limit: 5MB

**Admin Panel**: Accessible at `/admin` route
- Managed via [src/app/(payload)/admin/[[...segments]]/page.tsx](src/app/(payload)/admin/[[...segments]]/page.tsx)

**API Routes**:
- `/api/[...slug]` - Dynamic Payload REST API
- `/api/graphql` - GraphQL endpoint
- `/api/graphql-playground` - GraphQL playground interface

### Database Management

**Drizzle Configuration**: [drizzle.config.ts](drizzle.config.ts)
- Schema location: `./src/lib/db/schema/*` (currently not in use, Payload manages schema)
- Migration output: `./drizzle`
- PostgreSQL dialect with SSL enabled

**Important**: While Drizzle is configured, Payload CMS manages the database schema. The `db` folder was removed in a recent commit as it was redundant with Payload's database management.

## Development Patterns

### Adding New Collections

1. Create collection config in `src/collections/YourCollection.ts`
2. Import and add to `collections` array in [src/payload.config.ts](src/payload.config.ts)
3. Define access control using patterns from [src/access/roles.ts](src/access/roles.ts)
4. Run `npm run generate:types` to update TypeScript types

### Multi-Tenant Data Access

Always implement tenant isolation:
```typescript
access: {
  read: ({ req: { user } }) => {
    if (!user) return false
    if (user.role === 'admin') return true
    return {
      tenant: {
        equals: user.tenant,
      },
    }
  },
}
```

### Hooks Pattern

Collections use Payload hooks for business logic:
- `beforeValidate` - Data normalization (e.g., slug generation)
- `beforeChange` - Pre-save logic (e.g., setting timestamps)
- `afterChange` - Post-save side effects (e.g., triggering notifications)

### Animation & UI Libraries

From [.cursorrules](.cursorrules), the project uses:
- `framer-motion` - Primary animation library
- `aceternity-ui`, `magic-ui` - Advanced UI components
- `shadcn-ui` - Base component library
- `vaul`, `sonner`, `cmdk` - Specialized UI components
- `tailwindcss` - Styling
- `nuqs` - URL state management

Animation principles:
- Respect `prefers-reduced-motion`
- Keep micro-interactions under 300ms
- Use spring animations for natural feel
- Lazy load heavy animation libraries

## Testing & Quality

Per [.cursorrules](.cursorrules):
- Write tests for critical paths
- Unit tests for utilities
- Integration tests for API logic
- E2E tests for critical user flows
- Load testing for scalability

## Build & Deployment

**Build Configuration**: [next.config.mjs](next.config.mjs)
- React Compiler: Disabled
- TypeScript errors block builds
- ESLint errors block builds
- Image domains configured for localhost (add production domains as needed)

**Node Version**: Requires Node.js ^18.20.2 || >=20.9.0

**Production Deployment**:
1. Ensure all environment variables are set
2. Run `npm run build`
3. Run `npm run start`

**Vercel Deployment** (recommended per [.cursorrules](.cursorrules)):
- Configure Edge Functions where appropriate
- Set up error tracking with Sentry
- Configure OpenTelemetry for monitoring
- Enable Vercel Analytics

## Important Notes

- **Payload 3.0 requires Next.js 15** - Don't downgrade Next.js version
- **Server Actions are preferred** over traditional API routes
- **TypeScript strict mode** is enabled - all code must be type-safe
- **Multi-tenant isolation** must be maintained in all collection access controls
- **Gamification is optional** per tenant via `features.gamification` flag in Tenants collection
- Recent commit removed `db` folder - Payload manages all database operations
