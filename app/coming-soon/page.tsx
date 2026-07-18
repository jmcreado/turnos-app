import type { Metadata } from "next";
import { WaitlistForm } from "./WaitlistForm";

export const metadata: Metadata = {
  title: "Tornu — Próximamente",
  description:
    "Una nueva forma de gestionar tus turnos está en camino. Dejá tu email y sé de los primeros en probarla.",
  robots: { index: true, follow: false },
};

export default function ComingSoonPage() {
  return (
    <div className="cs-root">
      <style>{`
        .cs-root {
          --cs-bg: #0a0a0a;
          --cs-ink: #f5f5f4;
          --cs-muted: #8b8b88;
          --cs-faint: #55554f;
          --cs-accent: #8ef0b8;
          --cs-border: rgba(255,255,255,0.09);
          --cs-input-bg: rgba(255,255,255,0.04);

          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          background: var(--cs-bg);
          color: var(--cs-ink);
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          position: relative;
          overflow: hidden;
        }
        .cs-root::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 60% 45% at 50% -8%, rgba(142,240,184,0.14), transparent 65%),
            radial-gradient(ellipse 45% 35% at 82% 110%, rgba(142,240,184,0.06), transparent 60%);
          pointer-events: none;
        }
        .cs-root::after {
          content: "";
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 72px 72px;
          mask-image: radial-gradient(ellipse 70% 60% at 50% 20%, black 30%, transparent 75%);
          pointer-events: none;
        }
        .cs-root > * { position: relative; z-index: 1; }

        .cs-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 22px 28px;
        }
        .cs-logo {
          font-family: Georgia, serif;
          font-size: 21px;
          font-weight: 600;
          letter-spacing: -0.3px;
          text-decoration: none;
          color: var(--cs-ink);
        }
        .cs-logo span { color: var(--cs-accent); }
        .cs-nav-tag {
          font-size: 12.5px;
          color: var(--cs-muted);
          border: 1px solid var(--cs-border);
          padding: 6px 14px;
          border-radius: 100px;
        }

        .cs-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 48px 24px 80px;
        }
        .cs-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 500;
          color: var(--cs-accent);
          background: rgba(142,240,184,0.08);
          border: 1px solid rgba(142,240,184,0.22);
          padding: 6px 16px;
          border-radius: 100px;
          margin-bottom: 28px;
        }
        .cs-badge-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--cs-accent);
          animation: cs-pulse 2s ease-in-out infinite;
        }
        @keyframes cs-pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(142,240,184,0.5); }
          50% { opacity: 0.6; box-shadow: 0 0 0 5px rgba(142,240,184,0); }
        }

        .cs-main h1 {
          font-size: clamp(38px, 7.5vw, 72px);
          font-weight: 600;
          letter-spacing: -0.035em;
          line-height: 1.05;
          max-width: 780px;
          margin: 0 0 22px;
        }
        .cs-main h1 em {
          font-style: normal;
          background: linear-gradient(120deg, #8ef0b8 0%, #d6ffe9 55%, #8ef0b8 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .cs-sub {
          font-size: 17px;
          font-weight: 300;
          color: var(--cs-muted);
          line-height: 1.65;
          max-width: 520px;
          margin: 0 auto 40px;
        }
        .cs-sub strong { color: var(--cs-ink); font-weight: 500; }

        .wl-form { width: 100%; max-width: 440px; margin: 0 auto; }
        .wl-row {
          display: flex;
          gap: 8px;
          padding: 6px;
          background: var(--cs-input-bg);
          border: 1px solid var(--cs-border);
          border-radius: 14px;
          backdrop-filter: blur(8px);
          transition: border-color 0.15s;
        }
        .wl-row:focus-within { border-color: rgba(142,240,184,0.4); }
        .wl-row input {
          flex: 1;
          min-width: 0;
          background: transparent;
          border: none;
          outline: none;
          color: var(--cs-ink);
          font-size: 15px;
          font-family: inherit;
          padding: 12px 14px;
        }
        .wl-row input::placeholder { color: var(--cs-faint); }
        .wl-row button {
          background: var(--cs-ink);
          color: #0a0a0a;
          border: none;
          border-radius: 10px;
          padding: 12px 22px;
          font-size: 14.5px;
          font-weight: 500;
          font-family: inherit;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.15s;
        }
        .wl-row button:hover:not(:disabled) { background: var(--cs-accent); }
        .wl-row button:disabled { opacity: 0.6; cursor: default; }
        .wl-hint { font-size: 12.5px; color: var(--cs-faint); margin-top: 14px; }
        .wl-error { font-size: 13.5px; color: #f0a08e; margin-top: 12px; }
        .wl-success {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 15px;
          color: var(--cs-ink);
          background: rgba(142,240,184,0.08);
          border: 1px solid rgba(142,240,184,0.25);
          padding: 14px 22px;
          border-radius: 14px;
        }
        .wl-check { color: var(--cs-accent); font-weight: 600; }

        .cs-points {
          display: flex;
          gap: 10px 28px;
          justify-content: center;
          flex-wrap: wrap;
          margin-top: 52px;
        }
        .cs-point {
          font-size: 13.5px;
          color: var(--cs-muted);
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .cs-point::before {
          content: "";
          width: 4px; height: 4px;
          border-radius: 50%;
          background: var(--cs-accent);
          opacity: 0.7;
        }

        .cs-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 22px 28px;
          border-top: 1px solid var(--cs-border);
          font-size: 12.5px;
          color: var(--cs-faint);
          flex-wrap: wrap;
          gap: 8px;
        }

        @media (max-width: 560px) {
          .cs-nav { padding: 18px 20px; }
          .cs-main { padding: 32px 20px 64px; }
          .wl-row { flex-direction: column; padding: 8px; }
          .wl-row button { padding: 13px; }
          .cs-points { margin-top: 40px; flex-direction: column; align-items: center; }
          .cs-footer { justify-content: center; text-align: center; }
        }
      `}</style>

      <nav className="cs-nav">
        <a href="/" className="cs-logo">Tor<span>nu</span></a>
        <span className="cs-nav-tag">Acceso anticipado</span>
      </nav>

      <main className="cs-main">
        <span className="cs-badge">
          <span className="cs-badge-dot" />
          Próximamente
        </span>
        <h1>
          Una nueva forma de<br />gestionar tus <em>turnos</em>
        </h1>
        <p className="cs-sub">
          Compartís un link, tus clientes eligen horario y reciben
          recordatorios automáticos. <strong>Sin planillas, sin ida y vuelta
          por WhatsApp.</strong> Estamos terminando los últimos detalles.
        </p>

        <WaitlistForm />

        <div className="cs-points">
          <span className="cs-point">Para profesionales independientes</span>
          <span className="cs-point">Sin registro para tus clientes</span>
          <span className="cs-point">Hecho en Argentina</span>
        </div>
      </main>

      <footer className="cs-footer">
        <span>© 2026 Tornu</span>
        <span>Hecho en Argentina 🇦🇷</span>
      </footer>
    </div>
  );
}
