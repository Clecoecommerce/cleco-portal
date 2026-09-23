"use server";

import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// ─── Cobranza consolidada ─────────────────────────────────────────────────────

export interface FacturaParaCobro {
  numero: string;
  monto: number;
  /** ISO yyyy-mm-dd */
  fechaVencimiento: string;
}

export interface ResultadoCobranza {
  enviado: boolean;
  /** Facturas incluidas en el correo (solo las vencidas) */
  notificadas: number;
  /** Facturas omitidas por no estar vencidas todavía */
  omitidas: number;
}

/**
 * Envía UN solo correo por deudor con todas sus facturas vencidas.
 *
 * Reemplaza al envío por factura: subir una nómina de 15 documentos del mismo
 * deudor mandaba 15 correos simultáneos, incluyendo facturas que aún no vencían.
 *
 * El filtro de "solo vencidas" vive acá a propósito y no en el llamador: es una
 * garantía del módulo, no una disciplina que cada pantalla tenga que recordar.
 */
export async function enviarCobranzaConsolidada(params: {
  profileId: string;
  emailDeudor: string;
  nombreDeudor: string;
  facturas: FacturaParaCobro[];
}): Promise<ResultadoCobranza> {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const vencidas = params.facturas.filter(f => {
    const venc = new Date(f.fechaVencimiento + "T12:00:00");
    return venc.getTime() < hoy.getTime();
  });
  const omitidas = params.facturas.length - vencidas.length;

  if (!resend || vencidas.length === 0) {
    return { enviado: false, notificadas: 0, omitidas };
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("razon_social, ejecutivo_nombre, ejecutivo_email")
    .eq("id", params.profileId)
    .single();

  const emisor    = profile?.razon_social     ?? "Tu proveedor";
  const ejecutivo = profile?.ejecutivo_nombre ?? "Ejecutivo CLECO";
  const emailEjec = profile?.ejecutivo_email  ?? "contacto@cleco.cl";

  const total = vencidas.reduce((s, f) => s + f.monto, 0);
  const asunto = vencidas.length === 1
    ? `Factura N°${vencidas[0].numero} pendiente de pago — ${emisor}`
    : `${vencidas.length} facturas pendientes de pago — ${emisor}`;

  await resend.emails.send({
    from: "CLECO Cobranza <cobranza@cleco.cl>",
    to: params.emailDeudor,
    subject: asunto,
    html: plantillaConsolidada({
      nombreDeudor: params.nombreDeudor,
      emisor,
      ejecutivo,
      emailEjec,
      facturas: vencidas.map(f => ({
        numero:  f.numero,
        montoFmt: formatCLP(f.monto),
        fechaFmt: formatFecha(f.fechaVencimiento),
        moraDias: Math.floor((hoy.getTime() - new Date(f.fechaVencimiento + "T12:00:00").getTime()) / 86_400_000),
      })),
      totalFmt: formatCLP(total),
    }),
  });

  return { enviado: true, notificadas: vencidas.length, omitidas };
}

function formatCLP(monto: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency", currency: "CLP", minimumFractionDigits: 0,
  }).format(monto);
}

function formatFecha(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString("es-CL", {
    day: "numeric", month: "long", year: "numeric",
  });
}

interface FilaPlantilla {
  numero: string;
  montoFmt: string;
  fechaFmt: string;
  moraDias: number;
}

function plantillaConsolidada(p: {
  nombreDeudor: string;
  emisor: string;
  ejecutivo: string;
  emailEjec: string;
  facturas: FilaPlantilla[];
  totalFmt: string;
}): string {
  const filas = p.facturas.map(f => `
    <tr>
      <td style="padding:10px 0;font-size:13px;color:#0F172A;font-weight:600;border-bottom:1px solid #F1F5F9;">${f.numero}</td>
      <td style="padding:10px 0;font-size:12px;color:#64748B;border-bottom:1px solid #F1F5F9;">${f.fechaFmt}</td>
      <td style="padding:10px 0;font-size:12px;color:#B23B3B;font-weight:600;text-align:center;border-bottom:1px solid #F1F5F9;">${f.moraDias} d</td>
      <td style="padding:10px 0;font-size:13px;color:#0F172A;font-weight:600;text-align:right;border-bottom:1px solid #F1F5F9;">${f.montoFmt}</td>
    </tr>`).join("");

  const plural = p.facturas.length === 1 ? "la siguiente factura pendiente" : `las siguientes ${p.facturas.length} facturas pendientes`;

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:580px;margin:40px auto;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">

    <div style="background:#0F172A;padding:28px 32px;">
      <p style="margin:0;font-size:22px;font-weight:700;color:#fff;letter-spacing:-0.5px;">cleCo</p>
      <p style="margin:4px 0 0;font-size:11px;color:#8DA3C2;text-transform:uppercase;letter-spacing:1.5px;">Gestión de Cobranza · Chile</p>
    </div>

    <div style="background:#fff;padding:36px 32px;">
      <p style="margin:0 0 6px;font-size:15px;color:#0F172A;">Estimado/a representante de <strong>${p.nombreDeudor}</strong>,</p>
      <p style="margin:0 0 24px;font-size:14px;color:#475569;line-height:1.6;">
        Le informamos que <strong>${p.emisor}</strong> nos ha encargado la gestión de cobro de ${plural}:
      </p>

      <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:20px 24px;margin-bottom:24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <th style="padding:0 0 8px;font-size:11px;color:#94A3B8;text-transform:uppercase;letter-spacing:.5px;text-align:left;font-weight:600;">Factura</th>
            <th style="padding:0 0 8px;font-size:11px;color:#94A3B8;text-transform:uppercase;letter-spacing:.5px;text-align:left;font-weight:600;">Vencimiento</th>
            <th style="padding:0 0 8px;font-size:11px;color:#94A3B8;text-transform:uppercase;letter-spacing:.5px;text-align:center;font-weight:600;">Mora</th>
            <th style="padding:0 0 8px;font-size:11px;color:#94A3B8;text-transform:uppercase;letter-spacing:.5px;text-align:right;font-weight:600;">Monto</th>
          </tr>
          ${filas}
          <tr>
            <td colspan="3" style="padding:14px 0 0;font-size:13px;color:#64748B;font-weight:600;">Total adeudado</td>
            <td style="padding:14px 0 0;font-size:20px;color:#0F172A;font-weight:700;text-align:right;">${p.totalFmt}</td>
          </tr>
        </table>
      </div>

      <p style="margin:0 0 8px;font-size:14px;color:#475569;line-height:1.6;">
        Le solicitamos regularizar estos pagos a la brevedad. Si desea coordinar una forma de pago o tiene consultas, comuníquese directamente con nuestro ejecutivo:
      </p>
      <p style="margin:0 0 24px;font-size:14px;">
        <strong style="color:#0F172A;">${p.ejecutivo}</strong><br>
        <a href="mailto:${p.emailEjec}" style="color:#2563EB;text-decoration:none;">${p.emailEjec}</a>
      </p>

      <div style="text-align:center;margin:28px 0;">
        <a href="mailto:${p.emailEjec}?subject=Re: Cobranza ${p.emisor}"
           style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;">
          Responder a este cobro
        </a>
      </div>
    </div>

    <div style="background:#F8FAFC;border-top:1px solid #E2E8F0;padding:20px 32px;">
      <p style="margin:0;font-size:11px;color:#94A3B8;line-height:1.7;">
        Este mensaje fue enviado por <strong>CLECO SpA</strong> en representación de <strong>${p.emisor}</strong>.
        CLECO es una empresa de cobranza extrajudicial que opera conforme a la <strong>Ley 21.131 de pronto pago</strong>.
        Si considera que este mensaje fue enviado por error, por favor ignórelo o contáctenos a
        <a href="mailto:contacto@cleco.cl" style="color:#64748B;">contacto@cleco.cl</a>.
      </p>
    </div>

  </div>
</body>
</html>`;
}
