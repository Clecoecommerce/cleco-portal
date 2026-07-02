-- ============================================================
-- CLECO PORTAL — DATABASE SCHEMA
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. PROFILES
-- One row per authenticated user (empresa cliente)
create table if not exists public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  rut               text not null,
  razon_social      text not null,
  email             text not null,
  banco             text,
  cuenta_corriente  text,
  ejecutivo_nombre  text default 'Carolina Méndez',
  ejecutivo_email   text default 'carolina.mendez@cleco.cl',
  created_at        timestamptz default now() not null
);

-- 2. DEUDORES
-- Debtor companies linked to a client
create table if not exists public.deudores (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references public.profiles(id) on delete cascade,
  rut          text not null,
  razon_social text not null,
  sector       text,
  mora_dias    int  not null default 0,
  riesgo       text not null default 'bajo' check (riesgo in ('bajo', 'medio', 'alto')),
  -- Motor de scoring (Portal v2.0): categoría real y confiabilidad numérica del deudor
  tipo         text not null default 'pyme'
    check (tipo in ('persona_natural','pyme','inmobiliaria','construccion','institucion','gran_empresa','organismo_publico')),
  confiabilidad int not null default 50 check (confiabilidad >= 0 and confiabilidad <= 100),
  giro              text,
  comuna            text,
  cargo             text,
  email_contacto    text,
  telefono_contacto text,
  nombre_contacto   text,
  direccion         text,
  created_at   timestamptz default now() not null,
  unique (profile_id, rut)
);

-- 3. FACTURAS
-- Invoices submitted for collection
create table if not exists public.facturas (
  id                uuid primary key default gen_random_uuid(),
  profile_id        uuid not null references public.profiles(id) on delete cascade,
  deudor_id         uuid not null references public.deudores(id) on delete cascade,
  numero            text not null,
  monto             bigint not null,
  fecha_vencimiento date not null,
  estado            text not null default 'en_gestion' check (estado in ('en_gestion', 'pendiente', 'pagada')),
  archivo_url       text,
  notas             text,
  repactado         boolean not null default false,
  num_cuotas        int,
  monto_cuota       bigint,
  contactos_intentados int not null default 0,
  created_at        timestamptz default now() not null
);

-- 4. PAGOS
-- Payments recovered and liquidation records
create table if not exists public.pagos (
  id             uuid primary key default gen_random_uuid(),
  factura_id     uuid not null references public.facturas(id) on delete cascade,
  profile_id     uuid not null references public.profiles(id) on delete cascade,
  fecha          date not null,
  monto_bruto    bigint not null,
  honorarios_pct numeric(5,2) not null default 12.00,
  metodo         text not null default 'Transferencia',
  estado         text not null default 'en_proceso' check (estado in ('en_proceso', 'liquidado')),
  created_at     timestamptz default now() not null
);

-- ============================================================
-- ROW LEVEL SECURITY
-- Each client can only see and modify their own data
-- ============================================================

alter table public.profiles  enable row level security;
alter table public.deudores  enable row level security;
alter table public.facturas  enable row level security;
alter table public.pagos     enable row level security;

-- profiles: user can only read/update their own row
create policy "profiles_select_own" on public.profiles for select using (id = auth.uid());
create policy "profiles_update_own" on public.profiles for update using (id = auth.uid());

-- deudores
create policy "deudores_all_own" on public.deudores for all using (profile_id = auth.uid());

-- facturas
create policy "facturas_all_own" on public.facturas for all using (profile_id = auth.uid());

-- pagos
create policy "pagos_select_own" on public.pagos for select using (profile_id = auth.uid());

-- ============================================================
-- TRIGGER: auto-create profile on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, rut, razon_social, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'rut', ''),
    coalesce(new.raw_user_meta_data->>'razon_social', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- STORAGE BUCKET for invoice files
-- ============================================================
-- Run this separately or via Supabase Dashboard → Storage
-- insert into storage.buckets (id, name, public) values ('facturas', 'facturas', false);
-- create policy "facturas_upload_own" on storage.objects for insert with check (bucket_id = 'facturas' and auth.uid()::text = (storage.foldername(name))[1]);
-- create policy "facturas_read_own"   on storage.objects for select using (bucket_id = 'facturas' and auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- SEED DATA (optional — for local development)
-- Replace '00000000-0000-0000-0000-000000000000' with a real auth.users id
-- ============================================================
-- insert into public.profiles (id, rut, razon_social, email, banco, cuenta_corriente)
-- values ('00000000-0000-0000-0000-000000000000', '76.543.210-K', 'Ferretería Andes Ltda.', 'contacto@ferreteria-andes.cl', 'BCI', '12345678');
