import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MetricCard } from "@/components/ui/MetricCard";
import { PagosClient } from "./PagosClient";
import { formatCLP } from "@/lib/utils";
import type { PagoWithFactura } from "@/types/database";

export default async function PagosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: rawPagos }, { data: rawProfile }] = await Promise.all([
    supabase.from("pagos").select("*, facturas(numero, deudores(razon_social))").eq("profile_id", user.id).order("fecha", { ascending: false }),
    supabase.from("profiles").select("banco, cuenta_corriente").eq("id", user.id).single(),
  ]);

  const pagos             = (rawPagos ?? []) as PagoWithFactura[];
  const recuperadoMes     = pagos.reduce((a, p) => a + p.monto_bruto, 0);
  const honorariosTotal   = pagos.reduce((a, p) => a + Math.round(p.monto_bruto * p.honorarios_pct / 100), 0);
  const proximoDesembolso = recuperadoMes - honorariosTotal;

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-6">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#6B7A8F] mb-2">Recuperos</p>
          <h1 className="text-[22px] font-semibold tracking-tight text-[#0E1A2B] mb-1">Pagos</h1>
          <p className="text-[13.5px] text-[#6B7A8F]">Pagos recibidos y desembolsos a tu cuenta. Cleco retiene 12% de honorarios.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
        <MetricCard
          icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>}
          label="Recuperado este mes"
          value={`<span class='text-[#8E9BAE] font-medium text-[16px] mr-1'>$</span>${recuperadoMes.toLocaleString("es-CL")}`}
          delta="+18%" deltaText="vs mes anterior" />
        <MetricCard
          icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>}
          label="Próximo desembolso"
          value={`<span class='text-[#8E9BAE] font-medium text-[16px] mr-1'>$</span>${proximoDesembolso.toLocaleString("es-CL")}`}
          deltaText={`28 abr 2026 · ${rawProfile?.banco ?? "Banco"}`} />
        <MetricCard
          icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/></svg>}
          label="Honorarios Cleco"
          value={`<span class='text-[#8E9BAE] font-medium text-[16px] mr-1'>$</span>${honorariosTotal.toLocaleString("es-CL")}`}
          deltaText="12% sobre recupero · YTD 2026" />
      </div>

      <PagosClient
        pagos={pagos}
        recuperadoMes={recuperadoMes}
        honorariosTotal={honorariosTotal}
        proximoDesembolso={proximoDesembolso}
        banco={rawProfile?.banco ?? null}
        cuentaCorriente={rawProfile?.cuenta_corriente ?? null}
      />

      <div className="mt-4 px-4 py-3.5 bg-[#EBF2FA] border border-[#D6E5F4] rounded-[10px] flex gap-3 items-start text-[13px] text-[#2B3A4F]">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#185FA5" strokeWidth="2" className="flex-shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        <div>
          <b className="text-[#185FA5]">Liquidaciones cada 5 días hábiles.</b>{" "}
          Los pagos confirmados antes de las 14:00 hrs se transfieren en el siguiente ciclo. Honorarios según tu plan vigente ({formatCLP(honorariosTotal)} YTD 2026).
        </div>
      </div>
    </>
  );
}
