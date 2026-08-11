# Autorización y RLS — Fase 5

## Alcance operativo por sede

V1 no asigna empleados permanentemente a una sede. Un empleado activo puede trabajar en cualquiera de las sedes activas y selecciona la sede al iniciar su operación. Esta decisión evita inventar una relación empleado–sede que no existe en los requisitos actuales.

Si el negocio incorpora empleados restringidos por sede, deberá añadirse una relación explícita y revisarse esta matriz antes de producción.

## Matriz de permisos

### EMPLOYEE

- Lee su propio perfil y los catálogos activos.
- Lee turnos abiertos y los registros operativos que creó o en los que participó.
- Registra su propia asistencia.
- Puede abrir/cerrar turnos y registrar aperturas/cierres con su propia identidad.
- Registra entradas y mermas, pero no ajustes.
- Crea, envía y recibe transferencias con su propia identidad.
- No administra catálogos, perfiles ni roles.
- No consulta auditoría global.

### MANAGER

Incluye los permisos de EMPLOYEE y además:

- Lee perfiles y toda la operación para reportes.
- Lee asistencia y auditoría global.
- Crea ajustes positivos y negativos.
- Revisa discrepancias de transferencias.
- No administra roles ni catálogos.

### ADMIN

Incluye los permisos de MANAGER y además:

- Actualiza nombre, rol y estado de perfiles.
- Crea y actualiza sedes, productos y métodos de pago.
- No realiza borrado físico de configuración u operaciones.

## Principios aplicados

- Una cuenta inactiva conserva únicamente lectura de su propio perfil para poder mostrar el motivo del rechazo.
- `anon` no recibe privilegios sobre tablas de negocio.
- Las operaciones confirmadas no tienen políticas `DELETE`.
- Las políticas validan que `created_by`, `sent_by`, `received_by` o `user_id` coincidan con `auth.uid()`.
- Las decisiones transaccionales completas permanecen en los servicios de sus fases funcionales; RLS es defensa en profundidad, no reemplazo de las reglas de negocio.
- La cancelación de transferencias permanece bloqueada hasta definir su regla funcional.
- Los eventos de auditoría no aceptan escritura directa desde clientes autenticados; se crearán desde operaciones controladas.
