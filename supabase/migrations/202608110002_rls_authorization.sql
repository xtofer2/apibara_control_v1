begin;

create schema if not exists private;
revoke all on schema private from public;

create function private.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and active
  );
$$;

create function private.has_minimum_role(required_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select
      case role
        when 'EMPLOYEE' then 1
        when 'MANAGER' then 2
        when 'ADMIN' then 3
      end
      >=
      case required_role
        when 'EMPLOYEE' then 1
        when 'MANAGER' then 2
        when 'ADMIN' then 3
      end
    from public.profiles
    where id = (select auth.uid())
      and active
  ), false);
$$;

revoke all on function private.is_active_user() from public, anon, authenticated;
revoke all on function private.has_minimum_role(public.app_role) from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.is_active_user() to authenticated;
grant execute on function private.has_minimum_role(public.app_role) to authenticated;

revoke all privileges on all tables in schema public from anon, authenticated;

grant select on public.profiles to authenticated;
grant update (full_name, role, active) on public.profiles to authenticated;

grant select on public.locations to authenticated;
grant insert (name, code, active) on public.locations to authenticated;
grant update (name, code, active) on public.locations to authenticated;

grant select on public.products to authenticated;
grant insert (name, code, unit_type, active, display_order)
  on public.products to authenticated;
grant update (name, code, unit_type, active, display_order)
  on public.products to authenticated;

grant select on public.payment_methods to authenticated;
grant insert (code, name, active) on public.payment_methods to authenticated;
grant update (code, name, active) on public.payment_methods to authenticated;

grant select on public.work_shifts to authenticated;
grant insert (location_id) on public.work_shifts to authenticated;
grant update (status, closed_at) on public.work_shifts to authenticated;

grant select on public.openings to authenticated;
grant insert (work_shift_id, created_by, cash_opening)
  on public.openings to authenticated;
grant select on public.opening_items to authenticated;
grant insert (opening_id, product_id, quantity)
  on public.opening_items to authenticated;

grant select on public.inventory_movements to authenticated;
grant insert (work_shift_id, movement_type, reason, notes, created_by)
  on public.inventory_movements to authenticated;
grant select on public.inventory_movement_items to authenticated;
grant insert (inventory_movement_id, product_id, quantity)
  on public.inventory_movement_items to authenticated;

grant select on public.transfers to authenticated;
grant insert (
  origin_location_id,
  destination_location_id,
  origin_work_shift_id,
  created_by
) on public.transfers to authenticated;
grant update (
  origin_location_id,
  destination_location_id,
  origin_work_shift_id,
  destination_work_shift_id,
  status,
  sent_by,
  sent_at,
  received_by,
  received_at,
  reception_notes
) on public.transfers to authenticated;
grant select on public.transfer_items to authenticated;
grant insert (transfer_id, product_id, sent_quantity)
  on public.transfer_items to authenticated;
grant update (sent_quantity, received_quantity)
  on public.transfer_items to authenticated;
grant delete on public.transfer_items to authenticated;

grant select on public.closings to authenticated;
grant insert (work_shift_id, created_by) on public.closings to authenticated;
grant select on public.closing_items to authenticated;
grant insert (closing_id, product_id, quantity)
  on public.closing_items to authenticated;
grant select on public.closing_payments to authenticated;
grant insert (closing_id, payment_method_id, amount)
  on public.closing_payments to authenticated;

grant select on public.attendance to authenticated;
grant insert (user_id, location_id) on public.attendance to authenticated;
grant update (check_out_at) on public.attendance to authenticated;
grant select on public.audit_logs to authenticated;

drop policy if exists profiles_select_own on public.profiles;

create policy profiles_select_authorized
on public.profiles
for select
to authenticated
using (
  id = (select auth.uid())
  or (select private.has_minimum_role('MANAGER'))
);

create policy profiles_update_admin
on public.profiles
for update
to authenticated
using ((select private.has_minimum_role('ADMIN')))
with check ((select private.has_minimum_role('ADMIN')));

create policy locations_select_active_or_admin
on public.locations
for select
to authenticated
using (
  ((select private.is_active_user()) and active)
  or (select private.has_minimum_role('ADMIN'))
);

create policy locations_insert_admin
on public.locations
for insert
to authenticated
with check ((select private.has_minimum_role('ADMIN')));

create policy locations_update_admin
on public.locations
for update
to authenticated
using ((select private.has_minimum_role('ADMIN')))
with check ((select private.has_minimum_role('ADMIN')));

create policy products_select_active_or_admin
on public.products
for select
to authenticated
using (
  ((select private.is_active_user()) and active)
  or (select private.has_minimum_role('ADMIN'))
);

create policy products_insert_admin
on public.products
for insert
to authenticated
with check ((select private.has_minimum_role('ADMIN')));

create policy products_update_admin
on public.products
for update
to authenticated
using ((select private.has_minimum_role('ADMIN')))
with check ((select private.has_minimum_role('ADMIN')));

create policy payment_methods_select_active_or_admin
on public.payment_methods
for select
to authenticated
using (
  ((select private.is_active_user()) and active)
  or (select private.has_minimum_role('ADMIN'))
);

create policy payment_methods_insert_admin
on public.payment_methods
for insert
to authenticated
with check ((select private.has_minimum_role('ADMIN')));

create policy payment_methods_update_admin
on public.payment_methods
for update
to authenticated
using ((select private.has_minimum_role('ADMIN')))
with check ((select private.has_minimum_role('ADMIN')));

create policy work_shifts_select_authorized
on public.work_shifts
for select
to authenticated
using (
  (select private.has_minimum_role('MANAGER'))
  or ((select private.is_active_user()) and status = 'OPEN')
);

create policy work_shifts_insert_active
on public.work_shifts
for insert
to authenticated
with check ((select private.is_active_user()));

create policy work_shifts_update_active
on public.work_shifts
for update
to authenticated
using ((select private.is_active_user()) and status = 'OPEN')
with check ((select private.is_active_user()));

create policy openings_select_authorized
on public.openings
for select
to authenticated
using (
  (select private.has_minimum_role('MANAGER'))
  or created_by = (select auth.uid())
  or (
    (select private.is_active_user())
    and work_shift_id in (
      select id from public.work_shifts where status = 'OPEN'
    )
  )
);

create policy openings_insert_own
on public.openings
for insert
to authenticated
with check (
  (select private.is_active_user())
  and created_by = (select auth.uid())
);

create policy opening_items_select_authorized
on public.opening_items
for select
to authenticated
using (
  opening_id in (select id from public.openings)
);

create policy opening_items_insert_own
on public.opening_items
for insert
to authenticated
with check (
  opening_id in (
    select id
    from public.openings
    where created_by = (select auth.uid())
  )
);

create policy inventory_movements_select_authorized
on public.inventory_movements
for select
to authenticated
using (
  (select private.has_minimum_role('MANAGER'))
  or created_by = (select auth.uid())
);

create policy inventory_movements_insert_authorized
on public.inventory_movements
for insert
to authenticated
with check (
  (select private.is_active_user())
  and created_by = (select auth.uid())
  and (
    movement_type in ('ENTRY', 'WASTE')
    or (
      movement_type in ('ADJUSTMENT_POSITIVE', 'ADJUSTMENT_NEGATIVE')
      and (select private.has_minimum_role('MANAGER'))
    )
  )
);

create policy inventory_movement_items_select_authorized
on public.inventory_movement_items
for select
to authenticated
using (
  inventory_movement_id in (select id from public.inventory_movements)
);

create policy inventory_movement_items_insert_own
on public.inventory_movement_items
for insert
to authenticated
with check (
  inventory_movement_id in (
    select id
    from public.inventory_movements
    where created_by = (select auth.uid())
  )
);

create policy transfers_select_authorized
on public.transfers
for select
to authenticated
using (
  (select private.has_minimum_role('MANAGER'))
  or (
    (select private.is_active_user())
    and (
      created_by = (select auth.uid())
      or sent_by = (select auth.uid())
      or received_by = (select auth.uid())
      or status = 'SENT'
    )
  )
);

create policy transfers_insert_own
on public.transfers
for insert
to authenticated
with check (
  (select private.is_active_user())
  and created_by = (select auth.uid())
  and status = 'PENDING'
);

create policy transfers_update_participant
on public.transfers
for update
to authenticated
using (
  (select private.is_active_user())
  and (
    (status = 'PENDING' and created_by = (select auth.uid()))
    or status = 'SENT'
  )
)
with check (
  (select private.is_active_user())
  and (
    (status = 'PENDING' and created_by = (select auth.uid()))
    or (status = 'SENT' and sent_by = (select auth.uid()))
    or (
      status in ('RECEIVED', 'RECEIVED_WITH_DIFFERENCES')
      and received_by = (select auth.uid())
    )
  )
);

create policy transfer_items_select_authorized
on public.transfer_items
for select
to authenticated
using (transfer_id in (select id from public.transfers));

create policy transfer_items_insert_creator
on public.transfer_items
for insert
to authenticated
with check (
  transfer_id in (
    select id
    from public.transfers
    where status = 'PENDING'
      and created_by = (select auth.uid())
  )
);

create policy transfer_items_update_participant
on public.transfer_items
for update
to authenticated
using (
  transfer_id in (
    select id
    from public.transfers
    where (status = 'PENDING' and created_by = (select auth.uid()))
       or (status = 'SENT' and (select private.is_active_user()))
  )
)
with check (
  transfer_id in (
    select id
    from public.transfers
    where (status = 'PENDING' and created_by = (select auth.uid()))
       or (status = 'SENT' and (select private.is_active_user()))
  )
);

create policy transfer_items_delete_creator
on public.transfer_items
for delete
to authenticated
using (
  transfer_id in (
    select id
    from public.transfers
    where status = 'PENDING'
      and created_by = (select auth.uid())
  )
);

create policy closings_select_authorized
on public.closings
for select
to authenticated
using (
  (select private.has_minimum_role('MANAGER'))
  or created_by = (select auth.uid())
);

create policy closings_insert_own
on public.closings
for insert
to authenticated
with check (
  (select private.is_active_user())
  and created_by = (select auth.uid())
);

create policy closing_items_select_authorized
on public.closing_items
for select
to authenticated
using (closing_id in (select id from public.closings));

create policy closing_items_insert_own
on public.closing_items
for insert
to authenticated
with check (
  closing_id in (
    select id
    from public.closings
    where created_by = (select auth.uid())
  )
);

create policy closing_payments_select_authorized
on public.closing_payments
for select
to authenticated
using (closing_id in (select id from public.closings));

create policy closing_payments_insert_own
on public.closing_payments
for insert
to authenticated
with check (
  closing_id in (
    select id
    from public.closings
    where created_by = (select auth.uid())
  )
);

create policy attendance_select_authorized
on public.attendance
for select
to authenticated
using (
  user_id = (select auth.uid())
  or (select private.has_minimum_role('MANAGER'))
);

create policy attendance_insert_own
on public.attendance
for insert
to authenticated
with check (
  (select private.is_active_user())
  and user_id = (select auth.uid())
);

create policy attendance_update_own
on public.attendance
for update
to authenticated
using (
  (select private.is_active_user())
  and user_id = (select auth.uid())
)
with check (
  (select private.is_active_user())
  and user_id = (select auth.uid())
);

create policy audit_logs_select_manager
on public.audit_logs
for select
to authenticated
using ((select private.has_minimum_role('MANAGER')));

commit;
