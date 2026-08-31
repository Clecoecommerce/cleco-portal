-- ============================================================
-- Ingesta de nómina (CSV/Excel) + trazabilidad de gestiones
--
-- 1. facturas.fecha_emision: el dato ya se extraía en el parser
--    (bulk-upload/route.ts) pero se descartaba por falta de columna.
--    Sin él es imposible calcular DSO.
-- 2. tabla gestiones: registro de cada contacto enviado a un deudor,
--    con estado de entrega/apertura para trazabilidad y para alimentar
--    el recomendador de canal.
--
-- Seguro de correr en producción: todo IF NOT EXISTS, no borra datos.
-- Ejecutar en Supabase Dashboard → SQL Editor.
-- ============================================================

-- ── 1. Fecha de emisión ──────────────────────────────────────
-- Nullable a propósito: las facturas ya cargadas no la tienen y no
-- se puede inferir. Las nuevas sí la exigirán desde la aplicación.
alter table public.facturas add column if not exists fecha_emision date;

-- ── 2. Trazabilidad de gestiones ─────────────────────────────
create table if not exists public.gestiones (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references public.profiles(id) on delete cascade,
  deudor_id    uuid not null references public.deudores(id) on delete cascade,
  -- Nullable: permite gestiones consolidadas que cubren varias facturas
  factura_id   uuid references public.facturas(id) on delete cascade,

  canal        text not null check (canal in ('email','whatsapp','sms','llamada','carta')),
  -- Etapa de la cadena de cobranza que originó el mensaje
  etapa        text check (etapa in ('preventiva','vencimiento','mora_media','escalacion','manual')),
  destinatario text,
  asunto       text,

  -- ID del mensaje en el proveedor (Resend/Twilio), para conciliar webhooks
  proveedor        text,
  proveedor_msg_id text,

  estado       text not null default 'enviado'
    check (estado in ('enviado','entregado','abierto','click','rebotado','fallido')),
  error_msg    text,

  enviado_at   timestamptz not null default now(),
  entregado_at timestamptz,
  abierto_at   timestamptz,
  click_at     timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists gestiones_deudor_idx    on public.gestiones (deudor_id, enviado_at desc);
create index if not exists gestiones_factura_idx   on public.gestiones (factura_id);
create index if not exists gestiones_profile_idx   on public.gestiones (profile_id, enviado_at desc);
-- Lookup por webhook entrante del proveedor
create index if not exists gestiones_proveedor_idx on public.gestiones (proveedor_msg_id);

alter table public.gestiones enable row level security;
create policy "gestiones_all_own" on public.gestiones for all using (profile_id = auth.uid());

-- ── 3. Índices de apoyo a la ingesta ─────────────────────────
-- La deduplicación consulta facturas por (profile_id, numero) en cada carga.
create index if not exists facturas_profile_numero_idx on public.facturas (profile_id, numero);
