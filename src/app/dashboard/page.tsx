import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PanelClient } from "./PanelClient";
import { DashboardAnalytics } from "./DashboardAnalytics";
import type { FacturaWithDeudor } from "@/types/database";

type PagoResumen = { monto_bruto: number; honorarios_pct: number; fecha: string };

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
      .select("monto_bruto, honorarios_pct, fecha")
      .eq("profile_id", user.id)
      .order("fecha", { ascending: false }),
  ]);

  const facturas = (rawFacturas ?? []) as FacturaWithDeudor[];
  const pagos    = (rawPagos    ?? []) as PagoResumen[];

  const firstName = profile.razon_social.split(" ")[0];

  return (
    <>
      <div className="mb-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#6B7280] mb-2">Panel principal</p>
        <h1 className="text-[22px] font-semibold tracking-tight text-[#0F172A] mb-1">Buenos días, {firstName}</h1>
        <p className="text-[13.5px] text-[#6B7280]">
          Análisis de cartera al {new Date().toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })}.
        </p>
      </div>

      <DashboardAnalytics facturas={facturas ?? []} pagos={pagos ?? []} />

      <PanelClient facturas={facturas ?? []} profileId={user.id} />

      <p className="mt-6 text-center text-[12px] text-[#9CA3AF]">
        Cleco SpA · Cobranza extrajudicial certificada · contacto@cleco.cl · +56 2 2000 0000
      </p>
    </>
  );
}
