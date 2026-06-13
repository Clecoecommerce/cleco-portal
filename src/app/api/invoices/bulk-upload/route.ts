import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 120;

// ─── Server-side XML extraction (regex — no DOMParser in Node.js) ────────────

function getTag(xml: string, tag: string): string {
  // Try bare tag and namespaced variants
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

// ─── Claude Vision extraction ─────────────────────────────────────────────────

const EXTRACTION_PROMPT = `Extrae los datos de esta factura chilena y devuelve SOLO un objeto JSON válido, sin ningún texto adicional antes ni después. Usa exactamente estos campos:
{
  "folio": "número de factura o folio (solo dígitos)",
  "rutDeudor": "RUT del receptor en formato XX.XXX.XXX-X",
  "razonSocialDeudor": "razón social del receptor",
  "monto": "monto total en pesos chilenos (solo dígitos, sin puntos ni $ ni comas)",
  "fechaEmision": "fecha de emisión en formato YYYY-MM-DD",
  "fechaVencimiento": "fecha de vencimiento en formato YYYY-MM-DD"
}
Si un campo no está visible, usa cadena vacía "".`;

async function extractVision(base64: string, mediaType: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { error: "ANTHROPIC_API_KEY no configurada. Usa XML del SII para extracción automática." };
  }

  const client = new Anthropic({ apiKey });

  const contentBlock =
    mediaType === "application/pdf"
      ? [
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } } as any,
          { type: "text" as const, text: EXTRACTION_PROMPT },
        ]
      : [
          {
            type: "image" as const,
            source: {
              type: "base64" as const,
              media_type: mediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
              data: base64,
            },
          },
          { type: "text" as const, text: EXTRACTION_PROMPT },
        ];

  try {
    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: contentBlock }],
    });

    const text = msg.content
      .filter((c) => c.type === "text")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((c) => (c as any).text)
      .join("");

    const match = text.match(/\{[\s\S]*?\}/);
    if (!match) return { error: "No se pudo extraer datos de la imagen. Intenta con una foto más clara o sube el XML." };

    return { ...JSON.parse(match[0]), fuente: "vision" as const };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    // Retry once on transient errors
    if (msg.includes("overloaded") || msg.includes("529") || msg.includes("rate")) {
      await new Promise((r) => setTimeout(r, 2000));
      return extractVision(base64, mediaType);
    }
    return { error: `Error de visión: ${msg.slice(0, 120)}` };
  }
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
            // SII uses ISO-8859-1; try both encodings
            for (const enc of ["iso-8859-1", "utf-8"] as const) {
              const text = new TextDecoder(enc).decode(buffer);
              const datos = parseXml(text);
              if (datos) return { fileName: file.name, status: "ok", datos };
            }
            return { fileName: file.name, status: "error", error: "XML del SII no válido — faltan etiquetas Folio, MntTotal o RUTRecep" };
          }

          let mediaType: string;
          if (ext === "pdf") mediaType = "application/pdf";
          else if (ext === "jpg" || ext === "jpeg") mediaType = "image/jpeg";
          else if (ext === "png") mediaType = "image/png";
          else return { fileName: file.name, status: "error", error: `Formato no soportado: .${ext}` };

          const buffer = await file.arrayBuffer();
          const base64 = Buffer.from(buffer).toString("base64");
          const result = await extractVision(base64, mediaType);

          if (result.error) return { fileName: file.name, status: "error", error: result.error };
          return { fileName: file.name, status: "ok", datos: result };
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
