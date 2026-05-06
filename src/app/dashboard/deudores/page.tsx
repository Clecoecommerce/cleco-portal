import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MetricCard } from "@/components/ui/MetricCard";
import { DeudoresClient } from "./DeudoresClient";
import type { Deudor } from "@/types/database";

type DeudorWithFacturas = Deudor & { facturas: { id: string; monto: number; estado: string }[] };

export default async function DeudoresPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: rawDeudores } = await supabase
    .from("deudores")
    .select("*, facturas(id, monto, estado)")
    .eq("profile_id", user.id)
    .order("mora_dias", { ascending: false });

  const list = (rawDeudores ?? []) as DeudorWithFacturas[];
  const moraPromedio = list.length
    ? Math.round(list.reduce((a, d) => a + d.mora_dias, 0) / list.length)
    : 0;

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-6">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#6B7280] mb-2">Cartera</p>
          <h1 className="text-[22px] font-semibold tracking-tight text-[#0F172A] mb-1">Deudores</h1>
          <p className="text-[13.5px] text-[#6B7280]">{list.length} empresas con facturas en gestión activa.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
        <MetricCard
          icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 21h18M5 21V7l8-4 8 4v14"/></svg>}
          label="Total deudores" value={String(list.length)} delta="+4" deltaText="este mes" />
        <MetricCard
          icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>}
          label="Mora promedio"
          value={`${moraPromedio} <span class='text-[#9CA3AF] font-medium text-[16px]'>días</span>`}
          delta="+2 días" deltaVariant="amber" deltaText="vs mes anterior" />
        <MetricCard
          icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="20 6 9 17 4 12"/></svg>}
          label="Tasa de recupero"
          value={`76<span class='text-[#9CA3AF] font-medium text-[16px]'>%</span>`}
          delta="+3,1 pts" deltaText="últimos 90 días" />
      </div>

      <DeudoresClient deudores={list} profileId={user.id} />
    </>
  );
}
