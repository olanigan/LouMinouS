# Agent Guidelines for LouMinouS LMS Project

## Build/Lint/Test Commands

### Build Commands
- **Build**: `npm run build` - Builds the Next.js application with Payload CMS
- **Dev**: `npm run dev` - Starts development server with hot reload
- **Start**: `npm run start` - Starts production server

### Payload CMS Commands
- **Payload Admin**: `npm run payload` - Opens Payload admin interface
- **Generate Types**: `npm run generate:types` - Generates TypeScript types from Payload schema
- **Generate Schema**: `npm run generate:schema` - Generates GraphQL schema
- **Generate Importmap**: `npm run generate:importmap` - Generates import map for admin
- **Seed Database**: `npm run seed` - Seeds database with initial data

### Code Quality
- **Lint**: Run `npx eslint .` to check code style and errors
- **Type Check**: Run `npx tsc --noEmit` to check TypeScript types
- **Format**: Run `npx prettier --write .` to format code

### Testing
- No dedicated test runner configured yet
- MongoDB connection test: `node tests/test-mongo-connection.cjs`

## Code Style Guidelines

### TypeScript Configuration
- **Strict mode**: Enabled - all type checking rules enforced
- **Path mapping**: Use `@/*` for imports from `src/` directory
- **Target**: ES5 with modern lib support (DOM, ESNext)
- **Module resolution**: Bundler mode for Next.js compatibility

### Formatting (Prettier)
- **Quotes**: Single quotes (`'`) for all strings
- **Commas**: Trailing commas in all multi-line structures
- **Width**: 100 characters maximum line length
- **Semicolons**: Disabled - no semicolons used

### Linting (ESLint)
- **Config**: Extends `next/core-web-vitals`
- **Parser**: TypeScript with project references
- **Rules**: Next.js recommended rules for web vitals

### Naming Conventions
- **Types/Interfaces**: PascalCase (e.g., `User`, `EmailTemplateArgs`)
- **Variables/Functions**: camelCase (e.g., `userId`, `awardAchievement`)
- **Collections**: PascalCase (e.g., `Users`, `Achievements`)
- **Files**: PascalCase for components, camelCase for utilities

### Import/Export Patterns
- Use named exports over default exports
- Group imports: external libraries first, then internal imports
- Use absolute imports with `@/*` path mapping
- Sort imports alphabetically within groups

### Error Handling
- Use `.catch()` for async error handling in non-critical paths
- Implement proper try/catch blocks for critical operations
- Log errors with appropriate context
- Return user-friendly error messages

### Server Actions
- Use `'use server'` directive at top of server action files
- Implement proper TypeScript interfaces for parameters
- Handle errors gracefully and provide feedback

### Payload CMS Patterns
- Define collections with proper TypeScript types
- Use access control functions from `access/roles.ts`
- Implement hooks for data validation and processing
- Configure admin interface with proper grouping and columns

## Cursor Rules Integration

This project follows comprehensive guidelines defined in `.cursorrules` including:
- Next.js 15 + Payload CMS 3.0 architecture
- URL-based state management with `nuqs`
- Server-first approach with React Server Components
- Specific UI libraries: shadcn/ui, aceternity-ui, magic-ui, vaul, sonner
- Animation patterns with framer-motion and related libraries
- Multi-tenant architecture with role-based access control
- Performance requirements and deployment guidelines

Refer to `.cursorrules` for detailed technology stack, workflow processes, and architectural decisions.