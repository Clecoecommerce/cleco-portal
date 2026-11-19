"use client";
import React from "react";
import { Mail, Phone, Smartphone, MessageSquareText, Info } from "lucide-react";
import type { Channel, InvoiceStatus, Sentiment } from "../lib/types";

export const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(" ");

export const STATUS: Record<InvoiceStatus, { label: string; tone: Tone }> = {
  por_vencer: { label: "Por vencer", tone: "blue" },
  vencida: { label: "En gestión", tone: "amber" },
  comprometida: { label: "Fecha comprometida", tone: "green" },
  plan_pago: { label: "Plan de pago", tone: "green" },
  aviso_dicom: { label: "Aviso DICOM", tone: "red" },
  pagada: { label: "Pagada", tone: "gray" },
  pausada: { label: "En pausa", tone: "gray" },
};

type Tone = "blue" | "green" | "amber" | "red" | "gray" | "ink";
const TONES: Record<Tone, string> = {
  blue: "bg-blue-50 text-blue-700 ring-blue-200/60",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200/60",
  amber: "bg-amber-50 text-amber-800 ring-amber-200/70",
  red: "bg-red-50 text-red-700 ring-red-200/60",
  gray: "bg-slate-100 text-slate-600 ring-slate-200",
  ink: "bg-slate-900 text-white ring-slate-900",
};

export function Badge({ tone = "gray", children, dot = true, className }: { tone?: Tone; children: React.ReactNode; dot?: boolean; className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[12.5px] font-semibold ring-1 ring-inset", TONES[tone], className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />}
      {children}
    </span>
  );
}

export const StatusBadge = ({ s }: { s: InvoiceStatus }) => <Badge tone={STATUS[s].tone}>{STATUS[s].label}</Badge>;

export function Card({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...rest} className={cx("rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,.04),0_8px_24px_-16px_rgba(15,23,42,.18)]", className)}>{children}</div>;
}

export function CardHead({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 pt-5">
      <div>
        <h3 className="text-[17px] font-bold tracking-tight text-slate-900">{title}</h3>
        {sub && <p className="mt-0.5 text-[13.5px] text-slate-500">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function Button({ variant = "primary", size = "md", className, children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "dark" | "danger" | "soft"; size?: "sm" | "md" | "lg" }) {
  const v = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-600/20",
    ghost: "bg-white text-slate-800 ring-1 ring-inset ring-slate-200 hover:bg-slate-50",
    dark: "bg-slate-900 text-white hover:bg-slate-800",
    danger: "bg-white text-red-700 ring-1 ring-inset ring-red-200 hover:bg-red-50",
    soft: "bg-blue-50 text-blue-700 hover:bg-blue-100",
  }[variant];
  const s = { sm: "h-8 px-3 text-[13px]", md: "h-10 px-4 text-[14px]", lg: "h-12 px-6 text-[15px]" }[size];
  return (
    <button {...rest} className={cx("inline-flex items-center justify-center gap-2 rounded-full font-semibold transition active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600", v, s, className)}>
      {children}
    </button>
  );
}

export const CHANNEL: Record<Channel, { label: string; Icon: React.ComponentType<{ className?: string }> }> = {
  correo: { label: "Correo", Icon: Mail },
  sms: { label: "SMS", Icon: Smartphone },
  llamado: { label: "Llamado", Icon: Phone },
  portal: { label: "Portal", Icon: MessageSquareText },
  sistema: { label: "Cleco", Icon: Info },
};

export const SENTIMENT: Record<Sentiment, { label: string; tone: Tone }> = {
  positivo: { label: "Buena disposición", tone: "green" },
  neutral: { label: "Pide algo", tone: "amber" },
  molesto: { label: "Molesto", tone: "red" },
};

export function PageHeader({ kicker, title, sub, right }: { kicker?: string; title: string; sub?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {kicker && <div className="text-[12px] font-bold uppercase tracking-[.09em] text-blue-600">{kicker}</div>}
        <h1 className="mt-1 text-[30px] font-extrabold leading-tight tracking-[-0.03em] text-slate-900 md:text-[36px]">{title}</h1>
        {sub && <p className="mt-1 text-[15px] text-slate-500">{sub}</p>}
      </div>
      {right && <div className="flex flex-wrap items-center gap-2">{right}</div>}
    </div>
  );
}

export function Empty({ title, sub, icon }: { title: string; sub?: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      {icon && <div className="mb-1 grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-600">{icon}</div>}
      <div className="text-[15px] font-semibold text-slate-800">{title}</div>
      {sub && <div className="max-w-sm text-[13.5px] text-slate-500">{sub}</div>}
    </div>
  );
}

export function Stars({ n, size = 14 }: { n: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${n} de 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 20 20" className={i <= n ? "text-amber-400" : "text-slate-200"} fill="currentColor"><path d="M10 1.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L10 14.8l-5.2 2.8 1-5.8L1.5 7.7l5.9-.8z" /></svg>
      ))}
    </span>
  );
}
