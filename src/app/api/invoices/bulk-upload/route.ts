import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 120;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── XML parser ───────────────────────────────────────────────────────────────

function getTag(xml: string, tag: string): string {
  const patterns = [
    new RegExp(`<${tag}\\s*>([^<]+)<\\/${tag}>`, "i"),
    new RegExp(`<[^\\s>:]+:${tag}\\s*>([^<]+)<\\/[^\\s>:]+:${tag}>`, "i"),
    new RegExp(`<${tag}\\s[^>]*>([^<]+)<\\/${tag}>`, "i"),
  ];
  for (const p of patterns) {
    const m = xml.match(p);
    if (m?.[1]?.trim()) return m[1].trim();
  }
  return "";
}

function fmtRut(raw: string): string {
  const clean = raw.replace(/\./g, "").toUpperCase();
  const parts = clean.split("-");
  if (parts.length === 2) {
    const body = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${body}-${parts[1]}`;
  }
  if (clean.length >= 8) {
    const body = clean.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${body}-${clean.slice(-1)}`;
  }
  return raw;
}

function titleCase(str: string): string {
  return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function parseXml(xmlText: string) {
  const folio = getTag(xmlText, "Folio");
  const monto = getTag(xmlText, "MntTotal");
  const fechaVencimiento = getTag(xmlText, "FchVenc");
  const fechaEmision = getTag(xmlText, "FchEmis");
  const rutRaw = getTag(xmlText, "RUTRecep");
  const razonRaw = getTag(xmlText, "RznSocRecep");
  if (!folio || !monto || !rutRaw) return null;
  return {
    folio,
    monto,
    fechaVencimiento,
    fechaEmision,
    rutDeudor: fmtRut(rutRaw),
    razonSocialDeudor: titleCase(razonRaw),
    emailContacto: "",
    telefonoContacto: "",
    fuente: "xml" as const,
  };
}

// ─── PDF text parsing (regex, probado contra facturas reales) ─────────────────

function parseFecha(raw: string): string {
  const m = raw.match(/(\d{2})\s*[\/\-]\s*(\d{2})\s*[\/\-]\s*(\d{4})/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  const m2 = raw.match(/(\d{4})\s*[\/\-]\s*(\d{2})\s*[\/\-]\s*(\d{2})/);
  if (m2) return `${m2[1]}-${m2[2]}-${m2[3]}`;
  return "";
}

function parsearTextoFactura(text: string) {
  const t = text.replace(/\r/g, "\n");

  // Folio — "N° 015734399" → "15734399"
  const folioM = t.match(/n[°º\.]\s*0*(\d{3,12})/i)
    ?? t.match(/folio\s*[:\s]+0*(\d{3,12})/i)
    ?? t.match(/invoice\s*#?\s*[:\s]*0*(\d{3,12})/i);
  const folio = folioM?.[1] ?? "";

  // RUT deudor — línea "RUT:76.198.337-7" (sin puntos entre R.U.T)
  const rutM = t.match(/(?:^|\n)\s*RUT\s*:[ \t]*(\d{1,2}\.?\d{3}\.?\d{3}-[\dkK])/m)
    ?? t.match(/(?:rut|r\.u\.t\.?)\s*[:\s]+(\d{1,2}\.?\d{3}\.?\d{3}-[\dkK])/i);
  const rutDeudor = rutM?.[1] ? fmtRut(rutM[1]) : "";

  // Razón social — "SEÑOR (ES):BARO SPA"
  const razonM = t.match(/se[ñn]or[^\n:]{0,15}:\s*([^\n\r]{2,60})/i)
    ?? t.match(/raz[oó]n\s+social\s*[:\s]+([^\n\r\$]{3,60})/i)
    ?? t.match(/receptor\s*[:\s]+([^\n\r\$]{3,60})/i)
    ?? t.match(/cliente\s*[:\s]+([^\n\r\$]{3,60})/i);
  const razonSocialDeudor = razonM?.[1] ? titleCase(razonM[1].trim()) : "";

  // Monto total a pagar — "Total a Pagar$13.090.000"
  const montoM = t.match(/total\s+a\s+pagar\s*[\$\s]*([\d.,]+)/i)
    ?? t.match(/monto\s+total\s*[\$\s]*([\d.,]+)/i)
    ?? t.match(/total\s*[\$]\s*([\d.,]+)/i);
  const monto = montoM?.[1] ? montoM[1].replace(/\./g, "").replace(/,/g, "") : "";

  // Fechas — acepta "27 / 05 / 2026" con espacios
  const vencM = t.match(/vencimiento\s*:?\s*(\d{2}\s*[\/\-]\s*\d{2}\s*[\/\-]\s*\d{4})/i);
  const emisM = t.match(/emision\s*:?\s*(\d{2}\s*[\/\-]\s*\d{2}\s*[\/\-]\s*\d{4})/i)
    ?? t.match(/emisi[oó]n\s*:?\s*(\d{2}\s*[\/\-]\s*\d{2}\s*[\/\-]\s*\d{4})/i);

  let fechaVencimiento = vencM?.[1] ? parseFecha(vencM[1]) : "";
  let fechaEmision = emisM?.[1] ? parseFecha(emisM[1]) : "";

  // Fallback: todas las fechas del doc
  if (!fechaVencimiento || !fechaEmision) {
    const datePattern = /\b(\d{2})\s*[\/\-]\s*(\d{2})\s*[\/\-]\s*(\d{4})\b/g;
    const fechas: string[] = [];
    let dm;
    while ((dm = datePattern.exec(t)) !== null) {
      const f = `${dm[3]}-${dm[2]}-${dm[1]}`;
      if (f >= "2000-01-01" && f <= "2099-12-31") fechas.push(f);
    }
    const unicas = Array.from(new Set(fechas)).sort();
    if (!fechaEmision) fechaEmision = unicas[0] ?? "";
    if (!fechaVencimiento) fechaVencimiento = unicas[unicas.length - 1] ?? "";
    if (unicas.length === 1) { fechaVencimiento = unicas[0]; fechaEmision = ""; }
  }

  // Email
  const emailM = t.match(/\b([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})\b/);
  const emailContacto = emailM?.[1]?.toLowerCase() ?? "";

  // Teléfono
  const telPatterns = [
    /(?:tel[eé]fono|tel\.?|fono|whatsapp|celular|m[oó]vil)\s*[:/]?\s*([+\d][\d\s\-().]{6,18})/i,
    /(\+56\s*[\d\s]{8,14})/,
    /\b(9\s*\d{4}\s*\d{4})\b/,
  ];
  let telefonoContacto = "";
  for (const p of telPatterns) {
    const m = t.match(p);
    if (m?.[1]) { telefonoContacto = m[1].trim().replace(/\s+/g, " "); break; }
  }

  return { folio, rutDeudor, razonSocialDeudor, monto, fechaEmision, fechaVencimiento, emailContacto, telefonoContacto };
}

// ─── PDF extraction (pdf-parse v1 + Claude fallback) ─────────────────────────

async function extractFromPdf(buffer: ArrayBuffer) {
  // ── Estrategia 1: pdf-parse → regex (rápido, sin costo) ──
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse");
    const data = await pdfParse(Buffer.from(buffer));
    const text: string = data.text ?? "";
    if (text.trim()) {
      const datos = parsearTextoFactura(text);
      // Si extraemos al menos folio + monto + fecha, lo damos por bueno
      if (datos.folio && datos.monto && datos.fechaVencimiento) {
        return { ...datos, fuente: "pdf" as const };
      }
      // Si faltó algo, intentamos con Claude pasándole el texto
      try {
        const msg = await anthropic.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 512,
          messages: [{
            role: "user",
            content: `Extrae los datos de esta factura chilena y responde SOLO con JSON válido:
{"folio":"número sin ceros a la izquierda","rutDeudor":"RUT del receptor en XX.XXX.XXX-X","razonSocialDeudor":"razón social receptor","monto":"total a pagar como entero sin puntos ni simbolos","fechaEmision":"YYYY-MM-DD","fechaVencimiento":"YYYY-MM-DD","emailContacto":"o vacío","telefonoContacto":"o vacío"}

Texto del PDF:
${text.slice(0, 6000)}`,
          }],
        });
        const raw = msg.content[0]?.type === "text" ? msg.content[0].text : "";
        const jsonM = raw.match(/\{[\s\S]*\}/);
        if (jsonM) {
          const p = JSON.parse(jsonM[0]);
          return {
            folio: String(p.folio ?? datos.folio ?? ""),
            rutDeudor: String(p.rutDeudor ?? datos.rutDeudor ?? ""),
            razonSocialDeudor: String(p.razonSocialDeudor ?? datos.razonSocialDeudor ?? ""),
            monto: String(p.monto ?? datos.monto ?? "").replace(/\D/g, ""),
            fechaEmision: String(p.fechaEmision ?? datos.fechaEmision ?? ""),
            fechaVencimiento: String(p.fechaVencimiento ?? datos.fechaVencimiento ?? ""),
            emailContacto: String(p.emailContacto ?? ""),
            telefonoContacto: String(p.telefonoContacto ?? ""),
            fuente: "pdf" as const,
          };
        }
      } catch { /* Usar datos de regex */ }
      // Devolver lo que tenemos aunque incompleto (el usuario puede corregir en la tabla)
      return { ...datos, fuente: "pdf" as const };
    }
  } catch { /* Continuar con Claude nativo */ }

  // ── Estrategia 2: Claude con PDF nativo (para PDFs escaneados) ──
  try {
    const base64 = Buffer.from(buffer).toString("base64");
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      messages: [{
        role: "user",
        content: [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } },
          { type: "text", text: `Extrae los datos de esta factura chilena y responde SOLO con JSON válido:
{"folio":"número sin ceros a la izquierda","rutDeudor":"RUT del receptor en XX.XXX.XXX-X","razonSocialDeudor":"razón social receptor","monto":"total a pagar como entero","fechaEmision":"YYYY-MM-DD","fechaVencimiento":"YYYY-MM-DD","emailContacto":"","telefonoContacto":""}` },
        ],
      }],
    });
    const raw = msg.content[0]?.type === "text" ? msg.content[0].text.trim() : "";
    const jsonM = raw.match(/\{[\s\S]*\}/);
    if (jsonM) {
      const p = JSON.parse(jsonM[0]);
      return {
        folio: String(p.folio ?? ""),
        rutDeudor: String(p.rutDeudor ?? ""),
        razonSocialDeudor: String(p.razonSocialDeudor ?? ""),
        monto: String(p.monto ?? "").replace(/\D/g, ""),
        fechaEmision: String(p.fechaEmision ?? ""),
        fechaVencimiento: String(p.fechaVencimiento ?? ""),
        emailContacto: String(p.emailContacto ?? ""),
        telefonoContacto: String(p.telefonoContacto ?? ""),
        fuente: "pdf" as const,
      };
    }
  } catch { /* nada */ }

  return { error: "No se pudo extraer información del PDF." };
}

// ─── Imagen → entrada manual ──────────────────────────────────────────────────

function entradaManualImagen() {
  return {
    folio: "", rutDeudor: "", razonSocialDeudor: "",
    monto: "", fechaEmision: "", fechaVencimiento: "",
    emailContacto: "", telefonoContacto: "",
    fuente: "manual" as const,
  };
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    if (!files.length) return NextResponse.json({ error: "Sin archivos" }, { status: 400 });

    const results = await Promise.all(
      files.map(async (file) => {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
        try {
          if (ext === "xml") {
            const buffer = await file.arrayBuffer();
            for (const enc of ["iso-8859-1", "utf-8"] as const) {
              const text = new TextDecoder(enc).decode(buffer);
              const datos = parseXml(text);
              if (datos) return { fileName: file.name, status: "ok", datos };
            }
            return { fileName: file.name, status: "error", error: "XML del SII inválido — faltan etiquetas Folio, MntTotal o RUTRecep" };
          }

          if (ext === "pdf") {
            const buffer = await file.arrayBuffer();
            const result = await extractFromPdf(buffer);
            if ("error" in result) {
              return { fileName: file.name, status: "ok", datos: entradaManualImagen() };
            }
            return { fileName: file.name, status: "ok", datos: result };
          }

          if (["png", "jpg", "jpeg"].includes(ext)) {
            return { fileName: file.name, status: "ok", datos: entradaManualImagen() };
          }

          return { fileName: file.name, status: "error", error: `Formato no soportado: .${ext}` };
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Error inesperado";
          return { fileName: file.name, status: "error", error: msg };
        }
      })
    );

    return NextResponse.json({ results });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error del servidor";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
