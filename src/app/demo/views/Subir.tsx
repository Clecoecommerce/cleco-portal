"use client";
import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, FileSpreadsheet, FileUp, Loader2, Mail, Phone, Smartphone, Lock, CircleCheck, AlertTriangle } from "lucide-react";
import { useDemo, type NewInvoiceInput } from "../lib/store";
import { leerArchivoXml } from "@/lib/parseSiiXml";
import { buildPlan } from "../lib/seed";
import { SCENARIOS } from "../lib/sim";
import { addDays, clp, fecha, iso, rutFmt, today } from "../lib/format";
import { Badge, Button, Card, CHANNEL, PageHeader, cx } from "../components/ui";
import type { Scenario } from "../lib/types";

const validRut = (rut: string) => {
  const c = rut.replace(/[^0-9kK]/g, "").toUpperCase();
  if (c.length < 8) return false;
  const body = c.slice(0, -1), dv = c.slice(-1);
  let sum = 0, mul = 2;
  for (let i = body.length - 1; i >= 0; i--) { sum += Number(body[i]) * mul; mul = mul === 7 ? 2 : mul + 1; }
  const r = 11 - (sum % 11);
  return dv === (r === 11 ? "0" : r === 10 ? "K" : String(r));
};

const SAMPLE = { name: "Distribuidora Andes Sur SpA", rut: "76.543.210-3", contact: "Marcela Toro", email: "marcela.toro@andessur.cl", phone: "+56 9 6123 4587" };

type Form = { debtorId: string; name: string; rut: string; contact: string; email: string; phone: string; folio: string; amount: string; issueDate: string; dueDate: string; type: "directa" | "factoring"; line: string };

export function Subir() {
  const { state, addInvoice, go, toast } = useDemo();
  const [mode, setMode] = useState<"una" | "excel">("una");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [reading, setReading] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [drag, setDrag] = useState(false);
  const [scenario, setScenario] = useState<Scenario>("pide_documento");
  const [processing, setProcessing] = useState(-1);
  const [form, setForm] = useState<Form>(() => blank());
  const inputRef = useRef<HTMLInputElement>(null);

  function blank(): Form {
    const t = today();
    return { debtorId: "", ...SAMPLE, folio: String(1060000 + Math.floor(Math.random() * 8999)), amount: "2480000", issueDate: t, dueDate: iso(addDays(t, 30)), type: "directa", line: "Publicidad digital" };
  }
  const set = (k: keyof Form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const readFile = async (file?: File) => {
    const f = blank();
    setFileName(file ? file.name : "factura_ejemplo_1060231.pdf");
    setReading("Leyendo el documento…");
    let parsed = null as Awaited<ReturnType<typeof leerArchivoXml>>;
    if (file && /\.xml$/i.test(file.name)) { try { parsed = await leerArchivoXml(file); } catch {} }
    setTimeout(() => setReading("Extrayendo folio, montos y fechas…"), 650);
    setTimeout(() => setReading("Verificando el RUT del cliente…"), 1300);
    setTimeout(() => {
      if (parsed) {
        const existing = state.debtors.find((d) => d.rut.replace(/\./g, "") === rutFmt(parsed!.rutDeudor).replace(/\./g, ""));
        setForm({ ...f, debtorId: existing?.id ?? "", name: existing?.name ?? parsed.razonSocialDeudor ?? f.name, rut: rutFmt(parsed.rutDeudor), folio: parsed.folio, amount: parsed.monto, dueDate: parsed.fechaVencimiento || f.dueDate, contact: existing?.contact ?? f.contact, email: existing?.email ?? f.email, phone: existing?.phone ?? f.phone });
      } else setForm(f);
      setReading(null);
      setStep(2);
    }, 2000);
  };

  const chosen = state.debtors.find((d) => d.id === form.debtorId);
  const amount = Number(form.amount.replace(/\D/g, ""));
  const dup = state.invoices.some((i) => i.folio === form.folio);
  const checks = [
    { ok: chosen ? true : validRut(form.rut), label: "RUT del cliente válido" },
    { ok: !dup && form.folio.length > 3, label: dup ? "Ese N° de factura ya está cargado" : "N° de factura no duplicado" },
    { ok: amount > 0, label: "Monto mayor a cero" },
    { ok: form.dueDate >= form.issueDate, label: "Vencimiento posterior a la emisión" },
  ];
  const valid = checks.every((c) => c.ok) && (chosen || (form.name && form.email.includes("@")));
  const plan = buildPlan(form.issueDate, form.dueDate, state.rules);

  const activate = () => {
    setProcessing(0);
    const labels = 5;
    for (let k = 1; k <= labels; k++) setTimeout(() => setProcessing(k), k * 520);
    setTimeout(() => {
      const input: NewInvoiceInput = {
        folio: form.folio, amount, issueDate: form.issueDate, dueDate: form.dueDate, type: form.type, line: form.line, scenario,
        debtor: chosen ? { id: chosen.id, name: chosen.name, rut: chosen.rut, contact: chosen.contact, email: chosen.email, phone: chosen.phone } : { name: form.name, rut: rutFmt(form.rut), contact: form.contact, email: form.email, phone: form.phone },
      };
      const id = addInvoice(input);
      toast({ kind: "ok", text: "Cobranza activada", sub: `Factura N° ${form.folio} · ${chosen?.name ?? form.name}` });
      go({ v: "factura", id });
    }, labels * 520 + 450);
  };

  const field = (label: string, k: keyof Form, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="grid gap-1.5 text-[13px] font-semibold text-slate-700">{label}
      <input value={form[k]} onChange={(e) => set(k, e.target.value)} {...props} className="h-10 rounded-xl border border-slate-200 px-3 text-[14.5px] font-normal outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500" />
    </label>
  );

  return (
    <div className="fade-up mx-auto max-w-[980px]">
      <PageHeader kicker="Carga" title="Subir facturas" sub="Sube una factura y Cleco arma su plan de cobranza al instante. O carga el Excel de la semana." />
      <div className="mb-5 inline-flex rounded-full bg-slate-100 p-1">
        {([["una", "Una factura"], ["excel", "Excel de cartera"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setMode(k)} className={cx("h-9 rounded-full px-4 text-[13.5px] font-semibold", mode === k ? "bg-white shadow-sm" : "text-slate-500")}>{l}</button>
        ))}
      </div>

      {mode === "excel" ? <ExcelUpload /> : (
        <>
          <ol className="mb-5 flex items-center gap-2 text-[13px] font-semibold">
            {["Documento", "Revisa los datos", "Plan de cobranza"].map((l, i) => (
              <React.Fragment key={l}>
                <li className={cx("flex items-center gap-2", step > i + 1 ? "text-blue-600" : step === i + 1 ? "text-slate-900" : "text-slate-400")}>
                  <span className={cx("grid h-6 w-6 place-items-center rounded-full text-[12px]", step > i + 1 ? "bg-blue-600 text-white" : step === i + 1 ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-500")}>{step > i + 1 ? <Check className="h-3.5 w-3.5" /> : i + 1}</span>
                  <span className="hidden sm:inline">{l}</span>
                </li>
                {i < 2 && <span className="h-px flex-1 bg-slate-200" />}
              </React.Fragment>
            ))}
          </ol>

          {step === 1 && (
            <Card className="p-5 md:p-8">
              {reading ? (
                <div className="grid place-items-center gap-4 py-16 text-center">
                  <Loader2 className="h-9 w-9 animate-spin text-blue-600" />
                  <div><div className="text-[17px] font-bold">{reading}</div><div className="mt-1 text-[13.5px] text-slate-500">{fileName}</div></div>
                </div>
              ) : (
                <>
                  <div onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); readFile(e.dataTransfer.files[0]); }}
                    onClick={() => inputRef.current?.click()} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
                    className={cx("grid cursor-pointer place-items-center gap-3 rounded-2xl border-2 border-dashed px-6 py-14 text-center transition", drag ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-blue-300 hover:bg-slate-50")}>
                    <span className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-600"><FileUp className="h-6 w-6" /></span>
                    <div className="text-[17px] font-bold">Arrastra tu factura aquí</div>
                    <div className="text-[13.5px] text-slate-500">PDF, imagen o XML del SII · hasta 10 MB. El XML se lee de verdad; el resto se simula.</div>
                    <input ref={inputRef} type="file" accept=".pdf,.xml,.png,.jpg,.jpeg" className="hidden" onChange={(e) => readFile(e.target.files?.[0])} />
                  </div>
                  <div className="mt-5 flex flex-col items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4 sm:flex-row">
                    <span className="text-[14px] text-slate-600">¿No tienes una a mano? Usa una factura de ejemplo.</span>
                    <Button variant="soft" onClick={() => readFile()}>Usar factura de ejemplo <ArrowRight className="h-4 w-4" /></Button>
                  </div>
                </>
              )}
            </Card>
          )}

          {step === 2 && (
            <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              <Card className="p-5 md:p-6">
                <div className="flex items-center justify-between"><h3 className="text-[16px] font-bold">Datos leídos de la factura</h3><Badge tone="green">Lectura completa</Badge></div>
                <p className="mt-1 text-[13px] text-slate-500">{fileName}. Revisa y corrige si algo no calza.</p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-1.5 text-[13px] font-semibold text-slate-700 sm:col-span-2">Cliente
                    <select value={form.debtorId} onChange={(e) => set("debtorId", e.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-[14.5px] font-normal outline-none focus:border-blue-500">
                      <option value="">Cliente nuevo: {form.name}</option>
                      {state.debtors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </label>
                  {!chosen && <>{field("Razón social", "name")}{field("RUT", "rut")}{field("Contacto de pagos", "contact")}{field("Correo de pagos", "email", { type: "email" })}{field("Teléfono", "phone")}</>}
                  {field("N° de factura", "folio")}
                  <label className="grid gap-1.5 text-[13px] font-semibold text-slate-700">Monto total
                    <input value={amount ? clp(amount) : ""} onChange={(e) => set("amount", e.target.value.replace(/\D/g, ""))} className="h-10 rounded-xl border border-slate-200 px-3 text-[14.5px] font-normal outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
                  </label>
                  {field("Emisión", "issueDate", { type: "date" })}
                  {field("Vencimiento", "dueDate", { type: "date" })}
                  <label className="grid gap-1.5 text-[13px] font-semibold text-slate-700">Tipo
                    <select value={form.type} onChange={(e) => set("type", e.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-[14.5px] font-normal"><option value="directa">Directa</option><option value="factoring">Con factoring</option></select>
                  </label>
                  {field("Línea de negocio", "line")}
                </div>
              </Card>
              <div className="grid content-start gap-4">
                <Card className="p-5">
                  <h3 className="text-[15px] font-bold">Validaciones</h3>
                  <ul className="mt-3 grid gap-2.5">
                    {checks.map((c) => (
                      <li key={c.label} className="flex items-center gap-2.5 text-[13.5px]">
                        {c.ok ? <CircleCheck className="h-4.5 w-4.5 h-[18px] w-[18px] text-emerald-600" /> : <AlertTriangle className="h-[18px] w-[18px] text-amber-500" />}
                        <span className={c.ok ? "text-slate-700" : "font-semibold text-amber-800"}>{c.label}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setStep(1)}><ArrowLeft className="h-4 w-4" /> Volver</Button>
                  <Button className="flex-1" disabled={!valid} onClick={() => setStep(3)}>Ver plan de cobranza <ArrowRight className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
              <Card className="p-5 md:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-[16px] font-bold">Plan de cobranza propuesto</h3>
                    <p className="mt-1 text-[13px] text-slate-500">Factura N° {form.folio} · {clp(amount)} · vence el {fecha(form.dueDate)}</p>
                  </div>
                  <button onClick={() => go({ v: "reglas" })} className="text-[13px] font-semibold text-blue-600">Editar reglas</button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge tone="blue" dot={false}>Tono {state.rules.tone}</Badge>
                  {(["correo", "sms", "llamado"] as const).filter((c) => state.rules.channels[c]).map((c) => <Badge key={c} tone="gray" dot={false}>{CHANNEL[c].label}</Badge>)}
                  <Badge tone="gray" dot={false}>Envíos {state.rules.sendHours}</Badge>
                </div>
                <ol className="mt-5 grid gap-3">
                  {plan.map((p) => {
                    const Icon = p.needsApproval ? Lock : p.channel === "sms" ? Smartphone : p.channel === "llamado" ? Phone : Mail;
                    return (
                      <li key={p.id} className="grid grid-cols-[84px_28px_1fr] items-start gap-3 text-[13.5px]">
                        <span className="pt-1 text-right text-[12.5px] font-semibold text-slate-500">{fecha(addDays(form.dueDate, p.day).toISOString())}</span>
                        <span className={cx("grid h-7 w-7 place-items-center rounded-full", p.needsApproval ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600")}><Icon className="h-3.5 w-3.5" /></span>
                        <span><b>{p.title}</b>{p.needsApproval && <Badge tone="amber" dot={false} className="ml-2">Tú decides</Badge>}<span className="block text-[12.5px] text-slate-500">{p.detail}</span></span>
                      </li>
                    );
                  })}
                </ol>
              </Card>
              <div className="grid content-start gap-4">
                <Card className="p-5">
                  <h3 className="text-[15px] font-bold">Para la demo: ¿cómo responde tu cliente?</h3>
                  <p className="mt-1 text-[12.5px] text-slate-500">Elegimos un guion para simular días de cobranza en segundos.</p>
                  <div className="mt-4 grid gap-2">
                    {(Object.keys(SCENARIOS) as Scenario[]).map((k) => (
                      <button key={k} onClick={() => setScenario(k)} className={cx("rounded-xl p-3.5 text-left ring-1 transition", scenario === k ? "bg-blue-50 ring-2 ring-blue-600" : "ring-slate-200 hover:bg-slate-50")}>
                        <div className="flex items-center justify-between text-[14px] font-semibold">{SCENARIOS[k].label}{scenario === k && <Check className="h-4 w-4 text-blue-600" />}</div>
                        <div className="mt-0.5 text-[12.5px] text-slate-500">{SCENARIOS[k].desc}</div>
                      </button>
                    ))}
                  </div>
                </Card>
                {processing >= 0 ? (
                  <Card className="p-5">
                    <ul className="grid gap-2.5">
                      {["Factura validada", "Cliente registrado", "Plan de cobranza creado", "Mensajes programados", "Factura enviada al cliente"].map((l, k) => (
                        <li key={l} className="flex items-center gap-2.5 text-[13.5px]">
                          {processing > k ? <CircleCheck className="h-[18px] w-[18px] text-emerald-600" /> : processing === k ? <Loader2 className="h-[18px] w-[18px] animate-spin text-blue-600" /> : <span className="h-[18px] w-[18px] rounded-full border-2 border-slate-200" />}
                          <span className={processing >= k ? "text-slate-800" : "text-slate-400"}>{l}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => setStep(2)}><ArrowLeft className="h-4 w-4" /> Volver</Button>
                    <Button size="lg" className="flex-1" onClick={activate}>Activar cobranza</Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ExcelUpload() {
  const { state, toast, go } = useDemo();
  const [phase, setPhase] = useState<"idle" | "reading" | "done">("idle");
  const [name, setName] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);
  const start = (f?: File) => { setName(f?.name ?? "cartera_semana_47.xlsx"); setPhase("reading"); timer.current = setTimeout(() => setPhase("done"), 1800); };
  const open = state.invoices.filter((i) => i.status !== "pagada");
  const sample = open.slice(0, 6);
  return (
    <Card className="p-5 md:p-8">
      {phase === "idle" && (
        <div onClick={() => ref.current?.click()} role="button" tabIndex={0} className="grid cursor-pointer place-items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 px-6 py-14 text-center hover:border-blue-300 hover:bg-slate-50">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600"><FileSpreadsheet className="h-6 w-6" /></span>
          <div className="text-[17px] font-bold">Sube el Excel de cartera de la semana</div>
          <div className="text-[13.5px] text-slate-500">Lo comparamos con la semana anterior: qué facturas entraron, cuáles siguen y cuáles se pagaron.</div>
          <input ref={ref} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => start(e.target.files?.[0])} />
          <Button variant="soft" onClick={(e) => { e.stopPropagation(); start(); }}>Usar Excel de ejemplo</Button>
        </div>
      )}
      {phase === "reading" && <div className="grid place-items-center gap-3 py-16"><Loader2 className="h-9 w-9 animate-spin text-blue-600" /><div className="text-[16px] font-bold">Comparando con la semana anterior…</div><div className="text-[13px] text-slate-500">{name}</div></div>}
      {phase === "done" && (
        <div className="fade-up grid gap-5">
          <div className="grid grid-cols-3 gap-3">
            {[["Nuevas", 6, "entran a cobranza", "text-blue-600"], ["Siguen", open.length, "con su plan en curso", "text-slate-900"], ["Salieron", 4, "pagadas o anuladas", "text-emerald-600"]].map(([l, n, s, c]) => (
              <div key={l as string} className="rounded-2xl p-4 ring-1 ring-slate-200"><div className="text-[13px] text-slate-500">{l}</div><div className={cx("text-[30px] font-extrabold", c as string)}>{n}</div><div className="text-[12.5px] text-slate-500">{s}</div></div>
            ))}
          </div>
          <div className="overflow-x-auto rounded-xl ring-1 ring-slate-200">
            <table className="w-full text-[13.5px]"><thead><tr className="bg-slate-50 text-left text-[11.5px] font-bold uppercase tracking-[.06em] text-slate-500"><th className="px-4 py-2.5">Cliente</th><th className="px-3">N°</th><th className="px-3 text-right">Monto</th><th className="px-3">Cambio</th></tr></thead>
              <tbody>{sample.map((i, k) => <tr key={i.id} className="border-t border-slate-100"><td className="px-4 py-2.5">{state.debtors.find((d) => d.id === i.debtorId)?.name}</td><td className="px-3">{i.folio}</td><td className="px-3 text-right tabular-nums">{clp(i.amount)}</td><td className="px-3"><Badge tone={k < 2 ? "blue" : "gray"}>{k < 2 ? "Nueva" : "Sigue"}</Badge></td></tr>)}</tbody>
            </table>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="ghost" onClick={() => setPhase("idle")}>Cancelar</Button>
            <Button onClick={() => { toast({ kind: "ok", text: "Cartera de la semana cargada", sub: "6 nuevas · 4 salieron · planes actualizados" }); go({ v: "facturas" }); }}>Confirmar carga</Button>
          </div>
        </div>
      )}
    </Card>
  );
}
