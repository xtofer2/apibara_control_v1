# Apibara Control - Agent Instructions

## Project

Apibara Control is an internal operational control system for Mi Negocio Apibara.

The system manages:

- employees
- locations
- attendance
- operational shifts
- opening inventory
- closing inventory
- inventory movements
- waste
- transfers between locations
- transfer reception confirmation
- cash closing
- management reports
- auditing

## Tech stack

Use:

- Next.js with App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Hook Form
- Zod
- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Row Level Security

Testing:

- Vitest for unit/business logic tests
- Playwright for critical end-to-end flows

Deployment:

- Vercel
- Supabase Cloud

## Architecture

Organize business logic by domain.

Preferred domains:

- auth
- employees
- locations
- products
- attendance
- shifts
- inventory
- transfers
- waste
- cash
- reports
- audit

Do not place business logic directly inside React components.

Preferred flow:

UI
-> Server Action / Route Handler
-> Domain service
-> Database

Use Server Components by default.

Use Client Components only when browser-side interactivity is required.

Keep database access and business rules outside presentational UI components.

## Suggested source structure

```text
src/
├── app/
│   ├── (auth)/
│   └── (dashboard)/
├── features/
│   ├── auth/
│   ├── attendance/
│   ├── shifts/
│   ├── inventory/
│   ├── transfers/
│   ├── waste/
│   ├── cash/
│   ├── employees/
│   └── reports/
├── components/
│   └── ui/
├── lib/
│   ├── supabase/
│   ├── validations/
│   └── utils/
├── server/
│   ├── services/
│   └── repositories/
└── types/
```

## Database principles

PostgreSQL is the source of truth.

Prefer:

- foreign keys
- check constraints
- unique constraints
- transactions
- indexes
- server-generated timestamps

Important business integrity must not depend only on frontend validation.

Use Supabase RLS for authorization.

Do not hard-delete confirmed operational transactions.

Corrections must preserve audit history.

Use migrations for every database change.

Never make production-only manual schema changes that are not represented in migrations.

## Business rules

A location can have only one open operational shift at a time.

A shift has exactly one opening and at most one closing.

A completed shift cannot receive ordinary operational modifications.

Transfers require confirmation by the destination location.

Transfer lifecycle:

PENDING
-> SENT
-> RECEIVED

or:

SENT
-> RECEIVED_WITH_DIFFERENCES

The origin inventory is affected when the transfer is sent.

The destination inventory is affected when the destination employee confirms reception.

Received quantities may differ from sent quantities.

Differences require an observation and must remain auditable.

Waste decreases inventory and must include a reason.

Inventory adjustments are restricted to manager/admin roles.

Do not treat inventory activity as employee attendance.

Attendance is managed separately.

## Payments

V1 supports:

- CASH
- YAPE

Opening records only initial physical cash.

Closing records CASH and YAPE separately.

Do not store a redundant closing total.

Calculate totals from closing payment records.

## Products

Initial products:

- Empanada Clasica - UNIT
- Empanada Pizza - UNIT
- Empanada Full Queso - UNIT
- Api Morado - LITER
- Api Blanco - LITER
- Emoliente - LITER

UNIT products require integer quantities.

LITER products may use decimal quantities.

Do not create one database column per product.

Products must be modeled as catalog data.

## Important V1 limitation

Individual sales are not recorded during the day.

Therefore exact real-time physical stock cannot be known.

Sales are calculated after closing using:

opening
+ entries
+ confirmed transfers received
+ positive adjustments
- transfers sent
- waste
- negative adjustments
- closing inventory

Do not implement validations that assume exact real-time stock is known.

## Security

Never expose Supabase service-role credentials to the browser.

Do not commit secrets.

Use `.env.local` for local secrets and provide `.env.example` with placeholders only.

Authorization rules must be enforced server-side and, where appropriate, with RLS.

## Development approach

Do not implement the entire application in one task.

Work incrementally.

Before significant changes:

1. inspect existing code
2. explain the intended change
3. implement the smallest coherent unit
4. run lint/typecheck/tests
5. report changed files and remaining work

Do not change architectural decisions without explicitly explaining why.

When requirements are ambiguous, prefer preserving data integrity and auditability.
