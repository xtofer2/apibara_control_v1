# Apibara Control - Data Model V1

## General principles

- PostgreSQL is the source of truth.
- Supabase `auth.users` handles authentication identities.
- Application profile data lives in `profiles`.
- Use UUID primary keys unless a strong reason exists otherwise.
- Use `timestamptz` for timestamps.
- Server/database generates operational timestamps.
- Use `numeric` for money and measurable quantities; enforce whole numbers for UNIT products in business/database validation.
- Prefer immutable/append-style operational history over destructive edits.

## Entities

### 1. profiles

Application profile linked 1:1 to Supabase Auth.

Fields:

```text
id              uuid PK, FK -> auth.users.id
full_name       text not null
role            app_role not null
active          boolean not null default true
created_at      timestamptz not null default now()
updated_at      timestamptz not null default now()
```

Roles:

```text
EMPLOYEE
MANAGER
ADMIN
```

### 2. locations

Fields:

```text
id              uuid PK
name            text not null
code            text not null unique
active          boolean not null default true
created_at      timestamptz not null default now()
updated_at      timestamptz not null default now()
```

Initial rows:

```text
JESUS       | Av. Jesus
MIGUEL_GRAU | Miguel Grau
```

### 3. products

Fields:

```text
id              uuid PK
name            text not null
code            text not null unique
unit_type       product_unit not null
active          boolean not null default true
display_order   integer not null default 0
created_at      timestamptz not null default now()
updated_at      timestamptz not null default now()
```

Units:

```text
UNIT
LITER
```

Initial products:

```text
EMP_CLASSIC | Empanada Clasica    | UNIT
EMP_PIZZA   | Empanada Pizza      | UNIT
EMP_CHEESE  | Empanada Full Queso | UNIT
API_PURPLE  | Api Morado          | LITER
API_WHITE   | Api Blanco          | LITER
EMOLIENTE   | Emoliente           | LITER
```

### 4. work_shifts

Represents the operational day for one location.

Fields:

```text
id                  uuid PK
location_id         uuid not null FK -> locations.id
operational_date    date not null
status              shift_status not null
opened_at           timestamptz nullable
closed_at           timestamptz nullable
created_at          timestamptz not null default now()
updated_at          timestamptz not null default now()
```

Statuses:

```text
OPEN
CLOSED
```

Important constraints/indexes:

- unique `(location_id, operational_date)` for V1 unless business later requires multiple shifts per date.
- partial unique index allowing only one OPEN shift per location.

### 5. openings

Fields:

```text
id              uuid PK
work_shift_id   uuid not null unique FK -> work_shifts.id
created_by      uuid not null FK -> profiles.id
cash_opening    numeric(12,2) not null check >= 0
created_at      timestamptz not null default now()
```

### 6. opening_items

Fields:

```text
id              uuid PK
opening_id      uuid not null FK -> openings.id
product_id      uuid not null FK -> products.id
quantity        numeric(12,3) not null check >= 0
```

Constraints:

- unique `(opening_id, product_id)`

### 7. inventory_movements

Fields:

```text
id              uuid PK
work_shift_id   uuid not null FK -> work_shifts.id
movement_type   inventory_movement_type not null
reason          text nullable
notes           text nullable
created_by      uuid not null FK -> profiles.id
created_at      timestamptz not null default now()
```

Types:

```text
ENTRY
WASTE
ADJUSTMENT_POSITIVE
ADJUSTMENT_NEGATIVE
```

Business rules:

- adjustments manager/admin only
- WASTE must have a reason
- OTHER-like reasons require notes if implemented as an enum/catalog

### 8. inventory_movement_items

Fields:

```text
id                      uuid PK
inventory_movement_id   uuid not null FK -> inventory_movements.id
product_id              uuid not null FK -> products.id
quantity                numeric(12,3) not null check >= 0
```

Constraints:

- unique `(inventory_movement_id, product_id)`

### 9. transfers

Fields:

```text
id                          uuid PK
origin_location_id          uuid not null FK -> locations.id
destination_location_id     uuid not null FK -> locations.id
origin_work_shift_id        uuid not null FK -> work_shifts.id
destination_work_shift_id   uuid nullable FK -> work_shifts.id
status                      transfer_status not null
sent_by                     uuid nullable FK -> profiles.id
sent_at                     timestamptz nullable
received_by                 uuid nullable FK -> profiles.id
received_at                 timestamptz nullable
reception_notes             text nullable
cancelled_by                uuid nullable FK -> profiles.id
cancelled_at                timestamptz nullable
cancellation_reason         text nullable
created_by                  uuid not null FK -> profiles.id
created_at                  timestamptz not null default now()
updated_at                  timestamptz not null default now()
```

Statuses:

```text
PENDING
SENT
RECEIVED
RECEIVED_WITH_DIFFERENCES
CANCELLED
```

Constraints:

- `origin_location_id <> destination_location_id`
- received states require `received_by` and `received_at`
- SENT/received states require `sent_by` and `sent_at`
- RECEIVED_WITH_DIFFERENCES requires reception notes
- CANCELLED requires cancellation metadata according to workflow

### 10. transfer_items

Fields:

```text
id                  uuid PK
transfer_id         uuid not null FK -> transfers.id
product_id          uuid not null FK -> products.id
sent_quantity       numeric(12,3) not null check >= 0
received_quantity   numeric(12,3) nullable check >= 0
```

Constraints:

- unique `(transfer_id, product_id)`

Derived field:

```text
difference = received_quantity - sent_quantity
```

Do not persist `difference` unless future reporting performance proves it necessary.

### 11. closings

Fields:

```text
id              uuid PK
work_shift_id   uuid not null unique FK -> work_shifts.id
created_by      uuid not null FK -> profiles.id
created_at      timestamptz not null default now()
```

### 12. closing_items

Fields:

```text
id              uuid PK
closing_id      uuid not null FK -> closings.id
product_id      uuid not null FK -> products.id
quantity        numeric(12,3) not null check >= 0
```

Constraints:

- unique `(closing_id, product_id)`

### 13. payment_methods

Fields:

```text
id              uuid PK
code            text not null unique
name            text not null
active          boolean not null default true
created_at      timestamptz not null default now()
```

Initial rows:

```text
CASH | Efectivo
YAPE | Yape
```

### 14. closing_payments

Fields:

```text
id                  uuid PK
closing_id          uuid not null FK -> closings.id
payment_method_id   uuid not null FK -> payment_methods.id
amount              numeric(12,2) not null check >= 0
```

Constraints:

- unique `(closing_id, payment_method_id)`

Derived value:

```text
closing_total = SUM(amount)
```

Do not store a redundant total column.

### 15. attendance

Fields:

```text
id              uuid PK
user_id         uuid not null FK -> profiles.id
location_id     uuid not null FK -> locations.id
work_date       date not null
check_in_at     timestamptz not null
check_out_at    timestamptz nullable
created_at      timestamptz not null default now()
updated_at      timestamptz not null default now()
```

V1 assumption:

- one attendance record per employee per location/work date unless later requirements allow split shifts.

Possible unique constraint:

```text
(user_id, location_id, work_date)
```

### 16. audit_logs

Fields:

```text
id              uuid PK
user_id         uuid nullable FK -> profiles.id
action          text not null
entity_type     text not null
entity_id       uuid nullable
old_data        jsonb nullable
new_data        jsonb nullable
created_at      timestamptz not null default now()
```

Do not expose unrestricted audit logs to employees.

## Core relationships

```text
auth.users 1---1 profiles

profiles 1---N attendance
profiles 1---N openings
profiles 1---N closings
profiles 1---N inventory_movements
profiles 1---N transfers (creator/sender/receiver)
profiles 1---N audit_logs

locations 1---N work_shifts
locations 1---N attendance
locations 1---N transfers (origin)
locations 1---N transfers (destination)

work_shifts 1---1 openings
work_shifts 1---0..1 closings
work_shifts 1---N inventory_movements

openings 1---N opening_items
closings 1---N closing_items
closings 1---N closing_payments
inventory_movements 1---N inventory_movement_items
transfers 1---N transfer_items

products 1---N opening_items
products 1---N closing_items
products 1---N inventory_movement_items
products 1---N transfer_items

payment_methods 1---N closing_payments
```

## Values that must be calculated, not stored

### Calculated product sales

For each shift/product:

```text
opening
+ ENTRY movements
+ confirmed transfer receipts
+ ADJUSTMENT_POSITIVE
- sent transfers
- WASTE
- ADJUSTMENT_NEGATIVE
- closing
```

### Closing total

```text
SUM(closing_payments.amount)
```

### Transfer difference

```text
received_quantity - sent_quantity
```

## Database integrity recommendations

Use PostgreSQL constraints/indexes for at least:

- non-negative quantities and money
- unique opening per shift
- unique closing per shift
- unique product rows inside operation item tables
- unique payment method per closing
- origin location != destination location
- one OPEN shift per location
- valid transfer state metadata

Use transactions for multi-step operations such as:

- opening a shift + inserting opening + opening items
- receiving a transfer + recording quantities + updating status + audit
- closing a shift + closing + items + payment methods + shift status

## RLS direction

RLS design should be implemented after core schema validation.

Initial intent:

- employees: operational access only through authorized workflows
- managers: read across locations and create adjustments
- admins: administrative access

Prefer server-side/domain operations for sensitive writes even when RLS also protects the underlying tables.
