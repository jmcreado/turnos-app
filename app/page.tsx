import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tornu — Gestión de turnos simple",
  description:
    "Compartí un link, tus clientes eligen horario. Sin cuentas, sin fricciones.",
};

export default function LandingPage() {
  return (
    <div>
      <style>{`
        :root {
          --ink: #1a1a1a;
          --ink-soft: #666;
          --cream: #f7f5f0;
          --green: #1a6b4a;
          --green-light: #e8f2ed;
          --serif: 'Georgia', serif;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', system-ui, sans-serif; background: var(--cream); color: var(--ink); }
        a { color: inherit; }
        nav { display: flex; justify-content: space-between; align-items: center; padding: 20px 40px; border-bottom: 1px solid rgba(0,0,0,0.06); }
        .logo { font-family: var(--serif); font-size: 22px; font-weight: 600; text-decoration: none; color: var(--ink); }
        .logo span { color: var(--green); }
        nav ul { list-style: none; display: flex; gap: 28px; align-items: center; }
        nav ul a { text-decoration: none; font-size: 14px; color: var(--ink-soft); }
        .nav-cta { background: var(--green); color: white !important; padding: 8px 18px; border-radius: 100px; font-size: 14px !important; font-weight: 500; }
        .hero { max-width: 720px; margin: 0 auto; padding: 80px 40px 60px; text-align: center; }
        .hero-label { display: inline-block; background: var(--green-light); color: var(--green); font-size: 13px; font-weight: 500; padding: 4px 14px; border-radius: 100px; margin-bottom: 24px; }
        h1 { font-family: var(--serif); font-size: clamp(40px, 6vw, 68px); letter-spacing: -1.5px; line-height: 1.05; margin-bottom: 20px; }
        h1 em { color: var(--green); font-style: italic; }
        .hero-p { font-size: 18px; color: var(--ink-soft); font-weight: 300; line-height: 1.6; margin-bottom: 36px; }
        .hero-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
        .btn-primary { background: var(--green); color: white; padding: 14px 28px; border-radius: 100px; text-decoration: none; font-size: 15px; font-weight: 500; }
        .btn-primary:hover { opacity: 0.9; }
        .btn-secondary { background: white; color: var(--ink); padding: 14px 28px; border-radius: 100px; text-decoration: none; font-size: 15px; border: 1px solid rgba(0,0,0,0.1); }
        .steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 24px; margin: 64px auto 0; max-width: 900px; padding: 0 40px; }
        .step { text-align: left; }
        .step-num { font-size: 12px; font-weight: 600; color: var(--green); letter-spacing: 2px; margin-bottom: 10px; }
        .step h3 { font-size: 16px; font-weight: 600; margin-bottom: 6px; }
        .step p { font-size: 14px; color: var(--ink-soft); line-height: 1.5; }
        .features { max-width: 900px; margin: 80px auto; padding: 0 40px; display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }
        .feature { display: flex; gap: 14px; background: white; border-radius: 16px; padding: 20px; border: 1px solid rgba(0,0,0,0.06); }
        .fi { font-size: 20px; flex-shrink: 0; margin-top: 2px; }
        .feature h3 { font-size: 15px; font-weight: 500; margin-bottom: 4px; }
        .feature p { font-size: 13px; color: var(--ink-soft); line-height: 1.5; }
        .cta-final { background: var(--ink); color: #f7f5f0; padding: 80px 40px; text-align: center; }
        .cta-final h2 { font-family: var(--serif); font-size: clamp(36px,5vw,60px); letter-spacing: -1px; line-height: 1.1; margin-bottom: 16px; }
        .cta-final h2 em { color: #7dd3a8; font-style: italic; }
        .cta-final p { font-size: 17px; color: rgba(247,245,240,0.6); font-weight: 300; margin-bottom: 32px; }
        .btn-white { background: white; color: var(--ink); padding: 14px 32px; border-radius: 100px; text-decoration: none; font-size: 15px; font-weight: 500; display: inline-block; }
        .btn-white:hover { background: #7dd3a8; }
        footer { padding: 32px 40px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(0,0,0,0.06); font-size: 13px; color: #9a9a9a; flex-wrap: wrap; gap: 12px; }
        .footer-logo { font-family: var(--serif); font-size: 18px; color: var(--ink); text-decoration: none; }
      `}</style>

      <nav>
        <a href="/" className="logo">Tor<span>nu</span></a>
        <ul>
          <li><a href="#como">Cómo funciona</a></li>
          <li><a href="#features">Features</a></li>
          <li><a href="/login" className="nav-cta">Empezar gratis</a></li>
        </ul>
      </nav>

      <div className="hero">
        <span className="hero-label">Gestión de turnos simple</span>
        <h1>Tu agenda, <em>sin</em> el caos</h1>
        <p className="hero-p">Compartí un link, tus clientes eligen horario. Vos configurás, ellos reservan, y nadie se olvida.</p>
        <div className="hero-actions">
          <a href="/login" className="btn-primary">Crear mi cuenta gratis</a>
          <a href="#como" className="btn-secondary">Ver cómo funciona →</a>
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
