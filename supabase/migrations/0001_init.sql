-- =====================================================================
-- nutri-tracker · migración inicial
-- Pegar completo en Supabase → SQL Editor, o guardar en
-- supabase/migrations/0001_init.sql
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Enum de tipo de comida
-- ---------------------------------------------------------------------
do $$
begin
  create type public.meal_type as enum
    ('desayuno', 'almuerzo', 'merienda', 'cena', 'snack');
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------
-- 2. Función auxiliar: "día local" de un instante UTC
--    Todo el "día" de la app se calcula en America/Argentina/Buenos_Aires.
--    Se marca immutable para poder indexarla (Argentina no usa horario
--    de verano, así que el resultado es estable).
-- ---------------------------------------------------------------------
create or replace function public.local_day(ts timestamptz)
returns date
language sql
immutable
parallel safe
as $$
  select (ts at time zone 'America/Argentina/Buenos_Aires')::date
$$;

-- ---------------------------------------------------------------------
-- 3. Tablas
-- ---------------------------------------------------------------------
create table if not exists public.settings (
  user_id          uuid primary key references auth.users (id) on delete cascade,
  kcal_goal        integer       not null default 2000 check (kcal_goal > 0),
  protein_goal_g   integer       not null default 120  check (protein_goal_g >= 0),
  carbs_goal_g     integer       not null default 200  check (carbs_goal_g >= 0),
  fat_goal_g       integer       not null default 60   check (fat_goal_g >= 0),
  target_weight_kg numeric(5,2)  check (target_weight_kg > 0),
  height_cm        numeric(5,1)  check (height_cm > 0),
  updated_at       timestamptz   not null default now()
);

create table if not exists public.meals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade
                default auth.uid(),
  eaten_at    timestamptz not null,                 -- siempre UTC
  meal_type   public.meal_type not null,
  raw_text    text,
  is_binge    boolean not null default false,
  binge_tags  text[]  not null default '{}',
  binge_note  text,
  created_at  timestamptz not null default now()
);

create index if not exists meals_user_eaten_idx
  on public.meals (user_id, eaten_at desc);

create index if not exists meals_user_local_day_idx
  on public.meals (user_id, public.local_day(eaten_at));

create index if not exists meals_user_binge_idx
  on public.meals (user_id, eaten_at desc) where is_binge;

create table if not exists public.meal_items (
  id             uuid primary key default gen_random_uuid(),
  meal_id        uuid not null references public.meals (id) on delete cascade,
  name           text not null,
  quantity_text  text not null default '',
  kcal           numeric(7,1) not null default 0 check (kcal      >= 0),
  protein_g      numeric(6,1) not null default 0 check (protein_g >= 0),
  carbs_g        numeric(6,1) not null default 0 check (carbs_g   >= 0),
  fat_g          numeric(6,1) not null default 0 check (fat_g     >= 0)
);

create index if not exists meal_items_meal_idx
  on public.meal_items (meal_id);

create table if not exists public.weigh_ins (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade
                 default auth.uid(),
  measured_at  date not null,
  weight_kg    numeric(5,2) not null check (weight_kg > 0),
  waist_cm     numeric(5,1) check (waist_cm > 0),
  note         text,
  unique (user_id, measured_at)                      -- un registro por día
);

create index if not exists weigh_ins_user_date_idx
  on public.weigh_ins (user_id, measured_at desc);

-- ---------------------------------------------------------------------
-- 4. Row Level Security
-- ---------------------------------------------------------------------
alter table public.settings   enable row level security;
alter table public.meals      enable row level security;
alter table public.meal_items enable row level security;
alter table public.weigh_ins  enable row level security;

-- settings -------------------------------------------------------------
create policy "settings_select_own" on public.settings
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "settings_insert_own" on public.settings
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "settings_update_own" on public.settings
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "settings_delete_own" on public.settings
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- meals ----------------------------------------------------------------
create policy "meals_select_own" on public.meals
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "meals_insert_own" on public.meals
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "meals_update_own" on public.meals
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "meals_delete_own" on public.meals
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- meal_items (no tiene user_id: hereda el dueño desde meals) ------------
create policy "meal_items_select_own" on public.meal_items
  for select to authenticated
  using (exists (
    select 1 from public.meals m
    where m.id = meal_items.meal_id
      and m.user_id = (select auth.uid())
  ));

create policy "meal_items_insert_own" on public.meal_items
  for insert to authenticated
  with check (exists (
    select 1 from public.meals m
    where m.id = meal_items.meal_id
      and m.user_id = (select auth.uid())
  ));

create policy "meal_items_update_own" on public.meal_items
  for update to authenticated
  using (exists (
    select 1 from public.meals m
    where m.id = meal_items.meal_id
      and m.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.meals m
    where m.id = meal_items.meal_id
      and m.user_id = (select auth.uid())
  ));

create policy "meal_items_delete_own" on public.meal_items
  for delete to authenticated
  using (exists (
    select 1 from public.meals m
    where m.id = meal_items.meal_id
      and m.user_id = (select auth.uid())
  ));

-- weigh_ins ------------------------------------------------------------
create policy "weigh_ins_select_own" on public.weigh_ins
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "weigh_ins_insert_own" on public.weigh_ins
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "weigh_ins_update_own" on public.weigh_ins
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "weigh_ins_delete_own" on public.weigh_ins
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------
-- 5. Vista de totales diarios (día en hora de Buenos Aires)
--    security_invoker = true → la vista respeta el RLS del usuario que
--    consulta (sin esto, correría con permisos del dueño y se saltearía RLS).
--    Incluye los días con comidas aunque no tengan ítems (totales en 0).
-- ---------------------------------------------------------------------
create or replace view public.daily_totals
with (security_invoker = true) as
select
  m.user_id,
  public.local_day(m.eaten_at)                                   as day,
  coalesce(sum(i.kcal), 0)::numeric(8,1)                         as kcal,
  coalesce(sum(i.protein_g), 0)::numeric(7,1)                    as protein_g,
  coalesce(sum(i.carbs_g), 0)::numeric(7,1)                      as carbs_g,
  coalesce(sum(i.fat_g), 0)::numeric(7,1)                        as fat_g,
  coalesce(sum(i.kcal) filter (where m.is_binge), 0)::numeric(8,1) as binge_kcal,
  count(distinct m.id)::int                                      as meals_count,
  (count(distinct m.id) filter (where m.is_binge))::int          as binge_count
from public.meals m
left join public.meal_items i on i.meal_id = m.id
group by m.user_id, public.local_day(m.eaten_at);

grant select on public.daily_totals to authenticated;

-- ---------------------------------------------------------------------
-- 6. updated_at automático en settings
-- ---------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists settings_touch on public.settings;
create trigger settings_touch
  before update on public.settings
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- 7. Crear la fila de settings automáticamente al crear el usuario
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.settings (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Si ya creaste tu usuario antes de correr esta migración:
insert into public.settings (user_id)
select id from auth.users
on conflict (user_id) do nothing;
