# Abu Aaisha — blog & Islamic counseling

Production blog with a Next.js 16 frontend, an Express API, MongoDB, Cloudinary image hosting, and AI-assisted drafting. Deployable as a single Vercel project (Next.js + one serverless Express function). The public design is a 1:1 port of the previous Astro site.

> The original Markdown content is copied to `content/legacy/` and migrated into MongoDB.

## Stack

| Layer | Choice |
| --- | --- |
| Frontend | Next.js 16 (App Router, TypeScript, React 19) |
| API | Express 5 mounted as a Vercel serverless function (`api/[...path].ts`) via `serverless-http` |
| Database | MongoDB Atlas M0 + Mongoose (cached serverless connection) |
| Images | Cloudinary signed uploads + `next/image` custom loader |
| Auth | Single admin, bcrypt password hash, `jose` JWT in an httpOnly cookie |
| AI drafts | Server-side provider adapter (Gemini by default, any OpenAI-compatible endpoint) |
| Email | Resend (optional; messages are stored either way) |

## Architecture

```
Browser ──► Next.js (Vercel) ── reads ──► MongoDB Atlas
   │          public pages: ISR (5 min) + on-demand revalidation
   │          /admin: dynamic, no-store
   └──► /api/* ──► Express serverless function
                     auth · post writes · AI · Cloudinary signing · contact · search
```

- Public pages read MongoDB directly from server components.
- All writes go through Express; it is the only place with credentials.
- `/api/*` is same-origin, so the session cookie needs no CORS.
- After a write, the API calls `/revalidate/` with `REVALIDATE_SECRET` to refresh cached public pages.

## Run locally

```sh
npm install
cp .env.example .env.local     # then fill in values (see below)
npm run dev                    # Next.js :3000 + Express :3001
```

`npm run dev` starts both processes. `next.config.ts` proxies `/api/*` to `http://localhost:3001` in development; in production Vercel routes `/api/*` straight to the Express function. Use `npm run dev:web` / `npm run dev:api` to run them separately.

Minimum values to see content locally:

```
MONGODB_URI=...
SESSION_SECRET=...
ADMIN_EMAIL=...
ADMIN_PASSWORD_HASH=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
REVALIDATE_SECRET=...
```

Generate the password hash:

```sh
npm run hash-password -- "your-password"
```

## Migrate existing content

The 32 original posts are in `content/legacy/posts/`. The migration is idempotent and never deletes data.

```sh
npm run migrate
```

- Validates each file against `lib/post-schema.ts`.
- Upserts by slug, preserving slugs/dates/categories/language/sources.
- Uploads local covers to Cloudinary when `CLOUDINARY_*` is set; otherwise keeps existing `/images/posts/...` URLs (those files remain in `public/`).
- Creates MongoDB indexes.
- Run it against the same database configured for deployment.

## Admin panel

- `/admin/login` — email + password, rate-limited, httpOnly session cookie.
- `/admin/account` — change the password (requires the current one). All other sessions are signed out.
- `/admin/forgot-password` and `/admin/reset-password` — one-time email reset link, valid for 30 minutes.
- `/admin` — counts and recently updated posts.
- `/admin/posts` — search, status/category filters, pagination, publish/unpublish, delete (with confirmation).
- `/admin/posts/new` and `/admin/posts/[id]/edit` — title, slug, summary, SEO description, Markdown body, cover image + alt text, categories, language, publish date, sources. Autosaves unsaved edits to `localStorage` and offers to restore them. Preview opens the real post renderer; publishing asks for confirmation.
- `/admin/posts/[id]/preview` — private draft preview with a publish button.

Admin routes are protected twice: `proxy.ts` blocks unauthenticated page requests, and every `/api/admin/*` handler verifies the session itself.

### Password storage and reset

`ADMIN_PASSWORD_HASH` is the initial password. The first in-app change or reset stores a bcrypt hash in MongoDB (`AdminCredential`), which then supersedes the env hash. Changing or resetting bumps a session version so every existing session is signed out. To fall back to `ADMIN_PASSWORD_HASH`, delete the `AdminCredential` document (key `admin`).

Reset emails use `RESEND_API_KEY`; the sender defaults to `CONTACT_FROM_EMAIL` and the recipient to `ADMIN_EMAIL`:

```
PASSWORD_RESET_FROM_EMAIL=     # optional, defaults to CONTACT_FROM_EMAIL
PASSWORD_RESET_TO_EMAIL=       # optional, defaults to ADMIN_EMAIL
PASSWORD_RESET_BASE_URL=       # optional, defaults to NEXT_PUBLIC_SITE_URL
```

## AI drafts

`/admin/posts/new` → **Generate with AI**. Inputs: topic, audience, language, tone, length, keywords. The server calls the provider and inserts an editable draft; publishing is always a separate human action.

```
AI_PROVIDER=gemini        # or openai (OpenAI-compatible)
AI_API_KEY=
AI_MODEL=                 # defaults: gemini-3.1-flash-lite / gpt-4o-mini
AI_BASE_URL=              # optional
AI_DAILY_LIMIT=10
```

Text-only generation keeps requests inside Vercel's 60s function limit. Cover images are uploaded by the editor.

## Images

- Uploads are signed server-side; `CLOUDINARY_API_SECRET` never reaches the browser.
- The browser uploads directly to Cloudinary (images never pass through the 4.5 MB function body limit).
- Files are limited to JPEG/PNG/WebP/AVIF and 8 MB, transformed to ≤1600px.
- `next/image` uses `lib/cloudinary-loader.ts` so Cloudinary returns responsive `f_auto,q_auto` images without spending Vercel image-optimization quota.
- Static site artwork stays in `public/images/site/` and is served as-is.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Next.js + Express in development |
| `npm run build` | Production build (prerenders published posts) |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint 9 (flat config) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest units (schema, markdown sanitization, pagination, sessions) |
| `npm run migrate` | Markdown → MongoDB (+ optional Cloudinary upload) |
| `npm run hash-password` | Prints a bcrypt hash for `ADMIN_PASSWORD_HASH` |
| `npm run gen-icons` | Regenerates `components/icons.generated.ts` from `assets/icons/` |

## Project layout

```
app/(site)/            public pages, grouped so admin does not inherit the site chrome
app/admin/             login + protected admin route group
app/*.xml, sitemap.ts  feeds, sitemap, robots, revalidation webhook
api/[...path].ts       Vercel function entry for Express
server/                Express app, auth, routes, models, Cloudinary, AI, email
components/            public design components + admin components
lib/                   schema, formatters, MongoDB reads, markdown, auth helpers
content/legacy/        original Markdown (migration source, never deleted)
public/images/site/    existing static artwork
```

## URL compatibility

Kept: `/`, `/posts/`, `/posts/<slug>/`, `/posts/page/:n/`, `/posts/oldest/`, `/categories/<c>/`, `/about/`, `/counseling/`, `/contact/`, `/contact/thanks/`, `/index.xml`, `/posts/index.xml`, `/sitemap-index.xml`, `/robots.txt`.

Redirects (see `next.config.ts`): `/posts/page/1/` → `/posts/`, `/posts/page/4/` → `/posts/page/3/`, `/categories/` → `/posts/`, `/pages/` & `/pages/about/` → `/about/`, old feed paths → `/index.xml`, `/admin/ai` → the new-post editor.

## Verification status

Automated checks pass locally: `typecheck`, `lint`, `test` (22 tests), `build`. End-to-end checks against an in-memory MongoDB verified all public routes, pagination, redirects, RSS/sitemap, login, CRUD, publish/unpublish, draft privacy, search, contact storage, and 401/403 gating. Client bundles were scanned for secret values.

Not verifiable without accounts: live Cloudinary upload/migration, real AI generations, Resend delivery, and the actual Vercel deployment. See `DEPLOYMENT.md`.
