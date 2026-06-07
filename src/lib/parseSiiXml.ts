export interface SiiDatosExtraidos {
  folio: string;
  monto: string;
  fechaVencimiento: string; // YYYY-MM-DD
  rutDeudor: string;
  razonSocialDeudor: string;
}

export function parsearXmlSii(xmlText: string): SiiDatosExtraidos | null {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, "text/xml");

    if (doc.querySelector("parsererror")) return null;

    // getElementsByTagName ignores namespaces — works for all SII DTE variants
    const get = (tag: string): string =>
      doc.getElementsByTagName(tag)[0]?.textContent?.trim() ?? "";

    const folio           = get("Folio");
    const monto           = get("MntTotal");
    const fechaVencimiento = get("FchVenc");
    const rutRaw          = get("RUTRecep");
    const razonSocialRaw  = get("RznSocRecep");

    if (!folio || !monto || !rutRaw) return null;

    return {
      folio,
      monto,
      fechaVencimiento,
      rutDeudor: formatearRut(rutRaw),
      razonSocialDeudor: toTitleCase(razonSocialRaw),
    };
  } catch {
    return null;
  }
}

// SII puede enviar "12345678-9" o "123456789" — normalizamos a "12.345.678-9"
function formatearRut(raw: string): string {
  const sinPuntos = raw.replace(/\./g, "");
  const partes = sinPuntos.split("-");
  if (partes.length === 2) {
    const cuerpo = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${cuerpo}-${partes[1].toUpperCase()}`;
  }
  // Sin guión: últimos 1-2 chars son el DV
  if (sinPuntos.length >= 8) {
    const cuerpo = sinPuntos.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${cuerpo}-${sinPuntos.slice(-1).toUpperCase()}`;
  }
  return raw;
}

function toTitleCase(str: string): string {
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}
