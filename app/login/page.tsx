'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

type Mode = 'login' | 'signup' | 'magic'

const C = {
  ink: '#f5f5f4',
  muted: '#8b8b88',
  faint: '#55554f',
  accent: '#8ef0b8',
  surface: '#141414',
  edge: 'rgba(255,255,255,0.09)',
  danger: '#f0a08e',
}

function LoginForm() {
  const searchParams = useSearchParams()
  const authError = searchParams.get('error')
  const next = searchParams.get('next') ?? '/dashboard'
  const initialMode: Mode = searchParams.get('mode') === 'signup' ? 'signup' : 'login'

  const [mode, setMode] = useState<Mode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [magicSent, setMagicSent] = useState(false)
  const [signupConfirmSent, setSignupConfirmSent] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const origin = window.location.origin

    if (mode === 'signup') {
      if (password.length < 8) {
        setError('La contraseña tiene que tener al menos 8 caracteres.')
        setLoading(false)
        return
      }
      if (password !== confirmPassword) {
        setError('Las contraseñas no coinciden.')
        setLoading(false)
        return
      }
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${origin}/auth/callback` },
      })
      if (signUpError) {
        setError(
          signUpError.message.includes('already registered')
            ? 'Ese email ya tiene una cuenta. Iniciá sesión en su lugar.'
            : 'No pudimos crear la cuenta. Intentá de nuevo.'
        )
      } else if (!data.session) {
        setSignupConfirmSent(true)
      } else {
        window.location.href = next
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        setError('Email o contraseña incorrectos.')
      } else {
        window.location.href = next
      }
    }
    setLoading(false)
  }

  async function handleMagicSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const origin = window.location.origin
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
    })
    if (otpError) {
      setError('No pudimos enviar el link. Revisá el email e intentá de nuevo.')
    } else {
      setMagicSent(true)
    }
    setLoading(false)
  }

  const labelStyle = { display: 'block', fontSize: '14px', fontWeight: 500, color: C.ink, marginBottom: '6px' } as const

  return (
    <div className="tn-glow" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <a href="/" style={{ marginBottom: '44px', textDecoration: 'none' }}>
        <span style={{ fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: 600, color: C.ink, letterSpacing: '-0.5px' }}>Tor<span style={{ color: C.accent }}>nu</span></span>
      </a>
      <div className="tn-card" style={{ width: '100%', maxWidth: '400px', padding: '40px' }}>
        {authError && (
          <div style={{ backgroundColor: 'rgba(240,160,142,0.1)', border: '1px solid rgba(240,160,142,0.3)', borderRadius: '10px', padding: '12px 16px', marginBottom: '24px', color: C.danger, fontSize: '14px' }}>
            El link expiró o no es válido. Solicitá uno nuevo.
          </div>
        )}

        {magicSent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', backgroundColor: 'rgba(142,240,184,0.1)', border: '1px solid rgba(142,240,184,0.25)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 600, color: C.ink, marginBottom: '8px', letterSpacing: '-0.02em' }}>Revisá tu correo</h2>
            <p style={{ color: C.muted, fontSize: '15px', lineHeight: '1.5' }}>Te enviamos un link de acceso a <strong style={{ color: C.ink }}>{email}</strong>. Expira en 1 hora.</p>
            <button onClick={() => { setMagicSent(false); setMode('login') }} style={{ marginTop: '24px', color: C.accent, background: 'none', border: 'none', fontSize: '14px', cursor: 'pointer', textDecoration: 'underline' }}>Volver</button>
          </div>
        ) : signupConfirmSent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', backgroundColor: 'rgba(142,240,184,0.1)', border: '1px solid rgba(142,240,184,0.25)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 600, color: C.ink, marginBottom: '8px', letterSpacing: '-0.02em' }}>Confirmá tu cuenta</h2>
            <p style={{ color: C.muted, fontSize: '15px', lineHeight: '1.5' }}>Te enviamos un email a <strong style={{ color: C.ink }}>{email}</strong> para confirmar tu cuenta. Después ya podés iniciar sesión con tu contraseña.</p>
            <button onClick={() => { setSignupConfirmSent(false); setMode('login') }} style={{ marginTop: '24px', color: C.accent, background: 'none', border: 'none', fontSize: '14px', cursor: 'pointer', textDecoration: 'underline' }}>Volver</button>
          </div>
        ) : mode === 'magic' ? (
          <>
            <h1 style={{ fontSize: '25px', fontWeight: 600, color: C.ink, marginBottom: '8px', lineHeight: '1.2', letterSpacing: '-0.02em' }}>Link mágico</h1>
            <p style={{ color: C.muted, fontSize: '15px', marginBottom: '32px' }}>Te mandamos un link de acceso, sin contraseña.</p>
            <form onSubmit={handleMagicSubmit}>
              <label style={labelStyle}>Email</label>
              <input className="tn-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" required />
              {error && <p style={{ color: C.danger, fontSize: '13px', marginTop: '8px' }}>{error}</p>}
              <button className="tn-btn-primary" type="submit" disabled={loading || !email} style={{ width: '100%', marginTop: '20px' }}>
                {loading ? 'Enviando...' : 'Enviar link de acceso'}
              </button>
            </form>
            <button onClick={() => setMode('login')} style={{ marginTop: '20px', color: C.muted, background: 'none', border: 'none', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}>Volver a iniciar sesión con contraseña</button>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', gap: '4px', marginBottom: '28px', backgroundColor: 'rgba(255,255,255,0.04)', border: `1px solid ${C.edge}`, borderRadius: '10px', padding: '4px' }}>
              <button
                onClick={() => { setMode('login'); setError('') }}
                style={{ flex: 1, padding: '9px', borderRadius: '7px', border: 'none', fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', backgroundColor: mode === 'login' ? '#262626' : 'transparent', color: mode === 'login' ? C.ink : C.faint }}>
                Iniciar sesión
              </button>
              <button
                onClick={() => { setMode('signup'); setError('') }}
                style={{ flex: 1, padding: '9px', borderRadius: '7px', border: 'none', fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', backgroundColor: mode === 'signup' ? '#262626' : 'transparent', color: mode === 'signup' ? C.ink : C.faint }}>
                Crear cuenta
              </button>
            </div>

            <h1 style={{ fontSize: '25px', fontWeight: 600, color: C.ink, marginBottom: '8px', lineHeight: '1.2', letterSpacing: '-0.02em' }}>
              {mode === 'signup' ? 'Creá tu cuenta' : 'Ingresá a tu cuenta'}
            </h1>
            <p style={{ color: C.muted, fontSize: '15px', marginBottom: '28px' }}>
              {mode === 'signup' ? 'Gestioná tu agenda en minutos.' : 'Entrá con tu email y contraseña.'}
            </p>

            <form onSubmit={handlePasswordSubmit}>
              <label style={labelStyle}>Email</label>
              <input className="tn-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" required />

              <label style={{ ...labelStyle, marginTop: '16px' }}>Contraseña</label>
              <input className="tn-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={8} />

              {mode === 'signup' && (
                <>
                  <label style={{ ...labelStyle, marginTop: '16px' }}>Confirmar contraseña</label>
                  <input className="tn-input" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required minLength={8} />
                </>
              )}

              {error && <p style={{ color: C.danger, fontSize: '13px', marginTop: '8px' }}>{error}</p>}

              <button
                className="tn-btn-primary"
                type="submit"
                disabled={loading || !email || !password}
                style={{ width: '100%', marginTop: '20px' }}>
                {loading ? 'Un momento...' : mode === 'signup' ? 'Crear cuenta' : 'Iniciar sesión'}
              </button>
            </form>

            {mode === 'login' && (
              <button onClick={() => { setMode('magic'); setError('') }} style={{ marginTop: '20px', color: C.muted, background: 'none', border: 'none', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}>
                ¿Olvidaste tu contraseña? Entrá con link mágico
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a' }} />}>
      <LoginForm />
    </Suspense>
  )
}
