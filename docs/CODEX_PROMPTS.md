# Apibara Control - Suggested Codex Prompts

Use these prompts sequentially. Do not skip directly to the full product implementation.

## Prompt 1 - Architecture review

```text
Read AGENTS.md and every document inside /docs.

Do not implement anything yet.

Review the proposed architecture and data model for Apibara Control.

Identify:
- contradictions
- missing constraints
- dangerous assumptions
- places where the schema does not match the documented business rules

Do not invent new business features.

Return:
1. findings ordered by severity
2. recommended fixes
3. the implementation sequence you would follow
```

## Prompt 2 - Initialize Next.js

```text
Read AGENTS.md and /docs first.

Initialize the project using Next.js App Router + TypeScript + Tailwind.

Configure the base dependencies documented for the project.

Create only the initial modular folder structure.

Do not implement business screens.
Do not create Supabase domain tables yet.

At the end:
- run lint
- run typecheck
- report changed files
- report any decisions you had to make
```

## Prompt 3 - Supabase infrastructure

```text
Read AGENTS.md and /docs first.

Implement only the Supabase application infrastructure.

Add:
- browser client
- server client
- environment variable validation/documentation
- .env.example
- migration directory/tooling

Do not create domain tables yet.
Do not implement authentication UI yet.

Never commit secrets.

Run lint and typecheck when finished.
```

## Prompt 4 - Database migration

```text
Read AGENTS.md and docs/DATA_MODEL.md carefully.

Create the first PostgreSQL/Supabase migration for the V1 data model.

Before editing, inspect the documented model and note any schema inconsistency that would prevent a safe implementation.

Implement:
- enums/types
- tables
- primary keys
- foreign keys
- CHECK constraints
- UNIQUE constraints
- indexes
- seed data for locations, products and payment methods

Use UUID primary keys.
Use timestamptz for timestamps.
Use numeric for money/quantities where documented.

Do not implement broad RLS yet.
Do not invent new tables unless strictly necessary; if one is necessary, explain why before adding it.

Afterward validate that the migration can be applied cleanly.
```

## Prompt 5 - Authentication

```text
Read AGENTS.md and /docs first.

Implement authentication and the application profile layer.

Scope:
- login
- logout
- protected application layout
- current profile loading
- inactive user rejection
- role-aware navigation foundation

Do not implement attendance, opening, inventory or transfer workflows yet.

Keep authorization checks server-side.
Run lint/typecheck/tests when finished.
```

## Prompt 6 - Continue phase-by-phase

```text
Read AGENTS.md and docs/IMPLEMENTATION_PLAN.md.

Implement only Phase <N>.

Before changing code:
- inspect existing implementation
- confirm dependencies from previous phases are present
- identify any mismatch with the documented business rules

Do not work on later phases.

At the end:
- run relevant checks/tests
- summarize changed files
- summarize implemented behavior
- list remaining items for this phase, if any
```
