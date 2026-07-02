-- ============================================================
-- FIX: columnas usadas por el código pero ausentes/desincronizadas
-- en la base de datos real (causaba error 42703 "column giro does
-- not exist" y rompía por completo la Bandeja de Cobranza y Reportes).
--
-- Seguro de correr en producción: todo es ADD COLUMN IF NOT EXISTS,
-- no borra ni modifica datos existentes.
-- Ejecutar en Supabase Dashboard → SQL Editor.
-- ============================================================

-- deudores: columnas de contacto/ficha que el portal ya consulta
alter table public.deudores add column if not exists email_contacto   text;
alter table public.deudores add column if not exists telefono_contacto text;
alter table public.deudores add column if not exists nombre_contacto  text;
alter table public.deudores add column if not exists direccion        text;

-- facturas: columnas de repactación usadas al subir/editar facturas
alter table public.facturas add column if not exists repactado   boolean not null default false;
alter table public.facturas add column if not exists num_cuotas  int;
alter table public.facturas add column if not exists monto_cuota bigint;

-- Nota: la columna "giro" que el código pedía nunca existió — se reemplazó
-- en el código por "sector" (columna que sí existe desde el schema original)
-- para el campo "Tipo de deudor". No requiere migración.
