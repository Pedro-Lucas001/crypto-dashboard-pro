-- CryptoOps: favorites, thresholds and durable notifications.
-- This migration is scoped to a DEDICATED CryptoOps Supabase project.
-- Do not apply it to the Planeta-Lanches database.

create table if not exists public.crypto_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  coin_id text not null check (length(coin_id) between 1 and 100 and coin_id ~ '^[a-z0-9-]+$'),
  coin_symbol text not null check (length(coin_symbol) between 1 and 20),
  coin_name text not null check (length(coin_name) between 1 and 120),
  created_at timestamptz not null default now(),
  primary key (user_id, coin_id)
);

create table if not exists public.price_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  coin_id text not null check (length(coin_id) between 1 and 100 and coin_id ~ '^[a-z0-9-]+$'),
  coin_symbol text not null check (length(coin_symbol) between 1 and 20),
  direction text not null check (direction in ('above', 'below')),
  target_price numeric(28, 12) not null check (target_price > 0),
  is_active boolean not null default true,
  notify_email boolean not null default false,
  triggered_at timestamptz,
  triggered_price numeric(28, 12),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint triggered_pair_consistent check (
    (triggered_at is null and triggered_price is null)
    or (triggered_at is not null and triggered_price is not null)
  )
);

create index if not exists price_alerts_active_idx on public.price_alerts (coin_id)
  where is_active = true;
create index if not exists price_alerts_user_idx on public.price_alerts (user_id, created_at desc);

create table if not exists public.price_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  alert_id uuid not null references public.price_alerts(id) on delete cascade,
  coin_id text not null,
  coin_symbol text not null,
  direction text not null check (direction in ('above','below')),
  target_price numeric(28, 12) not null,
  observed_price numeric(28, 12) not null,
  triggered_at timestamptz not null,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  email_status text not null default 'skipped'
    check (email_status in ('pending','sent','failed','skipped')),
  email_attempts integer not null default 0 check (email_attempts between 0 and 10),
  email_error text,
  unique (alert_id, triggered_at)
);

create index if not exists price_notifications_inbox_idx
  on public.price_notifications (user_id, created_at desc);
create index if not exists price_notifications_email_idx
  on public.price_notifications (email_status, created_at)
  where email_status in ('pending','failed');

alter table public.crypto_favorites enable row level security;
alter table public.price_alerts enable row level security;
alter table public.price_notifications enable row level security;

-- The authenticated role only has write access to user-editable columns.
-- In particular, clients CANNOT set triggered_at or fabricate notifications.
revoke all on public.crypto_favorites from anon, authenticated;
revoke all on public.price_alerts from anon, authenticated;
revoke all on public.price_notifications from anon, authenticated;

grant select, insert, delete on public.crypto_favorites to authenticated;
grant select, delete on public.price_alerts to authenticated;
grant insert (user_id, coin_id, coin_symbol, direction, target_price, is_active, notify_email)
  on public.price_alerts to authenticated;
grant update (direction, target_price, is_active, notify_email)
  on public.price_alerts to authenticated;
grant select on public.price_notifications to authenticated;
grant update (read_at) on public.price_notifications to authenticated;

create policy "favorites_read_own" on public.crypto_favorites
  for select to authenticated using (user_id = (select auth.uid()));
create policy "favorites_insert_own" on public.crypto_favorites
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "favorites_delete_own" on public.crypto_favorites
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "alerts_read_own" on public.price_alerts
  for select to authenticated using (user_id = (select auth.uid()));
create policy "alerts_insert_own" on public.price_alerts
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "alerts_update_own" on public.price_alerts
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "alerts_delete_own" on public.price_alerts
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "notifications_read_own" on public.price_notifications
  for select to authenticated using (user_id = (select auth.uid()));
create policy "notifications_mark_own" on public.price_notifications
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create schema if not exists cryptoops_private;
revoke all on schema cryptoops_private from public, anon, authenticated;

-- A price alert and its inbox notification are committed in the SAME database
-- transaction. If notification creation fails the alert transition rolls back.
create or replace function cryptoops_private.on_price_alert_triggered()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.triggered_at is distinct from new.triggered_at
     and new.triggered_at is not null
     and old.is_active = true
     and new.is_active = false then
    insert into public.price_notifications (
      user_id, alert_id, coin_id, coin_symbol, direction, target_price,
      observed_price, triggered_at, email_status
    ) values (
      new.user_id, new.id, new.coin_id, new.coin_symbol, new.direction,
      new.target_price, new.triggered_price, new.triggered_at,
      case when new.notify_email then 'pending' else 'skipped' end
    );
  end if;
  return new;
end;
$$;

revoke all on function cryptoops_private.on_price_alert_triggered() from public, anon, authenticated;

drop trigger if exists price_alerts_notification_trigger on public.price_alerts;
create trigger price_alerts_notification_trigger
  after update of triggered_at on public.price_alerts
  for each row execute function cryptoops_private.on_price_alert_triggered();

comment on table public.price_notifications is
  'Server-generated notification events. Authenticated clients may read and mark as read, not insert.';
