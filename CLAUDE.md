# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 weekly planner application with Supabase authentication and PostgreSQL database via Prisma ORM. The app allows users to plan their week with daily notes and tasks.

## Development Commands

```bash
# Start development server (port 3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run ESLint
npm run lint

# Format code with dprint
npm run format

# Check formatting without modifying files
npm run check-format
```

## Database Commands

```bash
# Generate Prisma client (outputs to src/generated/prisma)
npx prisma generate

# Create a new migration
npx prisma migrate dev --name <migration_name>

# Apply migrations
npx prisma migrate deploy

# Open Prisma Studio (database GUI)
npx prisma studio
```

## Architecture

### Component Organization

The project uses an atomic design pattern:

- **Atoms** (`src/app/Atoms/`): Base UI components (Button, Checkbox, InputField, SmartEditor, etc.)
- **Components** (`src/app/Components/`): Composite components that combine atoms (Homepage, WeeklyContent, TaskItem, etc.)

Each component has its own directory with a `.tsx` file and corresponding `.module.scss` file for styles.

### Path Aliases

Configured in `tsconfig.json`:
- `@assets/*` → `src/app/assets/*`
- `@components/*` → `src/app/Components/*`
- `@atoms/*` → `src/app/Atoms/*`
- `@styles/*` → `src/app/styles/*`
- `@hooks/*` → `src/hooks/*`
- `@utils/*` → `src/utils/*`
- `@app` → `src/app`

### Authentication Flow

- Uses Supabase for authentication
- Server-side auth: `@utils/supabase/server.ts` (creates server client with cookies)
- Client-side auth: `@utils/supabase/client.ts` (creates browser client)
- Root page (`src/app/page.tsx`) is protected - redirects to `/login` if not authenticated
- Auth components in `src/app/Components/auth/` (AuthForm, PasswordField)

### Responsive Design

The app has separate mobile and desktop layouts:
- Uses `useMediaQuery` hook to detect viewport size (breakpoint: 1023px)
- Mobile: `MobileNavigation` with content switching
- Desktop: `DesktopNavigation` with `Sidebar` and `DesktopContent`
- Layout logic in `src/app/Components/Homepage/page.tsx`

### Database Layer

- Prisma client generated to `src/generated/prisma/` (not `node_modules`)
- Schema in `prisma/schema.prisma`
- Current models: Profile (id, email, displayName, timestamps)
- Uses PostgreSQL with Supabase (DATABASE_URL and DIRECT_URL required)

### Rich Text Editor

Uses BlockNote (based on ProseMirror) with Mantine styling:
- Main component: `SmartEditor.tsx`
- Custom slash menu configuration in `@utils/blocknoteSlashMenu.ts`
- Client-side only (check for `window` before rendering)

### SVG Handling

SVGs are imported as React components using `@svgr/webpack` (configured in `next.config.ts`).

## Code Style

- Formatting: Uses **dprint** (tabs, 120 line width)
- Always run `npm run format` before committing
- ESLint: Next.js TypeScript config with core-web-vitals
- Generated files in `src/generated/**` are ignored by ESLint

## Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `DATABASE_URL` (PostgreSQL connection string)
- `DIRECT_URL` (Direct database connection for migrations)
