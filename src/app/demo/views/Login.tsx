"use client";
import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Loader2, Lock, ShieldCheck } from "lucide-react";
import { CLIENT } from "../lib/seed";
import { Button } from "../components/ui";

export function Login({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<"cred" | "code" | "enter">("cred");
  const [email, setEmail] = useState(CLIENT.email);
  const [pass, setPass] = useState("demo-cleco");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const typing = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => () => clearInterval(typing.current), []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep("code"); autoType(); }, 700);
  };
  const autoType = () => {
    const target = "482915";
    let i = 0;
    setCode("");
    typing.current = setInterval(() => { i++; setCode(target.slice(0, i)); if (i >= 6) clearInterval(typing.current); }, 260);
  };
  const verify = () => {
    setStep("enter");
    setTimeout(onDone, 650);
  };

  return (
    <div className="grid min-h-screen font-[family-name:var(--font-inter-tight)] antialiased lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col">
        <img src="/landing/logo-white.png" alt="Cleco" className="h-9 w-auto self-start" />
        <div className="absolute -right-40 top-1/3 h-[520px] w-[520px] rounded-full bg-blue-600/25 blur-[120px]" />
        <div className="relative my-auto max-w-[540px]">
          <div className="text-[13px] font-bold uppercase tracking-[.1em] text-blue-300">Portal de clientes</div>
          <h1 className="mt-4 text-[56px] font-extrabold leading-[1.02] tracking-[-0.04em]">Tu cobranza,<br /><span className="text-blue-400">a la vista.</span></h1>
          <p className="mt-5 text-[18px] leading-relaxed text-slate-400">Cada correo, llamado y acuerdo con tus clientes, factura por factura. Tú decides lo importante; nosotros hacemos el resto.</p>
          <div className="mt-10 grid grid-cols-3 gap-3">
            {[["19,7% → 11,3%", "morosidad en oct 2026"], ["1.808", "facturas pagadas ene–sep"], ["71,7%", "del monto pagado a tiempo"]].map(([n, l]) => (
              <div key={l} className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                <div className="text-[20px] font-extrabold tracking-tight">{n}</div>
                <div className="mt-1 text-[12.5px] leading-snug text-slate-400">{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative text-[13px] text-slate-500">Cobranza que no duele · cleco.cl</div>
      </div>

      <div className="flex flex-col bg-white px-6 py-10 sm:px-12">
        <div className="flex items-center justify-between">
          <img src="/landing/logo-dark.png" alt="Cleco" className="h-8 w-auto lg:invisible" />
          <a href="/" className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-slate-500 hover:text-slate-900"><ArrowLeft className="h-4 w-4" /> Volver a cleco.cl</a>
        </div>
        <div className="m-auto w-full max-w-[400px]">
          {step === "cred" && (
            <form onSubmit={submit} className="fade-up grid gap-5">
              <div>
                <h2 className="text-[30px] font-extrabold tracking-[-0.03em] text-slate-900">Ingresa a tu portal</h2>
                <p className="mt-1.5 text-[15px] text-slate-500">Revisa tu cartera y lo que Cleco está haciendo con cada factura.</p>
              </div>
              <button type="button" onClick={() => submit({ preventDefault() {} } as React.FormEvent)} className="flex h-11 items-center justify-center gap-3 rounded-full border border-slate-200 text-[14.5px] font-semibold text-slate-800 transition hover:bg-slate-50">
                <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
                Continuar con Google
              </button>
              <div className="flex items-center gap-3 text-[12.5px] text-slate-400"><span className="h-px flex-1 bg-slate-200" />o con tu correo<span className="h-px flex-1 bg-slate-200" /></div>
              <label className="grid gap-1.5 text-[13.5px] font-semibold text-slate-700">Correo
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="h-11 rounded-xl border border-slate-200 px-3.5 text-[15px] font-normal outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
              </label>
              <label className="grid gap-1.5 text-[13.5px] font-semibold text-slate-700">
                <span className="flex justify-between">Contraseña <a className="font-medium text-blue-600" href="#" onClick={(e) => e.preventDefault()}>¿La olvidaste?</a></span>
                <input value={pass} onChange={(e) => setPass(e.target.value)} type="password" required className="h-11 rounded-xl border border-slate-200 px-3.5 text-[15px] font-normal outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
              </label>
              <Button size="lg" type="submit" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Ingresar <ArrowRight className="h-4 w-4" /></>}</Button>
              <p className="rounded-xl bg-amber-50 px-3.5 py-2.5 text-[12.5px] text-amber-900 ring-1 ring-amber-200">Versión demo: los datos ya vienen cargados. Es una maqueta con información ficticia.</p>
            </form>
          )}
          {step !== "cred" && (
            <div className="fade-up grid gap-5">
              <button onClick={() => setStep("cred")} className="inline-flex items-center gap-1.5 self-start text-[13.5px] font-semibold text-slate-500 hover:text-slate-800"><ArrowLeft className="h-4 w-4" /> Volver</button>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-600"><ShieldCheck className="h-6 w-6" /></div>
              <div>
                <h2 className="text-[30px] font-extrabold tracking-[-0.03em] text-slate-900">Revisa tu correo</h2>
                <p className="mt-1.5 text-[15px] text-slate-500">Te enviamos un código de 6 dígitos a <b className="text-slate-700">{email}</b>.</p>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className={`grid h-14 place-items-center rounded-xl border text-[24px] font-bold transition ${code[i] ? "border-blue-500 bg-blue-50/40 text-slate-900" : "border-slate-200 text-slate-300"}`}>{code[i] ?? "·"}</div>
                ))}
              </div>
              <Button size="lg" disabled={code.length < 6 || step === "enter"} onClick={verify}>
                {step === "enter" ? <><Loader2 className="h-4 w-4 animate-spin" /> Entrando…</> : <>Verificar e ingresar</>}
              </Button>
              <p className="flex items-center gap-2 text-[12.5px] text-slate-500"><Lock className="h-3.5 w-3.5" /> La doble verificación protege los datos de tus clientes.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
