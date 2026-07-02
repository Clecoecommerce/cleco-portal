"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SmartUploadModal } from "@/components/ui/SmartUploadModal";

interface Props { profileId: string }

const FORMATS = ["XML", "PDF", "PNG", "JPG"];

export function CargaClient({ profileId }: Props) {
  const router    = useRouter();
  const inputRef  = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [files,    setFiles]    = useState<File[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const handleFiles = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    setFiles(Array.from(list));
    setModalOpen(true);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }, []);

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  // Generate sample files for demo
  const usarEjemplos = () => {
    // We open the modal directly to show example mode
    setFiles([]);
    setModalOpen(true);
  };

  return (
    <>
      {modalOpen && (
        <SmartUploadModal
          open={modalOpen}
          onClose={() => { setModalOpen(false); setFiles([]); }}
          profileId={profileId}
          onCreated={(...args: any[]) => {
            setModalOpen(false);
            setFiles([]);
            router.push("/dashboard/bandeja");
            router.refresh();
          }}
        />
      )}

      {/* Page hero */}
      <div style={{ maxWidth: 700, margin: "0 auto", paddingTop: 20 }}>
        <div style={{ marginBottom: 32, textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 52, height: 52, borderRadius: 16, background: "#EFF6FF", marginBottom: 16 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0F172A", margin: "0 0 10px", lineHeight: 1.2 }}>
            Carga inteligente
          </h1>
          <p style={{ fontSize: 15, color: "#6B7280", lineHeight: 1.6, maxWidth: 480, margin: "0 auto" }}>
            Sube facturas y deja que el motor las clasifique, priorice y prepare la estrategia de cobranza automáticamente.
          </p>
        </div>

        {/* Drop zone */}
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          style={{
            border: `2px dashed ${dragging ? "#2563EB" : "#CBD5E1"}`,
            borderRadius: 20,
            padding: "52px 32px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
            cursor: "pointer",
            background: dragging ? "#EFF6FF" : "#FAFBFD",
            transition: "all .18s",
            textAlign: "center",
            userSelect: "none",
          }}>
          <input ref={inputRef} type="file" multiple
            accept=".xml,.pdf,.png,.jpg,.jpeg"
            style={{ display: "none" }}
            onChange={e => handleFiles(e.target.files)} />

          <div style={{ width: 56, height: 56, borderRadius: 16, background: dragging ? "#DBEAFE" : "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .18s" }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={dragging ? "#2563EB" : "#60A5FA"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>

          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: dragging ? "#2563EB" : "#0F172A", margin: "0 0 6px" }}>
              {dragging ? "Suelta aquí para cargar" : "Arrastra tus facturas aquí"}
            </p>
            <p style={{ fontSize: 13.5, color: "#9CA3AF", margin: 0 }}>
              o haz clic para seleccionar archivos desde tu equipo
            </p>
          </div>

          {/* Format chips */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", marginTop: 4 }}>
            {FORMATS.map(f => (
              <span key={f} style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".08em", color: "#2563EB", background: "#EFF6FF", border: "1px solid #BFDBFE", padding: "3px 10px", borderRadius: 20 }}>
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Secondary actions */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 20 }}>
          <button onClick={usarEjemplos}
            style={{ display: "flex", alignItems: "center", gap: 7, height: 38, padding: "0 18px", borderRadius: 10, fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", border: "1px solid #E2E8F0", background: "#FFFFFF", color: "#1E293B" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            Usar facturas de ejemplo
          </button>
        </div>

        {/* How it works */}
        <div style={{ marginTop: 44 }}>
          <div style={{ fontSize: 11, letterSpacing: ".14em", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", textAlign: "center", marginBottom: 20 }}>
            Cómo funciona
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {[
              { step: "1", title: "Sube facturas", desc: "Arrastra tus archivos XML, PDF o imágenes al área de carga." },
              { step: "2", title: "Motor analiza", desc: "La IA extrae datos, detecta duplicados y calcula el score de cada factura." },
              { step: "3", title: "Guarda en cartera", desc: "Confirma y las facturas se integran a tu bandeja priorizada." },
            ].map(item => (
              <div key={item.step} style={{ padding: "18px 16px", background: "#FFFFFF", borderRadius: 14, border: "1px solid #E2E8F0", textAlign: "center" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#EFF6FF", color: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, margin: "0 auto 12px" }}>
                  {item.step}
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A", marginBottom: 6 }}>{item.title}</div>
                <div style={{ fontSize: 12.5, color: "#9CA3AF", lineHeight: 1.55 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Supported formats detail */}
        <div style={{ marginTop: 24, padding: "16px 20px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 14, display: "flex", flexWrap: "wrap", gap: 20 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "#1E293B", display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1F7A4D" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            XML SII — extracción automática de todos los campos
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "#1E293B", display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1F7A4D" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            PDF / PNG / JPG — lectura por visión artificial (OCR)
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "#1E293B", display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1F7A4D" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Múltiples archivos en una sola carga · Sin límite
          </div>
        </div>
      </div>
    </>
  );
}
