import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 120;

// ─── XML parser (regex — server-side, no DOMParser) ──────────────────────────

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
    fuente: "xml" as const,
  };
}

// ─── Text extraction from OCR/PDF output ─────────────────────────────────────

function parsearTextoFactura(text: string) {
  const t = text.replace(/\r/g, "\n");

  // ── Folio ──
  let folio = "";
  const folioPatterns = [
    /n[°º\.]\s*(?:de\s+factura)?\s*[:\s]*(\d{3,12})/i,
    /folio\s*[:\s]+(\d{3,12})/i,
    /factura\s+(?:electr[oó]nica\s+)?n[°º]?\s*[:\s]*(\d{3,12})/i,
    /invoice\s*#?\s*[:\s]*(\d{3,12})/i,
  ];
  for (const p of folioPatterns) {
    const m = t.match(p);
    if (m?.[1]) { folio = m[1]; break; }
  }

  // ── RUT deudor — toma todos los RUTs del texto, el más relevante es el del receptor ──
  const rutRegex = /\b(\d{1,2}\.?\d{3}\.?\d{3}-[\dkK])\b/g;
  const ruts: string[] = [];
  let rm;
  while ((rm = rutRegex.exec(t)) !== null) {
    if (rm[1]) ruts.push(fmtRut(rm[1]));
  }

  // El RUT del receptor suele aparecer junto a etiquetas como "R.U.T.", "RUT", "Receptor"
  let rutDeudor = "";
  const rutLabel = t.match(/(?:r\.?u\.?t\.?|rut)\s*[:\s]+(\d{1,2}\.?\d{3}\.?\d{3}-[\dkK])/i);
  if (rutLabel?.[1]) {
    rutDeudor = fmtRut(rutLabel[1]);
  } else if (ruts.length > 0) {
    rutDeudor = ruts[0] ?? "";
  }

  // ── Razón social ──
  let razonSocialDeudor = "";
  const razonPatterns = [
    /raz[oó]n\s+social\s*[:\s]+([^\n\r$]{3,60})/i,
    /receptor\s*[:\s]+([^\n\r$]{3,60})/i,
    /cliente\s*[:\s]+([^\n\r$]{3,60})/i,
    /(?:señor(?:es)?|sr\.?)\s*[:\s]+([^\n\r$]{3,60})/i,
  ];
  for (const p of razonPatterns) {
    const m = t.match(p);
    const val = m?.[1]?.trim();
    if (val && val.length > 2) { razonSocialDeudor = titleCase(val); break; }
  }

  // ── Monto total ──
  let monto = "";
  const montoPatterns = [
    /total\s*\(?clp\)?\s*[\$\s:]*\$?\s*([\d.,]+)/i,
    /total\s+a\s+pagar\s*[\$\s:]*\$?\s*([\d.,]+)/i,
    /monto\s+total\s*[\$\s:]*\$?\s*([\d.,]+)/i,
    /total\s*[\$\s:]*\$\s*([\d.,]+)/i,
    /\$\s*([\d.,]{4,})\s*$/m,
  ];
  for (const p of montoPatterns) {
    const m = t.match(p);
    if (m?.[1]) {
      monto = m[1].replace(/\./g, "").replace(/,/g, "");
      break;
    }
  }

  // ── Fechas — primero busca por etiqueta, luego por posición ──
  function parseFecha(raw: string): string {
    // DD/MM/YYYY → YYYY-MM-DD
    const m = raw.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
    if (m) return `${m[3]}-${m[2]}-${m[1]}`;
    // YYYY-MM-DD directo
    const m2 = raw.match(/(\d{4})[\/\-](\d{2})[\/\-](\d{2})/);
    if (m2) return `${m2[1]}-${m2[2]}-${m2[3]}`;
    return "";
  }

  // Buscar fecha de vencimiento por etiqueta
  let fechaVencimiento = "";
  const vencimientoMatch = t.match(
    /(?:vencimiento|vence|vto\.?|expir[ae]|due\s*date|plazo)[^\d]{0,20}(\d{2}[\/-]\d{2}[\/-]\d{4}|\d{4}[\/-]\d{2}[\/-]\d{2})/i
  );
  if (vencimientoMatch?.[1]) fechaVencimiento = parseFecha(vencimientoMatch[1]);

  // Buscar fecha de emisión por etiqueta
  let fechaEmision = "";
  const emisionMatch = t.match(
    /(?:emisi[oó]n|emitida|fecha\s+doc|fecha\s+factura|issue\s*date)[^\d]{0,20}(\d{2}[\/-]\d{2}[\/-]\d{4}|\d{4}[\/-]\d{2}[\/-]\d{2})/i
  );
  if (emisionMatch?.[1]) fechaEmision = parseFecha(emisionMatch[1]);

  // Fallback: recoger todas las fechas y asumir menor=emisión, mayor=vencimiento
  if (!fechaVencimiento || !fechaEmision) {
    const datePattern = /\b(\d{2})[\/\-](\d{2})[\/\-](\d{4})\b/g;
    const fechas: string[] = [];
    let dm;
    while ((dm = datePattern.exec(t)) !== null) {
      const f = `${dm[3]}-${dm[2]}-${dm[1]}`;
      // Filtrar fechas razonables (entre 2000 y 2099)
      if (f >= "2000-01-01" && f <= "2099-12-31") fechas.push(f);
    }
    const unicas = Array.from(new Set(fechas)).sort();
    if (!fechaEmision) fechaEmision = unicas[0] ?? "";
    if (!fechaVencimiento) fechaVencimiento = unicas[unicas.length - 1] ?? "";
    // Si solo hay una fecha, es el vencimiento (más importante)
    if (unicas.length === 1) { fechaVencimiento = unicas[0]; fechaEmision = ""; }
  }

  // ── Email ──
  let emailContacto = "";
  const emailMatch = t.match(/\b([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})\b/);
  if (emailMatch?.[1]) emailContacto = emailMatch[1].toLowerCase();

  // ── Teléfono ──
  let telefonoContacto = "";
  const telPatterns = [
    /(?:tel[eé]fono|tel\.?|fono|whatsapp|celular|m[oó]vil|phone)\s*[:/]?\s*([+\d][\d\s\-().]{6,18})/i,
    /(\+56\s*[\d\s]{8,14})/,
    /\b(9\s*\d{4}\s*\d{4})\b/,
  ];
  for (const p of telPatterns) {
    const m = t.match(p);
    if (m?.[1]) { telefonoContacto = m[1].trim().replace(/\s+/g, " "); break; }
  }

  return { folio, rutDeudor, razonSocialDeudor, monto, fechaEmision, fechaVencimiento, emailContacto, telefonoContacto };
}

// ─── PDF extraction (gratis — pdf-parse) ─────────────────────────────────────

async function extractFromPdf(buffer: ArrayBuffer) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse");
    const data = await pdfParse(Buffer.from(buffer));
    const text = data.text ?? "";
    if (!text.trim()) return { error: "El PDF no contiene texto legible. Intenta exportarlo como PDF de texto o sube el XML del SII." };
    const datos = parsearTextoFactura(text);
    return { ...datos, fuente: "pdf" as const };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return { error: `No se pudo leer el PDF: ${msg.slice(0, 100)}` };
  }
}

// ─── Images → entrada manual ──────────────────────────────────────────────────
// Tesseract.js no es compatible con entornos serverless (Vercel).
// Las imágenes crean una fila editable vacía para que el usuario complete los datos.

function entradaManualImagen() {
  return {
    folio: "", rutDeudor: "", razonSocialDeudor: "",
    monto: "", fechaEmision: "", fechaVencimiento: "",
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
            if ("error" in result) return { fileName: file.name, status: "error", error: result.error };
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
