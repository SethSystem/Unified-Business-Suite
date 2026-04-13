# PWA Universal Personalizável

## Overview

A multitenant PWA (Progressive Web App) that serves multiple businesses (barbershops, restaurants, stores, salons) each with their own branding, colors, logo, and product catalog — all from a single codebase.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + TypeScript + Vite (artifacts/pwa-app)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **QR Codes**: qrcode.react
- **Offline storage**: Dexie (IndexedDB)
- **Styling**: Tailwind CSS v4, shadcn/ui

## Architecture

### Multitenancy
- Each business (tenant) identified by a unique **slug**
- Tenant config (colors, logo, type, products) loaded at login
- Colors applied as CSS variables `--tenant-primary`, `--tenant-secondary`
- Business type adapts UI icons and labels (barbershop/restaurant/store/salon)

### PWA Features
- Offline-first with IndexedDB (Dexie) for pending sales
- Auto-sync when internet returns
- Offline indicator banner
- Install PWA prompt (beforeinstallprompt)
- QR Code receipt generation after each sale
- Web Share API for WhatsApp sharing
- Camera-based barcode scanner (demo mode)
- Speech synthesis for voice reports in Portuguese

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/pwa-app run dev` — run frontend locally

## Demo Tenants (pre-seeded)

| Slug | Business | Type |
|------|----------|------|
| `barbearia-corte-real` | Barbearia Corte Real | barbershop |
| `lancho-express` | Lancho Express | restaurant |
| `loja-moderna` | Loja Moderna | store |

## Database Schema

- **tenants** — business configs (slug, name, businessType, colors, logo)
- **products** — product catalog per tenant (name, price, category, barcode, stock)
- **sales** — sale records with JSONB items array (tenantId, items, totalAmount, paymentMethod)

## API Routes

All under `/api`:
- `/tenants` — CRUD for tenants
- `/tenants/slug/:slug` — lookup by slug (used at login)
- `/tenants/:id/products` — product catalog
- `/tenants/:id/sales` — sales records
- `/tenants/:id/dashboard` — today/week/month summary
- `/tenants/:id/dashboard/recent` — last 10 sales
- `/tenants/:id/dashboard/top-products` — top selling products

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
