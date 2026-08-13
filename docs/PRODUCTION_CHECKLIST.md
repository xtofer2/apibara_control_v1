# Apibara Control - Checklist de producción

Este documento es la puerta de salida a producción. Ningún cambio manual en la base remota sustituye una migración versionada.

## Estado técnico de la Fase 15

- [x] Las únicas variables requeridas por la aplicación están documentadas en `.env.example` y validadas con Zod.
- [x] Ninguna credencial `service_role` se usa en el frontend ni en el servidor web.
- [x] Todas las tablas de negocio tienen RLS; la suite SQL comprueba RLS, acceso anónimo y restricciones de escritura.
- [x] Los errores no controlados del servidor generan eventos JSON en los logs con ruta sin query string y `digest`, sin incluir secretos ni cuerpos de solicitud.
- [x] Existen estados de error recuperables, página 404 y estados vacíos en los flujos operativos.
- [x] La navegación del panel funciona como una fila horizontal desplazable en pantallas pequeñas y conserva objetivos táctiles de al menos 44 px.
- [x] `GET /api/health` responde `200` si la configuración obligatoria existe y `503` si falta, sin revelar valores.
- [x] CI verifica lint, pruebas unitarias, pruebas SQL, tipos, build y recorridos E2E.
- [ ] Crear y configurar los recursos externos de producción siguiendo las secciones siguientes.

## 1. Responsables y criterios de recuperación

- [ ] Nombrar a una persona responsable del despliegue y otra de la validación.
- [ ] Definir RPO (máxima pérdida de datos aceptable): `__________`.
- [ ] Definir RTO (tiempo máximo para recuperar el servicio): `__________`.
- [ ] Registrar el canal de incidentes y contactos: `__________`.
- [ ] Elegir el plan de Supabase que cubra el RPO, la retención y la continuidad requerida.

## 2. Proyecto Supabase de producción

- [x] Crear un proyecto independiente de desarrollo y elegir una región cercana a Lima.
- [ ] Guardar el `project ref` en el gestor de secretos del equipo, no en Git.
- [ ] Verificar en **Database > Backups** que el plan tenga respaldos activos y retención suficiente.
- [ ] Habilitar Point-in-Time Recovery si el RPO no permite perder hasta un día de operaciones.
- [ ] Programar una restauración de prueba y documentar duración, responsable y resultado.
- [x] En **Authentication > URL Configuration**, establecer la URL HTTPS final como `Site URL` y registrar únicamente los redirects necesarios. En producción se prefieren URLs exactas.
- [x] Deshabilitar el registro público después de crear/invitar a los usuarios autorizados; Apibara Control es un sistema interno.
- [ ] Definir una política de contraseñas acorde con la organización y revisar expiración de sesiones.
- [ ] Configurar SMTP propio si se usarán invitaciones, recuperación de contraseña o confirmaciones por correo.
- [x] Crear un primer administrador de forma controlada y comprobar que su perfil quede activo con rol `ADMIN`.

Referencias oficiales: [migraciones de Supabase](https://supabase.com/docs/guides/deployment/database-migrations), [checklist de producción](https://supabase.com/docs/guides/deployment/going-into-prod), [redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls) y [respaldos](https://supabase.com/docs/guides/platform/backups).

## 3. Migraciones y controles de base de datos

Ejecutar desde una estación autorizada y con el repositorio en el commit aprobado:

```bash
npx supabase login
npx supabase link --project-ref <PROJECT_REF>
npx supabase migration list
npx supabase db push --dry-run
npx supabase db push
```

- [x] Confirmar que `migration list` no muestre divergencias inesperadas.
- [x] Revisar el plan de `db push --dry-run` antes de aplicar.
- [x] Aplicar una sola vez y guardar el log del despliegue.
- [x] No ejecutar `db reset`, seeds E2E ni pruebas destructivas contra producción.
- [x] Verificar que las ubicaciones, productos y métodos de pago iniciales estén presentes.
- [ ] Ejecutar el Security Advisor de Supabase y resolver hallazgos antes del lanzamiento.
- [ ] Mantener las correcciones de datos como operaciones auditables; no borrar transacciones confirmadas.

## 4. Proyecto Vercel

- [x] Importar `xtofer2/apibara_control_v1` y usar `main` como rama de producción.
- [x] Confirmar Node.js 22 o superior y los comandos detectados: instalación `npm ci`, build `npm run build`.
- [x] Configurar en **Production** y, si corresponde, **Preview**:

| Variable | Valor | Secreta |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase del entorno | No, pero debe administrarse en Vercel |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key del mismo proyecto | No |

- [x] No crear `SUPABASE_SERVICE_ROLE_KEY` para esta aplicación.
- [x] Asignar el dominio final, HTTPS y DNS.
- [ ] Desplegar primero una Preview conectada al entorno de prueba, nunca a datos de producción para E2E destructivo.
- [x] Promover el commit aprobado a Production.
- [x] Confirmar que `GET https://<dominio>/api/health` responda `200`.

Referencia oficial: [entornos y variables de Vercel](https://vercel.com/docs/environment-variables).

## 5. Pruebas de aceptación en producción

Usar datos identificados como prueba y retirarlos o desactivarlos de forma auditable al terminar.

- [ ] Un usuario inexistente/inactivo no puede entrar.
- [ ] Empleado: login, asistencia, apertura, movimiento/merma y cierre.
- [ ] Transferencia: envío, recepción exacta, recepción con diferencias y rechazo de doble recepción.
- [ ] Gerente: reportes calculados y auditoría.
- [ ] Empleado: bloqueo de ajustes, reportes gerenciales y configuración administrativa.
- [ ] Administrador: catálogos y gestión autorizada.
- [ ] Verificar los flujos en móvil real o viewport de 390 x 844 sin desbordamiento de página.
- [ ] Verificar estados vacíos y recuperación tras un error transitorio.
- [ ] Confirmar que cada acción crítica aparezca en auditoría.

## 6. Observabilidad y operación

- [ ] Configurar alertas externas sobre `/api/health`; tres fallos consecutivos deben abrir un incidente.
- [ ] Definir retención y acceso a Vercel Logs según la política interna.
- [ ] Alertar por eventos `unhandled_server_error` y usar `digest` para correlacionar el mensaje mostrado al usuario.
- [ ] Revisar logs sin copiar tokens, cookies, contraseñas ni datos personales a tickets.
- [ ] Revisar semanalmente errores, latencia y consultas lentas durante el primer mes.
- [ ] Registrar cada despliegue con commit, responsable, migraciones y resultado de smoke test.

## 7. Respaldo, restauración y rollback

- [ ] Confirmar antes de cada migración el último punto restaurable de Supabase.
- [ ] Para respaldo lógico adicional, usar `supabase db dump` desde un entorno seguro y cifrar el archivo fuera del repositorio.
- [ ] Recordar que un respaldo de base de datos no restaura archivos borrados de Supabase Storage; V1 actualmente no depende de Storage.
- [ ] Ante un fallo solo de frontend, promover el último deployment sano de Vercel.
- [ ] Ante un fallo de esquema, detener escrituras si es necesario y aplicar una migración correctiva; no reescribir ni borrar migraciones ya desplegadas.
- [ ] Restaurar Supabase únicamente con aprobación del responsable, aceptando la ventana de indisponibilidad y la pérdida de datos según el punto elegido.
- [ ] Después de cualquier rollback/restauración, repetir salud, login, permisos, apertura, transferencia, cierre y auditoría.

## Aprobación de lanzamiento

| Rol | Nombre | Fecha | Aprobación |
| --- | --- | --- | --- |
| Responsable técnico |  |  |  |
| Responsable operativo |  |  |  |
| Validación de seguridad/datos |  |  |  |

No lanzar mientras quede pendiente un punto que afecte integridad, autorización, recuperación o continuidad operativa.
