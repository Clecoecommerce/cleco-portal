"use client";

import { Badge, estadoToBadge } from "@/components/ui/Badge";
import { formatCLP, calcularEstado } from "@/lib/utils";
import type { FacturaWithDeudor } from "@/types/database";

interface Pago { monto_bruto: number; honorarios_pct: number; fecha: string; }
interface Props {
  facturas: FacturaWithDeudor[];
  pagos: Pago[];
  profile: { razon_social: string; rut: string; ejecutivo_nombre: string | null; ejecutivo_email: string | null } | null;
}

function moraDias(f: FacturaWithDeudor): number {
  if (f.estado === "pagada") return 0;
  const venc = new Date(f.fecha_vencimiento);
  const hoy  = new Date();
  if (venc >= hoy) return 0;
  return Math.floor((hoy.getTime() - venc.getTime()) / 86_400_000);
}

export function PanoramaClient({ facturas, pagos, profile }: Props) {
  const hoy        = new Date();
  const fechaStr   = hoy.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const fechaCorta = hoy.toISOString().slice(0, 10);

  const activas  = facturas.filter(f => f.estado !== "pagada");
  const vencidas = activas.filter(f => new Date(f.fecha_vencimiento) < hoy);
  const proximas = activas.filter(f => {
    const d = new Date(f.fecha_vencimiento);
    const diff = (d.getTime() - hoy.getTime()) / 86_400_000;
    return diff >= 0 && diff <= 14;
  });

  const sum = (arr: FacturaWithDeudor[]) => arr.reduce((a, f) => a + f.monto, 0);
  const montoActivo   = sum(activas);
  const montoVencido  = sum(vencidas);
  const recuperado    = pagos.reduce((a, p) => a + p.monto_bruto, 0);
  const honorarios    = pagos.reduce((a, p) => a + Math.round(p.monto_bruto * p.honorarios_pct / 100), 0);
  const neto          = recuperado - honorarios;
  const totalHistorico = montoActivo + recuperado;
  const tasaRecupero   = totalHistorico > 0 ? Math.round((recuperado / totalHistorico) * 100) : 0;

  const porEstado = {
    vencida:    sum(vencidas),
    en_gestion: sum(activas.filter(f => f.estado === "en_gestion" && new Date(f.fecha_vencimiento) >= hoy)),
    pendiente:  sum(activas.filter(f => f.estado === "pendiente")),
    pagada:     recuperado,
  };
  const totalBar = Object.values(porEstado).reduce((a, v) => a + v, 0);
  const pct = (v: number) => totalBar > 0 ? Math.max(1, Math.round((v / totalBar) * 100)) : 0;

  const activasOrdenadas = [...activas].sort((a, b) => moraDias(b) - moraDias(a));

  function handlePrint() {
    window.print();
  }

  return (
    <>
      {/* Print CSS */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-full { max-width: 100% !important; padding: 0 !important; }
          body { background: white !important; }
          @page { margin: 1.5cm; size: A4 portrait; }
        }
      `}</style>

      <div className="print-full max-w-[900px] mx-auto py-6 px-2 sm:px-0 space-y-6">

        {/* Barra de acciones — solo pantalla */}
        <div className="no-print flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-widest text-[#6B7280]">Panorama de Cobranza</p>
            <h1 className="text-[22px] font-semibold text-[#0F172A]">{profile?.razon_social ?? "Mi empresa"}</h1>
          </div>
          <button onClick={handlePrint}
            className="flex items-center gap-2 h-10 px-4 bg-[#0F172A] text-white text-[13.5px] font-medium rounded-[10px] hover:bg-[#1E293B] transition-all">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Descargar PDF
          </button>
        </div>

        {/* Encabezado del documento — visible en PDF */}
        <div className="bg-[#0F172A] text-white rounded-[14px] px-7 py-6 flex items-start justify-between">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-[#8DA3C2] mb-1">Panorama de Cobranza</p>
            <h1 className="text-[22px] font-semibold tracking-tight">{profile?.razon_social ?? "Mi empresa"}</h1>
            <p className="text-[13px] text-[#8DA3C2] mt-1">RUT {profile?.rut ?? "—"} · {fechaStr}</p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-[11px] text-[#8DA3C2]">Ejecutivo asignado</p>
            <p className="text-[14px] font-medium mt-0.5">{profile?.ejecutivo_nombre ?? "CLECO SpA"}</p>
            <p className="text-[12px] text-[#8DA3C2]">{profile?.ejecutivo_email ?? "contacto@cleco.cl"}</p>
          </div>
        </div>

        {/* KPIs principales */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Facturas activas",    value: String(activas.length),    sub: `${vencidas.length} vencidas`,  color: "#2563EB", bg: "#EFF6FF" },
            { label: "Monto en cartera",    value: formatCLP(montoActivo),   sub: `${formatCLP(montoVencido)} vencido`, color: "#B23B3B", bg: "#FBE9E9" },
            { label: "Recuperado total",    value: formatCLP(recuperado),    sub: `Neto: ${formatCLP(neto)}`,     color: "#1F7A4D", bg: "#E5F4EC" },
            { label: "Tasa de recupero",    value: `${tasaRecupero}%`,       sub: `${pagos.length} pagos recibidos`, color: "#B7791F", bg: "#FBF3E1" },
          ].map(k => (
            <div key={k.label} className="border border-[#E2E8F0] rounded-[12px] p-4" style={{ background: k.bg }}>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: k.color }}>{k.label}</p>
              <p className="text-[18px] font-bold text-[#0F172A] leading-tight">{k.value}</p>
              <p className="text-[11.5px] text-[#6B7280] mt-1">{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Distribución de cartera */}
        <div className="bg-white border border-[#E2E8F0] rounded-[14px] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[14px] font-semibold text-[#0F172A]">Distribución de cartera por estado</h2>
            <span className="text-[12px] text-[#6B7280]">Total histórico: {formatCLP(totalBar)}</span>
          </div>
          {totalBar > 0 && (
            <>
              <div className="flex h-5 rounded-full overflow-hidden gap-px mb-3">
                {[
                  { pct: pct(porEstado.vencida),    color: "#B23B3B" },
                  { pct: pct(porEstado.en_gestion), color: "#2563EB" },
                  { pct: pct(porEstado.pendiente),  color: "#F59E0B" },
                  { pct: pct(porEstado.pagada),     color: "#1F7A4D" },
                ].filter(s => s.pct > 0).map((s, i) => (
                  <div key={i} style={{ width: `${s.pct}%`, background: s.color }} />
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[12.5px]">
                {[
                  { label: "Vencido",     monto: porEstado.vencida,    color: "#B23B3B", pct: pct(porEstado.vencida) },
                  { label: "En gestión",  monto: porEstado.en_gestion, color: "#2563EB", pct: pct(porEstado.en_gestion) },
                  { label: "Pendiente",   monto: porEstado.pendiente,  color: "#F59E0B", pct: pct(porEstado.pendiente) },
                  { label: "Recuperado",  monto: porEstado.pagada,     color: "#1F7A4D", pct: pct(porEstado.pagada) },
                ].filter(s => s.monto > 0).map(s => (
                  <div key={s.label} className="flex items-start gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0 mt-0.5" style={{ background: s.color }} />
                    <div>
                      <p className="font-medium text-[#0F172A]">{s.label} · {s.pct}%</p>
                      <p className="text-[#6B7280]">{formatCLP(s.monto)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Alertas: próximas a vencer */}
        {proximas.length > 0 && (
          <div className="bg-white border border-[#E2E8F0] rounded-[14px] p-5">
            <h2 className="text-[14px] font-semibold text-[#0F172A] mb-3">
              ⚠ Facturas que vencen en los próximos 14 días
              <span className="ml-2 text-[12px] font-normal text-[#B7791F]">{formatCLP(sum(proximas))}</span>
            </h2>
            <div className="space-y-2">
              {proximas.map(f => {
                const dias = Math.round((new Date(f.fecha_vencimiento).getTime() - hoy.getTime()) / 86_400_000);
                return (
                  <div key={f.id} className="flex items-center justify-between bg-[#FFFBF0] border border-[#F59E0B]/20 rounded-[8px] px-3.5 py-2.5 text-[13px]">
                    <div>
                      <span className="font-medium text-[#0F172A]">{f.deudores?.razon_social ?? "—"}</span>
                      <span className="text-[#6B7280] ml-2 font-mono text-[12px]">N°{f.numero}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-[#0F172A]">{formatCLP(f.monto)}</span>
                      <span className={`text-[12px] font-semibold ${dias === 0 ? "text-[#B23B3B]" : "text-[#B7791F]"}`}>
                        {dias === 0 ? "Vence hoy" : `${dias}d`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tabla completa de facturas activas */}
        <div className="bg-white border border-[#E2E8F0] rounded-[14px] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#F1F5F9]">
            <h2 className="text-[14px] font-semibold text-[#0F172A]">Cartera activa — {activas.length} facturas · {formatCLP(montoActivo)}</h2>
            <p className="text-[12px] text-[#6B7280] mt-0.5">Ordenadas de mayor a menor mora</p>
          </div>
          {activasOrdenadas.length === 0 ? (
            <p className="px-5 py-8 text-center text-[13px] text-[#9CA3AF]">No hay facturas activas.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
            <table className="invoice-table w-full border-collapse text-[13px]">
              <thead>
                <tr className="bg-[#FAFBFD]">
                  {["Deudor", "RUT", "N° Factura", "Vencimiento", "Mora", "Monto", "Estado"].map((h, i) => (
                    <th key={h+i} className="text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide px-4 py-2.5 border-b border-[#E2E8F0]"
                      style={h === "Monto" ? { textAlign: "right" } : {}}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activasOrdenadas.map(f => {
                  const estadoDisplay = calcularEstado(f.estado, f.fecha_vencimiento);
                  const { variant, label } = estadoToBadge(estadoDisplay);
                  const mora = moraDias(f);
                  return (
                    <tr key={f.id} className="border-b border-[#F1F5F9] last:border-0">
                      <td className="td-debtor px-4 py-3 font-medium text-[#0F172A]" data-label="Deudor">{f.deudores?.razon_social ?? "—"}</td>
                      <td className="px-4 py-3 font-mono text-[12px] text-[#6B7280]" data-label="RUT">{f.deudores?.rut ?? "—"}</td>
                      <td className="px-4 py-3 font-mono text-[12px] text-[#1E293B]" data-label="N° Factura">N°{f.numero}</td>
                      <td className="px-4 py-3 text-[#6B7280] tabular-nums" data-label="Vencimiento">{new Date(f.fecha_vencimiento).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" })}</td>
                      <td className="px-4 py-3 tabular-nums" data-label="Mora">
                        {mora > 0
                          ? <span className={`font-semibold ${mora >= 90 ? "text-[#B23B3B]" : mora >= 30 ? "text-[#B7791F]" : "text-[#6B7280]"}`}>{mora}d</span>
                          : <span className="text-[#9CA3AF]">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-[#0F172A] tabular-nums" data-label="Monto">{formatCLP(f.monto)}</td>
                      <td className="px-4 py-3" data-label="Estado"><Badge variant={variant}>{label}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-[#FAFBFD] border-t border-[#E2E8F0]">
                  <td colSpan={5} className="px-4 py-3 text-[12px] font-semibold text-[#6B7280] uppercase tracking-wide">Total cartera activa</td>
                  <td className="px-4 py-3 text-right font-bold text-[#0F172A] tabular-nums" data-label="Total">{formatCLP(montoActivo)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
            </div>
          )}
        </div>

        {/* Pie de página */}
        <div className="text-center text-[11px] text-[#9CA3AF] pt-2 pb-4">
          Documento generado el {fechaStr} · CLECO SpA · Cobranza extrajudicial certificada · Ley 21.131
        </div>

      </div>
    </>
  );
}
