# GearLab

GearLab is a production-oriented, full-stack gaming gear and tech accessories preorder e-commerce application for customers in Myanmar, with products sourced from Thailand.

## Live Demo

**[Visit the GearLab live store](https://gearlab-store.vercel.app)**

## Tech Stack

- **Frontend:** Next.js App Router, TypeScript, Tailwind CSS
- **Database:** PostgreSQL hosted on Neon, accessed with Prisma
- **Authentication:** Auth.js credentials provider for administrators
- **Rate limiting:** Upstash Redis
- **Product media:** Vercel Blob
- **Hosting:** Vercel

## Key Features

- Database-backed product catalog with product detail views, search, and category filtering
- Admin-managed product images stored in Vercel Blob
- Guest shopping cart persisted in the customer’s browser
- Guest checkout with server-side validation of products, prices, quantities, and availability
- Inventory tracking, stock limits, preorder capacity limits, and out-of-stock protection
- Standard delivery details, with timing and any delivery charge confirmed separately
- Secure customer order confirmation and tracking; an order number alone does not grant access
- Administrator authentication with active-account checks and protected admin pages/actions
- Product management, including create/edit, archive/unarchive, safe deletion, and image management
- Order list and detail views, searchable by order number, customer name, or phone
- Admin order-status workflow and manual `UNPAID` / `PAID` status management; no online payments are processed
- Historical order-item name and price snapshots
- Login and checkout rate limiting backed by Upstash Redis
- Customer information pages: Preorder & Shipping, Privacy, Terms, and Contact

Customer accounts are not required; checkout and order tracking are guest-based.

## Architecture

GearLab uses the Next.js App Router for public and admin pages, with server-rendered data access and Server Actions for protected mutations. Server-side service modules keep database access, validation, and business rules separate from UI components. Prisma connects to PostgreSQL on Neon. Auth.js protects administrator access, Upstash Redis provides serverless-compatible rate limiting, and Vercel Blob stores managed product images. The application is built and hosted on Vercel.

Checkout sends product IDs and quantities rather than authoritative prices. The server reloads product data, checks availability and capacity, calculates totals, and creates the order and historical item snapshots in a database transaction.

## Local Development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and set the required environment variables for a development database and the services you intend to test. Never use production credentials for local experiments.

3. Generate Prisma Client and apply the committed migrations to the database configured for this environment:

   ```bash
   npm run db:generate
   npx prisma migrate deploy
   ```

4. Start Next.js:

   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000).

To configure the initial administrator, set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in the local environment and run `npm run db:seed:admin`. This is a setup/bootstrap operation; those variables are not required for normal administrator sign-in. Passwords are hashed before storage.

## Environment Variable Names

Configure values through a local ignored environment file or your deployment provider. Do not put values in source control.

Required for application runtime:

- `DATABASE_URL` — PostgreSQL/Neon connection string; server-only.
- `AUTH_SECRET` — Auth.js signing secret; server-only.

Required for production rate limiting:

- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` — shared Redis rate limits for administrator login and checkout.

Required for managed product-image uploads:

- `BLOB_READ_WRITE_TOKEN` — server-side access to Vercel Blob.

Bootstrap only:

- `ADMIN_EMAIL` and `ADMIN_PASSWORD` — used by `npm run db:seed:admin` to configure an administrator; not needed for normal runtime after setup.

The environment-variable values are intentionally omitted. `.env` and `.env.local` are ignored by Git; `.env.example` contains placeholders only.

## Security

- Admin pages and mutations require server-side authorization; active administrator records are rechecked against PostgreSQL.
- Passwords are stored as bcrypt hashes, and authentication secrets remain server-only.
- Guest order details are protected by an order-specific HttpOnly cookie. New checkout confirmation URLs omit the access token; compatible legacy token links exchange it for a scoped cookie and remove it before order details load. The order number alone reveals no order details.
- Checkout revalidates product data and creates orders atomically; rate limiting uses shared Upstash Redis rather than in-memory state.
- Security headers are configured in Next.js. Server logs use a structured, non-sensitive event context.

Dependency note: the project retains its compatible Auth.js beta line. The previously reviewed `deepmerge-ts` advisory is in Prisma CLI/configuration tooling rather than the deployed public runtime and remains an accepted tooling risk pending a compatible upstream fix.

## Project Structure

```text
src/app/                 Public/admin routes, pages, and Server Actions
src/components/site/     Shared storefront layout and information-page components
src/features/cart/       Guest cart state, types, and utilities
src/features/products/   Product catalog and presentation components
src/lib/                 Shared infrastructure, Prisma client, and rate limiting
src/server/              Server-side product, order, and authorization services
prisma/                  Database schema, migrations, seed, and verification scripts
public/                  Static brand and demonstration assets
```

## Useful Commands

```bash
npm run dev                 # Start the local development server
npm run lint                # Run ESLint
npm run build               # Generate Prisma Client and build for production
npx tsc --noEmit            # Run a TypeScript check
npm run db:validate         # Validate the Prisma schema
npm run db:generate         # Generate Prisma Client
npm run db:test:crud        # Test product CRUD and archive safety
npm run db:test:inventory   # Test stock and preorder limits
npm run db:test:security    # Test order access and security behavior
npm run db:test:product-images # Test managed product image behavior
```
