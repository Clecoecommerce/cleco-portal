import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LandingPage from "@/components/landing/LandingPage";

export const metadata = {
  title: "Cleco · Cobranza que no duele",
  description:
    "Ordenamos la cobranza de tu empresa desde que emites la factura y, si lo necesitas, cobramos por ti sin romper la relación con tus clientes.",
  openGraph: {
    title: "Cleco · Cobranza que no duele",
    description:
      "Ordenamos la cobranza de tu empresa desde que emites la factura y, si lo necesitas, cobramos por ti sin romper la relación con tus clientes.",
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
