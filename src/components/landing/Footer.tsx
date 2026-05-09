import Link from "next/link";
import { Mail, Phone } from "lucide-react";

const links: { category: string; items: { label: string; href: string }[] }[] = [
  {
    category: "Producto",
    items: [
      { label: "Cómo funciona",      href: "#soluciones" },
      { label: "Resultados",         href: "#kpis" },
      { label: "Portal de clientes", href: "/auth/login" },
    ],
  },
  {
    category: "Empresa",
    items: [
      { label: "Nosotros",  href: "/nosotros" },
      { label: "Contacto",  href: "mailto:contacto@cleco.cl" },
    ],
  },
  {
    category: "Legal",
    items: [
      { label: "Términos de servicio", href: "#" },
      { label: "Privacidad",           href: "#" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100" role="contentinfo">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-flex items-baseline gap-1.5" aria-label="Cleco">
              <span className="text-xl font-bold tracking-tight text-navy">cleco</span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-navy/40">.cl</span>
            </Link>
            <p className="mt-4 text-sm text-ink/50 leading-relaxed max-w-xs">
              Cobranza extrajudicial certificada para empresas chilenas.
              Sin riesgo. Solo comisión por resultado.
            </p>

            {/* Contact */}
            <div className="mt-6 space-y-2.5">
              <a
                href="mailto:contacto@cleco.cl"
                className="flex items-center gap-2 text-sm text-ink/60 hover:text-navy transition-colors"
              >
                <Mail size={14} className="shrink-0 text-navy/50" />
                contacto@cleco.cl
              </a>
              <a
                href="tel:+56220000000"
                className="flex items-center gap-2 text-sm text-ink/60 hover:text-navy transition-colors"
              >
                <Phone size={14} className="shrink-0 text-navy/50" />
                +56 2 2000 0000
              </a>
            </div>

            <p className="mt-6 text-xs text-ink/30 italic">"Cobranza que no duele."</p>
          </div>

          {/* Links */}
          {links.map(({ category, items }) => (
            <div key={category}>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-ink/40 mb-5">
                {category}
              </h3>
              <ul className="space-y-3" role="list">
                {items.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-ink/60 hover:text-ink transition-colors duration-150"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-7 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-ink/35">
            © {new Date().getFullYear()} Cleco SpA · Cobranza extrajudicial certificada · Santiago, Chile
          </p>
          <p className="text-xs text-ink/25">Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
