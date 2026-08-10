# Supabase

- `client.ts` crea el cliente para Client Components.
- `server.ts` crea un cliente por solicitud para Server Components, Server Actions y Route Handlers.
- `proxy.ts` sincroniza las cookies de autenticación.
- `auth.ts` expone la lectura de claims verificados para código de servidor.
- `env.ts` valida la URL y la clave pública cuando se crea un cliente.

Las credenciales con rol de servicio nunca deben exponerse al navegador. En código de servidor, no se debe confiar en `auth.getSession()` para autorizar acciones; usar claims verificados o consultar el usuario al servidor de Auth.
