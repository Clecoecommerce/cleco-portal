"use client";

import React, { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { validarRUT, formatRUT } from "@/lib/utils";
import { enviarEmailCobranza } from "@/lib/email";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExtractedData {
  folio: string;
  rutDeudor: string;
  razonSocialDeudor: string;
  monto: string;
  fechaEmision: string;
  fechaVencimiento: string;
  emailContacto: string;
  telefonoContacto: string;
  fuente: "xml" | "vision" | "pdf" | "ocr" | "manual";
}

type RowStatus = "extracting" | "ready" | "duplicate" | "invalid" | "error";

interface InvoiceRow {
  id: string;
  fileName: string;
  folio: string;
  rutDeudor: string;
  razonSocial: string;
  monto: string;
  fechaEmision: string;
  fechaVencimiento: string;
  emailContacto: string;
  telefonoContacto: string;
  status: RowStatus;
  errorMsg: string;
  duplicateDate?: string;
  include: boolean;
  fuente?: "xml" | "vision" | "pdf" | "ocr" | "manual";
}

interface SavedFolio {
  folio_sii: string;
  folio_cleco: string;
  razon_social: string;
}

interface FinalResult {
  saved: number;
  rejected: number;
  savedFolios: SavedFolio[];
}

type Stage = "drop" | "processing" | "preview" | "saving" | "done";

// ─── Validation ───────────────────────────────────────────────────────────────

function validateRow(row: InvoiceRow): string {
  if (!row.folio.trim()) return "Folio vacío";
  if (!row.razonSocial.trim()) return "Razón social vacía";
  if (!validarRUT(row.rutDeudor)) return "RUT inválido (verifica el dígito verificador)";
  const monto = parseInt(row.monto, 10);
  if (isNaN(monto) || monto <= 0) return "Monto debe ser mayor a $0";
  if (monto > 999_999_999_999) return "Monto excede el límite máximo";
  if (!row.fechaVencimiento) return "Fecha de vencimiento requerida";
  const hoy = new Date().toISOString().slice(0, 10);
  if (row.fechaEmision && row.fechaEmision > hoy) return "Fecha de emisión no puede ser futura";
  if (row.fechaEmision && row.fechaVencimiento < row.fechaEmision)
    return "Fecha de vencimiento es anterior a la emisión";
  if (!row.emailContacto.trim()) return "Email de contacto requerido";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.emailContacto)) return "Email inválido";
  if (!row.telefonoContacto.trim()) return "Teléfono de contacto requerido";
  return "";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtMonto(val: string): string {
  const n = parseInt(val || "0", 10);
  return n ? n.toLocaleString("es-CL") : val;
}

function downloadErrorCsv(rows: InvoiceRow[]) {
  const bad = rows.filter(
    (r) =>
      r.status === "error" ||
      r.status === "invalid" ||
      (r.status === "duplicate" && !r.include)
  );
  if (!bad.length) return;
  const header = "Archivo,Folio,RUT,Razón Social,Estado,Error\n";
  const lines = bad
    .map(
      (r) =>
        `"${r.fileName}","${r.folio}","${r.rutDeudor}","${r.razonSocial}","${r.status}","${r.errorMsg || "Folio duplicado"}"`
    )
    .join("\n");
  const blob = new Blob([header + lines], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `errores_facturas_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const ACCEPT = ".xml,.pdf,.png,.jpg,.jpeg";
const MAX_FILES = 50;
const MAX_MB = 10;

// ─── Sub-components ───────────────────────────────────────────────────────────

function Spinner({ size = 14, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <path d="M12 3a9 9 0 1 0 9 9" strokeLinecap="round" />
    </svg>
  );
}

function StatusBadge({ row }: { row: InvoiceRow }) {
  if (row.status === "extracting") return <span className="text-[#2563EB]"><Spinner size={13} /></span>;
  if (row.status === "ready" && row.include)
    return <span className="inline-flex items-center gap-1 text-[#1F7A4D] font-medium text-[12px]">✓ Listo</span>;
  if (row.status === "ready" && !row.include)
    return <span className="text-[#9CA3AF] text-[12px]">Omitido</span>;
  if (row.status === "duplicate")
    return <span className="inline-flex items-center gap-1 text-[#B7791F] font-medium text-[12px]">⚠ Duplicado</span>;
  if (row.status === "invalid" && row.fuente === "manual")
    return <span className="inline-flex items-center gap-1 text-[#7C3AED] font-medium text-[12px]">✏ Manual</span>;
  if (row.status === "invalid")
    return <span className="inline-flex items-center gap-1 text-[#B23B3B] font-medium text-[12px]">✗ Inválido</span>;
  if (row.status === "error")
    return <span className="inline-flex items-center gap-1 text-[#B23B3B] font-medium text-[12px]">✗ Sin datos</span>;
  return null;
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  profileId: string;
  onCreated?: () => void;
}

export function SmartUploadModal({ open, onClose, profileId, onCreated }: Props) {
  const [stage, setStage] = useState<Stage>("drop");
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [drag, setDrag] = useState(false);
  const [dropError, setDropError] = useState("");
  const [finalResult, setFinalResult] = useState<FinalResult | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const fileRef = useRef<HTMLInputElement>(null);
  // Shared mutable array for parallel updates → safe because each slot is accessed by only one Promise
  const resultsRef = useRef<InvoiceRow[]>([]);

  // ── Helpers ──

  function close() {
    if (stage === "processing" || stage === "saving") return;
    setStage("drop");
    setRows([]);
    setProcessedCount(0);
    setTotalCount(0);
    setDropError("");
    setFinalResult(null);
    setExpanded(new Set());
    onClose();
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function updateRow(id: string, field: keyof InvoiceRow, value: string | boolean) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, [field]: value };
        if (
          typeof value === "string" &&
          ["folio", "rutDeudor", "razonSocial", "monto", "fechaVencimiento", "fechaEmision", "emailContacto", "telefonoContacto"].includes(field)
        ) {
          const err = validateRow(updated);
          updated.status = err ? "invalid" : "ready";
          updated.errorMsg = err;
          if (!err) updated.include = true;
        }
        return updated;
      })
    );
  }

  // ── Processing ──

  async function processFiles(files: File[]) {
    const valid = files
      .filter((f) => {
        const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
        if (!["xml", "pdf", "png", "jpg", "jpeg"].includes(ext)) return false;
        if (f.size > MAX_MB * 1024 * 1024) return false;
        return true;
      })
      .slice(0, MAX_FILES);

    if (!valid.length) {
      setDropError("No hay archivos válidos. Usa .xml, .pdf, .png o .jpg (máx. 10 MB cada uno).");
      return;
    }
    if (files.length > valid.length && files.length <= MAX_FILES + 5) {
      setDropError(
        `${files.length - valid.length} archivo(s) ignorados por formato o tamaño incorrecto.`
      );
    }

    const initial: InvoiceRow[] = valid.map((f, i) => ({
      id: `r-${i}-${f.name}-${Date.now()}`,
      fileName: f.name,
      folio: "", rutDeudor: "", razonSocial: "", monto: "",
      fechaEmision: "", fechaVencimiento: "",
      emailContacto: "", telefonoContacto: "",
      status: "extracting", errorMsg: "", include: true,
    }));

    resultsRef.current = [...initial];
    setRows([...initial]);
    setTotalCount(valid.length);
    setProcessedCount(0);
    setStage("processing");

    await Promise.all(
      valid.map(async (file, i) => {
        const fd = new FormData();
        fd.append("files", file);

        try {
          const res = await fetch("/api/invoices/bulk-upload", { method: "POST", body: fd });
          const json = await res.json();
          const result = json.results?.[0];

          if (!result || result.status === "error") {
            resultsRef.current[i] = {
              ...resultsRef.current[i],
              status: "error",
              errorMsg: result?.error ?? "Error de procesamiento",
              include: false,
            };
          } else {
            const d: ExtractedData = result.datos;
            const esManual = d.fuente === "manual";
            resultsRef.current[i] = {
              ...resultsRef.current[i],
              folio: d.folio ?? "",
              rutDeudor: d.rutDeudor ?? "",
              razonSocial: d.razonSocialDeudor ?? "",
              monto: d.monto ?? "",
              fechaEmision: d.fechaEmision ?? "",
              fechaVencimiento: d.fechaVencimiento ?? "",
              emailContacto: d.emailContacto ?? "",
              telefonoContacto: d.telefonoContacto ?? "",
              fuente: d.fuente,
              status: esManual ? "invalid" : "ready",
              errorMsg: esManual ? "Imagen: completa los datos en la tabla y haz clic en Guardar" : "",
              include: true,
            };
          }
        } catch {
          resultsRef.current[i] = {
            ...resultsRef.current[i],
            status: "error",
            errorMsg: "Error de red al procesar el archivo",
            include: false,
          };
        }

        setProcessedCount((c) => c + 1);
        setRows([...resultsRef.current]);
      })
    );

    // ── Deduplication + Validation ──
    const current = [...resultsRef.current];
    const readyFolios = current
      .filter((r) => r.status === "ready" && r.folio)
      .map((r) => r.folio);

    if (readyFolios.length > 0) {
      const sb = createClient();
      const { data: existing } = await sb
        .from("facturas")
        .select("numero, created_at")
        .eq("profile_id", profileId)
        .in("numero", readyFolios);

      const dupMap = new Map(existing?.map((f) => [f.numero, f.created_at]) ?? []);

      for (let i = 0; i < current.length; i++) {
        if (current[i].status !== "ready") continue;
        const err = validateRow(current[i]);
        if (err) {
          // include: true → el usuario puede corregir el campo en la tabla y guardar
          current[i] = { ...current[i], status: "invalid", errorMsg: `⚠ ${err} — edita el campo en la tabla`, include: true };
        } else if (dupMap.has(current[i].folio)) {
          const dupDate = new Date(dupMap.get(current[i].folio)!).toLocaleDateString("es-CL", {
            day: "2-digit", month: "short", year: "numeric",
          });
          current[i] = {
            ...current[i],
            status: "duplicate",
            errorMsg: `Factura ${current[i].folio} ya fue cargada el ${dupDate}. Se omitirá.`,
            include: false,
          };
        }
      }
    }

    // Validate ready rows that weren't caught above
    for (let i = 0; i < current.length; i++) {
      if (current[i].status === "ready") {
        const err = validateRow(current[i]);
        if (err) current[i] = { ...current[i], status: "invalid", errorMsg: err, include: false };
      }
    }

    resultsRef.current = current;
    setRows([...current]);
    setStage("preview");
  }

  // ── Save ──

  async function saveInvoices() {
    setStage("saving");
    const sb = createClient();
    // Incluir "invalid" si el usuario las dejó marcadas (pudo haber corregido los campos)
    const toSave = rows.filter((r) => r.include && (r.status === "ready" || r.status === "invalid"));

    // Compute folio_cleco sequential base from current month
    const now = new Date();
    const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const { count } = await sb
      .from("facturas")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", profileId)
      .gte("created_at", startOfMonth);

    let seq = (count ?? 0) + 1;
    let saved = 0;
    let failed = 0;
    const savedFolios: SavedFolio[] = [];

    for (const row of toSave) {
      try {
        const { data: deudor, error: dErr } = await sb
          .from("deudores")
          .upsert(
            {
              profile_id: profileId,
              rut: row.rutDeudor,
              razon_social: row.razonSocial,
              mora_dias: 0,
              riesgo: "bajo",
              email_contacto: row.emailContacto || null,
              telefono_contacto: row.telefonoContacto || null,
            },
            { onConflict: "profile_id,rut" }
          )
          .select("id")
          .single();

        if (dErr || !deudor) throw new Error("No se pudo registrar el deudor");

        const monto = parseInt(row.monto, 10);
        const { error: fErr } = await sb.from("facturas").insert({
          profile_id: profileId,
          deudor_id: deudor.id,
          numero: row.folio,
          monto,
          fecha_vencimiento: row.fechaVencimiento,
          estado: "en_gestion",
          archivo_url: null,
          notas: null,
          repactado: false,
          num_cuotas: null,
          monto_cuota: null,
        });

        if (fErr) throw new Error(fErr.message);

        const folioCleco = `CL-${yyyymm}-${String(seq).padStart(3, "0")}`;
        seq++;
        savedFolios.push({ folio_sii: row.folio, folio_cleco: folioCleco, razon_social: row.razonSocial });
        saved++;

        if (row.emailContacto) {
          enviarEmailCobranza({
            profileId,
            emailDeudor: row.emailContacto,
            nombreDeudor: row.razonSocial,
            numeroFactura: row.folio,
            monto,
            fechaVencimiento: row.fechaVencimiento,
          }).catch(() => {});
        }
      } catch {
        failed++;
      }
    }

    const rejected =
      rows.filter((r) => r.status === "error" || r.status === "invalid" || r.status === "duplicate").length +
      failed;

    setFinalResult({ saved, rejected, savedFolios });
    setStage("done");
    onCreated?.();
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (!open) return null;

  const readyCount = rows.filter((r) => r.include && (r.status === "ready" || r.status === "invalid")).length;
  const errorCount = rows.filter((r) => r.status === "error" || r.status === "invalid").length;
  const dupCount = rows.filter((r) => r.status === "duplicate").length;
  const allReadyChecked = rows.filter((r) => r.status === "ready").every((r) => r.include);

  return (
    <div
      className="fixed inset-0 bg-[#0F172A]/45 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <div className="bg-white w-full sm:max-w-[920px] max-h-[96vh] overflow-hidden flex flex-col rounded-t-2xl sm:rounded-2xl shadow-xl">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#F1F5F9] shrink-0">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#2563EB] inline-flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                </svg>
              </div>
              <h2 className="text-[18px] font-semibold text-[#0F172A] tracking-tight">Carga Inteligente de Facturas</h2>
            </div>
            <p className="text-[12.5px] text-[#6B7280] mt-0.5 ml-9.5">
              {stage === "drop" && "XML del SII · PDF · Imágenes — extracción automática de datos"}
              {stage === "processing" && `Procesando ${processedCount} de ${totalCount} archivos…`}
              {stage === "preview" && `${rows.length} archivo${rows.length !== 1 ? "s" : ""} procesados · ${readyCount} listo${readyCount !== 1 ? "s" : ""} para guardar`}
              {stage === "saving" && "Guardando facturas en la base de datos…"}
              {stage === "done" && `${finalResult?.saved ?? 0} factura${finalResult?.saved !== 1 ? "s" : ""} guardadas correctamente`}
            </p>
          </div>
          <button
            onClick={close}
            disabled={stage === "processing" || stage === "saving"}
            className="w-8 h-8 rounded-lg text-[#6B7280] hover:bg-[#F1F5F9] inline-flex items-center justify-center disabled:opacity-30 shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-auto">

          {/* ── DROP ZONE ── */}
          {stage === "drop" && (
            <div className="p-6 space-y-4">
              {dropError && (
                <div className="px-4 py-3 rounded-[10px] bg-[#FBF3E1] border border-[#F6C366]/40 text-[#B7791F] text-[13px]">
                  {dropError}
                </div>
              )}

              <div
                className={`border-[2px] border-dashed rounded-[16px] px-8 py-12 text-center cursor-pointer transition-all ${
                  drag
                    ? "border-[#2563EB] bg-[#EFF6FF]"
                    : "border-[#E2E8F0] bg-[#FAFBFD] hover:border-[#2563EB] hover:bg-[#F5F9FF]"
                }`}
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDrag(false);
                  setDropError("");
                  processFiles(Array.from(e.dataTransfer.files));
                }}
              >
                <div className="w-14 h-14 rounded-2xl bg-[#EFF6FF] text-[#2563EB] inline-flex items-center justify-center mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                <p className="text-[15px] font-semibold text-[#0F172A] mb-1">Arrastra tus facturas aquí</p>
                <p className="text-[13px] text-[#6B7280] mb-5">o haz clic para seleccionar archivos de tu equipo</p>
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  {[
                    { label: "XML del SII", desc: "Extracción al instante", color: "bg-[#E5F4EC] text-[#1F7A4D]" },
                    { label: "PDF", desc: "Vía Claude Vision", color: "bg-[#EFF6FF] text-[#2563EB]" },
                    { label: "PNG / JPG", desc: "Foto de factura", color: "bg-[#F3F0FF] text-[#7C3AED]" },
                  ].map((f) => (
                    <span key={f.label} className={`px-3 py-1.5 rounded-full text-[12px] font-medium ${f.color}`}>
                      {f.label} <span className="opacity-60 font-normal">· {f.desc}</span>
                    </span>
                  ))}
                </div>
                <p className="text-[11.5px] text-[#9CA3AF]">Máx. {MAX_FILES} archivos · {MAX_MB} MB por archivo</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept={ACCEPT}
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    setDropError("");
                    processFiles(Array.from(e.target.files ?? []));
                    e.target.value = "";
                  }}
                />
              </div>

              {/* Feature highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    icon: (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      </svg>
                    ),
                    title: "Deduplicación automática",
                    desc: "Detecta si una factura ya fue cargada y la omite con aviso",
                  },
                  {
                    icon: (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 11 12 14 22 4"/>
                        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                      </svg>
                    ),
                    title: "Revisión previa editable",
                    desc: "Corrige datos extraídos antes de guardar — sin perder el folio original",
                  },
                  {
                    icon: (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      </svg>
                    ),
                    title: "Folio SII preservado",
                    desc: "Guarda el folio original y asigna un código CLECO (CL-YYYYMM-###)",
                  },
                ].map((item) => (
                  <div key={item.title} className="border border-[#E2E8F0] rounded-[12px] p-4 flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#F1F5F9] text-[#6B7280] inline-flex items-center justify-center shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-[#0F172A]">{item.title}</p>
                      <p className="text-[11.5px] text-[#6B7280] mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── PROCESSING ── */}
          {stage === "processing" && (
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <div className="flex justify-between text-[12.5px] text-[#6B7280]">
                  <span>Analizando archivos con Claude Vision…</span>
                  <span className="font-semibold text-[#0F172A]">{processedCount} / {totalCount}</span>
                </div>
                <div className="h-2.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#2563EB] to-[#60a5fa] rounded-full transition-all duration-500"
                    style={{ width: `${totalCount ? (processedCount / totalCount) * 100 : 0}%` }}
                  />
                </div>
                <p className="text-[11.5px] text-[#9CA3AF]">
                  Los XMLs del SII se procesan al instante. Los PDF e imágenes usan Claude Vision (~5s c/u).
                </p>
              </div>

              <div className="space-y-1.5 max-h-[55vh] overflow-auto pr-1">
                {rows.map((row) => (
                  <div
                    key={row.id}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] text-[12.5px] transition-all ${
                      row.status === "ready"
                        ? "bg-[#F0FBF4] border border-[#1F7A4D]/10"
                        : row.status === "error"
                        ? "bg-[#FBE9E9] border border-[#B23B3B]/10"
                        : "bg-[#F8FAFC] border border-[#E2E8F0]"
                    }`}
                  >
                    <span className="shrink-0 w-4 text-center">
                      {row.status === "extracting" && <Spinner size={13} className="text-[#2563EB]" />}
                      {row.status === "ready" && (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1F7A4D" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                      {row.status === "error" && (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#B23B3B" strokeWidth="2.5">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      )}
                    </span>
                    <span className="flex-1 font-mono text-[11.5px] text-[#475569] truncate">{row.fileName}</span>
                    {row.status === "ready" && (
                      <span className="text-[#1F7A4D] text-[12px] shrink-0 max-w-[200px] truncate">
                        {row.fuente === "xml" ? "✓ XML" : "✓ Visión"} · {row.razonSocial || `Folio ${row.folio}`}
                      </span>
                    )}
                    {row.status === "error" && (
                      <span className="text-[#B23B3B] text-[11.5px] shrink-0 max-w-[240px] truncate">
                        {row.errorMsg}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── PREVIEW TABLE ── */}
          {stage === "preview" && (
            <div className="p-4 space-y-3">
              {/* Summary chips */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-[#E5F4EC] text-[#1F7A4D] text-[12.5px] font-medium">
                  {readyCount} listo{readyCount !== 1 ? "s" : ""}
                </span>
                {dupCount > 0 && (
                  <span className="px-3 py-1 rounded-full bg-[#FBF3E1] text-[#B7791F] text-[12.5px] font-medium">
                    {dupCount} duplicado{dupCount !== 1 ? "s" : ""}
                  </span>
                )}
                {errorCount > 0 && (
                  <span className="px-3 py-1 rounded-full bg-[#FBE9E9] text-[#B23B3B] text-[12.5px] font-medium">
                    {errorCount} con error
                  </span>
                )}
                <span className="text-[12px] text-[#9CA3AF] ml-auto">
                  Edita las celdas para corregir datos antes de guardar
                </span>
              </div>

              {/* Table */}
              <div className="border border-[#E2E8F0] rounded-[12px] overflow-hidden">
                <div className="overflow-x-auto max-h-[55vh] overflow-y-auto">
                  <table className="w-full text-[12.5px] border-collapse">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                        <th className="w-10 px-3 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={allReadyChecked}
                            onChange={(e) =>
                              setRows((prev) =>
                                prev.map((r) =>
                                  r.status === "ready" ? { ...r, include: e.target.checked } : r
                                )
                              )
                            }
                            className="w-3.5 h-3.5 rounded border-[#CBD5E1] accent-[#2563EB]"
                          />
                        </th>
                        {["Folio SII", "Razón Social", "RUT Deudor", "Monto CLP", "Vencimiento", "Estado"].map((h) => (
                          <th key={h} className="px-3 py-3 text-left font-semibold text-[#6B7280] whitespace-nowrap text-[11.5px] uppercase tracking-wide">
                            {h}
                          </th>
                        ))}
                        <th className="w-8 px-2 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                      {rows.map((row) => (
                        <React.Fragment key={row.id}>
                          <tr
                            className={`transition-colors ${
                              row.status === "error"
                                ? "bg-[#FFF8F8]"
                                : row.status === "invalid" && row.fuente === "manual"
                                ? "bg-[#F5F3FF]/60"
                                : row.status === "duplicate"
                                ? "bg-[#FFFBF0]"
                                : !row.include
                                ? "opacity-40"
                                : "hover:bg-[#FAFBFD]"
                            }`}
                          >
                            {/* Checkbox */}
                            <td className="px-3 py-2.5">
                              <input
                                type="checkbox"
                                checked={row.include}
                                disabled={row.status === "error"}
                                onChange={(e) => updateRow(row.id, "include", e.target.checked)}
                                className="w-3.5 h-3.5 rounded border-[#CBD5E1] accent-[#2563EB] disabled:opacity-30"
                              />
                            </td>

                            {/* Folio SII */}
                            <td className="px-2 py-2">
                              {row.status === "error" ? (
                                <span className="text-[#9CA3AF] px-1">—</span>
                              ) : (
                                <input
                                  className="w-24 h-7 px-2 rounded-[6px] font-mono text-[12px] bg-transparent border border-transparent hover:border-[#E2E8F0] focus:border-[#2563EB] focus:bg-white focus:outline-none transition-colors"
                                  value={row.folio}
                                  onChange={(e) => updateRow(row.id, "folio", e.target.value)}
                                  placeholder="0001234"
                                />
                              )}
                            </td>

                            {/* Razón Social */}
                            <td className="px-2 py-2 min-w-[160px] max-w-[200px]">
                              {row.status === "error" ? (
                                <span className="text-[#9CA3AF] text-[11px] px-1 truncate block" title={row.fileName}>
                                  {row.fileName}
                                </span>
                              ) : (
                                <input
                                  className="w-full h-7 px-2 rounded-[6px] text-[12px] bg-transparent border border-transparent hover:border-[#E2E8F0] focus:border-[#2563EB] focus:bg-white focus:outline-none transition-colors"
                                  value={row.razonSocial}
                                  onChange={(e) => updateRow(row.id, "razonSocial", e.target.value)}
                                  placeholder="Empresa S.A."
                                />
                              )}
                            </td>

                            {/* RUT */}
                            <td className="px-2 py-2">
                              {row.status === "error" ? (
                                <span className="text-[#9CA3AF] px-1">—</span>
                              ) : (
                                <input
                                  className="w-32 h-7 px-2 rounded-[6px] font-mono text-[12px] bg-transparent border border-transparent hover:border-[#E2E8F0] focus:border-[#2563EB] focus:bg-white focus:outline-none transition-colors"
                                  value={row.rutDeudor}
                                  onChange={(e) => updateRow(row.id, "rutDeudor", formatRUT(e.target.value))}
                                  placeholder="12.345.678-9"
                                  maxLength={12}
                                />
                              )}
                            </td>

                            {/* Monto */}
                            <td className="px-2 py-2">
                              {row.status === "error" ? (
                                <span className="text-[#9CA3AF] px-1">—</span>
                              ) : (
                                <div className="relative">
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[#9CA3AF] text-[11px]">$</span>
                                  <input
                                    className="w-32 h-7 pl-5 pr-2 rounded-[6px] text-[12px] text-right font-medium bg-transparent border border-transparent hover:border-[#E2E8F0] focus:border-[#2563EB] focus:bg-white focus:outline-none transition-colors"
                                    value={fmtMonto(row.monto)}
                                    onChange={(e) =>
                                      updateRow(row.id, "monto", e.target.value.replace(/\D/g, ""))
                                    }
                                    placeholder="1.250.000"
                                  />
                                </div>
                              )}
                            </td>

                            {/* Vencimiento */}
                            <td className="px-2 py-2">
                              {row.status === "error" ? (
                                <span className="text-[#9CA3AF] px-1">—</span>
                              ) : (
                                <input
                                  type="date"
                                  className="h-7 px-2 rounded-[6px] text-[12px] bg-transparent border border-transparent hover:border-[#E2E8F0] focus:border-[#2563EB] focus:bg-white focus:outline-none transition-colors"
                                  value={row.fechaVencimiento}
                                  onChange={(e) => updateRow(row.id, "fechaVencimiento", e.target.value)}
                                />
                              )}
                            </td>

                            {/* Estado */}
                            <td className="px-3 py-2.5 whitespace-nowrap">
                              <StatusBadge row={row} />
                            </td>

                            {/* empty last col */}
                            <td className="w-2" />
                          </tr>

                          {/* Error / duplicate message */}
                          {row.errorMsg && (
                            <tr className={
                              row.status === "duplicate" ? "bg-[#FFFBF0]" :
                              row.fuente === "manual" ? "bg-[#F5F3FF]" :
                              "bg-[#FFF8F8]"
                            }>
                              <td colSpan={8} className="px-4 pb-1.5 pt-0">
                                <p className={`text-[11.5px] ${
                                  row.status === "duplicate" ? "text-[#B7791F]" :
                                  row.fuente === "manual" ? "text-[#7C3AED]" :
                                  "text-[#B23B3B]"
                                }`}>{row.errorMsg}</p>
                              </td>
                            </tr>
                          )}

                          {/* Contacto — siempre visible, obligatorio */}
                          {row.status !== "error" && (
                            <tr className="bg-[#F8FAFC] border-b border-[#EEF2F7]">
                              <td />
                              <td colSpan={7} className="px-3 py-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide mr-1">
                                    Contacto<span className="text-[#B23B3B] ml-0.5">*</span>
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
                                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                                    </svg>
                                    <input
                                      type="email"
                                      placeholder="email@empresa.cl *"
                                      className={`h-7 px-2.5 rounded-[6px] text-[12px] border bg-white focus:outline-none w-48 ${
                                        !row.emailContacto.trim() ? "border-[#FECACA] focus:border-[#B23B3B]" : "border-[#E2E8F0] focus:border-[#2563EB]"
                                      }`}
                                      value={row.emailContacto}
                                      onChange={(e) => updateRow(row.id, "emailContacto", e.target.value)}
                                    />
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
                                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.63A2 2 0 012 .18h3a2 2 0 012 1.72c.12.96.36 1.9.69 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.09-1.09a2 2 0 012.11-.45c.91.33 1.85.57 2.81.69A2 2 0 0122 16.92z"/>
                                    </svg>
                                    <input
                                      type="tel"
                                      placeholder="+56 9 8765 4321 *"
                                      className={`h-7 px-2.5 rounded-[6px] text-[12px] border bg-white focus:outline-none w-40 ${
                                        !row.telefonoContacto.trim() ? "border-[#FECACA] focus:border-[#B23B3B]" : "border-[#E2E8F0] focus:border-[#2563EB]"
                                      }`}
                                      value={row.telefonoContacto}
                                      onChange={(e) => updateRow(row.id, "telefonoContacto", e.target.value)}
                                    />
                                  </div>
                                  <span className="text-[11px] text-[#9CA3AF]">Se envía notificación al deudor automáticamente</span>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Download errors link */}
              {(errorCount > 0 || dupCount > 0) && (
                <button
                  onClick={() => downloadErrorCsv(rows)}
                  className="flex items-center gap-1.5 text-[12.5px] text-[#6B7280] hover:text-[#0F172A] transition-colors"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Descargar reporte de errores (CSV)
                </button>
              )}
            </div>
          )}

          {/* ── SAVING ── */}
          {stage === "saving" && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#EFF6FF] inline-flex items-center justify-center">
                <Spinner size={22} className="text-[#2563EB]" />
              </div>
              <p className="text-[14.5px] font-medium text-[#0F172A]">Guardando facturas…</p>
              <p className="text-[12.5px] text-[#6B7280]">Registrando deudores y facturas en la base de datos</p>
            </div>
          )}

          {/* ── DONE ── */}
          {stage === "done" && finalResult && (
            <div className="p-6 space-y-5">
              {/* Hero summary */}
              <div className={`flex items-center gap-4 px-5 py-4 rounded-[14px] ${finalResult.rejected === 0 ? "bg-[#E5F4EC]" : "bg-[#F0FBF4]"}`}>
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm inline-flex items-center justify-center shrink-0">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1F7A4D" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <div>
                  <p className="text-[16px] font-bold text-[#1F7A4D]">
                    {finalResult.saved} factura{finalResult.saved !== 1 ? "s" : ""} guardadas correctamente
                  </p>
                  <p className="text-[13px] text-[#1F7A4D]/70 mt-0.5">
                    {finalResult.rejected > 0
                      ? `${finalResult.rejected} omitida${finalResult.rejected !== 1 ? "s" : ""} (duplicadas, errores o descartadas manualmente)`
                      : "Todas las facturas seleccionadas se guardaron exitosamente."}
                  </p>
                </div>
              </div>

              {/* Saved folios list */}
              {finalResult.savedFolios.length > 0 && (
                <div className="border border-[#E2E8F0] rounded-[12px] overflow-hidden">
                  <div className="px-4 py-2.5 bg-[#FAFBFD] border-b border-[#F1F5F9] flex items-center justify-between">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-[#9CA3AF]">
                      Facturas guardadas
                    </p>
                    <p className="text-[11px] text-[#9CA3AF]">Folio SII → Código CLECO</p>
                  </div>
                  <div className="max-h-72 overflow-auto divide-y divide-[#F8FAFC]">
                    {finalResult.savedFolios.map((f) => (
                      <div key={f.folio_sii} className="flex items-center justify-between px-4 py-2.5 text-[12.5px] hover:bg-[#FAFBFD]">
                        <span className="text-[#0F172A] font-medium truncate max-w-[280px]">{f.razon_social}</span>
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          <span className="font-mono text-[#6B7280]">#{f.folio_sii}</span>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2">
                            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                          </svg>
                          <span className="font-mono text-[#2563EB] font-semibold">{f.folio_cleco}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-[#F1F5F9] shrink-0 bg-white">
          <span className="flex items-center gap-1.5 text-[11.5px] text-[#9CA3AF]">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
            Cifrado extremo a extremo
          </span>

          <div className="flex gap-2">
            {(stage === "drop" || stage === "preview") && (
              <button
                onClick={close}
                className="h-9 px-4 text-[13.5px] font-medium text-[#1E293B] border border-[#E2E8F0] rounded-[8px] hover:bg-[#F1F5F9] transition-all"
              >
                {stage === "preview" ? "Cancelar" : "Cerrar"}
              </button>
            )}

            {stage === "preview" && (
              <button
                onClick={saveInvoices}
                disabled={readyCount === 0}
                className="h-9 px-5 text-[13.5px] font-semibold text-white bg-[#2563EB] hover:bg-[#1d4ed8] rounded-[8px] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/>
                  <polyline points="7 3 7 8 15 8"/>
                </svg>
                Guardar {readyCount} factura{readyCount !== 1 ? "s" : ""}
              </button>
            )}

            {stage === "done" && (
              <button
                onClick={close}
                className="h-9 px-5 text-[13.5px] font-semibold text-white bg-[#2563EB] hover:bg-[#1d4ed8] rounded-[8px] transition-all"
              >
                Ver en el panel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
