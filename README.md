# FareDrop Launchpad

Build a SaaS landing page + authenticated app shell for FareDrop, a product that watches flight prices on the routes you care about and emails you the moment they drop, targeted at frequent travelers, digital nomads, and families planning trips who don't want to check fare sites every day.

The site must include:

1. A public landing page (`/`) with:

   - Hero section: product name "FareDrop" prominently displayed, value prop "設定航線，票價一降就通知你。" (English subtitle: "Set your route, get an alert the moment the price drops."), and a primary CTA button labeled "Sign in / 登入" in the top-right header

   - Features section with exactly 3 feature cards:

     * Card 1: "全航線比價 (All-airline price tracking)" — covers major airlines and OTAs, prices refreshed hourly

     * Card 2: "降價立即通知 (Instant drop alerts)" — monitored in the background, you get an email the second the fare falls

     * Card 3: "歷史價格曲線 (Price history charts)" — see the seasonal pattern and know whether today's fare is actually a good deal

   - Footer with copyright "© 2026 FareDrop"

2. Authentication using Lovable's built-in Supabase-style auth (use whatever auth backend Lovable provides by default — Lovable Cloud is fine for this v1; we'll swap to a user-owned Supabase project in a later step):

   - Sign Up page with email + password

   - Sign In page with email + password

   - Sign Out functionality

   - Email confirmation can be disabled for simplicity in this v1

3. An authenticated app shell at `/app` that the user lands on after signing in:

   - Greets the signed-in user by email: "Hi {user.email}"

   - A placeholder message: "Your watchlist is coming soon. Route tracking and price alerts will be added in the next milestone."

   - A Sign Out button in the header

Design requirements:

- Modern, professional dark theme (sky-blue/cyan accent on a near-black background)

- Use Inter or a similar sans-serif font

- Mobile responsive

- Tasteful subtle animations (fade-in on scroll is fine; don't overdo it)

Out of scope for this v1: route search form, watchlist CRUD, price charts, email sending, payment, custom database tables (do NOT create a `profiles`, `routes`, or `alerts` table — only use Supabase's default `auth.users`). Those come in later milestones. Stick to landing page + auth + placeholder dashboard.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/30f65cf1-a7c3-4446-b4fc-13a8157c477d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
