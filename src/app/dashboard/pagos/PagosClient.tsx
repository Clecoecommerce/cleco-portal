"use client";

import { useState } from "react";
import { Badge, estadoToBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCLP } from "@/lib/utils";
import { exportCsv } from "@/lib/exportCsv";
import type { PagoWithFactura } from "@/types/database";

type Tab = "pagos" | "desembolsos" | "cuenta";
const PER_PAGE = 10;

interface Props {
  pagos: PagoWithFactura[];
  recuperadoMes: number;
  honorariosTotal: number;
  proximoDesembolso: number;
  banco: string | null;
  cuentaCorriente: string | null;
}

export function PagosClient({ pagos, recuperadoMes, honorariosTotal, proximoDesembolso, banco, cuentaCorriente }: Props) {
  const [tab,  setTab]  = useState<Tab>("pagos");
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(pagos.length / PER_PAGE));
  const paged      = pagos.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function doExport() {
    const headers = ["Fecha", "Deudor", "Factura", "Método", "Monto bruto", "Honorarios", "Neto", "Estado"];
    const rows = pagos.map(p => {
      const f = p.facturas as { numero: string; deudores: { razon_social: string } | null } | null;
      const honorarios = Math.round(p.monto_bruto * p.honorarios_pct / 100);
      return [p.fecha, f?.deudores?.razon_social ?? "", f?.numero ?? "", p.metodo, String(p.monto_bruto), String(honorarios), String(p.monto_bruto - honorarios), p.estado];
    });
    exportCsv([headers, ...rows], `cartola-cleco-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  const TABS = [
    { key: "pagos",       label: "Pagos recibidos", count: pagos.length },
    { key: "desembolsos", label: "Desembolsos",      count: null },
    { key: "cuenta",      label: "Cuenta bancaria",  count: null },
  ] as const;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[14px] shadow-sm overflow-hidden">
      {/* Tabs + export */}
      <div className="flex items-center justify-between px-4 pt-2 border-b border-[#E2E8F0] no-scrollbar overflow-x-auto">
        <div className="flex">
          {TABS.map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setPage(1); }}
              className={`px-3.5 py-3 text-[13.5px] font-medium border-b-2 mb-[-1px] transition-colors whitespace-nowrap ${t.key === tab ? "text-[#2563EB] border-[#2563EB]" : "text-[#6B7280] border-transparent hover:text-[#1E293B]"}`}>
              {t.label}
              {t.count !== null && <span className={`ml-1.5 text-[11px] px-1.5 py-0.5 rounded-full ${t.key === tab ? "bg-[#EFF6FF] text-[#2563EB]" : "bg-[#F1F5F9] text-[#1E293B]"}`}>{t.count}</span>}
            </button>
          ))}
        </div>
        <Button variant="secondary" size="sm" onClick={doExport} className="mr-1 shrink-0">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Cartola CSV
        </Button>
      </div>

      {/* Tab: Pagos recibidos */}
      {tab === "pagos" && (
        pagos.length === 0 ? (
          <EmptyState icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>}
            title="Sin pagos registrados" body="Los pagos recuperados aparecerán aquí con su detalle de liquidación." />
        ) : (
          <>
            <table className="invoice-table w-full border-collapse text-[13.5px]">
              <thead>
                <tr className="bg-[#FAFBFD]">
                  {["Fecha", "Deudor", "Factura", "Método", "Monto bruto", "Honorarios", "Neto cliente", "Estado"].map(h => (
                    <th key={h} className="text-left text-[12px] font-medium text-[#6B7280] uppercase tracking-wide px-4 py-2.5 border-b border-[#E2E8F0]"
                      style={["Monto bruto", "Honorarios", "Neto cliente"].includes(h) ? { textAlign: "right" } : {}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map(p => {
                  const honorarios = Math.round(p.monto_bruto * p.honorarios_pct / 100);
                  const neto = p.monto_bruto - honorarios;
                  const { variant, label } = estadoToBadge(p.estado);
                  const factura = p.facturas as { numero: string; deudores: { razon_social: string } | null } | null;
                  return (
                    <tr key={p.id} className="border-b border-[#F1F5F9] last:border-0 hover:bg-[#FAFBFD] transition-colors">
                      <td className="px-4 py-3.5 text-[#6B7280] tabular-nums" data-label="Fecha">{new Date(p.fecha).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" })}</td>
                      <td className="td-debtor px-4 py-3.5 font-medium text-[#0F172A]" data-label="Deudor">{factura?.deudores?.razon_social ?? "—"}</td>
                      <td className="px-4 py-3.5 font-mono text-[12.5px] text-[#1E293B]" data-label="Factura">N° {factura?.numero ?? "—"}</td>
                      <td className="px-4 py-3.5 text-[#1E293B]" data-label="Método">{p.metodo}</td>
                      <td className="px-4 py-3.5 text-right font-medium text-[#0F172A] tabular-nums" data-label="Bruto">{formatCLP(p.monto_bruto)}</td>
                      <td className="px-4 py-3.5 text-right text-[#6B7280] tabular-nums" data-label="Honorarios">−{formatCLP(honorarios)}</td>
                      <td className="px-4 py-3.5 text-right font-medium text-[#0F172A] tabular-nums" data-label="Neto">{formatCLP(neto)}</td>
                      <td className="px-4 py-3.5" data-label="Estado"><Badge variant={variant}>{label}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-[#E2E8F0] text-[12.5px] text-[#6B7280] gap-2">
              <span>Recupero: <b className="text-[#0F172A]">{formatCLP(recuperadoMes)}</b> · Honorarios: <b className="text-[#0F172A]">{formatCLP(honorariosTotal)}</b></span>
              <div className="flex gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-7 h-7 rounded-[6px] border text-[12px] bg-white border-[#E2E8F0] hover:bg-[#F1F5F9] disabled:opacity-40">‹</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)} className={`w-7 h-7 rounded-[6px] border text-[12px] ${p === page ? "bg-[#2563EB] text-white border-[#2563EB]" : "bg-white border-[#E2E8F0] hover:bg-[#F1F5F9]"}`}>{p}</button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-7 h-7 rounded-[6px] border text-[12px] bg-white border-[#E2E8F0] hover:bg-[#F1F5F9] disabled:opacity-40">›</button>
              </div>
            </div>
          </>
        )
      )}

      {/* Tab: Desembolsos */}
      {tab === "desembolsos" && (
        proximoDesembolso > 0 ? (
          <div className="p-6 space-y-4">
            <div className="bg-[#E5F4EC] border border-[#1F7A4D]/20 rounded-[12px] p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#1F7A4D] text-white flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
              </div>
              <div>
                <p className="text-[12px] text-[#1F7A4D] font-semibold uppercase tracking-widest mb-1">Próximo desembolso</p>
                <p className="text-[28px] font-bold text-[#0F172A]">{formatCLP(proximoDesembolso)}</p>
                <p className="text-[13px] text-[#6B7280] mt-1">28 abr 2026 · {banco ?? "Banco registrado"} · Cta. {cuentaCorriente ?? "—"}</p>
              </div>
            </div>
            <div className="bg-[#FAFBFD] border border-[#E2E8F0] rounded-[12px] p-4 text-[13px] space-y-2">
              <div className="flex justify-between"><span className="text-[#6B7280]">Recuperado bruto</span><span className="font-medium">{formatCLP(recuperadoMes)}</span></div>
              <div className="flex justify-between"><span className="text-[#6B7280]">Honorarios Cleco (12%)</span><span className="text-[#B23B3B]">−{formatCLP(honorariosTotal)}</span></div>
              <div className="flex justify-between border-t border-[#E2E8F0] pt-2 mt-2"><span className="font-semibold text-[#0F172A]">Neto a desembolsar</span><span className="font-bold text-[#0F172A]">{formatCLP(proximoDesembolso)}</span></div>
            </div>
            <p className="text-[12px] text-[#9CA3AF]">Liquidaciones cada 5 días hábiles. Pagos confirmados antes de las 14:00 hrs se incluyen en el ciclo siguiente.</p>
          </div>
        ) : (
          <EmptyState icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>}
            title="Sin desembolsos pendientes" body="Cuando se recupere y liquide un pago, el detalle del desembolso aparecerá aquí." />
        )
      )}

      {/* Tab: Cuenta bancaria */}
      {tab === "cuenta" && (
        <div className="p-6">
          <div className="max-w-sm space-y-4">
            <p className="text-[13px] text-[#6B7280]">Esta es la cuenta donde Cleco deposita los recuperos, descontando honorarios.</p>
            <div className="bg-[#FAFBFD] border border-[#E2E8F0] rounded-[12px] p-5 space-y-3 text-[13.5px]">
              <div className="flex justify-between"><span className="text-[#6B7280]">Banco</span><span className="font-medium text-[#0F172A]">{banco ?? "No registrado"}</span></div>
              <div className="flex justify-between"><span className="text-[#6B7280]">N° cuenta</span><span className="font-mono text-[#0F172A]">{cuentaCorriente ?? "No registrado"}</span></div>
            </div>
            <p className="text-[12px] text-[#9CA3AF]">Para actualizar los datos bancarios, contacta a tu ejecutivo en <b>hola@cleco.cl</b>.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="py-16 text-center text-[#6B7280]">
      <div className="w-11 h-11 rounded-[12px] bg-[#F1F5F9] inline-flex items-center justify-center mb-3">{icon}</div>
      <h3 className="text-[15px] font-semibold text-[#0F172A] mb-1">{title}</h3>
      <p className="text-[13px] max-w-xs mx-auto">{body}</p>
    </div>
  );
}
