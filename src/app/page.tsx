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

// La portada se muestra siempre, con o sin sesión. Al portal se entra con "Ingresar al portal".
export default function RootPage() {
  return <LandingPage />;
}
