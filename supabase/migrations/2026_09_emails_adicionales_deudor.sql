-- Correos adicionales por deudor.
--
-- En una PyME el que aprueba la factura y el que la paga rara vez son la misma
-- persona. Cobrar a una sola casilla es la causa más común de "no me llegó".
-- CobranzaOnline permite hasta 10 destinatarios por empresa; acá replicamos eso.
--
-- Columna aditiva y nullable: no rompe filas existentes ni el código actual.

alter table deudores
  add column if not exists emails_adicionales text[] default '{}';

comment on column deudores.emails_adicionales is
  'Destinatarios extra en copia de la cobranza. Máximo 10, validado en la aplicación.';
