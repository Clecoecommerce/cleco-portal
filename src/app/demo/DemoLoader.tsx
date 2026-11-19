"use client";
import dynamic from "next/dynamic";

// La demo vive solo en el navegador (fechas relativas y localStorage), así que se carga sin SSR.
const DemoApp = dynamic(() => import("./DemoApp"), { ssr: false, loading: () => <div className="min-h-screen bg-white" /> });

export default function DemoLoader() {
  return <DemoApp />;
}
