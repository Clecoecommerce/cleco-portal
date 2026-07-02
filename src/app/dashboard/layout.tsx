import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { scoreFacturas } from "@/lib/scoring";
import type { Profile } from "@/types/database";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: rawProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (!rawProfile) redirect("/auth/login");

  const { data: rawFacturas } = await supabase
    .from("facturas")
    .select("*, deudores(rut, razon_social)")
    .eq("profile_id", user.id)
    .neq("estado", "pagada");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scored = scoreFacturas((rawFacturas ?? []) as any);
  const urgentCount = scored.filter(r => r.action === "contactar_hoy").length;

  return (
    <DashboardShell profile={rawProfile as Profile} urgentCount={urgentCount}>
      {children}
    </DashboardShell>
  );
}
