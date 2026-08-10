# Apibara Control

Sistema web interno para controlar la operación diaria de Mi Negocio Apibara.

## Requisitos

- Node.js 22 o superior
- npm 10 o superior

## Desarrollo local

```bash
npm install
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

## Configuración de Supabase

1. Copiar `.env.example` a `.env.local`.
2. Completar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` desde el diálogo **Connect** del proyecto Supabase.
3. Iniciar la aplicación con `npm run dev`.

Para levantar la pila local de Supabase se requiere Docker:

```bash
npm run supabase:start
npm run db:reset
npm run supabase:stop
```

La configuración del CLI está en `supabase/config.toml`. Las migraciones futuras se guardarán en `supabase/migrations/`.

## Verificación

```bash
npm run lint
npm run typecheck
npm run build
```

## Arquitectura

La aplicación usa Next.js con App Router, TypeScript, Tailwind CSS y shadcn/ui. La lógica se organiza por dominio en `src/features`; el acceso a datos y las reglas de negocio permanecerán fuera de los componentes de presentación.

Antes de desarrollar una fase, leer `AGENTS.md`, los documentos de `docs/` y la [revisión de arquitectura](docs/ARCHITECTURE_REVIEW.md).

La infraestructura SSR de Supabase ya está preparada. El esquema de PostgreSQL y la interfaz de autenticación se incorporarán en las fases siguientes del plan de implementación.
