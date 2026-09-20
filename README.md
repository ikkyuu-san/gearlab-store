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

Order confirmation requires both the order number and a separate cryptographically random public access token. An order number alone does not reveal order details. The token is never selected for administrator lists or detail pages.

Admin pages and Server Actions call `requireAdmin()`. That function verifies the Auth.js session, re-fetches the administrator from PostgreSQL, and requires the account to still be active. Passwords are stored only as bcrypt hashes.

Products and orders are accessed through server-side service modules. Customer information is available only from authenticated administrator routes.

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
