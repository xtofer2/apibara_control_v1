begin;

create extension if not exists pgcrypto with schema extensions;

create type public.app_role as enum (
  'EMPLOYEE',
  'MANAGER',
  'ADMIN'
);

create type public.product_unit as enum (
  'UNIT',
  'LITER'
);

create type public.shift_status as enum (
  'OPEN',
  'CLOSED'
);

create type public.inventory_movement_type as enum (
  'ENTRY',
  'WASTE',
  'ADJUSTMENT_POSITIVE',
  'ADJUSTMENT_NEGATIVE'
);

create type public.transfer_status as enum (
  'PENDING',
  'SENT',
  'RECEIVED',
  'RECEIVED_WITH_DIFFERENCES',
  'CANCELLED'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete restrict,
  full_name text not null,
  role public.app_role not null default 'EMPLOYEE',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_full_name_not_blank check (btrim(full_name) <> '')
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint locations_name_not_blank check (btrim(name) <> ''),
  constraint locations_code_not_blank check (btrim(code) <> '')
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  unit_type public.product_unit not null,
  active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_name_not_blank check (btrim(name) <> ''),
  constraint products_code_not_blank check (btrim(code) <> ''),
  constraint products_display_order_non_negative check (display_order >= 0)
);

create table public.work_shifts (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations (id) on delete restrict,
  operational_date date not null default ((now() at time zone 'America/Lima')::date),
  status public.shift_status not null default 'OPEN',
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint work_shifts_location_date_unique unique (location_id, operational_date),
  constraint work_shifts_id_location_unique unique (id, location_id),
  constraint work_shifts_operational_date_matches_opening check (
    operational_date = (opened_at at time zone 'America/Lima')::date
  ),
  constraint work_shifts_status_timestamps_valid check (
    (
      status = 'OPEN'
      and closed_at is null
    )
    or
    (
      status = 'CLOSED'
      and closed_at is not null
      and closed_at >= opened_at
    )
  )
);

create unique index work_shifts_one_open_per_location_idx
  on public.work_shifts (location_id)
  where status = 'OPEN';

create table public.openings (
  id uuid primary key default gen_random_uuid(),
  work_shift_id uuid not null unique references public.work_shifts (id) on delete restrict,
  created_by uuid not null references public.profiles (id) on delete restrict,
  cash_opening numeric(12, 2) not null,
  created_at timestamptz not null default now(),
  constraint openings_cash_non_negative check (cash_opening >= 0)
);

create table public.opening_items (
  id uuid primary key default gen_random_uuid(),
  opening_id uuid not null references public.openings (id) on delete restrict,
  product_id uuid not null references public.products (id) on delete restrict,
  quantity numeric(12, 3) not null,
  constraint opening_items_opening_product_unique unique (opening_id, product_id),
  constraint opening_items_quantity_non_negative check (quantity >= 0)
);

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  work_shift_id uuid not null references public.work_shifts (id) on delete restrict,
  movement_type public.inventory_movement_type not null,
  reason text,
  notes text,
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint inventory_movements_reason_required check (
    movement_type = 'ENTRY'
    or nullif(btrim(reason), '') is not null
  ),
  constraint inventory_movements_waste_reason_valid check (
    movement_type <> 'WASTE'
    or btrim(reason) in ('DAMAGED', 'DROPPED', 'PREPARATION', 'EXPIRED', 'OTHER')
  ),
  constraint inventory_movements_other_notes_required check (
    movement_type <> 'WASTE'
    or btrim(reason) <> 'OTHER'
    or nullif(btrim(notes), '') is not null
  ),
  constraint inventory_movements_adjustment_notes_required check (
    movement_type not in ('ADJUSTMENT_POSITIVE', 'ADJUSTMENT_NEGATIVE')
    or nullif(btrim(notes), '') is not null
  )
);

create table public.inventory_movement_items (
  id uuid primary key default gen_random_uuid(),
  inventory_movement_id uuid not null references public.inventory_movements (id) on delete restrict,
  product_id uuid not null references public.products (id) on delete restrict,
  quantity numeric(12, 3) not null,
  constraint inventory_movement_items_movement_product_unique unique (
    inventory_movement_id,
    product_id
  ),
  constraint inventory_movement_items_quantity_non_negative check (quantity >= 0)
);

create table public.transfers (
  id uuid primary key default gen_random_uuid(),
  origin_location_id uuid not null references public.locations (id) on delete restrict,
  destination_location_id uuid not null references public.locations (id) on delete restrict,
  origin_work_shift_id uuid not null,
  destination_work_shift_id uuid,
  status public.transfer_status not null default 'PENDING',
  sent_by uuid references public.profiles (id) on delete restrict,
  sent_at timestamptz,
  received_by uuid references public.profiles (id) on delete restrict,
  received_at timestamptz,
  reception_notes text,
  cancelled_by uuid references public.profiles (id) on delete restrict,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transfers_origin_shift_location_fk foreign key (
    origin_work_shift_id,
    origin_location_id
  ) references public.work_shifts (id, location_id) on delete restrict,
  constraint transfers_destination_shift_location_fk foreign key (
    destination_work_shift_id,
    destination_location_id
  ) references public.work_shifts (id, location_id) on delete restrict,
  constraint transfers_different_locations check (
    origin_location_id <> destination_location_id
  ),
  constraint transfers_status_metadata_valid check (
    (
      status = 'PENDING'
      and destination_work_shift_id is null
      and sent_by is null
      and sent_at is null
      and received_by is null
      and received_at is null
      and reception_notes is null
      and cancelled_by is null
      and cancelled_at is null
      and cancellation_reason is null
    )
    or
    (
      status = 'SENT'
      and destination_work_shift_id is null
      and sent_by is not null
      and sent_at is not null
      and received_by is null
      and received_at is null
      and reception_notes is null
      and cancelled_by is null
      and cancelled_at is null
      and cancellation_reason is null
    )
    or
    (
      status in ('RECEIVED', 'RECEIVED_WITH_DIFFERENCES')
      and destination_work_shift_id is not null
      and sent_by is not null
      and sent_at is not null
      and received_by is not null
      and received_at is not null
      and received_at >= sent_at
      and cancelled_by is null
      and cancelled_at is null
      and cancellation_reason is null
      and (
        status = 'RECEIVED'
        or nullif(btrim(reception_notes), '') is not null
      )
    )
    or
    (
      status = 'CANCELLED'
      and destination_work_shift_id is null
      and sent_by is null
      and sent_at is null
      and received_by is null
      and received_at is null
      and reception_notes is null
      and cancelled_by is not null
      and cancelled_at is not null
      and nullif(btrim(cancellation_reason), '') is not null
    )
  )
);

create table public.transfer_items (
  id uuid primary key default gen_random_uuid(),
  transfer_id uuid not null references public.transfers (id) on delete restrict,
  product_id uuid not null references public.products (id) on delete restrict,
  sent_quantity numeric(12, 3) not null,
  received_quantity numeric(12, 3),
  constraint transfer_items_transfer_product_unique unique (transfer_id, product_id),
  constraint transfer_items_sent_quantity_non_negative check (sent_quantity >= 0),
  constraint transfer_items_received_quantity_non_negative check (
    received_quantity is null or received_quantity >= 0
  )
);

create table public.closings (
  id uuid primary key default gen_random_uuid(),
  work_shift_id uuid not null unique references public.work_shifts (id) on delete restrict,
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.closing_items (
  id uuid primary key default gen_random_uuid(),
  closing_id uuid not null references public.closings (id) on delete restrict,
  product_id uuid not null references public.products (id) on delete restrict,
  quantity numeric(12, 3) not null,
  constraint closing_items_closing_product_unique unique (closing_id, product_id),
  constraint closing_items_quantity_non_negative check (quantity >= 0)
);

create table public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint payment_methods_code_not_blank check (btrim(code) <> ''),
  constraint payment_methods_name_not_blank check (btrim(name) <> '')
);

create table public.closing_payments (
  id uuid primary key default gen_random_uuid(),
  closing_id uuid not null references public.closings (id) on delete restrict,
  payment_method_id uuid not null references public.payment_methods (id) on delete restrict,
  amount numeric(12, 2) not null,
  constraint closing_payments_closing_method_unique unique (
    closing_id,
    payment_method_id
  ),
  constraint closing_payments_amount_non_negative check (amount >= 0)
);

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete restrict,
  location_id uuid not null references public.locations (id) on delete restrict,
  work_date date not null default ((now() at time zone 'America/Lima')::date),
  check_in_at timestamptz not null default now(),
  check_out_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint attendance_user_location_date_unique unique (
    user_id,
    location_id,
    work_date
  ),
  constraint attendance_work_date_matches_check_in check (
    work_date = (check_in_at at time zone 'America/Lima')::date
  ),
  constraint attendance_checkout_after_checkin check (
    check_out_at is null or check_out_at >= check_in_at
  )
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete restrict,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now(),
  constraint audit_logs_action_not_blank check (btrim(action) <> ''),
  constraint audit_logs_entity_type_not_blank check (btrim(entity_type) <> '')
);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create function public.enforce_catalog_quantity_unit()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  product_unit public.product_unit;
begin
  select products.unit_type
    into product_unit
    from public.products
   where products.id = new.product_id;

  if not found then
    raise exception 'Product % does not exist', new.product_id;
  end if;

  if product_unit = 'UNIT' and new.quantity <> trunc(new.quantity) then
    raise exception 'UNIT product % requires a whole-number quantity', new.product_id;
  end if;

  return new;
end;
$$;

create function public.enforce_transfer_quantity_unit()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  product_unit public.product_unit;
begin
  select products.unit_type
    into product_unit
    from public.products
   where products.id = new.product_id;

  if not found then
    raise exception 'Product % does not exist', new.product_id;
  end if;

  if product_unit = 'UNIT' then
    if new.sent_quantity <> trunc(new.sent_quantity) then
      raise exception 'UNIT product % requires a whole-number sent quantity', new.product_id;
    end if;

    if new.received_quantity is not null
       and new.received_quantity <> trunc(new.received_quantity) then
      raise exception 'UNIT product % requires a whole-number received quantity', new.product_id;
    end if;
  end if;

  return new;
end;
$$;

create function public.prevent_used_product_unit_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.unit_type = old.unit_type then
    return new;
  end if;

  if exists (select 1 from public.opening_items where product_id = old.id)
     or exists (select 1 from public.inventory_movement_items where product_id = old.id)
     or exists (select 1 from public.transfer_items where product_id = old.id)
     or exists (select 1 from public.closing_items where product_id = old.id) then
    raise exception 'Cannot change unit type for product % after operational use', old.id;
  end if;

  return new;
end;
$$;

create function public.assert_operation_shift_is_open()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  current_status public.shift_status;
begin
  select work_shifts.status
    into current_status
    from public.work_shifts
   where work_shifts.id = new.work_shift_id
   for update;

  if not found then
    raise exception 'Work shift % does not exist', new.work_shift_id;
  end if;

  if current_status <> 'OPEN' then
    raise exception 'Work shift % is closed', new.work_shift_id;
  end if;

  return new;
end;
$$;

create function public.validate_work_shift_transition()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = 'CLOSED' then
    raise exception 'Closed work shift % cannot be modified', old.id;
  end if;

  if new.location_id <> old.location_id
     or new.operational_date <> old.operational_date
     or new.opened_at <> old.opened_at then
    raise exception 'Work shift identity and opening metadata are immutable';
  end if;

  if new.status = 'CLOSED'
     and not exists (
       select 1
         from public.closings
        where closings.work_shift_id = old.id
     ) then
    raise exception 'Work shift % requires a closing before it can close', old.id;
  end if;

  return new;
end;
$$;

create function public.validate_transfer_state_transition()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  origin_status public.shift_status;
  destination_status public.shift_status;
  item_count integer;
  has_difference boolean;
begin
  select work_shifts.status
    into origin_status
    from public.work_shifts
   where work_shifts.id = new.origin_work_shift_id
     and work_shifts.location_id = new.origin_location_id
   for update;

  if not found then
    raise exception 'Origin work shift does not belong to origin location';
  end if;

  if tg_op = 'INSERT' and new.status <> 'PENDING' then
    raise exception 'A transfer must be created as PENDING';
  end if;

  if tg_op = 'UPDATE' then
    if new.id <> old.id
       or new.created_by <> old.created_by
       or new.created_at <> old.created_at then
      raise exception 'Transfer identity and creation metadata are immutable';
    end if;

    if new.status = old.status and old.status <> 'PENDING' then
      raise exception 'Transfer % cannot be modified without a valid state transition', old.id;
    end if;

    if new.status <> old.status
       and not (
         (old.status = 'PENDING' and new.status in ('SENT', 'CANCELLED'))
         or
         (old.status = 'SENT' and new.status in ('RECEIVED', 'RECEIVED_WITH_DIFFERENCES'))
       ) then
      raise exception 'Invalid transfer transition from % to %', old.status, new.status;
    end if;
  end if;

  if new.status in ('PENDING', 'SENT') and origin_status <> 'OPEN' then
    raise exception 'Origin work shift must be open while creating or sending a transfer';
  end if;

  if new.status = 'SENT' then
    select count(*)
      into item_count
      from public.transfer_items
     where transfer_items.transfer_id = new.id;

    if item_count = 0 then
      raise exception 'Transfer % requires at least one item before sending', new.id;
    end if;
  end if;

  if new.status in ('RECEIVED', 'RECEIVED_WITH_DIFFERENCES') then
    select work_shifts.status
      into destination_status
      from public.work_shifts
     where work_shifts.id = new.destination_work_shift_id
       and work_shifts.location_id = new.destination_location_id
     for update;

    if not found or destination_status <> 'OPEN' then
      raise exception 'Destination work shift must exist, be open, and belong to destination location';
    end if;

    select
      count(*),
      coalesce(bool_or(received_quantity <> sent_quantity), false)
      into item_count, has_difference
      from public.transfer_items
     where transfer_items.transfer_id = new.id
       and received_quantity is not null;

    if item_count = 0
       or item_count <> (
         select count(*)
           from public.transfer_items
          where transfer_items.transfer_id = new.id
       ) then
      raise exception 'Every transfer item requires a received quantity';
    end if;

    if new.status = 'RECEIVED' and has_difference then
      raise exception 'Transfer with quantity differences must use RECEIVED_WITH_DIFFERENCES';
    end if;

    if new.status = 'RECEIVED_WITH_DIFFERENCES' and not has_difference then
      raise exception 'Transfer without quantity differences must use RECEIVED';
    end if;
  end if;

  return new;
end;
$$;

create function public.enforce_transfer_item_mutability()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  parent_transfer_id uuid;
  parent_status public.transfer_status;
begin
  parent_transfer_id = case when tg_op = 'DELETE' then old.transfer_id else new.transfer_id end;

  select transfers.status
    into parent_status
    from public.transfers
   where transfers.id = parent_transfer_id
   for update;

  if not found then
    raise exception 'Transfer % does not exist', parent_transfer_id;
  end if;

  if tg_op = 'INSERT' then
    if parent_status <> 'PENDING' or new.received_quantity is not null then
      raise exception 'Items can only be added to a PENDING transfer without received quantities';
    end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    if parent_status <> 'PENDING' then
      raise exception 'Items can only be deleted from a PENDING transfer';
    end if;
    return old;
  end if;

  if new.transfer_id <> old.transfer_id or new.product_id <> old.product_id then
    raise exception 'Transfer item identity is immutable';
  end if;

  if parent_status = 'PENDING' then
    if new.received_quantity is not null then
      raise exception 'PENDING transfer items cannot have received quantities';
    end if;
  elsif parent_status = 'SENT' then
    if new.sent_quantity <> old.sent_quantity then
      raise exception 'Sent quantities cannot change after a transfer is sent';
    end if;
  else
    raise exception 'Items of a completed or cancelled transfer are immutable';
  end if;

  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger locations_set_updated_at
before update on public.locations
for each row execute function public.set_updated_at();

create trigger products_10_prevent_used_unit_change
before update on public.products
for each row execute function public.prevent_used_product_unit_change();

create trigger products_90_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create trigger work_shifts_10_validate_transition
before update on public.work_shifts
for each row execute function public.validate_work_shift_transition();

create trigger work_shifts_90_set_updated_at
before update on public.work_shifts
for each row execute function public.set_updated_at();

create trigger openings_require_open_shift
before insert or update on public.openings
for each row execute function public.assert_operation_shift_is_open();

create trigger opening_items_validate_unit
before insert or update on public.opening_items
for each row execute function public.enforce_catalog_quantity_unit();

create trigger inventory_movements_require_open_shift
before insert or update on public.inventory_movements
for each row execute function public.assert_operation_shift_is_open();

create trigger inventory_movement_items_validate_unit
before insert or update on public.inventory_movement_items
for each row execute function public.enforce_catalog_quantity_unit();

create trigger transfers_10_validate_state
before insert or update on public.transfers
for each row execute function public.validate_transfer_state_transition();

create trigger transfers_90_set_updated_at
before update on public.transfers
for each row execute function public.set_updated_at();

create trigger transfer_items_10_enforce_mutability
before insert or update or delete on public.transfer_items
for each row execute function public.enforce_transfer_item_mutability();

create trigger transfer_items_20_validate_unit
before insert or update on public.transfer_items
for each row execute function public.enforce_transfer_quantity_unit();

create trigger closings_require_open_shift
before insert or update on public.closings
for each row execute function public.assert_operation_shift_is_open();

create trigger closing_items_validate_unit
before insert or update on public.closing_items
for each row execute function public.enforce_catalog_quantity_unit();

create trigger attendance_set_updated_at
before update on public.attendance
for each row execute function public.set_updated_at();

create index profiles_role_active_idx on public.profiles (role, active);
create index openings_created_by_idx on public.openings (created_by);
create index opening_items_product_idx on public.opening_items (product_id);
create index inventory_movements_shift_created_idx
  on public.inventory_movements (work_shift_id, created_at);
create index inventory_movements_created_by_idx
  on public.inventory_movements (created_by);
create index inventory_movement_items_product_idx
  on public.inventory_movement_items (product_id);
create index transfers_origin_location_status_idx
  on public.transfers (origin_location_id, status, created_at);
create index transfers_destination_location_status_idx
  on public.transfers (destination_location_id, status, created_at);
create index transfers_origin_shift_idx on public.transfers (origin_work_shift_id);
create index transfers_destination_shift_idx on public.transfers (destination_work_shift_id);
create index transfers_created_by_idx on public.transfers (created_by);
create index transfers_sent_by_idx on public.transfers (sent_by);
create index transfers_received_by_idx on public.transfers (received_by);
create index transfer_items_product_idx on public.transfer_items (product_id);
create index closings_created_by_idx on public.closings (created_by);
create index closing_items_product_idx on public.closing_items (product_id);
create index closing_payments_method_idx on public.closing_payments (payment_method_id);
create index attendance_location_date_idx on public.attendance (location_id, work_date);
create index attendance_user_date_idx on public.attendance (user_id, work_date);
create index audit_logs_user_created_idx on public.audit_logs (user_id, created_at);
create index audit_logs_entity_created_idx
  on public.audit_logs (entity_type, entity_id, created_at);

alter table public.profiles enable row level security;
alter table public.locations enable row level security;
alter table public.products enable row level security;
alter table public.work_shifts enable row level security;
alter table public.openings enable row level security;
alter table public.opening_items enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.inventory_movement_items enable row level security;
alter table public.transfers enable row level security;
alter table public.transfer_items enable row level security;
alter table public.closings enable row level security;
alter table public.closing_items enable row level security;
alter table public.payment_methods enable row level security;
alter table public.closing_payments enable row level security;
alter table public.attendance enable row level security;
alter table public.audit_logs enable row level security;

insert into public.locations (id, code, name, active)
values
  ('10000000-0000-4000-8000-000000000001', 'JESUS', 'Av. Jesus', true),
  ('10000000-0000-4000-8000-000000000002', 'MIGUEL_GRAU', 'Miguel Grau', true);

insert into public.products (id, code, name, unit_type, active, display_order)
values
  ('20000000-0000-4000-8000-000000000001', 'EMP_CLASSIC', 'Empanada Clasica', 'UNIT', true, 10),
  ('20000000-0000-4000-8000-000000000002', 'EMP_PIZZA', 'Empanada Pizza', 'UNIT', true, 20),
  ('20000000-0000-4000-8000-000000000003', 'EMP_CHEESE', 'Empanada Full Queso', 'UNIT', true, 30),
  ('20000000-0000-4000-8000-000000000004', 'API_PURPLE', 'Api Morado', 'LITER', true, 40),
  ('20000000-0000-4000-8000-000000000005', 'API_WHITE', 'Api Blanco', 'LITER', true, 50),
  ('20000000-0000-4000-8000-000000000006', 'EMOLIENTE', 'Emoliente', 'LITER', true, 60);

insert into public.payment_methods (id, code, name, active)
values
  ('30000000-0000-4000-8000-000000000001', 'CASH', 'Efectivo', true),
  ('30000000-0000-4000-8000-000000000002', 'YAPE', 'Yape', true);

commit;
