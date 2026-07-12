'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

type Mode = 'login' | 'signup' | 'magic'

const G = { green: '#1a6b4a', cream: '#f7f5f0' }

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

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    fontSize: '15px',
    border: '1.5px solid #e0ddd6',
    borderRadius: '8px',
    backgroundColor: '#faf9f7',
    color: '#0f0f0f',
    outline: 'none',
    boxSizing: 'border-box' as const,
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: G.cream, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'DM Sans, sans-serif' }}>
      <a href="/" style={{ marginBottom: '48px', textDecoration: 'none' }}>
        <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: '28px', color: '#0f0f0f', letterSpacing: '-0.5px' }}>Tor<span style={{ color: G.green }}>nu</span></span>
      </a>
      <div style={{ width: '100%', maxWidth: '400px', backgroundColor: '#ffffff', borderRadius: '16px', padding: '40px', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}>
        {authError && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', marginBottom: '24px', color: '#dc2626', fontSize: '14px' }}>
            El link expiró o no es válido. Solicitá uno nuevo.
          </div>
        )}

        {magicSent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', backgroundColor: '#e8f2ed', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={G.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '22px', color: '#0f0f0f', marginBottom: '8px' }}>Revisá tu correo</h2>
            <p style={{ color: '#4a4a4a', fontSize: '15px', lineHeight: '1.5' }}>Te enviamos un link de acceso a <strong>{email}</strong>. Expira en 1 hora.</p>
            <button onClick={() => { setMagicSent(false); setMode('login') }} style={{ marginTop: '24px', color: G.green, background: 'none', border: 'none', fontSize: '14px', cursor: 'pointer', textDecoration: 'underline' }}>Volver</button>
          </div>
        ) : signupConfirmSent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', backgroundColor: '#e8f2ed', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={G.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '22px', color: '#0f0f0f', marginBottom: '8px' }}>Confirmá tu cuenta</h2>
            <p style={{ color: '#4a4a4a', fontSize: '15px', lineHeight: '1.5' }}>Te enviamos un email a <strong>{email}</strong> para confirmar tu cuenta. Después ya podés iniciar sesión con tu contraseña.</p>
            <button onClick={() => { setSignupConfirmSent(false); setMode('login') }} style={{ marginTop: '24px', color: G.green, background: 'none', border: 'none', fontSize: '14px', cursor: 'pointer', textDecoration: 'underline' }}>Volver</button>
          </div>
        ) : mode === 'magic' ? (
          <>
            <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '26px', color: '#0f0f0f', marginBottom: '8px', lineHeight: '1.2' }}>Link mágico</h1>
            <p style={{ color: '#4a4a4a', fontSize: '15px', marginBottom: '32px' }}>Te mandamos un link de acceso, sin contraseña.</p>
            <form onSubmit={handleMagicSubmit}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f0f0f', marginBottom: '6px' }}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" required style={inputStyle} />
              {error && <p style={{ color: '#dc2626', fontSize: '13px', marginTop: '8px' }}>{error}</p>}
              <button type="submit" disabled={loading || !email} style={{ width: '100%', marginTop: '20px', padding: '13px', backgroundColor: loading || !email ? '#a3c4b5' : G.green, color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '500', cursor: loading || !email ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Enviando...' : 'Enviar link de acceso'}
              </button>
            </form>
            <button onClick={() => setMode('login')} style={{ marginTop: '20px', color: '#4a4a4a', background: 'none', border: 'none', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}>Volver a iniciar sesión con contraseña</button>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', gap: '4px', marginBottom: '28px', backgroundColor: '#f3f1ec', borderRadius: '10px', padding: '4px' }}>
              <button
                onClick={() => { setMode('login'); setError('') }}
                style={{ flex: 1, padding: '9px', borderRadius: '7px', border: 'none', fontSize: '14px', fontWeight: 500, cursor: 'pointer', backgroundColor: mode === 'login' ? '#ffffff' : 'transparent', color: mode === 'login' ? '#0f0f0f' : '#8a8880', boxShadow: mode === 'login' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none' }}>
                Iniciar sesión
              </button>
              <button
                onClick={() => { setMode('signup'); setError('') }}
                style={{ flex: 1, padding: '9px', borderRadius: '7px', border: 'none', fontSize: '14px', fontWeight: 500, cursor: 'pointer', backgroundColor: mode === 'signup' ? '#ffffff' : 'transparent', color: mode === 'signup' ? '#0f0f0f' : '#8a8880', boxShadow: mode === 'signup' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none' }}>
                Crear cuenta
              </button>
            </div>

            <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '26px', color: '#0f0f0f', marginBottom: '8px', lineHeight: '1.2' }}>
              {mode === 'signup' ? 'Creá tu cuenta' : 'Ingresá a tu cuenta'}
            </h1>
            <p style={{ color: '#4a4a4a', fontSize: '15px', marginBottom: '28px' }}>
              {mode === 'signup' ? 'Gestioná tu agenda en minutos.' : 'Entrá con tu email y contraseña.'}
            </p>

            <form onSubmit={handlePasswordSubmit}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f0f0f', marginBottom: '6px' }}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" required style={inputStyle} />

              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f0f0f', marginTop: '16px', marginBottom: '6px' }}>Contraseña</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={8} style={inputStyle} />

              {mode === 'signup' && (
                <>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f0f0f', marginTop: '16px', marginBottom: '6px' }}>Confirmar contraseña</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required minLength={8} style={inputStyle} />
                </>
              )}

              {error && <p style={{ color: '#dc2626', fontSize: '13px', marginTop: '8px' }}>{error}</p>}

              <button
                type="submit"
                disabled={loading || !email || !password}
                style={{ width: '100%', marginTop: '20px', padding: '13px', backgroundColor: loading || !email || !password ? '#a3c4b5' : G.green, color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '500', cursor: loading || !email || !password ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Un momento...' : mode === 'signup' ? 'Crear cuenta' : 'Iniciar sesión'}
              </button>
            </form>

            {mode === 'login' && (
              <button onClick={() => { setMode('magic'); setError('') }} style={{ marginTop: '20px', color: '#4a4a4a', background: 'none', border: 'none', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}>
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
    <Suspense fallback={<div style={{ minHeight: '100vh', backgroundColor: '#f7f5f0' }} />}>
      <LoginForm />
    </Suspense>
  )
}
