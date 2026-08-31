// Parseo de nóminas CSV/Excel a filas de factura.
//
// El objetivo es que el cliente pueda exportar desde su ERP sin reformatear:
// las cabeceras se reconocen por alias y los valores se normalizan a los
// formatos que ya espera el resto del portal (RUT con guion, fecha ISO,
// monto entero en pesos).

export interface NominaRow {
  folio: string;
  rutDeudor: string;
  razonSocialDeudor: string;
  monto: string;
  fechaEmision: string;
  fechaVencimiento: string;
  emailContacto: string;
  telefonoContacto: string;
  estadoPago: string;
  /** Fila en el archivo original (1-based, sin contar cabecera) para reportar errores */
  fila: number;
}

export const COLUMNAS_NOMINA = [
  "rut_deudor",
  "razon_social",
  "email_contacto",
  "telefono_contacto",
  "numero_factura",
  "fecha_emision",
  "fecha_vencimiento",
  "monto_total",
  "estado_pago",
] as const;

type Columna = (typeof COLUMNAS_NOMINA)[number];

// Alias aceptados por columna. Se comparan ya normalizados (sin tildes,
// minúsculas, sin separadores), así que "Razón Social" == "razonsocial".
const ALIASES: Record<Columna, string[]> = {
  rut_deudor: ["rutdeudor", "rut", "rutcliente", "rutreceptor", "rutempresa"],
  razon_social: [
    "razonsocial", "razonsocialdeudor", "nombre", "cliente", "empresa",
    "nombrecliente", "deudor", "nombredeudor",
  ],
  email_contacto: ["emailcontacto", "email", "correo", "mail", "correoelectronico", "emailcliente"],
  telefono_contacto: ["telefonocontacto", "telefono", "fono", "celular", "movil", "telefonocliente"],
  numero_factura: [
    "numerofactura", "folio", "nfactura", "nrofactura", "numfactura",
    "documento", "numdocumento", "nrodocumento", "factura",
  ],
  fecha_emision: ["fechaemision", "emision", "fechadocumento", "fechadoc", "fechafactura"],
  fecha_vencimiento: ["fechavencimiento", "vencimiento", "vence", "fechavenc", "fechapago"],
  monto_total: ["montototal", "monto", "total", "importe", "valor", "saldo", "montobruto", "totalpagar"],
  estado_pago: ["estadopago", "estado", "situacion", "estadofactura"],
};

/** minúsculas, sin tildes, sin nada que no sea alfanumérico */
function normalizarCabecera(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/** Mapea las cabeceras del archivo a nuestras columnas canónicas. */
export function mapearCabeceras(cabeceras: string[]): {
  mapa: Map<Columna, number>;
  faltantes: Columna[];
  noReconocidas: string[];
} {
  const mapa = new Map<Columna, number>();
  const noReconocidas: string[] = [];

  cabeceras.forEach((cab, idx) => {
    const norm = normalizarCabecera(cab);
    if (!norm) return;
    const match = (Object.keys(ALIASES) as Columna[]).find(
      (col) => col === norm || ALIASES[col].includes(norm)
    );
    // La primera columna que coincide gana; duplicadas se ignoran
    if (match && !mapa.has(match)) mapa.set(match, idx);
    else if (!match) noReconocidas.push(cab);
  });

  // estado_pago es opcional: si no viene, se asume "en_gestion"
  const requeridas = COLUMNAS_NOMINA.filter((c) => c !== "estado_pago");
  const faltantes = requeridas.filter((c) => !mapa.has(c));

  return { mapa, faltantes, noReconocidas };
}

/**
 * Normaliza fechas a YYYY-MM-DD.
 * Acepta dd/mm/yyyy, dd-mm-yyyy, yyyy-mm-dd y seriales de Excel.
 * Chile usa día primero, así que 03/04/2026 es 3 de abril.
 */
export function normalizarFecha(valor: unknown): string {
  if (valor == null || valor === "") return "";

  // Excel guarda fechas como días desde 1899-12-30
  if (typeof valor === "number" && valor > 0 && valor < 100000) {
    const ms = Math.round((valor - 25569) * 86400 * 1000);
    return new Date(ms).toISOString().slice(0, 10);
  }
  if (valor instanceof Date && !isNaN(valor.getTime())) {
    // Compensa el desfase de zona horaria para no perder un día
    const off = valor.getTimezoneOffset() * 60000;
    return new Date(valor.getTime() - off).toISOString().slice(0, 10);
  }

  const s = String(valor).trim();
  if (!s) return "";

  const iso = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;

  const dmy = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
  if (dmy) {
    const dia = dmy[1].padStart(2, "0");
    const mes = dmy[2].padStart(2, "0");
    let anio = dmy[3];
    if (anio.length === 2) anio = `20${anio}`;
    if (+mes < 1 || +mes > 12 || +dia < 1 || +dia > 31) return "";
    return `${anio}-${mes}-${dia}`;
  }

  return "";
}

/**
 * Normaliza montos a entero de pesos.
 * Acepta "$ 1.234.567", "1234567", "1.234.567,89", "1,234,567.89".
 */
export function normalizarMonto(valor: unknown): string {
  if (valor == null || valor === "") return "";
  if (typeof valor === "number") return String(Math.round(valor));

  let s = String(valor).trim().replace(/[$\s]/g, "");
  if (!s) return "";

  const tienePunto = s.includes(".");
  const tieneComa = s.includes(",");

  if (tienePunto && tieneComa) {
    // El último separador es el decimal
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) s = s.replace(/\./g, "").replace(",", ".");
    else s = s.replace(/,/g, "");
  } else if (tieneComa) {
    // Coma sola: decimal si deja 1-2 dígitos ("1234,50"), si no es miles ("1,234,567")
    const post = s.length - s.lastIndexOf(",") - 1;
    s = post <= 2 && s.split(",").length === 2 ? s.replace(",", ".") : s.replace(/,/g, "");
  } else if (tienePunto) {
    // Punto solo: mismo criterio
    const post = s.length - s.lastIndexOf(".") - 1;
    if (!(post <= 2 && s.split(".").length === 2)) s = s.replace(/\./g, "");
  }

  const n = Number(s);
  if (!isFinite(n)) return "";
  return String(Math.round(n));
}

/** Normaliza el RUT a formato 12.345.678-9 */
export function normalizarRut(valor: unknown): string {
  const limpio = String(valor ?? "").replace(/[^0-9kK]/g, "").toUpperCase();
  if (limpio.length < 2) return String(valor ?? "").trim();
  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);
  return `${cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}-${dv}`;
}

/** Mapea el estado del archivo a los valores que acepta la BD. */
export function normalizarEstado(valor: unknown): string {
  const s = normalizarCabecera(String(valor ?? ""));
  if (!s) return "en_gestion";
  if (["pagada", "pagado", "cancelada", "cancelado", "pagadas"].includes(s)) return "pagada";
  if (["pendiente", "pendientes", "porcobrar", "impaga", "impago", "vencida"].includes(s)) return "pendiente";
  return "en_gestion";
}

/** Lee un archivo CSV o Excel y devuelve una matriz de celdas en crudo. */
async function leerMatriz(file: File): Promise<unknown[][]> {
  const esExcel = /\.(xlsx|xlsm|xls)$/i.test(file.name);

  if (esExcel) {
    const XLSX = await import("xlsx");
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array", cellDates: true });
    const hoja = wb.Sheets[wb.SheetNames[0]];
    if (!hoja) return [];
    return XLSX.utils.sheet_to_json(hoja, { header: 1, blankrows: false, defval: "" }) as unknown[][];
  }

  const Papa = (await import("papaparse")).default;
  const texto = await file.text();
  const out = Papa.parse<string[]>(texto, {
    skipEmptyLines: "greedy",
    // Autodetecta coma, punto y coma o tabulador (Excel en es-CL exporta con ";")
    delimiter: "",
  });
  return out.data as unknown[][];
}

export interface ResultadoNomina {
  filas: NominaRow[];
  faltantes: Columna[];
  noReconocidas: string[];
  totalFilas: number;
}

/**
 * Parsea una nómina completa. No valida reglas de negocio (eso lo hace
 * validateRow en el uploader); aquí solo se normalizan formatos.
 */
export async function parsearNomina(file: File): Promise<ResultadoNomina> {
  const matriz = await leerMatriz(file);
  if (matriz.length === 0) {
    return { filas: [], faltantes: [...COLUMNAS_NOMINA], noReconocidas: [], totalFilas: 0 };
  }

  const cabeceras = (matriz[0] ?? []).map((c) => String(c ?? ""));
  const { mapa, faltantes, noReconocidas } = mapearCabeceras(cabeceras);
  if (faltantes.length > 0) {
    return { filas: [], faltantes, noReconocidas, totalFilas: 0 };
  }

  const celda = (fila: unknown[], col: Columna): unknown => {
    const idx = mapa.get(col);
    return idx === undefined ? "" : fila[idx];
  };
  const texto = (fila: unknown[], col: Columna): string => String(celda(fila, col) ?? "").trim();

  const filas: NominaRow[] = [];
  for (let i = 1; i < matriz.length; i++) {
    const fila = matriz[i] ?? [];
    // Salta filas totalmente vacías (comunes al final de exports de Excel)
    if (fila.every((c) => String(c ?? "").trim() === "")) continue;

    filas.push({
      folio: texto(fila, "numero_factura"),
      rutDeudor: normalizarRut(celda(fila, "rut_deudor")),
      razonSocialDeudor: texto(fila, "razon_social"),
      monto: normalizarMonto(celda(fila, "monto_total")),
      fechaEmision: normalizarFecha(celda(fila, "fecha_emision")),
      fechaVencimiento: normalizarFecha(celda(fila, "fecha_vencimiento")),
      emailContacto: texto(fila, "email_contacto"),
      telefonoContacto: texto(fila, "telefono_contacto"),
      estadoPago: normalizarEstado(celda(fila, "estado_pago")),
      fila: i,
    });
  }

  return { filas, faltantes: [], noReconocidas, totalFilas: filas.length };
}

/**
 * CSV de ejemplo que el cliente descarga para saber qué formato usar.
 *
 * Los RUT de ejemplo tienen que pasar validarRUT(): el cliente descarga esta
 * plantilla, la sube tal cual para probar, y si el dígito verificador está mal
 * ve "RUT inválido" y cree que el sistema está roto. Hay un test que lo cubre.
 */
export function plantillaNominaCsv(): string {
  const cabecera = COLUMNAS_NOMINA.join(",");
  const ejemplos = [
    "76.543.210-3,Constructora Norte S.A.,pagos@constructoranorte.cl,+56912345678,15734399,2026-06-01,2026-07-01,4200000,pendiente",
    "77.123.456-9,Distribuidora El Volcán Ltda.,finanzas@elvolcan.cl,+56987654321,15734400,2026-06-15,2026-07-15,1850000,pendiente",
  ];
  return [cabecera, ...ejemplos].join("\n");
}
