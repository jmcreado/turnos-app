import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tornu — Gestión de turnos simple",
  description:
    "Compartí un link, tus clientes eligen horario. Sin cuentas, sin fricciones.",
};

export default function LandingPage() {
  return (
    <div className="tn-glow">
      <style>{`
        .lp-nav { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 20px 28px; border-bottom: 1px solid var(--tn-edge); }
        .lp-logo { font-family: Georgia, serif; font-size: 21px; font-weight: 600; letter-spacing: -0.3px; text-decoration: none; color: var(--tn-ink); flex-shrink: 0; }
        .lp-logo span { color: var(--tn-accent); }
        .lp-nav-links { list-style: none; display: flex; gap: 22px; align-items: center; margin: 0; padding: 0; }
        .lp-nav-links a { text-decoration: none; font-size: 14px; color: var(--tn-muted); transition: color 0.15s; }
        .lp-nav-links a:hover { color: var(--tn-ink); }
        .lp-nav-login { font-size: 14px; color: var(--tn-muted); text-decoration: none; white-space: nowrap; }
        .lp-nav-login:hover { color: var(--tn-ink); }
        .lp-nav-cta { background: var(--tn-ink); color: #0a0a0a !important; padding: 9px 18px; border-radius: 100px; font-size: 13.5px; font-weight: 500; white-space: nowrap; text-decoration: none; transition: background 0.15s; }
        .lp-nav-cta:hover { background: var(--tn-accent); }

        .lp-hero { max-width: 780px; margin: 0 auto; padding: 72px 24px 56px; text-align: center; }
        .lp-hero h1 { font-size: clamp(38px, 7vw, 68px); font-weight: 600; letter-spacing: -0.035em; line-height: 1.05; margin: 0 0 22px; }
        .lp-hero h1 em { font-style: normal; }
        .lp-hero-p { font-size: 17px; color: var(--tn-muted); font-weight: 300; line-height: 1.65; margin: 0 auto 36px; max-width: 500px; }
        .lp-hero-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

        .lp-stats { display: flex; justify-content: center; gap: 32px; margin-top: 48px; padding-top: 28px; border-top: 1px solid var(--tn-edge); flex-wrap: wrap; }
        .lp-stat { text-align: center; }
        .lp-stat-val { font-size: 17px; font-weight: 500; color: var(--tn-ink); }
        .lp-stat-label { font-size: 11px; color: var(--tn-faint); margin-top: 2px; }

        .lp-steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 64px auto 0; max-width: 940px; padding: 0 24px; }
        .lp-step { text-align: left; background: var(--tn-surface); border: 1px solid var(--tn-edge); border-radius: 16px; padding: 24px; }
        .lp-step-num { font-size: 12px; font-weight: 600; color: var(--tn-accent); letter-spacing: 2px; margin-bottom: 12px; }
        .lp-step h3 { font-size: 16px; font-weight: 600; margin: 0 0 6px; color: var(--tn-ink); }
        .lp-step p { font-size: 14px; color: var(--tn-muted); line-height: 1.55; margin: 0; }

        .lp-features { max-width: 940px; margin: 72px auto; padding: 0 24px; display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px; }
        .lp-feature { display: flex; gap: 14px; background: var(--tn-surface); border-radius: 16px; padding: 20px; border: 1px solid var(--tn-edge); transition: border-color 0.15s; }
        .lp-feature:hover { border-color: var(--tn-accent-border); }
        .lp-fi { font-size: 20px; flex-shrink: 0; margin-top: 2px; }
        .lp-feature h3 { font-size: 15px; font-weight: 500; margin: 0 0 4px; color: var(--tn-ink); }
        .lp-feature p { font-size: 13px; color: var(--tn-muted); line-height: 1.5; margin: 0; }

        .lp-cta-final { border-top: 1px solid var(--tn-edge); padding: 88px 24px; text-align: center; position: relative; overflow: hidden; }
        .lp-cta-final::before { content: ""; position: absolute; inset: 0; background: radial-gradient(ellipse 50% 60% at 50% 100%, rgba(142,240,184,0.1), transparent 65%); pointer-events: none; }
        .lp-cta-final > * { position: relative; }
        .lp-cta-final h2 { font-size: clamp(30px, 6vw, 54px); font-weight: 600; letter-spacing: -0.03em; line-height: 1.1; margin: 0 0 14px; }
        .lp-cta-final p { font-size: 16px; color: var(--tn-muted); font-weight: 300; margin: 0 0 32px; }

        .lp-footer { padding: 28px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--tn-edge); font-size: 12.5px; color: var(--tn-faint); flex-wrap: wrap; gap: 10px; }
        .lp-footer-logo { font-family: Georgia, serif; font-size: 17px; color: var(--tn-ink); text-decoration: none; }

        @media (max-width: 640px) {
          .lp-nav { padding: 16px 20px; }
          .lp-nav-links { display: none; }
          .lp-nav-login { display: none; }
          .lp-hero { padding: 48px 20px 40px; }
          .lp-steps { margin-top: 48px; padding: 0 20px; }
          .lp-features { margin: 56px auto; padding: 0 20px; }
          .lp-cta-final { padding: 64px 20px; }
          .lp-footer { justify-content: center; text-align: center; }
        }
      `}</style>

      <nav className="lp-nav">
        <a href="/" className="lp-logo">Tor<span>nu</span></a>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <ul className="lp-nav-links">
            <li><a href="#como">Cómo funciona</a></li>
            <li><a href="#features">Features</a></li>
          </ul>
          <a href="/login" className="lp-nav-login">Iniciar sesión</a>
          <a href="/login" className="lp-nav-cta">Empezar gratis</a>
        </div>
      </nav>

      <div className="lp-hero">
        <span className="tn-badge" style={{ marginBottom: "28px" }}>
          <span className="tn-badge-dot" />
          Para profesionales independientes
        </span>
        <h1>Dejá de perseguir turnos por <em className="tn-gradient">WhatsApp</em></h1>
        <p className="lp-hero-p">
          Compartís un link, tus clientes eligen horario y reciben recordatorio
          automático. Vos no volvés a escribir &quot;¿confirmamos?&quot;.
        </p>
        <div className="lp-hero-actions">
          <a href="/login" className="tn-btn-primary">Crear mi cuenta gratis</a>
          <a href="#como" className="tn-btn-ghost">Ver cómo funciona →</a>
        </div>

        <div className="lp-stats">
          <div className="lp-stat"><div className="lp-stat-val">0%</div><div className="lp-stat-label">comisión</div></div>
          <div className="lp-stat"><div className="lp-stat-val">5 min</div><div className="lp-stat-label">para publicar tu link</div></div>
          <div className="lp-stat"><div className="lp-stat-val">🇦🇷</div><div className="lp-stat-label">hecho en Argentina</div></div>
        </div>

        <div className="lp-steps" id="como">
          <div className="lp-step">
            <div className="lp-step-num">01</div>
            <h3>Configurá tus servicios</h3>
            <p>Precio, duración y horarios disponibles. En minutos tenés tu perfil listo.</p>
          </div>
          <div className="lp-step">
            <div className="lp-step-num">02</div>
            <h3>Compartí tu link</h3>
            <p>Cada servicio tiene su link. Mandalo por donde quieras.</p>
          </div>
          <div className="lp-step">
            <div className="lp-step-num">03</div>
            <h3>Recibí tus turnos</h3>
            <p>Tus clientes reciben confirmación por email y un link para gestionar su reserva.</p>
          </div>
        </div>
      </div>

      <div className="lp-features" id="features">
        <div className="lp-feature">
          <span className="lp-fi">📅</span>
          <div>
            <h3>Múltiples servicios</h3>
            <p>Cada uno con precio, duración y link propio.</p>
          </div>
        </div>
        <div className="lp-feature">
          <span className="lp-fi">📧</span>
          <div>
            <h3>Confirmación por email</h3>
            <p>El cliente recibe su turno por email con link para cancelar si lo necesita.</p>
          </div>
        </div>
        <div className="lp-feature">
          <span className="lp-fi">🔗</span>
          <div>
            <h3>Sin registro para clientes</h3>
            <p>Reservan con un link, sin cuenta ni contraseña.</p>
          </div>
        </div>
        <div className="lp-feature">
          <span className="lp-fi">📊</span>
          <div>
            <h3>Métricas por servicio</h3>
            <p>Clientes únicos, recurrentes y servicio más popular.</p>
          </div>
        </div>
        <div className="lp-feature">
          <span className="lp-fi">⚡</span>
          <div>
            <h3>Confirmación automática</h3>
            <p>Elegís si los turnos se confirman solos o con tu OK.</p>
          </div>
        </div>
        <div className="lp-feature">
          <span className="lp-fi">🗓️</span>
          <div>
            <h3>Disponibilidad flexible</h3>
            <p>Configurá tu semana una vez y los slots se generan automáticamente.</p>
          </div>
        </div>
      </div>

      <div className="lp-cta-final">
        <h2>Empezá a recibir<br />turnos <em className="tn-gradient" style={{ fontStyle: "normal" }}>hoy</em></h2>
        <p>Sin tarjeta de crédito. En 5 minutos.</p>
        <a href="/login" className="tn-btn-primary">Crear mi cuenta gratis →</a>
      </div>

      <footer className="lp-footer">
        <a href="/" className="lp-footer-logo">Tornu</a>
        <span>© 2026 Tornu · Hecho en Argentina 🇦🇷</span>
        <span>Términos · Privacidad</span>
      </footer>
    </div>
  );
}
