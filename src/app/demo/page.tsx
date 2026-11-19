import type { Metadata } from "next";
import DemoLoader from "./DemoLoader";

export const metadata: Metadata = {
  title: "Cleco · Portal de clientes (demo)",
  description: "Maqueta interactiva del portal de clientes de Cleco, con datos ficticios.",
  robots: { index: false, follow: false },
};

export default function DemoPage() {
  return <DemoLoader />;
}
