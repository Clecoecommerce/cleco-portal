// @ts-nocheck
"use client";
// Landing pública de cleco.cl (oct 2026). Markup y estilos estáticos; animaciones en el efecto.
import { useEffect } from "react";

const CSS = `
/* Layout: landing de una columna con bandas alternadas blanco / celeste / tinta; la escalera de cobranza es la pieza central */
:root{
  --ink:#0F172A; --ink-2:#1E293B; --muted:#5B6476; --blue:#2563EB; --blue-2:#1D4ED8; --sky:#EFF6FF; --sky-2:#DBEAFE;
  --line:#E2E8F0; --paper:#FFFFFF; --ok:#1F7A4D; --ok-bg:#E5F4EC; --warn:#9A6412; --warn-bg:#FBF1DE;
  --sans:var(--font-inter-tight),"Inter Tight",system-ui,-apple-system,"Segoe UI",Arial,sans-serif;
  --r:14px; --max:1160px;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}*{animation:none!important;transition:none!important}}
body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--sans);font-size:17px;line-height:1.55;-webkit-font-smoothing:antialiased}
img{max-width:100%;display:block}
a{color:inherit}
.wrap{max-width:var(--max);margin:0 auto;padding-left:max(20px,env(safe-area-inset-left,0px));padding-right:max(20px,env(safe-area-inset-right,0px))}
h1,h2,h3{margin:0;letter-spacing:-.025em;line-height:1.05;text-wrap:balance}
h1{font-size:clamp(44px,7vw,84px);font-weight:800}
h2{font-size:clamp(32px,4.4vw,52px);font-weight:800}
h3{font-size:20px;font-weight:700;letter-spacing:-.01em;line-height:1.25}
p{margin:0}
.lead{font-size:clamp(18px,1.6vw,21px);color:var(--muted);max-width:60ch}
.kicker{font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--blue)}
.btn{display:inline-flex;align-items:center;gap:10px;font:600 16px var(--sans);text-decoration:none;border-radius:999px;padding:15px 24px;border:1.5px solid transparent;cursor:pointer;transition:transform .15s,background .15s}
.btn:hover{transform:translateY(-1px)}
.btn:focus-visible,a:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible,summary:focus-visible{outline:3px solid var(--blue);outline-offset:3px}
.btn-primary{background:var(--blue);color:#fff}
.btn-primary:hover{background:var(--blue-2)}
.btn-ghost{border-color:var(--line);color:var(--ink);background:#fff}
section{padding-block:clamp(72px,9vw,120px)}
.band-sky{background:var(--sky)}
.band-ink{background:var(--ink);color:#fff}
.band-ink .lead{color:#AEB8CA}
.sec-head{display:grid;gap:16px;margin-bottom:48px;max-width:760px}

/* nav */
header.nav{position:sticky;top:0;z-index:20;background:rgba(255,255,255,.92);backdrop-filter:saturate(1.4) blur(10px);border-bottom:1px solid var(--line)}
header.nav .wrap{display:flex;align-items:center;justify-content:space-between;gap:20px;height:70px}
.logo img{height:30px;width:auto}
.nav-links{display:flex;gap:28px;font-size:15px;font-weight:500}
.nav-links a{text-decoration:none;color:var(--ink-2)}
.nav-links a:hover{color:var(--blue)}
.nav-cta{display:flex;gap:10px;align-items:center}
.nav-cta .btn{padding:10px 18px;font-size:15px}
.login{display:inline-flex;align-items:center;gap:6px;font-size:15px;font-weight:500;text-decoration:none;color:var(--ink-2);border-radius:999px;padding:8px 10px}
.login:hover{color:var(--blue)}
.login-s{display:none}
.cta-short{display:none}
@media (max-width:900px){.nav-links{display:none}.login-l{display:none}.login-s{display:inline}}
@media (max-width:400px){.login-s{display:none}
.cta-short{display:none}.login{padding:8px;border:1px solid var(--line)}}

/* hero */
.hero{padding-block:clamp(56px,7vw,96px) clamp(64px,8vw,104px)}
.hero .wrap{display:grid;grid-template-columns:1.1fr .9fr;gap:56px;align-items:center}
@media (max-width:960px){.hero .wrap{grid-template-columns:1fr}}
.hero h1 .blue{color:var(--blue)}
.hero .lead{margin-top:24px}
.hero-ctas{display:flex;flex-wrap:wrap;gap:12px;margin-top:32px}
.hero-note{margin-top:18px;font-size:14px;color:var(--muted)}
.proof{margin-top:40px;display:flex;align-items:center;gap:14px;padding-top:24px;border-top:1px solid var(--line);font-size:15px;color:var(--ink-2)}
.proof b{font-weight:700}
.proof .big{font-size:30px;font-weight:800;color:var(--blue);letter-spacing:-.02em;line-height:1}

/* invoice card stack (pieza firma) */
.inv{position:relative;display:grid;gap:14px}
.inv-card{background:#fff;border:1px solid var(--line);border-radius:var(--r);padding:18px 20px;box-shadow:0 18px 40px -24px rgba(15,23,42,.35);display:grid;gap:10px}
.inv-top{display:flex;justify-content:space-between;align-items:baseline;gap:12px}
.inv-name{font-weight:700}
.inv-amt{font-weight:700;font-variant-numeric:tabular-nums}
.inv-meta{font-size:13.5px;color:var(--muted)}
.tl{display:grid;gap:8px;margin-top:4px}
.tl-row{display:grid;grid-template-columns:18px 1fr auto;gap:10px;align-items:start;font-size:14px}
.tl-dot{width:10px;height:10px;border-radius:50%;margin-top:6px;background:var(--sky-2);box-shadow:0 0 0 3px #fff,0 0 0 4px var(--sky-2)}
.tl-row.done .tl-dot{background:var(--blue);box-shadow:0 0 0 3px #fff,0 0 0 4px var(--blue)}
.tl-day{color:var(--muted);font-variant-numeric:tabular-nums;font-size:13px}
.chip{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:600;border-radius:999px;padding:4px 10px}
.chip.ok{background:var(--ok-bg);color:var(--ok)}
.chip.warn{background:var(--warn-bg);color:var(--warn)}
.chip.blue{background:var(--sky);color:var(--blue-2)}
.inv-card.back{transform:translateX(16px) scale(.97);opacity:.95}
.inv-caption{font-size:12.5px;color:var(--muted);text-align:right}



/* factura en vivo */
.live{position:relative;display:grid;gap:14px}
.live-card{background:#fff;border:1px solid var(--line);border-radius:18px;padding:20px 22px;box-shadow:0 30px 60px -28px rgba(15,23,42,.38);display:grid;gap:12px;transition:transform .5s cubic-bezier(.2,.8,.2,1),opacity .5s}
.live-card.swap{transform:translateY(10px) scale(.98);opacity:0}
.live-head{display:flex;justify-content:space-between;align-items:center}
.live-tag{display:inline-flex;align-items:center;gap:8px;font-size:12.5px;font-weight:700;color:var(--blue-2);background:var(--sky);border-radius:999px;padding:4px 10px}
.pulse{width:8px;height:8px;border-radius:50%;background:var(--blue);box-shadow:0 0 0 0 rgba(37,99,235,.55);animation:pulse 1.6s infinite}
@keyframes pulse{70%{box-shadow:0 0 0 9px rgba(37,99,235,0)}100%{box-shadow:0 0 0 0 rgba(37,99,235,0)}}
.live-step{font-size:12.5px;color:var(--muted);font-variant-numeric:tabular-nums}
.track{display:grid;gap:6px}
.track-bar{height:8px;border-radius:999px;background:linear-gradient(90deg,var(--sky-2) 0 50%,#FDE2E2 50% 100%);overflow:hidden}
.track-bar span{display:block;height:100%;width:0;border-radius:999px;background:var(--blue);transition:width .9s cubic-bezier(.4,.1,.2,1)}
.track-bar span.late{background:#DC2626}
.track-labels{display:flex;justify-content:space-between;font-size:11.5px;color:var(--muted)}
.steps-live{list-style:none;margin:0;padding:0;display:grid;gap:8px;min-height:132px}
.steps-live li{display:grid;grid-template-columns:20px 1fr auto;gap:10px;align-items:start;font-size:14px;animation:stepIn .45s cubic-bezier(.2,.8,.2,1) both}
.steps-live li .d{width:20px;height:20px;border-radius:50%;background:var(--blue);color:#fff;font-size:11px;display:grid;place-items:center;font-weight:700}
.steps-live li.warn .d{background:#F59E0B}
.steps-live li .t{color:var(--muted);font-size:12.5px;font-variant-numeric:tabular-nums;padding-top:2px}
@keyframes stepIn{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:none}}
.live-foot{min-height:28px}
#lv-chip{opacity:0;transform:scale(.9);transition:opacity .35s,transform .35s cubic-bezier(.2,1.4,.4,1)}
#lv-chip.on{opacity:1;transform:none}
.toast{position:absolute;right:-10px;top:40%;display:flex;gap:10px;align-items:center;background:var(--ink);color:#fff;border-radius:14px;padding:12px 16px;box-shadow:0 20px 40px -16px rgba(15,23,42,.6);opacity:0;transform:translateY(12px);transition:opacity .4s,transform .4s cubic-bezier(.2,1.2,.4,1);pointer-events:none;z-index:2}
.toast.on{opacity:1;transform:none}
.toast-ic{width:28px;height:28px;border-radius:50%;background:#16A34A;display:grid;place-items:center;font-weight:800;flex:none}
.toast small{display:block;color:#AEB8CA;font-size:12px}
.week{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.week div{background:#fff;border:1px solid var(--line);border-radius:14px;padding:12px 14px;display:grid;gap:2px}
.wk-n{font-size:24px;font-weight:800;letter-spacing:-.02em;font-variant-numeric:tabular-nums;color:var(--ink)}
.wk-l{font-size:12px;color:var(--muted);line-height:1.3}
.wk-n.bump{animation:bump .5s}
@keyframes bump{40%{transform:translateY(-3px);color:var(--blue)}}
.wk-n{display:inline-block}
@media (max-width:640px){.toast{right:8px;left:8px;top:auto;bottom:118px}.steps-live{min-height:150px}.live-card{padding:18px}}

/* planes */
.plans{display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:stretch}
@media (max-width:820px){.plans{grid-template-columns:1fr}}
.plan{position:relative;border-radius:22px;padding:32px;display:flex;flex-direction:column;gap:16px}
.plan-basic{background:#fff;border:1px solid var(--line)}
.plan-360{background:var(--ink);color:#fff;box-shadow:0 30px 60px -30px rgba(37,99,235,.55)}
.plan-top{display:flex;align-items:center;gap:14px}
.plan-icon{width:48px;height:48px;border-radius:14px;display:grid;place-items:center;flex:none}
.plan-basic .plan-icon{background:var(--sky);color:var(--blue)}
.plan-360 .plan-icon{background:var(--blue);color:#fff}
.plan-name{display:block;font-weight:800;font-size:18px;letter-spacing:-.01em}
.plan-type{display:block;font-size:13.5px;color:var(--muted)}
.plan-360 .plan-type{color:#8DB8FF}
.plan h3{font-size:clamp(26px,3vw,34px);font-weight:800;letter-spacing:-.025em;line-height:1.08}
.plan-360 h3{color:#fff}
.plan-for{color:var(--muted);font-size:15.5px}
.plan-360 .plan-for{color:#AEB8CA}
.checks{list-style:none;margin:0;padding:0;display:grid;gap:10px}
.checks li{position:relative;padding-left:30px;font-size:15.5px}
.checks li::before{content:"";position:absolute;left:0;top:3px;width:18px;height:18px;border-radius:50%;background:var(--sky) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%232563EB' stroke-width='3.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 12.5l4 4 8-9'/%3E%3C/svg%3E") center/12px no-repeat}
.plan-360 .checks li{color:#D6DEEA}
.plan-360 .checks li b{color:#fff}
.plan-360 .checks li::before{background-color:var(--blue);background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 12.5l4 4 8-9'/%3E%3C/svg%3E")}
.plan-price{margin-top:auto;padding-top:16px;border-top:1px solid var(--line);font-weight:600;font-size:15.5px;color:var(--ink-2)}
.plan-price span{display:block;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-bottom:4px}
.plan-360 .plan-price{border-color:#24314D;color:#fff}
.plan-360 .plan-price span{color:#8DB8FF}
.plan-badge{position:absolute;top:-12px;right:24px;background:#FBBF24;color:var(--ink);font-size:12.5px;font-weight:700;border-radius:999px;padding:5px 12px}
.who{margin-top:24px;background:#fff;border:1px solid var(--line);border-radius:16px;overflow:hidden}
.who-row{display:grid;grid-template-columns:1.6fr 1fr 1fr;gap:12px;padding:14px 20px;border-top:1px solid var(--line);font-size:15px;align-items:center}
.who-row:first-child{border-top:0}
.who-head{background:#F8FAFC;font-size:12.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--muted)}
.c-you{color:var(--muted)}
.c-auto{color:var(--blue-2);font-weight:600}
.c-us{color:var(--ink);font-weight:700}
@media (max-width:560px){.who-row{grid-template-columns:1.3fr .9fr .9fr;padding:12px 14px;font-size:13.5px;gap:8px}.plan{padding:24px}}

/* movimiento */
.draft-bar{background:#FBBF24;color:var(--ink);font-size:12px;font-weight:700;text-align:center;padding:4px 12px;letter-spacing:.02em}
.progress{position:fixed;left:0;right:0;top:env(safe-area-inset-top,0px);height:3px;z-index:40;pointer-events:none}
.progress span{display:block;height:100%;width:100%;background:var(--blue);transform-origin:0 50%;transform:scaleX(0)}
.js .reveal{transform:translateY(28px);opacity:.35;transition:transform .7s cubic-bezier(.2,.7,.2,1),opacity .7s ease}
.js .reveal.in{transform:none;opacity:1}
.js .stagger > *{transform:translateY(22px);opacity:.35;transition:transform .6s cubic-bezier(.2,.7,.2,1),opacity .6s ease}
.js .stagger.in > *{transform:none;opacity:1}
.js .stagger.in > *:nth-child(2){transition-delay:.08s}.js .stagger.in > *:nth-child(3){transition-delay:.16s}
.js .stagger.in > *:nth-child(4){transition-delay:.24s}.js .stagger.in > *:nth-child(5){transition-delay:.32s}.js .stagger.in > *:nth-child(6){transition-delay:.4s}
.js .ladder .rung{transform:translateX(-30px);opacity:.3;transition:transform .6s cubic-bezier(.2,.7,.2,1),opacity .6s ease}
.js .ladder.in .rung{transform:none;opacity:1}
.ladder.in .rung:nth-child(2){transition-delay:.1s}.ladder.in .rung:nth-child(3){transition-delay:.2s}.ladder.in .rung:nth-child(4){transition-delay:.3s}.ladder.in .rung:nth-child(5){transition-delay:.4s}.ladder.in .rung:nth-child(6){transition-delay:.5s}
.hero h1 .blue{display:inline-block}
.js .hero h1 .blue{animation:pop .9s .2s cubic-bezier(.2,.8,.2,1) both}
@keyframes pop{from{transform:translateY(18px);opacity:0}to{transform:none;opacity:1}}
.res-main{position:relative;overflow:hidden}
.res-main::after{content:"";position:absolute;inset:0;background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.18) 50%,transparent 70%);transform:translateX(-100%)}
.res-main.in::after{animation:shine 1.6s .5s ease}
@keyframes shine{to{transform:translateX(100%)}}
.mcta{display:none}
@media (max-width:640px){
  .mcta{display:flex;position:fixed;left:0;right:0;bottom:0;z-index:35;padding:10px max(16px,env(safe-area-inset-left,0px)) calc(10px + env(safe-area-inset-bottom,0px));background:rgba(255,255,255,.96);backdrop-filter:blur(8px);border-top:1px solid var(--line);transform:translateY(110%);transition:transform .35s ease}
  .mcta.show{transform:none}
  .mcta .btn{width:100%;justify-content:center}
  footer{padding-bottom:96px}
}
@media (prefers-reduced-motion:reduce){.js .reveal,.js .stagger > *,.js .ladder .rung{transform:none!important;opacity:1!important}.js .hero h1 .blue{animation:none}.res-main::after{display:none}}

/* resultados */
.results{background:var(--ink);color:#fff}
.results .lead{color:#AEB8CA}
.results .kicker{color:#8DB8FF}
.res-grid{display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr;gap:16px}
@media (max-width:1000px){.res-grid{grid-template-columns:1fr 1fr}}
@media (max-width:560px){.res-grid{grid-template-columns:1fr}}
.res{background:#16213A;border:1px solid #24314D;border-radius:var(--r);padding:26px;display:grid;gap:10px;align-content:start}
.res .n{font-size:clamp(36px,4vw,48px);font-weight:800;letter-spacing:-.03em;line-height:1;font-variant-numeric:tabular-nums}
.res p{color:#AEB8CA;font-size:15.5px}
.res-main{background:var(--blue);border-color:var(--blue)}
.res-main .n{font-size:clamp(36px,4.4vw,54px)}
.res-main p{color:#E0EAFF}
.res-main .arrow{font-weight:500;opacity:.8}
@media (max-width:1000px){.res-main{grid-column:1/-1}}
.results .src{color:#8391A7}

/* facts */
.facts{display:grid;grid-template-columns:repeat(3,1fr);gap:0;border-top:1px solid var(--line)}
@media (max-width:820px){.facts{grid-template-columns:1fr}}
.fact{padding:32px 28px 8px 0;display:grid;gap:10px}
.fact + .fact{padding-left:28px;border-left:1px solid var(--line)}
@media (max-width:820px){.fact + .fact{border-left:0;padding-left:0;border-top:1px solid var(--line)}}
.fact .n{font-size:clamp(48px,6vw,72px);font-weight:800;letter-spacing:-.04em;color:var(--blue);line-height:1}
.fact p{color:var(--ink-2)}
.src{margin-top:28px;font-size:13px;color:var(--muted)}

/* steps */
.steps{display:grid;grid-template-columns:repeat(5,1fr);gap:16px;counter-reset:s}
@media (max-width:1000px){.steps{grid-template-columns:1fr 1fr}}
@media (max-width:560px){.steps{grid-template-columns:1fr}}
.step{background:#fff;border:1px solid var(--line);border-radius:var(--r);padding:24px;display:grid;gap:10px;align-content:start}
.step .num{counter-increment:s;font-size:14px;font-weight:700;color:var(--blue)}
.step .num::before{content:"0" counter(s)}
.step p{font-size:15.5px;color:var(--muted)}
.rule{margin-top:28px;display:flex;gap:14px;align-items:flex-start;background:var(--ink);color:#fff;border-radius:var(--r);padding:22px 24px}
.rule b{color:#8DB8FF}

/* escalera */
.ladder-grid{display:grid;grid-template-columns:.9fr 1.1fr;gap:56px;align-items:end}
@media (max-width:960px){.ladder-grid{grid-template-columns:1fr}}
.ladder{display:grid;gap:10px}
.rung{display:grid;grid-template-columns:44px 1fr;gap:16px;align-items:center;border-radius:12px;padding:16px 18px;background:#16213A;border:1px solid #24314D}
.rung .lvl{font-weight:800;font-size:22px;color:#8DB8FF;text-align:center}
.rung h3{font-size:17px}
.rung p{font-size:14.5px;color:#AEB8CA;margin-top:2px}
.rung .you{display:inline-block;margin-left:8px;font-size:12px;font-weight:700;color:var(--ink);background:#FBBF24;border-radius:999px;padding:2px 9px;vertical-align:middle;letter-spacing:.01em}
.rung:nth-child(1){margin-left:0}.rung:nth-child(2){margin-left:6%}.rung:nth-child(3){margin-left:12%}
.rung:nth-child(4){margin-left:18%}.rung:nth-child(5){margin-left:24%}.rung:nth-child(6){margin-left:30%}
@media (max-width:600px){.rung{margin-left:0!important}}
.rung.ext{background:transparent;border-style:dashed}
.ladder-note{display:grid;gap:18px}
.ladder-note li{margin-bottom:10px;color:#D6DEEA}
.ladder-note ul{padding-left:20px;margin:0}

/* portal */
.portal-grid{display:grid;grid-template-columns:1.25fr .75fr;gap:48px;align-items:center}
.portal-grid > *,.hero .wrap > *,.ladder-grid > *,.cta-grid > *,.story > *{min-width:0}
@media (max-width:960px){.portal-grid{grid-template-columns:1fr}}
.shot{border-radius:16px;overflow:hidden;border:1px solid var(--line);box-shadow:0 30px 60px -30px rgba(15,23,42,.45);background:#fff}
.shot-cap{margin-top:12px;font-size:13px;color:var(--muted)}
.feat{display:grid;gap:22px}
.feat div{display:grid;gap:4px}
.feat p{color:var(--muted);font-size:16px}

/* precio */
.price-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}
@media (max-width:820px){.price-grid{grid-template-columns:1fr}}
.price{background:#fff;border:1px solid var(--line);border-radius:18px;padding:32px;display:grid;gap:14px;align-content:start}
.price .tag{font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
.price h3{font-size:30px;font-weight:800;letter-spacing:-.02em;line-height:1.1}
.price ul{margin:0;padding-left:20px;color:var(--ink-2);display:grid;gap:8px}
.price.accent{border:2px solid var(--blue)}
.plan-for{color:var(--muted);font-size:15.5px}
.plan-price{margin-top:auto;padding-top:14px;border-top:1px solid var(--line);font-weight:600;color:var(--ink-2);font-size:15.5px}
.price ul b{color:var(--ink)}
.price-foot{margin-top:24px;display:flex;flex-wrap:wrap;gap:18px;justify-content:space-between;align-items:center}

/* comparativa */
.tbl-wrap{overflow-x:auto;border:1px solid var(--line);border-radius:var(--r);background:#fff}
table{border-collapse:collapse;width:100%;min-width:720px;font-size:15.5px}
th,td{padding:16px 18px;text-align:left;border-bottom:1px solid var(--line);vertical-align:top}
thead th{font-size:13px;letter-spacing:.04em;text-transform:uppercase;color:var(--muted);font-weight:700;background:#F8FAFC}
th.us,td.us{background:var(--sky)}
thead th.us{color:var(--blue-2)}
tbody tr:last-child td{border-bottom:0}
td:first-child{font-weight:600}
.y{color:var(--ok);font-weight:700}.nn{color:#94A3B8}

/* nosotros */
.team{display:grid;grid-template-columns:1fr;gap:28px;margin-top:8px}
@media (max-width:760px){.team{grid-template-columns:1fr}}
.person{display:grid;grid-template-columns:96px 1fr;gap:18px;align-items:center}
.person img{width:96px;height:96px;border-radius:50%;object-fit:cover}
.person p{color:var(--muted);font-size:15.5px}
.story{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:start}
@media (max-width:900px){.story{grid-template-columns:1fr}}
.quote{font-size:clamp(24px,2.6vw,32px);font-weight:700;letter-spacing:-.02em;line-height:1.25}
.quote .blue{color:var(--blue)}

/* faq */
.faq{display:grid;gap:12px;max-width:860px}
details{background:#fff;border:1px solid var(--line);border-radius:12px;padding:0 22px}
summary{cursor:pointer;list-style:none;padding:20px 0;font-weight:600;font-size:17px;display:flex;justify-content:space-between;gap:16px}
summary::-webkit-details-marker{display:none}
summary::after{content:"+";font-size:22px;color:var(--blue);line-height:1}
details[open] summary::after{content:"–"}
details p{padding-bottom:20px;color:var(--muted)}

/* cta */
.cta-grid{display:grid;grid-template-columns:.9fr 1.1fr;gap:56px;align-items:start}
@media (max-width:960px){.cta-grid{grid-template-columns:1fr}}
.need{display:grid;gap:14px;margin-top:28px}
.need div{display:flex;gap:12px;align-items:flex-start;color:#D6DEEA}
.need span{flex:none;width:26px;height:26px;border-radius:50%;background:var(--blue);color:#fff;font-size:13px;font-weight:700;display:grid;place-items:center}
form{background:#fff;color:var(--ink);border-radius:18px;padding:32px;display:grid;gap:16px}
.row{display:grid;grid-template-columns:1fr 1fr;gap:16px}
@media (max-width:560px){.row{grid-template-columns:1fr}}
label{display:grid;gap:6px;font-size:14px;font-weight:600}
input,select,textarea{font:16px var(--sans);padding:12px 14px;border:1px solid #CBD5E1;border-radius:10px;background:#fff;color:var(--ink);width:100%}
textarea{min-height:96px;resize:vertical}
.form-note{font-size:13px;color:var(--muted)}
.sent{display:none;background:var(--ok-bg);color:var(--ok);border-radius:10px;padding:14px 16px;font-weight:600}

footer{background:var(--ink);color:#AEB8CA;padding-block:48px;border-top:1px solid #1E293B}
footer .wrap{display:flex;flex-wrap:wrap;gap:24px;justify-content:space-between;align-items:center;font-size:14px}
footer img{height:26px;width:auto}
footer a{color:#D6DEEA;text-decoration:none}

.cmp-m{display:none}
.swipe{display:none}
@media (max-width:640px){
  body{font-size:16px}
  section{padding-block:64px}
  .sec-head{margin-bottom:32px}
  header.nav .wrap{height:62px}
  .logo img{height:26px}
  .nav-cta .btn{padding:9px 14px;font-size:14px;white-space:nowrap}
  .cta-long{display:none}
  .cta-short{display:inline}
  .hero .h-left{display:contents}
  .h-intro{order:1}.live{order:2}.h-actions{order:3}
  .hero .wrap{gap:28px}
  .hero .lead{margin-top:16px;font-size:17px}
  .live-card{padding:16px}
  .week{gap:8px}.week div{padding:10px}.wk-n{font-size:20px}.wk-l{font-size:11px}
  .hero{padding-block:40px 64px}
  .hero-ctas .btn{width:100%;justify-content:center}
  .proof{align-items:flex-start}
  .inv-card.back{transform:none}
  .inv-top{flex-wrap:wrap}
  .tl-row{font-size:13.5px}
  .fact{padding:24px 0 8px}
  .step{padding:20px}
  .rule{flex-direction:column;gap:8px}
  .rung{padding:14px}
  .price{padding:24px}
  .price h3{font-size:24px}
  .price-foot .btn{width:100%;justify-content:center}
  .shot{overflow-x:auto;-webkit-overflow-scrolling:touch}
  .shot img{width:620px;max-width:none}
  .swipe{display:inline}
  .tbl-wrap{display:none}
  .cmp-m{display:grid;gap:12px}
  .cmp-m div{background:#fff;border:1px solid var(--line);border-radius:12px;padding:18px;display:grid;gap:6px}
  .cmp-m h3{font-size:17px}
  .cmp-m p{font-size:15px;color:var(--muted)}
  .cmp-m .us-a{color:var(--blue-2);font-weight:600}
  .person{grid-template-columns:72px 1fr}
  .person img{width:72px;height:72px}
  form{padding:22px}
  footer .wrap{flex-direction:column;align-items:flex-start}
}
`;

const HTML = `

<div class="progress" aria-hidden="true"><span id="prog"></span></div>

<header class="nav">
  <div class="wrap">
    <a class="logo" href="#top" aria-label="Cleco, inicio"><img src="/landing/logo-dark.png" alt="cleCo"></a>
    <nav class="nav-links" aria-label="Secciones">
      <a href="#como-funciona">Cómo funciona</a>
      <a href="#escalera">Escalamiento</a>
      <a href="#planes">Planes</a>
      <a href="#nosotros">Nosotros</a>
      <a href="#preguntas">Preguntas</a>
    </nav>
    <div class="nav-cta">
      <a class="login" href="/auth/login"><svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c1.3-3.6 4.1-5.4 7.5-5.4s6.2 1.8 7.5 5.4"/></svg><span class="login-l">Ingresar al portal</span><span class="login-s">Ingresar</span></a>
      <a class="btn btn-primary" href="#diagnostico"><span class="cta-long">Diagnóstico gratis</span><span class="cta-short">Diagnóstico</span></a>
    </div>
  </div>
</header>

<main id="top">

<!-- HERO -->
<section class="hero">
  <div class="wrap">
    <div class="h-left">
      <div class="h-intro">
      <div class="kicker">Cobranza B2B para empresas chilenas</div>
      <h1 style="margin-top:18px">Cobranza que <span class="blue">no duele.</span></h1>
      <p class="lead">Ordenamos la cobranza de tu empresa desde que emites la factura. Y si lo necesitas, nos hacemos cargo de cobrar por ti, sin romper la relación con tus clientes.</p>
      </div>
      <div class="h-actions">
      <div class="hero-ctas">
        <a class="btn btn-primary" href="#diagnostico">Pide tu diagnóstico gratis</a>
        <a class="btn btn-ghost" href="#como-funciona">Ver cómo funciona</a>
      </div>
      <p class="hero-note">Te respondemos en menos de 24 horas hábiles. Sin compromiso.</p>
      <div class="proof">
        <span class="big">+200</span>
        <span>facturas al mes gestionamos hoy para <b>grandes empresas chilenas</b>, con el mismo método que te ofrecemos a ti.</span>
      </div>
      </div>
    </div>

    <div class="live" id="live" aria-label="Ejemplo animado de cómo Cleco gestiona una factura">
      <div class="live-card">
        <div class="live-head">
          <span class="live-tag"><span class="pulse"></span>Cleco gestionando</span>
          <span class="live-step" id="lv-step">1 / 3</span>
        </div>
        <div class="inv-top">
          <span class="inv-name" id="lv-num">Factura N° 48.213</span>
          <span class="inv-amt" id="lv-amt">$2.480.000</span>
        </div>
        <div class="inv-meta" id="lv-meta">Empresa Ejemplo SpA · vence el 30 oct</div>
        <div class="track" aria-hidden="true">
          <div class="track-bar"><span id="lv-fill" style="width:62%"></span></div>
          <div class="track-labels"><span>Emisión</span><span>Vence</span><span>Mora</span></div>
        </div>
        <ol class="steps-live" id="lv-steps"><li><span class="d">✓</span><span>Recordatorio antes del vencimiento</span><span class="t">23 oct</span></li><li><span class="d">✓</span><span>Cliente confirma fecha de pago: 6 nov</span><span class="t">24 oct</span></li><li><span class="d">✓</span><span>No insistimos hasta esa fecha</span><span class="t">—</span></li><li><span class="d">✓</span><span>Pago recibido</span><span class="t">6 nov</span></li></ol>
        <div class="live-foot"><span class="chip ok on" id="lv-chip">● Pagada sin llegar a mora</span></div>
      </div>
      <div class="toast" id="lv-toast" role="status"><span class="toast-ic">✓</span><span><b id="lv-toast-t">Pago recibido</b><small id="lv-toast-s">$2.480.000 · Empresa Ejemplo SpA</small></span></div>
      <div class="week">
        <div><span class="wk-n" id="wk1">48</span><span class="wk-l">recordatorios enviados</span></div>
        <div><span class="wk-n" id="wk2">17</span><span class="wk-l">fechas de pago confirmadas</span></div>
        <div><span class="wk-n" id="wk3">12</span><span class="wk-l">facturas pagadas</span></div>
      </div>
      <p class="inv-caption">Ejemplo ilustrativo de una semana de gestión</p>
    </div>
  </div>
</section>

<!-- RESULTADOS -->
<section class="results">
  <div class="wrap">
    <div class="sec-head reveal">
      <div class="kicker">Resultados reales</div>
      <h2>Lo que logramos cobrando de verdad.</h2>
      <p class="lead">No son proyecciones: son números reales de la cartera que gestionamos hoy.</p>
    </div>
    <div class="res-grid stagger">
      <div class="res res-main"><div class="n">19,7% <span class="arrow">→</span> 11,3%</div><p>bajó la morosidad de la cartera en octubre de 2026.</p></div>
      <div class="res"><div class="n" data-count="1808" data-fmt="int">1.808</div><p>facturas pagadas entre enero y septiembre.</p></div>
      <div class="res"><div class="n" data-count="508" data-prefix="$" data-suffix=" M">$508 M</div><p>recuperados en 623 facturas que ya estaban vencidas.</p></div>
      <div class="res"><div class="n" data-count="71.7" data-dec="1" data-suffix="%">71,7%</div><p>del monto se pagó a tiempo, sin llegar a mora.</p></div>
    </div>
    <p class="src">Fuente: cartera gestionada por Cleco, enero a octubre de 2026.</p>
  </div>
</section>

<!-- PROBLEMA -->
<section class="band-sky">
  <div class="wrap">
    <div class="sec-head reveal">
      <div class="kicker">El problema</div>
      <h2>En Chile, pagar tarde entre empresas es lo normal.</h2>
      <p class="lead">Y cada semana que una factura espera, cuesta más recuperarla.</p>
    </div>
    <div class="facts stagger">
      <div class="fact"><div class="n" data-count="71" data-suffix="%">71%</div><p>de las facturas morosas del país corresponde a pymes.</p></div>
      <div class="fact"><div class="n">64 <span style="font-size:.45em;color:var(--muted);letter-spacing:0">vs.</span> 26</div><p>de cada 100 facturas morosas se recuperan si se actúa entre los 30 y 90 días, versus entre los 90 y 180.</p></div>
      <div class="fact"><div class="n">30 días</div><p>es el plazo legal de pago desde 2019 (Ley 21.131). Más de la mitad de las empresas igual tiene facturas pendientes.</p></div>
    </div>
    <p class="src">Fuentes: Diario Estrategia (2024 y 28 de marzo de 2025), con datos del informe de comportamiento de pago de CobranzaOnline, Duemint y Sheriff; Ley 21.131.</p>
  </div>
</section>

<!-- PLANES -->
<section id="planes" class="band-sky">
  <div class="wrap">
    <div class="sec-head reveal">
      <div class="kicker">Planes</div>
      <h2>¿Cobras tú o cobramos nosotros?</h2>
      <p class="lead">Elige cuánto quieres delegar. Puedes partir con uno y cambiarte cuando lo necesites.</p>
    </div>
    <div class="plans">
      <article class="plan plan-basic reveal">
        <div class="plan-top">
          <span class="plan-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4M7 9h6M7 12h10"/></svg>
          </span>
          <div><span class="plan-name">Cleco Básico</span><span class="plan-type">Software</span></div>
        </div>
        <h3>Tú cobras.<br>Cleco te ordena.</h3>
        <p class="plan-for">Para empresas con su propio equipo de cobranza que quieren dejar de hacerlo a mano.</p>
        <ul class="checks">
          <li>Recordatorios automáticos por correo y SMS</li>
          <li>Todos tus datos de cobranza en un solo lugar</li>
          <li>Portal con el estado de cada factura</li>
        </ul>
        <p class="plan-price"><span>Cómo se paga</span>Plan mensual según el tamaño de tu cartera.</p>
      </article>
      <article class="plan plan-360 reveal">
        <span class="plan-badge">Más completo</span>
        <div class="plan-top">
          <span class="plan-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c.8-3 3-4.6 5.5-4.6s4.7 1.6 5.5 4.6"/><path d="M15 5.5l5 0M17.5 3v5"/><path d="M16 12.5c1.9.4 3.6 2 4.3 4.5"/></svg>
          </span>
          <div><span class="plan-name">Cleco 360</span><span class="plan-type">Software + equipo Cleco</span></div>
        </div>
        <h3>Cleco cobra por ti.<br>De la emisión a la mora.</h3>
        <p class="plan-for">Para empresas que quieren delegar la cobranza completa y cuidar la relación con sus clientes.</p>
        <ul class="checks">
          <li>Todo lo de Cleco Básico</li>
          <li><b>Cobranza preventiva:</b> confirmamos la fecha de pago antes de que venza</li>
          <li><b>Cobranza morosa:</b> un mediador negocia las facturas difíciles</li>
          <li>Escalamiento solo con tu autorización</li>
        </ul>
        <p class="plan-price"><span>Cómo se paga</span>Comisión por factura gestionada: baja si aún no vence, mayor según los días de mora y el monto.</p>
      </article>
    </div>
    <div class="who reveal" role="table" aria-label="Quién hace cada tarea en cada plan">
      <div class="who-row who-head" role="row"><span role="columnheader">¿Quién lo hace?</span><span role="columnheader">Básico</span><span role="columnheader">360</span></div>
      <div class="who-row" role="row"><span role="cell">Recordar antes y después del vencimiento</span><span role="cell" class="c-auto">Cleco, automático</span><span role="cell" class="c-us">Cleco</span></div>
      <div class="who-row" role="row"><span role="cell">Llamar cuando no responden</span><span role="cell" class="c-you">Tu equipo</span><span role="cell" class="c-us">Cleco</span></div>
      <div class="who-row" role="row"><span role="cell">Negociar facturas morosas y planes de pago</span><span role="cell" class="c-you">Tu equipo</span><span role="cell" class="c-us">Cleco, tú apruebas</span></div>
      <div class="who-row" role="row"><span role="cell">Coordinar con tu equipo comercial</span><span role="cell" class="c-you">Tu equipo</span><span role="cell" class="c-us">Cleco</span></div>
    </div>
    <div class="price-foot reveal">
      <p style="color:var(--ink-2);max-width:60ch">¿No sabes cuál te conviene? En el diagnóstico gratuito te recomendamos el plan y te damos el valor exacto para tu cartera.</p>
      <a class="btn btn-primary" href="#diagnostico">Pedir diagnóstico</a>
    </div>
  </div>
</section>

<!-- COMO FUNCIONA -->
<section id="como-funciona">
  <div class="wrap">
    <div class="sec-head reveal">
      <div class="kicker">Cómo funciona Cleco 360</div>
      <h2>Un método, no una planilla y buena voluntad.</h2>
      <p class="lead">Es el mismo proceso con el que cobramos hoy, convertido en reglas claras para cada factura. Cleco Básico automatiza los pasos 1 a 3.</p>
    </div>
    <div class="steps stagger">
      <div class="step"><span class="num"></span><h3>Nos compartes tu cartera</h3><p>Cada semana, en Excel o exportada de tu ERP. Detectamos qué facturas son nuevas, cuáles se pagaron y cuáles se anularon.</p></div>
      <div class="step"><span class="num"></span><h3>Recordamos antes de que venza</h3><p>Una semana después de emitida o una antes de vencer, confirmamos con tu cliente la fecha de pago.</p></div>
      <div class="step"><span class="num"></span><h3>Seguimiento con calma</h3><p>Un correo por semana. Si tu cliente compromete una fecha, no insistimos hasta que pase.</p></div>
      <div class="step"><span class="num"></span><h3>Destrabamos el pago</h3><p>¿Pide el PDF, los datos de pago o hay un problema con el servicio? Lo resolvemos o lo derivamos a tu ejecutivo.</p></div>
      <div class="step"><span class="num"></span><h3>Escalamos solo si hace falta</h3><p>Llamado, apoyo de tu equipo comercial y, si tú lo autorizas, las medidas de último recurso.</p></div>
    </div>
    <div class="rule reveal"><span style="font-size:22px;line-height:1">↗</span><p><b>La regla de oro:</b> no insistir antes de tiempo, pero no dejar pasar nunca una fecha comprometida. Cada gestión queda registrada, con su próxima revisión.</p></div>
  </div>
</section>

<!-- ESCALERA -->
<section id="escalera" class="band-ink">
  <div class="wrap ladder-grid">
    <div class="ladder-note">
      <div class="kicker" style="color:#8DB8FF">Escalamiento · Cleco 360</div>
      <h2>Subimos de a un escalón. Y avisamos antes de cada uno.</h2>
      <p class="lead">La mayoría de las facturas se resuelve en los primeros pasos. Las decisiones que pueden afectar la relación con tu cliente siempre las tomas tú.</p>
      <ul>
        <li>Planes de pago: los evaluamos y te los presentamos; tú apruebas.</li>
        <li>DICOM: solo como último recurso y con tu autorización.</li>
        <li>Cobranza judicial: no la hacemos. Si llega a esa etapa, pasa a tu área legal o abogado.</li>
      </ul>
    </div>
    <div class="ladder" role="list" aria-label="Etapas de cobranza">
      <div class="rung" role="listitem"><span class="lvl">1</span><div><h3>Correos de cobranza</h3><p>Uno por semana, respetando las fechas que comprometa tu cliente.</p></div></div>
      <div class="rung" role="listitem"><span class="lvl">2</span><div><h3>Llamado y tu ejecutivo de ventas</h3><p>Tras 3 o 4 correos sin respuesta ni pago.</p></div></div>
      <div class="rung" role="listitem"><span class="lvl">3</span><div><h3>Aviso formal</h3><p>Le informamos al cliente que la deuda podría publicarse.</p></div></div>
      <div class="rung" role="listitem"><span class="lvl">4</span><div><h3>Publicación en DICOM <span class="you">Tú decides</span></h3><p>Solo si la autorizas, cuando no hubo respuesta a nada de lo anterior.</p></div></div>
      <div class="rung" role="listitem"><span class="lvl">5</span><div><h3>Seguimos negociando</h3><p>Aun publicada, buscamos un acuerdo de pago.</p></div></div>
      <div class="rung ext" role="listitem"><span class="lvl">6</span><div><h3>Cobranza judicial <span class="you">Tú decides</span></h3><p>Sale de Cleco y la toma tu área legal.</p></div></div>
    </div>
  </div>
</section>

<!-- PORTAL -->
<section>
  <div class="wrap portal-grid">
    <div>
      <div class="shot reveal"><picture><source media="(max-width:640px)" srcset="/landing/panel-movil.jpg"><img src="/landing/panel.jpg" alt="Panel del portal Cleco: score de cartera, facturas en gestión y lista de qué hacer hoy" loading="lazy"></picture></div>
      <p class="shot-cap">Portal Cleco con datos de prueba. Versión en desarrollo.<span class="swipe"> Desliza para ver más →</span></p>
    </div>
    <div class="feat stagger">
      <div class="kicker">Tu portal · en ambos planes</div>
      <h2 style="font-size:clamp(30px,3.6vw,44px)">Ves todo. Sin cajas negras.</h2>
      <div><h3>Qué hacer hoy</h3><p>Cada factura ordenada por prioridad: a quién contactar hoy y cuáles hay que escalar o negociar.</p></div>
      <div><h3>Salud de tu cartera</h3><p>Un puntaje de 0 a 100, cuántas facturas están en gestión, cuántas vencidas y cuánto suman.</p></div>
      <div><h3>Cada gestión registrada</h3><p>Qué se le escribió a tu cliente, qué respondió y cuándo es la próxima revisión.</p></div>
    </div>
  </div>
</section>

<!-- COMPARATIVA -->
<section>
  <div class="wrap">
    <div class="sec-head reveal">
      <div class="kicker">Por qué Cleco</div>
      <h2>Lo mejor de ordenar y de negociar, en un solo lugar.</h2>
      <p class="lead">El software de gestión recuerda, pero no negocia. La cobranza tradicional negocia, pero llega tarde y presiona. Cleco hace las dos cosas.</p>
    </div>
    <div class="tbl-wrap reveal">
      <table>
        <thead><tr><th></th><th>Planilla y correo propio</th><th>Software de recordatorios</th><th>Cobranza tradicional</th><th class="us">Cleco</th></tr></thead>
        <tbody>
          <tr><td>Gestiona desde la emisión</td><td class="nn">A veces</td><td class="y">Sí</td><td class="nn">No, llega con la mora</td><td class="us y">Sí</td></tr>
          <tr><td>Alguien negocia las difíciles</td><td class="nn">Tu equipo, si tiene tiempo</td><td class="nn">No</td><td class="y">Sí</td><td class="us y">Sí, con Cleco 360</td></tr>
          <tr><td>Cuida la relación con tu cliente</td><td class="nn">Depende</td><td class="nn">—</td><td class="nn">Publica en DICOM a los pocos días</td><td class="us y">DICOM solo si tú lo autorizas</td></tr>
          <tr><td>Ves cada gestión</td><td class="nn">En tu correo</td><td class="y">Sí</td><td class="nn">Poco</td><td class="us y">Sí, en tu portal</td></tr>
          <tr><td>Cómo se cobra</td><td class="nn">Horas de tu equipo</td><td class="nn">Mensualidad</td><td class="nn">Comisión</td><td class="us">Básico: plan mensual · 360: comisión por factura gestionada</td></tr>
        </tbody>
      </table>
    </div>
    <div class="cmp-m stagger" aria-label="Comparación resumida">
      <div><h3>Gestiona desde la emisión</h3><p class="us-a">Cleco: sí, antes de que venza.</p><p>Cobranza tradicional: llega con la mora.</p></div>
      <div><h3>Alguien negocia las difíciles</h3><p class="us-a">Cleco 360: sí, con respeto.</p><p>Software de recordatorios: no.</p></div>
      <div><h3>Cuida la relación con tu cliente</h3><p class="us-a">Cleco: DICOM solo si tú lo autorizas.</p><p>Cobranza tradicional: publica en DICOM a los pocos días.</p></div>
      <div><h3>Ves cada gestión</h3><p class="us-a">Cleco: sí, en tu portal.</p><p>Planilla propia: repartida en el correo.</p></div>
      <div><h3>Cómo se cobra</h3><p class="us-a">Cleco: plan mensual (Básico) o comisión por factura gestionada (360).</p><p>Otros: solo mensualidad, solo comisión o las horas de tu equipo.</p></div>
    </div>
  </div>
</section>

<!-- NOSOTROS -->
<section id="nosotros" class="band-sky">
  <div class="wrap story">
    <div style="display:grid;gap:20px">
      <div class="kicker">Nosotros</div>
      <p class="quote">“Después de 6 años cobrando facturas aprendimos que <span class="blue">la mayoría se paga con un buen recordatorio</span>, y que las difíciles necesitan a una persona que negocie.”</p>
      <p class="lead">Cleco nació cobrando a mano para una de las empresas más grandes del país. Hoy convertimos esa experiencia en un sistema: tecnología para lo fácil y personas para lo difícil.</p>
    </div>
    <div class="team stagger">
      <div class="person"><img src="/landing/clemente-bn.jpg" alt="Clemente Icarán"><div><h3>Clemente Icarán</h3><p>Fundador · Operaciones. Más de 6 años en cobranza entre empresas.</p></div></div>
      <div class="person"><img src="/landing/benjamin-bn.jpg" alt="Benjamín Herrera"><div><h3>Benjamín Herrera</h3><p>Cofundador · Comercial y producto. Construye el portal Cleco.</p></div></div>
    </div>
  </div>
</section>

<!-- FAQ -->
<section id="preguntas">
  <div class="wrap">
    <div class="sec-head reveal"><div class="kicker">Preguntas frecuentes</div><h2>Lo que nos preguntan antes de empezar.</h2></div>
    <div class="faq stagger">
      <details><summary>¿Van a dañar la relación con mi cliente?</summary><p>No. Escribimos con tono profesional, una vez por semana, y respetamos cualquier fecha de pago que tu cliente comprometa. Las medidas más duras solo se aplican si tú las autorizas.</p></details>
      <details><summary>¿Publican a mis clientes en DICOM?</summary><p>Solo como último recurso y siempre con tu autorización, después de correos, llamados y un aviso previo al cliente.</p></details>
      <details><summary>¿Hacen cobranza judicial?</summary><p>No. Cleco es cobranza extrajudicial. Si una factura llega a esa etapa, la toma tu área legal o tu abogado, y sale de nuestra gestión.</p></details>
      <details><summary>¿Por qué canales contactan a mis clientes?</summary><p>Los recordatorios automáticos se envían por correo y SMS. En Cleco 360 también llamamos por teléfono cuando no hay respuesta y, si hace falta, coordinamos con tu ejecutivo de ventas, que conoce al cliente.</p></details>
      <details><summary>¿Qué necesito para empezar?</summary><p>Tu cartera de facturas por cobrar en Excel (o exportada de tu ERP) con los datos de contacto que tengas. Si falta alguno, lo buscamos nosotros.</p></details>
      <details><summary>¿Qué diferencia hay entre Cleco Básico y Cleco 360?</summary><p>Con Cleco Básico tu equipo sigue cobrando, pero con recordatorios automáticos por correo y SMS y toda la información en un solo lugar. Con Cleco 360 nos hacemos cargo nosotros: cobranza preventiva antes del vencimiento y negociación de las facturas morosas.</p></details>
      <details><summary>¿Cuánto cuesta?</summary><p>Cleco Básico es un plan mensual según el tamaño de tu cartera. Cleco 360 cobra una comisión por cada factura que gestionamos, estén vencidas o no: es baja si la factura aún no vence y aumenta según los días de mora y el monto. En el diagnóstico te damos el valor exacto.</p></details>
      <details><summary>¿Quién aprueba un plan de pago?</summary><p>Tú. Nosotros evaluamos si la propuesta del cliente es viable y te la presentamos con nuestra recomendación.</p></details>
    </div>
  </div>
</section>

<!-- CTA -->
<section id="diagnostico" class="band-ink">
  <div class="wrap cta-grid">
    <div>
      <div class="kicker" style="color:#8DB8FF">Diagnóstico gratis</div>
      <h2 style="margin-top:16px">¿Tienes facturas que no se mueven?</h2>
      <p class="lead" style="margin-top:18px">Cuéntanos de tu cartera y en menos de 24 horas hábiles te decimos cuánto podrías recuperar y cómo.</p>
      <div class="need">
        <div><span>1</span><p>Cuántas facturas vencidas tienes, aproximadamente.</p></div>
        <div><span>2</span><p>El monto total y hace cuánto vencieron.</p></div>
        <div><span>3</span><p>Te respondemos con un plan para tu caso. Sin compromiso.</p></div>
      </div>
      <p style="margin-top:28px;color:#AEB8CA;font-size:15px">¿Prefieres escribirnos? <b style="color:#fff">contacto@cleco.cl</b></p>
    </div>
    <form id="lead" novalidate>
      <div class="row">
        <label for="f-nombre">Nombre<input id="f-nombre" name="nombre" autocomplete="name" required></label>
        <label for="f-empresa">Empresa<input id="f-empresa" name="empresa" autocomplete="organization" required></label>
      </div>
      <div class="row">
        <label for="f-correo">Correo<input id="f-correo" name="correo" type="email" autocomplete="email" required></label>
        <label for="f-tel">Teléfono<input id="f-tel" name="telefono" type="tel" autocomplete="tel"></label>
      </div>
      <div class="row">
        <label for="f-facturas">Facturas vencidas<select id="f-facturas" name="facturas"><option>Menos de 10</option><option>10 a 50</option><option>50 a 200</option><option>Más de 200</option></select></label>
        <label for="f-monto">Monto aproximado<select id="f-monto" name="monto"><option>Menos de $5 MM</option><option>$5 a $50 MM</option><option>$50 a $200 MM</option><option>Más de $200 MM</option></select></label>
      </div>
      <label for="f-plan">Plan que te interesa<select id="f-plan" name="plan"><option>Todavía no sé</option><option>Cleco Básico</option><option>Cleco 360</option></select></label>
      <label for="f-msg">¿Algo que debamos saber?<textarea id="f-msg" name="mensaje" placeholder="Por ejemplo: tenemos un cliente grande con tres facturas atrasadas."></textarea></label>
      <button class="btn btn-primary" type="submit" style="justify-content:center">Pedir diagnóstico gratis</button>
      <p class="form-note">Usamos tus datos solo para responderte.</p>
      <div class="sent" id="sent" role="status">¡Listo! Te escribimos en menos de 24 horas hábiles.</div>
    </form>
  </div>
</section>

</main>
<div class="mcta" id="mcta"><a class="btn btn-primary" href="#diagnostico">Pide tu diagnóstico gratis</a></div>

<footer>
  <div class="wrap">
    <img src="/landing/logo-white.png" alt="cleCo">
    <span>Cobranza que no duele · Santiago, Chile · <a href="mailto:contacto@cleco.cl">contacto@cleco.cl</a></span>
    <span><a href="/auth/login">Portal de clientes</a> · <a href="/nosotros">Nosotros</a></span>
  </div>
</footer>


`;

export default function NewLanding() {
  useEffect(() => {
var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js');
  // aparición al hacer scroll
  var els = document.querySelectorAll('.reveal,.stagger,.ladder,.res-main');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, {rootMargin:'0px 0px -12% 0px', threshold:0.08});
    els.forEach(function(el){ io.observe(el); });
  } else { els.forEach(function(el){ el.classList.add('in'); }); }
  // contadores
  function fmt(v, el){
    var dec = +(el.dataset.dec||0);
    var s = dec ? v.toFixed(dec).replace('.', ',') : Math.round(v).toLocaleString('es-CL');
    return (el.dataset.prefix||'') + s + (el.dataset.suffix||'');
  }
  var nums = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window && !reduce) {
    var nio = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (!e.isIntersecting) return; nio.unobserve(e.target);
        var el = e.target, to = parseFloat(el.dataset.count), t0 = performance.now(), dur = 1300;
        (function step(t){ var p = Math.min(1,(t-t0)/dur), k = 1-Math.pow(1-p,3); el.textContent = fmt(to*k, el); if (p<1) requestAnimationFrame(step); })(t0);
      });
    }, {threshold:0.4});
    nums.forEach(function(n){ nio.observe(n); });
  }
  // factura en vivo: tres casos en bucle
  var S = [
    {num:'Factura N° 48.213', amt:2480000, meta:'Empresa Ejemplo SpA · vence el 30 oct', late:false, fill:[18,38,55,62],
     steps:[['Recordatorio antes del vencimiento','23 oct'],['Cliente confirma fecha de pago: 6 nov','24 oct'],['No insistimos hasta esa fecha','—'],['Pago recibido','6 nov']],
     chip:'● Pagada sin llegar a mora', toast:'Pago recibido'},
    {num:'Factura N° 47.902', amt:860000, meta:'Comercial Demo Ltda. · vence el 15 oct', late:false, fill:[30,45,52,58],
     steps:[['Pide la factura en PDF','16 oct'],['Le enviamos el PDF y los datos de pago','16 oct'],['Seguimiento a la semana','23 oct'],['Pago recibido','24 oct']],
     chip:'● Pagada a los 9 días de vencida', toast:'Pago recibido'},
    {num:'Factura N° 45.110', amt:5260000, meta:'Servicios Muestra SpA · vencida hace 38 días', late:true, fill:[60,72,84,92],
     steps:[['3 correos sin respuesta: llamado','2 oct',1],['Propone pagar en 2 cuotas','4 oct'],['Apruebas el plan de pago','5 oct'],['Primera cuota recibida','20 oct']],
     chip:'● Plan de pago en curso', toast:'Cuota recibida'}
  ];
  var $ = function(id){ return document.getElementById(id); };
  var live = $('live');
  function money(n){ return '$' + Math.round(n).toLocaleString('es-CL'); }
  function countTo(el, to, dur){ var t0 = performance.now(); (function s(t){ var p = Math.min(1,(t-t0)/dur), k = 1-Math.pow(1-p,3); el.textContent = money(to*k); if (p<1) requestAnimationFrame(s); })(t0); }
  function render(c, i, animate){
    $('lv-num').textContent = c.num; $('lv-meta').textContent = c.meta; $('lv-step').textContent = (i+1) + ' / ' + S.length;
    var fill = $('lv-fill'); fill.classList.toggle('late', c.late);
    var ol = $('lv-steps'); ol.innerHTML = ''; var chip = $('lv-chip'); chip.textContent = c.chip; chip.classList.remove('on');
    chip.className = 'chip ' + (c.late ? 'warn' : 'ok');
    var toast = $('lv-toast'); toast.classList.remove('on');
    if (!animate){ $('lv-amt').textContent = money(c.amt); fill.style.width = c.fill[3]+'%';
      c.steps.forEach(function(s){ ol.insertAdjacentHTML('beforeend', '<li class="'+(s[2]?'warn':'')+'"><span class="d">✓</span><span>'+s[0]+'</span><span class="t">'+s[1]+'</span></li>'); }); chip.classList.add('on'); return 0; }
    countTo($('lv-amt'), c.amt, 900); fill.style.width = '6%';
    c.steps.forEach(function(s, k){
      setTimeout(function(){
        ol.insertAdjacentHTML('beforeend', '<li class="'+(s[2]?'warn':'')+'"><span class="d">✓</span><span>'+s[0]+'</span><span class="t">'+s[1]+'</span></li>');
        fill.style.width = c.fill[k] + '%';
        if (k === c.steps.length-1) setTimeout(function(){
          chip.classList.add('on');
          $('lv-toast-t').textContent = c.toast; $('lv-toast-s').textContent = money(c.late ? c.amt/2 : c.amt) + ' · ' + c.meta.split(' · ')[0];
          toast.classList.add('on'); bumpWeek(c);
        }, 500);
      }, 700 + k*900);
    });
    return 700 + c.steps.length*900 + 2600;
  }
  var wk = [48,17,12];
  function bumpWeek(c){ wk[0]+=2; wk[1]+=1; wk[2]+= c.late?0:1; ['wk1','wk2','wk3'].forEach(function(id,j){ var el=$(id); el.textContent = wk[j]; el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }); }
  if (live){
    if (reduce){ render(S[0], 0, false); }
    else {
      var idx = 0, card = live.querySelector('.live-card');
      render(S[0], 0, false);
      function loop(){
        var wait = render(S[idx], idx, true);
        setTimeout(function(){ card.classList.add('swap'); $('lv-toast').classList.remove('on');
          setTimeout(function(){ card.classList.remove('swap'); idx = (idx+1) % S.length; loop(); }, 450); }, wait);
      }
      setTimeout(function(){ card.classList.add('swap'); setTimeout(function(){ card.classList.remove('swap'); idx = 1; loop(); }, 450); }, 2200);
    }
  }
  // barra de progreso y CTA móvil
  var prog = document.getElementById('prog'), mcta = document.getElementById('mcta'), hero = document.querySelector('.hero'), form = document.getElementById('diagnostico');
  var ticking = false;
  function onScroll(){
    ticking = false;
    var d = document.documentElement, max = d.scrollHeight - innerHeight;
    if (prog) prog.style.transform = 'scaleX(' + (max>0 ? scrollY/max : 0) + ')';
    if (mcta && hero && form) {
      var pastHero = scrollY > hero.offsetTop + hero.offsetHeight - 80;
      var atForm = form.getBoundingClientRect().top < innerHeight * 0.9;
      mcta.classList.toggle('show', pastHero && !atForm);
    }
  }
  addEventListener('scroll', function(){ if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, {passive:true});
  onScroll();


    // formulario de diagnóstico: mismo envío que la landing anterior
    var form = document.getElementById("lead");
    if (form) form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = Object.fromEntries(new FormData(form).entries());
      var btn = form.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.textContent = "Enviando…"; }
      fetch("https://formsubmit.co/ajax/contacto@cleco.cl", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(Object.assign({}, data, { _subject: "Diagnóstico gratis desde cleco.cl", _captcha: "false" })),
      }).catch(function () {}).finally(function () {
        if (btn) { btn.textContent = "Enviado"; }
        var ok = document.getElementById("sent"); if (ok) ok.style.display = "block";
      });
    });
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div dangerouslySetInnerHTML={{ __html: HTML }} />
    </>
  );
}
