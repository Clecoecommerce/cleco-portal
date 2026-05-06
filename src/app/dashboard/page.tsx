import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MetricCard } from "@/components/ui/MetricCard";
import { PanelClient } from "./PanelClient";
import type { FacturaWithDeudor } from "@/types/database";

type PagoResumen = { monto_bruto: number; honorarios_pct: number };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: rawProfile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const profile = rawProfile as { id: string; razon_social: string; email: string } | null;
  if (!profile) redirect("/auth/login");

  const [{ data: rawFacturas }, { data: rawPagos }] = await Promise.all([
    supabase
      .from("facturas")
      .select("*, deudores(rut, razon_social)")
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("pagos")
      .select("monto_bruto, honorarios_pct")
      .eq("profile_id", user.id),
  ]);

  const facturas = (rawFacturas ?? []) as FacturaWithDeudor[];
  const pagos    = (rawPagos    ?? []) as PagoResumen[];

  const montoEnGestion = facturas
    .filter((f) => f.estado !== "pagada")
    .reduce((acc, f) => acc + (f.monto ?? 0), 0);

  const recuperado = pagos.reduce((acc, p) => acc + (p.monto_bruto ?? 0), 0);
  const firstName = profile.razon_social.split(" ")[0];

  return (
    <>
      <div className="mb-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#6B7280] mb-2">
          Panel principal
        </p>
        <h1 className="text-[22px] font-semibold tracking-tight text-[#0F172A] mb-1">
          Buenos días, {firstName}
        </h1>
        <p className="text-[13.5px] text-[#6B7280]">
          Resumen de tu cartera al{" "}
          {new Date().toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })}.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
        <MetricCard
          icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
          label="Facturas activas"
          value={String((facturas ?? []).filter((f) => f.estado !== "pagada").length)}
          delta="+3"
          deltaText="nuevas esta semana"
        />
        <MetricCard
          icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 6h18M3 12h18M3 18h12"/></svg>}
          label="Monto en gestión"
          value={`<span class='text-[#9CA3AF] font-medium text-[16px] mr-1'>$</span>${montoEnGestion.toLocaleString("es-CL")}`}
          delta="+5,2%"
          deltaVariant="amber"
          deltaText="vs mes anterior"
        />
        <MetricCard
          icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="20 6 9 17 4 12"/></svg>}
          label="Recuperado este mes"
          value={`<span class='text-[#9CA3AF] font-medium text-[16px] mr-1'>$</span>${recuperado.toLocaleString("es-CL")}`}
          delta="+18%"
          deltaText="vs mes anterior"
        />
      </div>

      {/* Invoice panel (client component for tabs + modal) */}
      <PanelClient
        facturas={facturas ?? []}
        profileId={user.id}
      />

      <p className="mt-6 text-center text-[12px] text-[#9CA3AF]">
        Cleco SpA · Cobranza extrajudicial certificada · contacto@cleco.cl · +56 2 2000 0000
      </p>
    </>
  );
}
