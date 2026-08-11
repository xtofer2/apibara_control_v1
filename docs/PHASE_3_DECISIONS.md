# Decisiones de integridad para la Fase 3

Este documento cierra únicamente las decisiones necesarias para crear el esquema V1. No añade funcionalidades nuevas.

## Decisiones aplicadas

1. **Relación sede–turno en transferencias.** Los turnos se referencian mediante claves foráneas compuestas `(work_shift_id, location_id)`. Así, un turno de origen o destino no puede pertenecer a otra sede.
2. **Fecha operativa.** `work_shifts.operational_date` y `attendance.work_date` deben coincidir con sus timestamps usando `America/Lima`. Los timestamps siguen siendo `timestamptz` generados por PostgreSQL.
3. **Estados y timestamps.** Restricciones `CHECK` impiden combinaciones incoherentes en turnos y transferencias. Los cambios de estado de transferencias también se validan mediante trigger.
4. **Cancelación V1.** Solo una transferencia `PENDING` puede pasar a `CANCELLED`. Cancelar después del envío requeriría una reversión de inventario que no está definida en V1.
5. **Recepción tardía.** Una transferencia enviada puede permanecer en tránsito aunque cierre el turno de origen. Al recibirla debe asignarse un turno abierto perteneciente a la sede destino.
6. **Cantidades por unidad.** Los productos `UNIT` solo aceptan cantidades enteras en aperturas, movimientos, transferencias y cierres. Los productos `LITER` aceptan hasta tres decimales.
7. **Motivos de merma.** Se conserva `reason` como texto, restringido para `WASTE` a `DAMAGED`, `DROPPED`, `PREPARATION`, `EXPIRED` u `OTHER`. `OTHER` exige notas.
8. **Ajustes.** Los movimientos de ajuste exigen motivo y notas. La restricción por rol se implementará en servidor y RLS en la Fase 5.
9. **Actualizaciones.** Las tablas que incluyen `updated_at` usan un trigger común para actualizarlo con tiempo del servidor.
10. **RLS seguro por defecto.** RLS queda habilitado sin políticas. Por tanto, las claves públicas no pueden acceder a las tablas hasta implementar las políticas revisadas en la Fase 5.
11. **Datos iniciales.** Sedes, productos y medios de pago usan UUID fijos dentro de la migración para que cualquier entorno se reconstruya con los mismos identificadores.

## Decisiones diferidas

- No se crea una tabla de asignación empleado–sede porque el alcance por sede todavía no está definido.
- La obligación de incluir exactamente todos los productos activos en una apertura o cierre se aplicará en las operaciones transaccionales de sus fases. El catálogo puede cambiar y el modelo todavía no define snapshots de catálogo.
- La escritura automática de eventos en `audit_logs` se añadirá junto con cada operación crítica para conservar su contexto de negocio.
- No se crean políticas RLS permisivas en esta fase.
