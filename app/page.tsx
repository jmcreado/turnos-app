import Link from "next/link";

export default function Home() {
  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: "#f7f5f0", minHeight: "100vh", color: "#0f0f0f" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        :root { --ink:#0f0f0f; --ink-soft:#4a4a4a; --paper:#f7f5f0; --accent:#1a6b4a; --accent-light:#e8f2ed; --serif:'DM Serif Display',Georgia,serif; }
        nav { position:fixed; top:0; left:0; right:0; z-index:100; padding:20px 40px; display:flex; align-items:center; justify-content:space-between; background:rgba(247,245,240,0.9); backdrop-filter:blur(12px); border-bottom:1px solid rgba(0,0,0,0.06); }
        .logo { font-family:var(--serif); font-size:22px; color:var(--ink); text-decoration:none; }
        .logo span { color:var(--accent); }
        nav ul { list-style:none; display:flex; gap:32px; }
        nav ul a { text-decoration:none; color:var(--ink-soft); font-size:14px; }
        .nav-cta { background:var(--ink); color:#f7f5f0 !important; padding:9px 20px; border-radius:100px; font-weight:500 !important; }
        .hero { min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:120px 40px 80px; text-align:center; }
        .hero-label { display:inline-block; font-size:12px; font-weight:500; letter-spacing:1.5px; text-transform:uppercase; color:var(--accent); background:var(--accent-light); padding:6px 14px; border-radius:100px; margin-bottom:28px; }
        h1 { font-family:var(--serif); font-size:clamp(48px,7vw,84px); line-height:1.05; letter-spacing:-1.5px; max-width:760px; margin-bottom:24px; }
        h1 em { font-style:italic; color:var(--accent); }
        .hero-p { font-size:18px; color:var(--ink-soft); max-width:480px; font-weight:300; line-height:1.7; margin-bottom:40px; }
        .hero-actions { display:flex; gap:12px; align-items:center; margin-bottom:64px; }
        .btn-primary { background:var(--ink); color:#f7f5f0; padding:14px 28px; border-radius:100px; text-decoration:none; font-size:15px; font-weight:500; }
        .btn-primary:hover { background:var(--accent); }
        .btn-secondary { color:var(--ink-soft); text-decoration:none; font-size:15px; padding:14px 20px; }
        .steps { display:grid; grid-template-columns:repeat(3,1fr); gap:24px; max-width:900px; width:100%; }
        .step { background:white; border-radius:16px; padding:28px; border:1px solid rgba(0,0,0,0.06); text-align:left; }
        .step-num { font-family:var(--serif); font-size:36px; color:var(--accent-light); margin-bottom:12px; }
        .step h3 { font-size:16px; font-weight:500; margin-bottom:6px; }
        .step p { font-size:14px; color:var(--ink-soft); line-height:1.6; }
        .features { display:grid; grid-template-columns:repeat(3,1fr); gap:2px; background:rgba(0,0,0,0.06); border-radius:16px; overflow:hidden; max-width:900px; width:100%; margin-top:60px; }
        .feature { background:var(--paper); padding:22px 18px; display:flex; align-items:flex-start; gap:12px; }
        .feature:hover { background:white; }
        .fi { font-size:20px; flex-shrink:0; margin-top:2px; }
        .feature h3 { font-size:15px; font-weight:500; margin-bottom:4px; }
        .feature p { font-size:13px; color:var(--ink-soft); line-height:1.5; }
        .cta-final { background:var(--ink); color:#f7f5f0; padding:80px 40px; text-align:center; }
        .cta-final h2 { font-family:var(--serif); font-size:clamp(36px,5vw,60px); letter-spacing:-1px; line-height:1.1; margin-bottom:16px; }
        .cta-final h2 em { color:#7dd3a8; font-style:italic; }
        .cta-final p { font-size:17px; color:rgba(247,245,240,0.6); font-weight:300; margin-bottom:32px; }
        .btn-white { background:white; color:var(--ink); padding:14px 32px; border-radius:100px; text-decoration:none; font-size:15px; font-weight:500; display:inline-block; }
        .btn-white:hover { background:#7dd3a8; }
        footer { padding:32px 40px; display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(0,0,0,0.06); font-size:13px; color:#9a9a9a; }
        .footer-logo { font-family:var(--serif); font-size:18px; color:var(--ink); text-decoration:none; }
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
        <p className="hero-p">Compartí un link, tus clientes eligen horario. Vos cobrás, confirmás y seguís con tu trabajo.</p>
        <div className="hero-actions">
          <a href="/login" className="btn-primary">Crear mi cuenta gratis</a>
          <a href="#como" className="btn-secondary">Ver cómo funciona →</a>
        </div>

        <div className="steps" id="como">
          <div className="step"><div className="step-num">01</div><h3>Configurá tus servicios</h3><p>Precio, duración y horarios. En minutos tenés tu perfil listo.</p></div>
          <div className="step"><div className="step-num">02</div><h3>Compartí tu link</h3><p>Cada servicio tiene su link. Mandalo por donde quieras.</p></div>
          <div className="step"><div className="step-num">03</div><h3>Recibí tus turnos</h3><p>Te llega un Telegram con cada reserva. El cliente recibe su confirmación.</p></div>
        </div>

        <div className="features" id="features">
          <div className="feature"><span className="fi">📅</span><div><h3>Múltiples servicios</h3><p>Cada uno con precio, duración y link propio.</p></div></div>
          <div className="feature"><span className="fi">💬</span><div><h3>Notificaciones Telegram</h3><p>Avisamos al instante de reservas y cancelaciones.</p></div></div>
          <div className="feature"><span className="fi">💳</span><div><h3>Pagos con Mercado Pago</h3><p>Cobrá seña o total al reservar.</p></div></div>
          <div className="feature"><span className="fi">🔗</span><div><h3>Sin registro para clientes</h3><p>Reservan con un link, sin cuenta ni contraseña.</p></div></div>
          <div className="feature"><span className="fi">📊</span><div><h3>Métricas por servicio</h3><p>Clientes únicos, recurrentes y más popular.</p></div></div>
          <div className="feature"><span className="fi">⚡</span><div><h3>Confirmación automática</h3><p>Elegís si los turnos se confirman solos o con tu OK.</p></div></div>
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