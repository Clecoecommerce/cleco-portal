"use server";

import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface EmailCobranzaParams {
  profileId: string;
  emailDeudor: string;
  nombreDeudor: string;
  numeroFactura: string;
  monto: number;
  fechaVencimiento: string;
}

export async function enviarEmailCobranza(params: EmailCobranzaParams): Promise<void> {
  if (!resend) return; // Silencioso si no hay API key configurada

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("razon_social, ejecutivo_nombre, ejecutivo_email")
    .eq("id", params.profileId)
    .single();

  const emisor     = profile?.razon_social   ?? "Tu proveedor";
  const ejecutivo  = profile?.ejecutivo_nombre ?? "Ejecutivo CLECO";
  const emailEjec  = profile?.ejecutivo_email  ?? "contacto@cleco.cl";

  const montoFmt = new Intl.NumberFormat("es-CL", {
    style: "currency", currency: "CLP", minimumFractionDigits: 0,
  }).format(params.monto);

  const fechaFmt = new Date(params.fechaVencimiento + "T12:00:00").toLocaleDateString("es-CL", {
    day: "numeric", month: "long", year: "numeric",
  });

  await resend.emails.send({
    from: "CLECO Cobranza <cobranza@cleco.cl>",
    to: params.emailDeudor,
    subject: `Factura N°${params.numeroFactura} pendiente de pago — ${emisor}`,
    html: plantillaEmail({
      nombreDeudor: params.nombreDeudor,
      emisor,
      numeroFactura: params.numeroFactura,
      montoFmt,
      fechaFmt,
      ejecutivo,
      emailEjec,
    }),
  });
}

interface PlantillaProps {
  nombreDeudor: string;
  emisor: string;
  numeroFactura: string;
  montoFmt: string;
  fechaFmt: string;
  ejecutivo: string;
  emailEjec: string;
}

function plantillaEmail(p: PlantillaProps): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:580px;margin:40px auto;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">

    <!-- Header -->
    <div style="background:#0F172A;padding:28px 32px;">
      <p style="margin:0;font-size:22px;font-weight:700;color:#fff;letter-spacing:-0.5px;">cleCo</p>
      <p style="margin:4px 0 0;font-size:11px;color:#8DA3C2;text-transform:uppercase;letter-spacing:1.5px;">Gestión de Cobranza · Chile</p>
    </div>

    <!-- Body -->
    <div style="background:#fff;padding:36px 32px;">
      <p style="margin:0 0 6px;font-size:15px;color:#0F172A;">Estimado/a representante de <strong>${p.nombreDeudor}</strong>,</p>
      <p style="margin:0 0 24px;font-size:14px;color:#475569;line-height:1.6;">
        Le informamos que <strong>${p.emisor}</strong> nos ha encargado la gestión de cobro de la siguiente factura pendiente de pago:
      </p>

      <!-- Invoice card -->
      <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:20px 24px;margin-bottom:24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;font-size:13px;color:#64748B;border-bottom:1px solid #F1F5F9;">N° de factura</td>
            <td style="padding:8px 0;font-size:13px;color:#0F172A;font-weight:600;text-align:right;border-bottom:1px solid #F1F5F9;">${p.numeroFactura}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:13px;color:#64748B;border-bottom:1px solid #F1F5F9;">Emisor</td>
            <td style="padding:8px 0;font-size:13px;color:#0F172A;font-weight:600;text-align:right;border-bottom:1px solid #F1F5F9;">${p.emisor}</td>
          </tr>
          <tr>
            <td style="padding:12px 0 0;font-size:13px;color:#64748B;">Monto total</td>
            <td style="padding:12px 0 0;font-size:20px;color:#0F172A;font-weight:700;text-align:right;">${p.montoFmt}</td>
          </tr>
          ${p.fechaFmt ? `<tr>
            <td style="padding:4px 0 0;font-size:13px;color:#64748B;">Vencimiento</td>
            <td style="padding:4px 0 0;font-size:13px;color:#B23B3B;font-weight:600;text-align:right;">${p.fechaFmt}</td>
          </tr>` : ""}
        </table>
      </div>

      <p style="margin:0 0 8px;font-size:14px;color:#475569;line-height:1.6;">
        Le solicitamos regularizar este pago a la brevedad. Si desea coordinar una forma de pago o tiene consultas, comuníquese directamente con nuestro ejecutivo:
      </p>
      <p style="margin:0 0 24px;font-size:14px;">
        <strong style="color:#0F172A;">${p.ejecutivo}</strong><br>
        <a href="mailto:${p.emailEjec}" style="color:#2563EB;text-decoration:none;">${p.emailEjec}</a>
      </p>

      <!-- CTA -->
      <div style="text-align:center;margin:28px 0;">
        <a href="mailto:${p.emailEjec}?subject=Re: Factura N°${p.numeroFactura}"
           style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;">
          Responder a este cobro
        </a>
      </div>
    </div>

    <!-- Footer -->
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
