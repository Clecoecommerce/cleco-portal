"use client";
import React, { useEffect, useState } from "react";
import { DemoProvider, useDemo } from "./lib/store";
import { Shell } from "./components/Shell";
import { Login } from "./views/Login";
import { Resumen } from "./views/Resumen";
import { Facturas } from "./views/Facturas";
import { FacturaDetalle } from "./views/FacturaDetalle";
import { Subir } from "./views/Subir";
import { Aprobaciones, Conversaciones, Deudores, Reglas, Reportes } from "./views/Otras";

const SESSION = "cleco-demo-session";

function Router() {
  const { route } = useDemo();
  switch (route.v) {
    case "facturas": return <Facturas key={route.f ?? ""} />;
    case "factura": return <FacturaDetalle key={route.id} id={route.id ?? ""} />;
    case "subir": return <Subir />;
    case "deudores": return <Deudores />;
    case "conversaciones": return <Conversaciones />;
    case "aprobaciones": return <Aprobaciones />;
    case "reportes": return <Reportes />;
    case "reglas": return <Reglas />;
    default: return <Resumen />;
  }
}

export default function DemoApp() {
  const [logged, setLogged] = useState<boolean | null>(null);
  useEffect(() => {
    try { setLogged(window.sessionStorage.getItem(SESSION) === "1"); } catch { setLogged(false); }
  }, []);
  if (logged === null) return <div className="min-h-screen bg-white" />;
  if (!logged) return <Login onDone={() => { try { window.sessionStorage.setItem(SESSION, "1"); } catch {} setLogged(true); }} />;
  return (
    <DemoProvider>
      <Shell onLogout={() => { try { window.sessionStorage.removeItem(SESSION); } catch {} setLogged(false); }}>
        <Router />
      </Shell>
    </DemoProvider>
  );
}
