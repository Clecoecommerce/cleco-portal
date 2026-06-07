export interface SiiDatosExtraidos {
  folio: string;
  monto: string;
  fechaVencimiento: string; // YYYY-MM-DD
  rutDeudor: string;
  razonSocialDeudor: string;
  rutEmisor: string;
  razonSocialEmisor: string;
  tipoDte: string;
}

export function parsearXmlSii(xmlText: string): SiiDatosExtraidos | null {
  try {
    const parser = new DOMParser();

    // Intentar UTF-8 primero; si falla o devuelve garbage probar ISO-8859-1
    let doc = parser.parseFromString(xmlText, "text/xml");
    if (doc.querySelector("parsererror")) return null;

    // getElementsByTagNameNS("*", tag) cruza cualquier namespace — más robusto que getElementsByTagName
    const get = (tag: string): string => {
      const el =
        doc.getElementsByTagNameNS("*", tag)[0] ??
        doc.getElementsByTagName(tag)[0];
      return el?.textContent?.trim() ?? "";
    };

    const folio              = get("Folio");
    const monto              = get("MntTotal");
    const fechaVencimiento   = get("FchVenc");
    const rutRaw             = get("RUTRecep");
    const razonSocialRaw     = get("RznSocRecep");
    const rutEmisorRaw       = get("RUTEmisor");
    const razonSocialEmisor  = get("RznSoc");   // <RznSoc> está en Emisor
    const tipoDte            = get("TipoDTE");

    if (!folio || !monto || !rutRaw) return null;

    return {
      folio,
      monto,
      fechaVencimiento,
      rutDeudor:           formatearRut(rutRaw),
      razonSocialDeudor:   toTitleCase(razonSocialRaw),
      rutEmisor:           formatearRut(rutEmisorRaw),
      razonSocialEmisor:   toTitleCase(razonSocialEmisor),
      tipoDte,
    };
  } catch {
    return null;
  }
}

export async function leerArchivoXml(file: File): Promise<SiiDatosExtraidos | null> {
  const leer = (enc: string) =>
    new Promise<string>(res => {
      const r = new FileReader();
      r.onload = e => res((e.target?.result as string) ?? "");
      r.readAsText(file, enc);
    });

  // Probar ISO-8859-1 primero (encoding oficial SII), luego UTF-8
  for (const enc of ["ISO-8859-1", "UTF-8"]) {
    const text = await leer(enc);
    const datos = parsearXmlSii(text);
    if (datos) return datos;
  }
  return null;
}

function formatearRut(raw: string): string {
  const sinPuntos = raw.replace(/\./g, "").toUpperCase();
  const partes = sinPuntos.split("-");
  if (partes.length === 2) {
    const cuerpo = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${cuerpo}-${partes[1]}`;
  }
  if (sinPuntos.length >= 8) {
    const cuerpo = sinPuntos.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${cuerpo}-${sinPuntos.slice(-1)}`;
  }
  return raw;
}

function toTitleCase(str: string): string {
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}
