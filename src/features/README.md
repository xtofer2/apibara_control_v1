# Features

Cada dominio contendrá su validación, tipos, casos de uso y componentes específicos cuando corresponda. Los dominios previstos son: `auth`, `employees`, `locations`, `products`, `attendance`, `shifts`, `inventory`, `transfers`, `waste`, `cash`, `reports` y `audit`.

La UI no accederá directamente a PostgreSQL. El flujo será: UI → Server Action o Route Handler → servicio de dominio → repositorio/base de datos.
