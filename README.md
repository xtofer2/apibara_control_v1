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

La Fase 5 añade políticas RLS y comprobaciones server-side para separar operaciones de empleados, supervisión gerencial y configuración administrativa. La matriz completa está en `docs/PHASE_5_AUTHORIZATION.md`.

La Fase 6 incorpora catálogos reales de sedes, productos y métodos de pago. Los usuarios activos pueden consultarlos y los administradores pueden crear, editar, activar o desactivar sedes y productos sin borrado físico.

La Fase 7 incorpora entrada y salida de asistencia con timestamps de servidor, una sola jornada abierta por usuario y consulta gerencial filtrable por fecha, sede y empleado.

La Fase 8 incorpora la apertura transaccional de turnos con efectivo físico y un conteo inicial obligatorio para cada producto activo.

La Fase 9 incorpora entradas, mermas y ajustes gerenciales como movimientos transaccionales e inmutables dentro de turnos abiertos.

La Fase 10 incorpora envío y recepción transaccional de transferencias entre sedes, incluyendo cantidades reales y diferencias auditables.

La Fase 11 incorpora el cierre transaccional del turno con conteo físico final y pagos separados en efectivo y Yape.

La Fase 12 incorpora ventas calculadas por producto y un tablero gerencial de conciliación por fecha, sede y participación de empleado, sin persistir ventas ni totales redundantes.

La Fase 13 incorpora auditoría inmutable para operaciones críticas y cambios administrativos, con consulta gerencial filtrable por fecha, acción y responsable.

La Fase 14 incorpora pruebas unitarias de reglas de negocio con Vitest y recorridos críticos E2E con Playwright, ejecutables localmente y en GitHub Actions.

Las credenciales locales deben permanecer únicamente en `.env.local`.

## Verificación

```bash
npm run lint
npm run typecheck
npm run build
npm run db:test
npm run test:unit
npm run test:e2e
```

Las pruebas E2E requieren Docker. El comando inicia Supabase local si es necesario, reinicia la base antes de cada escenario y conserva trazas únicamente cuando una prueba falla.

## Arquitectura

La aplicación usa Next.js con App Router, TypeScript, Tailwind CSS y shadcn/ui. La lógica se organiza por dominio en `src/features`; el acceso a datos y las reglas de negocio permanecerán fuera de los componentes de presentación.

Antes de desarrollar una fase, leer `AGENTS.md`, los documentos de `docs/` y la [revisión de arquitectura](docs/ARCHITECTURE_REVIEW.md).

La infraestructura SSR de Supabase, el esquema inicial de PostgreSQL y el acceso autenticado al panel ya están preparados. Los permisos detallados por dominio y sus políticas RLS se incorporarán de forma incremental en las siguientes fases.
