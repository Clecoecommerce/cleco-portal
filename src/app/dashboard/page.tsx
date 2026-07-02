import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { scoreFacturas } from "@/lib/scoring";
import { PanelDashboard } from "./PanelDashboard";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: rawProfile } = await supabase
    .from("profiles")
    .select("id, razon_social")
    .eq("id", user.id)
    .single();
  if (!rawProfile) redirect("/auth/login");

  const { data: rawFacturas } = await supabase
    .from("facturas")
    .select("*, deudores(rut, razon_social, email_contacto, telefono_contacto, tipo, confiabilidad)")
    .eq("profile_id", user.id)
    .neq("estado", "pagada")
    .order("fecha_vencimiento", { ascending: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scored = scoreFacturas((rawFacturas ?? []) as any);
  const firstName = (rawProfile as { razon_social: string }).razon_social.split(" ")[0];

  return (
    <PanelDashboard
      scored={scored}
      firstName={firstName}
      profileId={user.id}
      profileName={(rawProfile as { razon_social: string }).razon_social}
    />
  );
}
