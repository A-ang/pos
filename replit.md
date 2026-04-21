# Workspace

## Overview

Web POS & Manajemen Rental Mobil — a full-stack car rental management system. Built with React + Vite frontend, Go backend, and PostgreSQL.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Go net/http
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Auth**: Session-based / cookie-based scaffold on Go backend
- **Frontend**: React + Vite + TanStack Query + wouter + shadcn/ui + Recharts

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `go run ./apps/api-go/cmd/server` — run Go API server locally

## Project Structure

- `apps/web/` — React + Vite frontend (served at `/`)
- `apps/api-go/` — Go API backend (served at `/api`)
- `apps/api-node/` — legacy Node backend snapshot, for reference/migration only
- `apps/mockup/` — UI sandbox/mockup area
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth)
- `lib/api-client-react/` — Generated React Query hooks
- `lib/api-zod/` — Generated Zod validation schemas
- `lib/db/` — Drizzle ORM schema + client

## Features

- Fleet management (armada) — internal & external (mitra) units
- Customer management (pelanggan) — KTP/SIM docs
- Booking system (reservasi) — check-in/check-out with KM tracking
- POS & Transactions (transaksi) — invoices, cash/transfer/QRIS payment
- Reports (laporan) — revenue charts, vehicle utilization, partner profit sharing
- User management with RBAC (admin/staff/owner roles)
- Maintenance log tracking

## Default Login

- **Admin**: username `admin`, password `admin123`
- **Staff**: username `budi`, password `admin123`
- **Owner**: username `mitra1`, password `admin123`

## API Notes

- PostgreSQL is the primary database service for local development
- Go backend is now the main backend target for frontend integration
