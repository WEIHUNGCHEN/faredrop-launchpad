# FareDrop

Flight price drop alerts — a static **Vite + React** single-page app.

## Stack

- Vite (`vite build` → `dist/`), React 19, TypeScript
- React Router for client-side routing
- Tailwind CSS v4 + shadcn/ui
- Supabase (auth) via `@supabase/supabase-js`
- TanStack Query for data fetching

There is no SSR and no server runtime: the build output is plain static files.

## Routes

| Path | Page |
| --- | --- |
| `/` | Landing page |
| `/sign-in` | Sign in |
| `/sign-up` | Sign up |
| `/auth` | Redirects to `/sign-in` |
| `/app` | Dashboard (requires a Supabase session) |
| anything else | 404 |

## Local development

```bash
bun install      # or npm install
bun run dev      # http://localhost:8080
bun run build    # static output in dist/
bun run preview
```

## Environment variables

The app talks to a Supabase project through these three variables. Vite inlines
them into the client bundle at build time, so set them in `.env` locally and in
the Vercel project's environment variables for deploys. `.env.example` lists the
shape.

```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_PROJECT_ID=
```

`VITE_SUPABASE_PUBLISHABLE_KEY` takes Supabase's publishable key
(`sb_publishable_*`) — the browser-safe, RLS-gated key that replaced the older
anon key. Never put a secret (`sb_secret_*` / service-role) key in a `VITE_`
variable; anything prefixed `VITE_` ships to the browser.

## Deploying to Vercel

`vercel.json` pins the framework to Vite, the output directory to `dist`, and adds
the SPA fallback rewrite so deep links such as `/app` are served `index.html` and
resolved by React Router on the client.
