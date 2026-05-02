import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LandingPage from "@/components/landing/LandingPage";

export const metadata = {
  title: "Cleco · Cobranza que no duele",
  description:
    "Recuperamos tus cuentas por cobrar con IA y trato respetuoso. Sin mensualidades. Sin riesgo. Solo resultados.",
  openGraph: {
    title: "Cleco · Cobranza que no duele",
    description:
      "Recuperamos tus cuentas por cobrar con IA y trato respetuoso. Sin mensualidades. Sin riesgo. Solo resultados.",
    url: "https://cleco.cl",
    siteName: "Cleco",
    locale: "es_CL",
    type: "website",
  },
};

export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return <LandingPage />;
}
