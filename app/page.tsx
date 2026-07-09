import type { Metadata } from "next";
import { ThemeToggle } from "./components/ThemeToggle";

export const metadata: Metadata = {
  title: "Tornu — Gestión de turnos simple",
  description:
    "Compartí un link, tus clientes eligen horario. Sin cuentas, sin fricciones.",
};

const THEME_INIT_SCRIPT = `
  try {
    var saved = localStorage.getItem('tornu-theme');
    if (saved === 'dark' || saved === 'light') {
      document.documentElement.setAttribute('data-theme', saved);
    }
  } catch (e) {}
`;

export default function LandingPage() {
  return (
    <div>
      <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      <style>{`
        :root {
          --ink: #0f0f0f;
          --ink-soft: #5c5a53;
          --bg: #f7f5f0;
          --card-bg: #ffffff;
          --green: #1a6b4a;
          --green-light: #e8f2ed;
          --border: rgba(0,0,0,0.08);
          --on-accent: #ffffff;
          --footer-muted: #9a9a9a;
          --cta-bg: #1a1a1a;
          --cta-text: #f7f5f0;
          --cta-accent: #7dd3a8;
          --serif: 'Georgia', serif;
        }
        [data-theme="dark"] {
          --ink: #f2f1ec;
          --ink-soft: #a3a89f;
          --bg: #12160f;
          --card-bg: #1c211b;
          --green: #8ef0b8;
          --green-light: #24301f;
          --border: #2c322a;
          --on-accent: #12160f;
          --footer-muted: #7a807a;
          --cta-bg: #1c211b;
          --cta-text: #f2f1ec;
          --cta-accent: #8ef0b8;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', system-ui, sans-serif; background: var(--bg); color: var(--ink); transition: background 0.15s, color 0.15s; }
        a { color: inherit; }

        nav { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 18px 24px; border-bottom: 1px solid var(--border); }
        .logo { font-family: var(--serif); font-size: 20px; font-weight: 600; text-decoration: none; color: var(--ink); flex-shrink: 0; }
        .logo span { color: var(--green); }
        nav ul { list-style: none; display: flex; gap: 20px; align-items: center; }
        nav ul a { text-decoration: none; font-size: 14px; color: var(--ink-soft); white-space: nowrap; }
        .nav-links { display: flex; gap: 20px; }
        .theme-toggle { background: none; border: 1px solid var(--border); border-radius: 100px; width: 34px; height: 34px; font-size: 15px; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; line-height: 1; }
        .nav-cta { background: var(--green); color: var(--on-accent) !important; padding: 9px 16px; border-radius: 100px; font-size: 13px !important; font-weight: 500; white-space: nowrap; }

        .hero { max-width: 720px; margin: 0 auto; padding: 56px 24px 48px; text-align: center; }
        .hero-label { display: inline-block; background: var(--green-light); color: var(--green); font-size: 13px; font-weight: 500; padding: 4px 14px; border-radius: 100px; margin-bottom: 22px; }
        h1 { font-family: var(--serif); font-size: clamp(32px, 7vw, 60px); letter-spacing: -1px; line-height: 1.1; margin-bottom: 18px; }
        h1 em { color: var(--green); font-style: italic; }
        .hero-p { font-size: 16px; color: var(--ink-soft); font-weight: 300; line-height: 1.6; margin-bottom: 30px; max-width: 480px; margin-left: auto; margin-right: auto; }
        .hero-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
        .btn-primary { background: var(--green); color: var(--on-accent); padding: 14px 26px; border-radius: 100px; text-decoration: none; font-size: 15px; font-weight: 500; }
        .btn-primary:hover { opacity: 0.9; }
        .btn-secondary { background: var(--card-bg); color: var(--ink); padding: 14px 26px; border-radius: 100px; text-decoration: none; font-size: 15px; border: 1px solid var(--border); }

        .stats { display: flex; justify-content: center; gap: 28px; margin-top: 32px; padding-top: 20px; border-top: 1px solid var(--border); flex-wrap: wrap; }
        .stat { text-align: center; }
        .stat-val { font-size: 16px; font-weight: 500; }
        .stat-label { font-size: 10.5px; color: var(--footer-muted); }

        .steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 24px; margin: 56px auto 0; max-width: 900px; padding: 0 24px; }
        .step { text-align: left; }
        .step-num { font-size: 12px; font-weight: 600; color: var(--green); letter-spacing: 2px; margin-bottom: 10px; }
        .step h3 { font-size: 16px; font-weight: 600; margin-bottom: 6px; }
        .step p { font-size: 14px; color: var(--ink-soft); line-height: 1.5; }

        .features { max-width: 900px; margin: 64px auto; padding: 0 24px; display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; }
        .feature { display: flex; gap: 14px; background: var(--card-bg); border-radius: 16px; padding: 20px; border: 1px solid var(--border); }
        .fi { font-size: 20px; flex-shrink: 0; margin-top: 2px; }
        .feature h3 { font-size: 15px; font-weight: 500; margin-bottom: 4px; }
        .feature p { font-size: 13px; color: var(--ink-soft); line-height: 1.5; }

        .cta-final { background: var(--cta-bg); color: var(--cta-text); padding: 64px 24px; text-align: center; }
        .cta-final h2 { font-family: var(--serif); font-size: clamp(28px,6vw,52px); letter-spacing: -0.5px; line-height: 1.15; margin-bottom: 14px; }
        .cta-final h2 em { color: var(--cta-accent); font-style: italic; }
        .cta-final p { font-size: 16px; color: rgba(247,245,240,0.6); font-weight: 300; margin-bottom: 28px; }
        .btn-white { background: var(--cta-text); color: var(--cta-bg); padding: 14px 30px; border-radius: 100px; text-decoration: none; font-size: 15px; font-weight: 500; display: inline-block; }
        .btn-white:hover { background: var(--cta-accent); color: var(--cta-bg); }

        footer { padding: 28px 24px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); font-size: 13px; color: var(--footer-muted); flex-wrap: wrap; gap: 10px; }
        .footer-logo { font-family: var(--serif); font-size: 18px; color: var(--ink); text-decoration: none; }

        @media (max-width: 640px) {
          nav { padding: 14px 16px; }
          .nav-links { display: none; }
          .hero { padding: 40px 16px 36px; }
          .steps { margin-top: 44px; padding: 0 16px; }
          .features { margin: 48px auto; padding: 0 16px; }
          .cta-final { padding: 48px 16px; }
          footer { padding: 24px 16px; justify-content: center; text-align: center; }
        }
      `}</style>

      <nav>
        <a href="/" className="logo">Tor<span>nu</span></a>
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <ul className="nav-links">
            <li><a href="#como">Cómo funciona</a></li>
            <li><a href="#features">Features</a></li>
          </ul>
          <ThemeToggle />
          <a href="/login" className="nav-cta">Empezar gratis</a>
        </div>
      </nav>

      <div className="hero">
        <span className="hero-label">Para profesionales independientes</span>
        <h1>Dejá de perseguir turnos por <em>WhatsApp</em></h1>
        <p className="hero-p">Compartís un link, tus clientes eligen horario y reciben recordatorio automático. Vos no volvés a escribir &quot;¿confirmamos?&quot;.</p>
        <div className="hero-actions">
          <a href="/login" className="btn-primary">Crear mi cuenta gratis</a>
          <a href="#como" className="btn-secondary">Ver cómo funciona →</a>
        </div>

        <div className="stats">
          <div className="stat"><div className="stat-val">0%</div><div className="stat-label">comisión</div></div>
          <div className="stat"><div className="stat-val">5 min</div><div className="stat-label">para publicar tu link</div></div>
          <div className="stat"><div className="stat-val">🇦🇷</div><div className="stat-label">hecho en Argentina</div></div>
        </div>

        <div className="steps" id="como">
          <div className="step">
            <div className="step-num">01</div>
            <h3>Configurá tus servicios</h3>
            <p>Precio, duración y horarios disponibles. En minutos tenés tu perfil listo.</p>
          </div>
          <div className="step">
            <div className="step-num">02</div>
            <h3>Compartí tu link</h3>
            <p>Cada servicio tiene su link. Mandalo por donde quieras.</p>
          </div>
          <div className="step">
            <div className="step-num">03</div>
            <h3>Recibí tus turnos</h3>
            <p>Tus clientes reciben confirmación por email y un link para gestionar su reserva.</p>
          </div>
        </div>
      </div>

      <div className="features" id="features">
        <div className="feature">
          <span className="fi">📅</span>
          <div>
            <h3>Múltiples servicios</h3>
            <p>Cada uno con precio, duración y link propio.</p>
          </div>
        </div>
        <div className="feature">
          <span className="fi">📧</span>
          <div>
            <h3>Confirmación por email</h3>
            <p>El cliente recibe su turno por email con link para cancelar si lo necesita.</p>
          </div>
        </div>
        <div className="feature">
          <span className="fi">🔗</span>
          <div>
            <h3>Sin registro para clientes</h3>
            <p>Reservan con un link, sin cuenta ni contraseña.</p>
          </div>
        </div>
        <div className="feature">
          <span className="fi">📊</span>
          <div>
            <h3>Métricas por servicio</h3>
            <p>Clientes únicos, recurrentes y servicio más popular.</p>
          </div>
        </div>
        <div className="feature">
          <span className="fi">⚡</span>
          <div>
            <h3>Confirmación automática</h3>
            <p>Elegís si los turnos se confirman solos o con tu OK.</p>
          </div>
        </div>
        <div className="feature">
          <span className="fi">🗓️</span>
          <div>
            <h3>Disponibilidad flexible</h3>
            <p>Configurá tu semana una vez y los slots se generan automáticamente.</p>
          </div>
        </div>
      </div>

      <div className="cta-final">
        <h2>Empezá a recibir<br/>turnos <em>hoy</em></h2>
        <p>Sin tarjeta de crédito. En 5 minutos.</p>
        <a href="/login" className="btn-white">Crear mi cuenta gratis →</a>
      </div>

      <footer>
        <a href="/" className="footer-logo">Tornu</a>
        <span>© 2026 Tornu · Hecho en Argentina 🇦🇷</span>
        <span>Términos · Privacidad</span>
      </footer>
    </div>
  );
}
