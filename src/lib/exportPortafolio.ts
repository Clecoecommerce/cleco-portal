// Exporta el portafolio de cobranza a un .xlsx con analítica.
//
// A diferencia de exportCsv (una tabla plana), este archivo es el que el cliente
// manda a su gerencia: cuatro hojas — detalle, resumen ejecutivo, aging y
// concentración por deudor. La librería xlsx se importa de forma dinámica para
// no cargarla en el bundle de quienes nunca exportan.

import type { ScoredFactura } from "./scoring";
import { ACTION_LABELS, TIPO_LABELS, TRAMOS_MORA, TRAMO_LABELS, getTramoMora } from "./scoring";

/** "2026-06-01" → Date local, sin desfase de zona horaria */
function aFecha(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const [a, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!a || !m || !d) return null;
  return new Date(a, m - 1, d);
}

function pct(parte: number, total: number): number {
  return total === 0 ? 0 : Math.round((parte / total) * 1000) / 10;
}

export interface OpcionesPortafolio {
  /** Razón social del cliente, para la cabecera del resumen */
  nombreEmpresa: string;
  /** Descripción de los filtros activos, para que el Excel sea auditable */
  filtrosAplicados: string;
}

export interface Portafolio {
  detalle:  (string | number | Date | null)[][];
  resumen:  (string | number | null)[][];
  aging:    (string | number)[][];
  deudores: (string | number)[][];
}

/**
 * Calcula las cuatro hojas del portafolio. Separado de la descarga para poder
 * verificar los números sin un navegador ni escribir archivos.
 */
export function construirPortafolio(
  filas: ScoredFactura[],
  { nombreEmpresa, filtrosAplicados }: OpcionesPortafolio,
  ahora: Date = new Date()
): Portafolio {
  const hoy = ahora;

  const montoTotal = filas.reduce((s, f) => s + f.monto, 0);
  const vencidas   = filas.filter(f => f.moraDias > 0);
  const montoVencido = vencidas.reduce((s, f) => s + f.monto, 0);

  // ── Hoja 1: detalle factura por factura ──
  const detalle: (string | number | Date | null)[][] = [[
    "Folio", "RUT Deudor", "Razón Social", "Tipo", "Comuna",
    "Email contacto", "Teléfono contacto",
    "Emisión", "Vencimiento", "Días de mora", "Tramo de mora",
    "Monto CLP", "Estado", "Score", "Acción recomendada", "Contactos intentados", "Notas",
  ]];
  for (const f of filas) {
    detalle.push([
      f.numero,
      f.deudores?.rut ?? "",
      f.deudores?.razon_social ?? "",
      f.deudores?.tipo ? TIPO_LABELS[f.deudores.tipo] : "",
      f.deudores?.comuna ?? "",
      f.deudores?.email_contacto ?? "",
      f.deudores?.telefono_contacto ?? "",
      aFecha(f.fecha_emision),
      aFecha(f.fecha_vencimiento),
      f.moraDias,
      TRAMO_LABELS[getTramoMora(f.moraDias)],
      f.monto,
      f.estado,
      f.score,
      ACTION_LABELS[f.action],
      f.contactos_intentados ?? 0,
      f.notas ?? "",
    ]);
  }

  // ── Hoja 2: resumen ejecutivo ──
  // Mora ponderada: los pesos son los montos, no las facturas — 1 factura de
  // $10M con 90 días pesa más que 10 de $100k con 5 días.
  const moraPonderada = montoTotal === 0 ? 0
    : filas.reduce((s, f) => s + Math.max(f.moraDias, 0) * f.monto, 0) / montoTotal;

  const conEmision = filas.filter(f => aFecha(f.fecha_emision));
  const montoConEmision = conEmision.reduce((s, f) => s + f.monto, 0);
  const antiguedadPonderada = montoConEmision === 0 ? 0
    : conEmision.reduce((s, f) => {
        const dias = Math.floor((hoy.getTime() - aFecha(f.fecha_emision)!.getTime()) / 86_400_000);
        return s + dias * f.monto;
      }, 0) / montoConEmision;

  const scorePonderado = montoTotal === 0 ? 0
    : filas.reduce((s, f) => s + f.score * f.monto, 0) / montoTotal;

  const ruts = new Set(filas.map(f => f.deudores?.rut).filter(Boolean));
  const masAntigua = filas.reduce<ScoredFactura | null>(
    (peor, f) => (peor === null || f.moraDias > peor.moraDias ? f : peor), null
  );

  const resumen: (string | number | null)[][] = [
    ["Portafolio de cobranza", nombreEmpresa],
    ["Generado", hoy.toLocaleString("es-CL")],
    ["Filtros aplicados", filtrosAplicados],
    ["Alcance", "Facturas no pagadas (la bandeja excluye las pagadas)"],
    [],
    ["CARTERA"],
    ["Facturas", filas.length],
    ["Deudores distintos", ruts.size],
    ["Monto total CLP", montoTotal],
    ["Ticket promedio CLP", filas.length ? Math.round(montoTotal / filas.length) : 0],
    [],
    ["MORA"],
    ["Facturas vencidas", vencidas.length],
    ["Monto vencido CLP", montoVencido],
    ["% de la cartera vencido", pct(montoVencido, montoTotal)],
    ["Monto por vencer CLP", montoTotal - montoVencido],
    ["Mora promedio ponderada por monto (días)", Math.round(moraPonderada)],
    ["Factura más vencida (días)", masAntigua ? Math.max(masAntigua.moraDias, 0) : 0],
    ["Factura más vencida (deudor)", masAntigua?.deudores?.razon_social ?? ""],
    [],
    ["ANTIGÜEDAD DESDE EMISIÓN"],
    // No es el DSO contable (ese necesita las ventas del período): es la edad
    // promedio de lo que está por cobrar. Se declara la cobertura porque las
    // facturas cargadas por foto/PDF pueden no traer fecha de emisión.
    ["Días promedio desde emisión (ponderado por monto)", Math.round(antiguedadPonderada)],
    ["Facturas con fecha de emisión", conEmision.length],
    ["Cobertura del cálculo (%)", pct(conEmision.length, filas.length)],
    [],
    ["PRIORIZACIÓN"],
    ["Score promedio ponderado por monto", Math.round(scorePonderado)],
  ];
  for (const [accion, label] of Object.entries(ACTION_LABELS)) {
    const grupo = filas.filter(f => f.action === accion);
    resumen.push([label, grupo.length, grupo.reduce((s, f) => s + f.monto, 0)]);
  }

  // ── Hoja 3: aging ──
  const aging: (string | number)[][] = [["Tramo de mora", "Facturas", "Monto CLP", "% de la cartera"]];
  for (const tramo of TRAMOS_MORA) {
    const grupo = filas.filter(f => getTramoMora(f.moraDias) === tramo);
    const monto = grupo.reduce((s, f) => s + f.monto, 0);
    aging.push([TRAMO_LABELS[tramo], grupo.length, monto, pct(monto, montoTotal)]);
  }
  aging.push(["TOTAL", filas.length, montoTotal, montoTotal ? 100 : 0]);

  // ── Hoja 4: concentración por deudor ──
  const porDeudor = new Map<string, ScoredFactura[]>();
  for (const f of filas) {
    const clave = f.deudores?.rut ?? f.deudor_id;
    const lista = porDeudor.get(clave);
    if (lista) lista.push(f);
    else porDeudor.set(clave, [f]);
  }
  const deudores: (string | number)[][] = [[
    "RUT", "Razón Social", "Tipo", "Facturas", "Monto total CLP", "% de la cartera",
    "Mora máxima (días)", "Score máximo", "Acción más urgente", "Email contacto", "Teléfono contacto",
  ]];
  const filasDeudor = Array.from(porDeudor.values())
    .map(grupo => {
      const monto = grupo.reduce((s, f) => s + f.monto, 0);
      const peor  = grupo.reduce((a, b) => (b.score > a.score ? b : a));
      const d     = peor.deudores;
      return {
        monto,
        fila: [
          d?.rut ?? "", d?.razon_social ?? "", d?.tipo ? TIPO_LABELS[d.tipo] : "",
          grupo.length, monto, pct(monto, montoTotal),
          Math.max(...grupo.map(f => f.moraDias), 0),
          peor.score, ACTION_LABELS[peor.action],
          d?.email_contacto ?? "", d?.telefono_contacto ?? "",
        ] as (string | number)[],
      };
    })
    .sort((a, b) => b.monto - a.monto);
  for (const { fila } of filasDeudor) deudores.push(fila);

  return { detalle, resumen, aging, deudores };
}

/** Construye el libro y dispara la descarga en el navegador. */
export async function exportarPortafolioXlsx(
  filas: ScoredFactura[],
  opciones: OpcionesPortafolio
): Promise<void> {
  const XLSX = await import("xlsx");
  const { detalle, resumen, aging, deudores } = construirPortafolio(filas, opciones);

  const wb = XLSX.utils.book_new();

  const hojaDetalle = XLSX.utils.aoa_to_sheet(detalle, { cellDates: true });
  hojaDetalle["!cols"] = [
    { wch: 12 }, { wch: 14 }, { wch: 30 }, { wch: 16 }, { wch: 14 },
    { wch: 26 }, { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 13 }, { wch: 13 },
    { wch: 14 }, { wch: 12 }, { wch: 8 }, { wch: 20 }, { wch: 12 }, { wch: 30 },
  ];
  formatearColumnas(XLSX, hojaDetalle, detalle.length, { 7: "dd-mm-yyyy", 8: "dd-mm-yyyy", 11: "#,##0" });

  const hojaResumen = XLSX.utils.aoa_to_sheet(resumen);
  hojaResumen["!cols"] = [{ wch: 44 }, { wch: 26 }, { wch: 18 }];

  const hojaAging = XLSX.utils.aoa_to_sheet(aging);
  hojaAging["!cols"] = [{ wch: 16 }, { wch: 10 }, { wch: 16 }, { wch: 16 }];
  formatearColumnas(XLSX, hojaAging, aging.length, { 2: "#,##0" });

  const hojaDeudores = XLSX.utils.aoa_to_sheet(deudores);
  hojaDeudores["!cols"] = [
    { wch: 14 }, { wch: 30 }, { wch: 16 }, { wch: 10 }, { wch: 16 }, { wch: 16 },
    { wch: 18 }, { wch: 13 }, { wch: 20 }, { wch: 26 }, { wch: 16 },
  ];
  formatearColumnas(XLSX, hojaDeudores, deudores.length, { 4: "#,##0" });

  XLSX.utils.book_append_sheet(wb, hojaResumen, "Resumen");
  XLSX.utils.book_append_sheet(wb, hojaAging, "Aging");
  XLSX.utils.book_append_sheet(wb, hojaDeudores, "Por deudor");
  XLSX.utils.book_append_sheet(wb, hojaDetalle, "Facturas");

  XLSX.writeFile(wb, `portafolio-cleco-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/** Aplica un formato numérico/fecha a columnas completas (índice 0-based, saltando la cabecera). */
function formatearColumnas(
  XLSX: typeof import("xlsx"),
  hoja: import("xlsx").WorkSheet,
  totalFilas: number,
  formatos: Record<number, string>
) {
  for (const [col, z] of Object.entries(formatos)) {
    for (let fila = 1; fila < totalFilas; fila++) {
      const celda = hoja[XLSX.utils.encode_cell({ r: fila, c: Number(col) })];
      if (celda && (celda.t === "n" || celda.t === "d")) celda.z = z;
    }
  }
}
