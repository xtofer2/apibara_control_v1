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

## Acceso al sistema

Los usuarios se crean en Supabase Auth. Al crear una cuenta, la base de datos genera automáticamente su perfil operativo con rol `EMPLOYEE`; un administrador puede asignar después el rol y estado correspondientes.

La Fase 4 incluye:

- inicio y cierre de sesión con Supabase Auth
- rutas del panel protegidas en servidor
- rechazo de perfiles inactivos o inexistentes
- navegación preparada según los roles `EMPLOYEE`, `MANAGER` y `ADMIN`

Las credenciales locales deben permanecer únicamente en `.env.local`.

## Verificación

```bash
npm run lint
npm run typecheck
npm run build
```

## Arquitectura

La aplicación usa Next.js con App Router, TypeScript, Tailwind CSS y shadcn/ui. La lógica se organiza por dominio en `src/features`; el acceso a datos y las reglas de negocio permanecerán fuera de los componentes de presentación.

Antes de desarrollar una fase, leer `AGENTS.md`, los documentos de `docs/` y la [revisión de arquitectura](docs/ARCHITECTURE_REVIEW.md).

La infraestructura SSR de Supabase, el esquema inicial de PostgreSQL y el acceso autenticado al panel ya están preparados. Los permisos detallados por dominio y sus políticas RLS se incorporarán de forma incremental en las siguientes fases.
