-- ============================================================
-- Campos reales del motor de scoring (Portal CLECO v2.0 - Claude Designer)
-- Reemplaza la aproximación de la migración anterior (riesgo/sector) por
-- los campos exactos que usa la fórmula real: tipo de deudor, confiabilidad
-- numérica y conteo de contactos intentados por factura.
--
-- Seguro de correr en producción: todo ADD COLUMN IF NOT EXISTS,
-- no borra ni modifica datos existentes.
-- Ejecutar en Supabase Dashboard → SQL Editor.
-- ============================================================

-- deudores: categoría real (antes se usaba "riesgo"/"sector" como aproximación)
alter table public.deudores add column if not exists tipo text not null default 'pyme'
  check (tipo in ('persona_natural','pyme','inmobiliaria','construccion','institucion','gran_empresa','organismo_publico'));

-- confiabilidad 0-100: reemplaza el cálculo aproximado por mora promedio
alter table public.deudores add column if not exists confiabilidad int not null default 50
  check (confiabilidad >= 0 and confiabilidad <= 100);

alter table public.deudores add column if not exists comuna text;
alter table public.deudores add column if not exists cargo  text;

-- "giro" sí es un campo real del diseño (rubro/descripción del negocio) — se había
-- descartado por error en una migración anterior porque la columna no existía en BD.
alter table public.deudores add column if not exists giro text;

-- facturas: conteo real de intentos de contacto (antes hardcodeado a 50/neutro)
alter table public.facturas add column if not exists contactos_intentados int not null default 0;
