# Apibara Control - Implementation Plan

## Guiding principle

Build incrementally. Each phase should be small enough to review, test, and commit independently.

Do not ask Codex to build the entire system in a single task.

## Phase 0 - Repository and documentation

Deliverables:

- Git repository initialized
- `AGENTS.md`
- `/docs` documentation committed
- `.gitignore`
- basic README

Exit criteria:

- architecture and scope are documented
- no application code is required yet

## Phase 1 - Next.js foundation

Initialize:

- Next.js
- App Router
- TypeScript
- Tailwind CSS
- ESLint
- recommended package manager lockfile

Add:

- shadcn/ui foundation
- React Hook Form
- Zod

Create modular source structure without business implementation.

Exit criteria:

- app boots locally
- lint passes
- typecheck passes

## Phase 2 - Supabase foundation

Add:

- Supabase browser client
- Supabase server client
- auth/session helpers
- `.env.example`
- local `.env.local` ignored by Git
- Supabase CLI/migration structure if chosen

Do not create domain tables in this phase.

Exit criteria:

- project can connect to a development Supabase project
- secrets are not committed

## Phase 3 - Database schema

Implement first migration based on `docs/DATA_MODEL.md`.

Include:

- enums/types
- tables
- primary keys
- foreign keys
- CHECK constraints
- UNIQUE constraints
- indexes
- seed data for initial locations, products, and payment methods

Do not add broad RLS policies until schema is reviewed.

Exit criteria:

- migration applies cleanly from an empty development database
- seed data is deterministic
- schema can be recreated from migrations

## Phase 4 - Authentication and profiles

Implement:

- login
- logout
- profile loading
- role-aware navigation foundation
- protected application shell

Exit criteria:

- authenticated users can access protected routes
- inactive users are rejected
- role is available server-side

## Phase 5 - RLS and authorization

Implement RLS and server-side permission checks.

At minimum cover:

- profiles
- locations/products read access
- employee operational writes
- manager reports/adjustments
- admin configuration
- audit restrictions

Exit criteria:

- an employee cannot perform manager/admin actions even by calling endpoints directly

## Phase 6 - Catalogs

Implement:

- locations read/configuration as authorized
- products read/configuration as authorized
- payment methods seed/read

Exit criteria:

- forms use catalog data instead of hard-coded product columns

## Phase 7 - Attendance

Implement employee flows:

- check in
- check out
- current attendance status

Manager:

- attendance list
- filters by date/location/employee

Exit criteria:

- manager can answer which employee worked on a given day

## Phase 8 - Operational shifts and opening

Implement:

- detect current open shift by location
- open shift
- opening product count
- initial cash
- transactionally create shift/opening/items

Exit criteria:

- duplicate opening/open shift race is prevented by database constraints

## Phase 9 - Inventory movements and waste

Implement:

- ENTRY
- WASTE
- manager ADJUSTMENT_POSITIVE
- manager ADJUSTMENT_NEGATIVE

Include reason/notes validation.

Exit criteria:

- operation history is traceable
- employees cannot create adjustments

## Phase 10 - Transfers

Implement origin flow:

- create transfer
- choose destination
- add product quantities
- send transfer

Implement destination flow:

- pending incoming transfers
- confirm received quantities
- require notes on differences

Use transactions for confirmation.

Exit criteria:

- transfer cannot be received twice
- discrepancy state is correct
- received quantities, not sent quantities, affect destination calculations

## Phase 11 - Closing and payments

Implement:

- final product count
- Cash amount
- Yape amount
- transactional closing creation
- shift becomes CLOSED

Exit criteria:

- shift cannot close twice
- closing total is calculated from payment records

## Phase 12 - Calculated sales and management dashboard

Implement queries/views/services for:

- calculated sales per product
- opening vs closing
- entries
- sent/received transfers
- waste
- adjustments
- Cash/Yape totals

Manager dashboard:

- date filter
- location filter
- employee activity filter where appropriate

Exit criteria:

- calculations match documented formula

## Phase 13 - Audit

Implement audit strategy for critical actions.

Cover at least:

- opening
- closing
- transfer send
- transfer receive
- transfer discrepancy
- inventory adjustment
- cancellation/administrative correction

Exit criteria:

- manager can review critical operation history

## Phase 14 - Tests

Unit/business tests using Vitest:

- calculated sales
- transfer differences
- closing totals
- authorization helpers
- status transitions

Playwright critical flows:

1. employee login -> attendance -> opening -> closing
2. send transfer -> destination receives normally
3. send transfer -> destination receives with differences
4. employee cannot access manager/admin actions

Exit criteria:

- critical tests pass in CI/local workflow

## Phase 15 - Production readiness

Review:

- environment variables
- RLS
- logging
- error states
- empty states
- mobile usability
- database backups
- Vercel deployment
- Supabase production project

Create production checklist before launch.

## Recommended commit strategy

Examples:

```text
chore: initialize nextjs project
chore: configure supabase clients
feat(db): add core domain schema
feat(auth): add login and protected shell
feat(attendance): add employee check-in flow
feat(shifts): add opening workflow
feat(inventory): add waste movements
feat(transfers): add send and receive flows
feat(closing): add closing inventory and payments
feat(reports): add calculated sales dashboard
feat(audit): record critical actions
test: add critical business rule tests
```
