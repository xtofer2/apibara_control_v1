# Revisión de arquitectura V1

Esta revisión registra los puntos que deben resolverse antes de crear la primera migración. No amplía el alcance funcional del producto.

## Hallazgos por severidad

### Alta

1. **Las relaciones no garantizan que los turnos de una transferencia pertenezcan a las sedes declaradas.** Una clave foránea simple permite asociar `origin_work_shift_id` o `destination_work_shift_id` con una sede distinta. La migración debe proteger esta coherencia mediante claves compuestas o validación transaccional en base de datos.
2. **La integridad del ciclo de vida no está completamente expresada.** `work_shifts.status`, `opened_at` y `closed_at` pueden contradecirse; lo mismo ocurre entre el estado de una transferencia y sus metadatos de envío, recepción o cancelación. Se requieren restricciones de estado coherentes.
3. **La unidad de producto no puede validarse con un `CHECK` aislado en las tablas de items.** La regla que exige enteros para productos `UNIT` depende del catálogo. Debe aplicarse en el servicio y en la base de datos, probablemente con un trigger reutilizable.
4. **No está definido el alcance de empleados por sede.** Los roles existen, pero el modelo no indica si un empleado puede operar cualquier sede. Esta decisión es necesaria antes de diseñar RLS.

### Media

5. **La fecha operativa necesita una zona horaria explícita.** `operational_date` y `attendance.work_date` deben derivarse usando `America/Lima`, no la zona implícita del cliente o de la sesión SQL.
6. **La recepción tardía de transferencias necesita una regla de turno destino.** El origen puede cerrar mientras el envío está en tránsito, pero falta definir qué turno destino recibe el movimiento y si debe estar abierto.
7. **La cancelación de transferencias está subespecificada.** Deben fijarse estados de origen permitidos, roles autorizados y efecto sobre inventario antes de implementar la restricción.
8. **`updated_at` no se actualiza automáticamente.** Las tablas documentadas requieren un trigger común o actualizaciones disciplinadas desde todos los servicios.
9. **La completitud de aperturas y cierres no está garantizada.** Debe decidirse si cada confirmación exige exactamente un item por producto activo y cómo se conserva el catálogo aplicable al momento de la operación.

### Baja

10. **Los motivos de merma están recomendados pero no normalizados.** Conviene decidir entre enum y catálogo antes de la migración para poder exigir notas cuando el motivo sea `OTHER`.
11. **La auditoría aparece después de los flujos sensibles en el plan.** La estrategia mínima de auditoría debe definirse junto con cada operación crítica para evitar reconstruir contexto perdido más adelante.

## Correcciones recomendadas

- Diseñar las operaciones de apertura, cierre, envío y recepción como funciones transaccionales o servicios con garantías equivalentes en PostgreSQL.
- Incorporar restricciones de coherencia de estados y timestamps desde la primera migración.
- Validar cantidades en dos capas: Zod/servicio para mensajes útiles y PostgreSQL para integridad.
- Documentar antes de RLS el alcance por sede y añadir una relación de asignación solo si el negocio la confirma.
- Centralizar la fecha operativa con `America/Lima` y timestamps generados por servidor.
- Definir recepción tardía, cancelación, catálogo aplicable y auditoría mínima antes de implementar sus fases.

## Secuencia de implementación

1. Fundación Next.js y estructura modular.
2. Clientes y configuración de Supabase sin tablas de dominio.
3. Decisiones pendientes de integridad y primera migración revisable.
4. Autenticación, perfiles, RLS y autorización server-side.
5. Catálogos y asistencia.
6. Turnos y apertura.
7. Movimientos, mermas y ajustes.
8. Transferencias.
9. Cierre, pagos y ventas calculadas.
10. Reportes, auditoría integral y pruebas críticas.
