# Pixora – web client

Pixora is a cloud photo library. This is the Next.js frontend; it talks to the Spring Boot API in `../backend`, which stores files in ImageKit and metadata in PostgreSQL.

## Stack

- Next.js 16 (App Router, Turbopack) with React 19 and TypeScript
- Tailwind CSS 4 with shadcn/ui (Base UI primitives) and lucide icons
- TanStack Query for server state, Zustand for auth, selection and upload queue state
- next-themes for light / dark / system theme
- sonner for toasts, react-hook-form + zod for forms

## Running locally

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

The API base URL defaults to `http://localhost:8080/api`. Override it with:

```bash
NEXT_PUBLIC_API_URL=https://your-api.example.com/api pnpm dev
```

Other scripts: `pnpm lint`, `pnpm build`, `pnpm start`.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Public landing page (features, how it works, workspace preview) |
| `/login`, `/register` | Authentication; signed-in users are redirected to the workspace |
| `/dashboard` | Overview: recently added photos, albums, real library usage, quick actions |
| `/photos` | Main library with drag-and-drop upload, filtering, selection and bulk actions |
| `/photos/[id]` | Full-screen viewer with prev/next, details panel and ImageKit AI edits |
| `/albums`, `/albums/[id]` | Album list and detail with rename, cover, add/remove photos, delete |
| `/archive`, `/trash` | Archived and trashed photos with restore / permanent delete |

Protected routes are guarded on the client (`components/auth/auth-guard.tsx`). Unauthenticated visitors are sent to `/login?next=…` and return to the page they asked for after signing in.

## Project layout

```
app/              routes (route groups: (auth), (app))
components/
  brand/          Pixora mark and wordmark
  landing/        public landing page sections
  layout/         app shell, sidebar, account menu, page header
  photos/         grid, tiles, viewer, upload queue, drop zone, bulk toolbar
  albums/         album grid, dialogs, photo picker
  dashboard/      overview widgets
  library/        storage summary, ImageKit import
  ui/             shadcn/ui primitives plus small shared pieces
hooks/            TanStack Query hooks and UI hooks
lib/              API client (with token refresh), ImageKit URL helpers, formatting
stores/           Zustand stores: auth (persisted), selection, upload queue, viewer
```

## Sessions

Access tokens are short-lived; `lib/api.ts` decodes the `exp` claim and refreshes via `POST /auth/refresh` shortly before expiry, or once after an unauthenticated response. Refresh calls are single-flight and tolerate another tab having rotated the token first.

## Images

Thumbnails and album covers are requested from ImageKit with a square smart-crop URL transformation (`lib/imagekit.ts`). Full-size images in the viewer use the original URL. No ImageKit credentials live in the client; uploads go through the backend.
