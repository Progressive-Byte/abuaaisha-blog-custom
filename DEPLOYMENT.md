# Deployment guide

This project deploys to **one Vercel project**:

- Next.js app (public site + admin UI)
- `api/[...path].ts` — the Express API as a Node serverless function

## Accounts you need

1. **MongoDB Atlas** (free M0 cluster)
2. **Cloudinary** (free account)
3. **Vercel** (Hobby/free)
4. **AI provider** (Google AI Studio for Gemini, or any OpenAI-compatible API)
5. **Resend** (optional — contact messages are stored in MongoDB even without it)

No paid service is required.

## 1. MongoDB Atlas

1. Create an M0 cluster and a database user.
2. Network Access → allow `0.0.0.0/0` (Vercel functions and builds use dynamic IPs). Tighten later with a private endpoint if available.
3. Copy the connection string and add a database name, e.g.
   `mongodb+srv://user:pass@cluster.mongodb.net/abuaaisha?retryWrites=true&w=majority`
4. Set `MONGODB_URI` locally in `.env.local` and in Vercel.

The build prerenders published posts, so the database must be reachable **during the Vercel build** as well as at runtime.

## 2. Cloudinary

1. Copy the cloud name, API key, and API secret from the Cloudinary dashboard.
2. Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
3. No upload preset is required; the API signs each upload server-side.
4. Optionally add the domain `res.cloudinary.com` to `next.config.ts` (already configured) and custom delivery domains later.

If these variables are missing, image upload returns a clean `503` and the image migration keeps existing local URLs.

## 3. Resend (optional)

1. Verify your sending domain in Resend.
2. Set `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`.
3. Without these, contact submissions are stored in MongoDB and the API still returns success.

## 4. AI provider

Default is Gemini:

```
AI_PROVIDER=gemini
AI_API_KEY=...            # Google AI Studio key
AI_MODEL=gemini-3.1-flash-lite
```

Any OpenAI-compatible endpoint:

```
AI_PROVIDER=openai
AI_API_KEY=...
AI_MODEL=gpt-4o-mini
AI_BASE_URL=https://api.openai.com/v1
```

Limits: 2,000-character prompts, capped output tokens, a 55s fallback budget (primary `gemini-3.1-flash-lite`, retries `gemini-3.5-flash`), and `AI_DAILY_LIMIT` (default 10) generations per admin per 24h.

## 5. Environment variables

Set these in Vercel → Project → Settings → Environment Variables (and in `.env.local` for local development):

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | yes | Atlas connection string |
| `SESSION_SECRET` | yes | 32+ random characters; signs session JWTs |
| `ADMIN_EMAIL` | yes | Admin login email |
| `ADMIN_PASSWORD_HASH` | yes | Initial bcrypt hash from `npm run hash-password` |
| `PASSWORD_RESET_FROM_EMAIL` | no | Reset sender; defaults to `CONTACT_FROM_EMAIL` |
| `PASSWORD_RESET_TO_EMAIL` | no | Reset recipient; defaults to `ADMIN_EMAIL` |
| `PASSWORD_RESET_BASE_URL` | no | Public URL in reset links; defaults to `NEXT_PUBLIC_SITE_URL` |
| `NEXT_PUBLIC_SITE_URL` | yes | `https://abuaaisha.com` — canonical URLs + revalidation |
| `REVALIDATE_SECRET` | yes | Shared secret for the cache-refresh webhook |
| `CLOUDINARY_CLOUD_NAME` | images | Cloudinary |
| `CLOUDINARY_API_KEY` | images | Cloudinary |
| `CLOUDINARY_API_SECRET` | images | Cloudinary (server-only) |
| `AI_PROVIDER` | AI | `gemini` or `openai` |
| `AI_API_KEY` | AI | Provider key (server-only) |
| `AI_MODEL` | no | Model override |
| `AI_BASE_URL` | no | OpenAI-compatible base URL |
| `AI_DAILY_LIMIT` | no | Default `10` |
| `RESEND_API_KEY` | no | Contact email + admin password reset |
| `CONTACT_TO_EMAIL` | no | Inbox for contact messages |
| `CONTACT_FROM_EMAIL` | no | Verified Resend sender (also default reset sender) |

Password reset also needs `RESEND_API_KEY` and a sender; set `PASSWORD_RESET_TO_EMAIL` if the reset should go to a different inbox than `ADMIN_EMAIL`.

Never commit `.env*` (only `.env.example` is tracked).

## 6. Migrate content

Run locally against the production database (or a staging one first):

```sh
npm run migrate
```

This upserts the 32 legacy posts and uploads their covers to `abuaaisha/posts/<slug>` on Cloudinary. It is safe to re-run; it never deletes posts.

## 7. Deploy to Vercel

1. Push the repository to GitHub.
2. Import it in Vercel. Framework preset: **Next.js**. Root directory: repository root.
3. Set every environment variable above for Production (and Preview if desired).
4. Build command `npm run build`; output is handled by Next.js.
5. Vercel picks up `api/[...path].ts` as a Node function. `vercel.json` sets `maxDuration: 60` (Hobby limit) for AI requests.
6. Deploy.

`vercel.json` is intentionally minimal; add platform settings only if Vercel asks for them.

### Free-plan notes

- One function handles the whole API; cold starts are normal.
- AI is text-only to stay under the 60s limit.
- Image uploads bypass the 4.5 MB request limit by going directly to Cloudinary.
- Public pages are ISR (`revalidate = 300`) and refreshed on demand after writes, so database reads are not per-request.
- Admin pages are dynamic and `no-store`.

## 8. After deploying

1. Visit `/admin/login`, sign in with `ADMIN_EMAIL` / your password.
2. Create a draft, preview it, publish it.
3. Confirm the public listing updates (on-demand revalidation should be immediate; worst case 5 minutes).
4. Upload a cover and confirm it renders from `res.cloudinary.com`.
5. Generate an AI draft.
6. Submit the contact form.
7. Check `/sitemap.xml`, `/sitemap-index.xml`, `/index.xml`, `/robots.txt`.
8. Confirm the old redirects work.

## 9. Security checklist

- Session cookie: httpOnly, `Secure` in production, `SameSite=Lax`, 7-day expiry.
- Login is rate-limited (10 attempts / 15 min per IP); AI and contact endpoints are limited too.
- Every admin API route verifies the JWT independently of the page proxy.
- Mutating requests reject cross-site origins.
- Markdown is sanitized with `rehype-sanitize`; raw HTML is stripped.
- Errors are generic in production; stack traces stay in server logs.
- `/admin/*` sends `X-Robots-Tag: noindex` and `Cache-Control: no-store`.
- The CSP allows Cloudinary images/uploads and no third-party scripts.
- Client bundles contain no secrets (`CLOUDINARY_API_SECRET`, `AI_API_KEY`, `MONGODB_URI`, `SESSION_SECRET`, `RESEND_API_KEY` are server-only).

## 10. Rollback

- The previous Astro site is archived outside this repository (backup); restore it and deploy on Netlify if needed.
- MongoDB data and the original Markdown in `content/legacy/` are untouched by rollback.
- Cloudinary assets are only removed when you delete a post or explicitly remove its image from the admin panel.
