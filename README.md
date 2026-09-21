# GearLab

GearLab is a monochrome, premium gaming gear and tech accessories store for customers in Myanmar. Products are sourced from Thailand and currently support preorder-style checkout.

## Current system

- Next.js App Router with TypeScript and Tailwind CSS
- PostgreSQL / Neon database through Prisma
- Database-backed product catalog and product detail views
- Guest cart persisted in browser localStorage
- Guest checkout with server-side product, price, quantity, and availability validation
- Atomic Order and OrderItem creation with historical product name/price snapshots
- Cryptographically protected public order confirmation links
- Auth.js administrator authentication with bcrypt password hashing and JWT sessions
- PostgreSQL-backed administrator revalidation on every protected page and mutation
- Authenticated product Create, Read, Update, and Delete operations
- Authenticated order list, order details, and status management
- Serverless-compatible Upstash Redis rate limiting for admin login and guest order creation
- Security headers configured in Next.js for browser hardening, with stricter no-referrer handling on order confirmation pages
- Structured server-side logging with an allowlisted, non-sensitive event context

## Local development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and configure the variables below.

3. Generate the Prisma client and apply existing migrations:

   ```bash
   npm run db:generate
   npx prisma migrate deploy
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Required:

- `DATABASE_URL` — PostgreSQL/Neon connection string. Server-only.
- `AUTH_SECRET` — long random Auth.js signing secret. Server-only.
- `ADMIN_EMAIL` — used only by the local admin bootstrap script.
- `ADMIN_PASSWORD` — used only by the local admin bootstrap script; it is hashed before storage.

Required before production traffic:

- `UPSTASH_REDIS_REST_URL` — Upstash Redis REST endpoint.
- `UPSTASH_REDIS_REST_TOKEN` — Upstash Redis REST token.

The rate limiter uses Upstash Redis because Vercel/serverless instances do not share process memory. Login and checkout requests fail safely in production if the rate-limiter variables are not configured. Local development can run without them.

Never commit `.env`, `.env.local`, credentials, tokens, or database connection strings. Environment files are ignored by Git. `.env.example` contains placeholders only.

## Security architecture

Public checkout sends only product IDs, quantities, and customer form data. The server validates the request, re-fetches products and prices from PostgreSQL, calculates totals, rejects unavailable products, and creates the order atomically in a Prisma transaction.

Order confirmation requires both the order number and a separate cryptographically random public access token. New checkout requests set the token in a scoped HttpOnly cookie on the server before redirecting to a clean `/order/[orderNumber]` path. Legacy `?token=` links are accepted only through a client-side exchange bridge and are removed from the URL before confirmation data is loaded. An order number alone does not reveal order details. The token is never selected for administrator lists or detail pages.

Admin pages and Server Actions call `requireAdmin()`. That function verifies the Auth.js session, re-fetches the administrator from PostgreSQL, and requires the account to still be active. Passwords are stored only as bcrypt hashes.

Products and orders are accessed through server-side service modules. Customer information is available only from authenticated administrator routes.

The project intentionally keeps Auth.js at the existing beta version and Prisma at the existing 6.19.3 version for compatibility. The previously audited `deepmerge-ts` advisory is transitive Prisma CLI/configuration tooling, not a public runtime code path; it remains documented as an accepted temporary dependency risk until a compatible Prisma fix is available.

The structured logger only accepts safe operational fields such as event code, route label, status code, and retryability. It must not receive passwords, tokens, customer contact details, addresses, database errors, or environment values.

## Useful scripts

```bash
npm run dev              # Development server
npm run lint             # ESLint
npm run build            # Production build and TypeScript checks
npm run db:generate      # Generate Prisma client
npm run db:validate      # Validate Prisma schema
npm run db:format        # Format Prisma schema
npm run db:seed          # Upsert the mock catalog
npm run db:seed:admin    # Configure the local admin from env values
npm run db:verify        # Verify the product catalog without printing raw errors
npm run db:test:crud     # Run the non-destructive product CRUD check
```

## Main structure

```text
src/app/                 Next.js routes, pages, and Server Actions
src/components/          Shared visual components
src/features/cart/       Guest cart state and utilities
src/features/products/   Product presentation and catalog components
src/lib/                 Prisma and shared infrastructure, including rate limiting
src/server/              Server-only product, order, and authorization services
prisma/                  Schema, migrations, seed, and verification scripts
public/                  Static brand and demo assets
```

The public storefront visual design remains intentionally separate from the server-side data and security layers.
