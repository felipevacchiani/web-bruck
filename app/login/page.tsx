'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'login' | 'forgot'>('login')
  const [forgotSent, setForgotSent] = useState(false)
  const [showPass, setShowPass] = useState(false)

  useEffect(() => {
    const hash = window.location.hash
    if (hash.includes('type=recovery')) {
      router.push('/reset-password' + hash)
      return
    }
    const errorParam = searchParams.get('error')
    if (errorParam === 'account_disabled') setError('Tu cuenta está desactivada. Contactá al administrador.')
    if (errorParam === 'organization_suspended') setError('Tu organización está suspendida. Contactá a BRUCK.')
    if (errorParam === 'profile_not_found') setError('No se encontró tu perfil. Contactá al administrador.')
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email o contraseña incorrectos')
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    router.push(['admin','super_admin'].includes(profile?.role) ? '/admin' : '/dashboard')
    router.refresh()
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) {
      setError('Error al enviar el email. Verificá la dirección.')
    } else {
      setForgotSent(true)
    }
    setLoading(false)
  }

  const inputStyle: React.CSSProperties = {
    background: '#FFFFFF',
    border: '1px solid rgba(18,23,20,0.14)',
    outline: 'none',
    transition: 'border-color 0.15s',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F3EFE5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', position: 'relative', overflow: 'hidden' }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(49,174,121,0.10) 0%, transparent 65%)' }} />
      </div>

      <div style={{ width: '100%', maxWidth: 380, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #31AE79, #99D0B8)', marginBottom: 14 }}>
            <span style={{ color: '#07120D', fontWeight: 900, fontSize: 20, letterSpacing: 2 }}>B</span>
          </div>
          <div style={{ color: '#121714', fontWeight: 900, letterSpacing: '0.22em', fontSize: 20 }}>BRUCK</div>
          <div style={{ color: '#858C87', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 4 }}>Portal de Clientes</div>
        </div>

        {/* Card */}
        <div style={{ borderRadius: 20, overflow: 'hidden', background: '#FFFFFF', border: '1px solid rgba(18,23,20,0.08)', boxShadow: '0 20px 60px rgba(18,23,20,0.10)' }}>
          <div style={{ height: 3, background: 'linear-gradient(90deg, #31AE79, #99D0B8)' }} />
          <div style={{ padding: '28px 28px 24px' }}>

            {/* LOGIN */}
            {mode === 'login' && (
              <>
                <div style={{ marginBottom: 22 }}>
                  <div style={{ color: '#121714', fontSize: 17, fontWeight: 600, marginBottom: 2 }}>Iniciar sesión</div>
                  <div style={{ color: '#4E5651', fontSize: 13 }}>Ingresá tus credenciales para continuar</div>
                </div>

                {error && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: 'rgba(228,123,104,0.10)', border: '1px solid rgba(228,123,104,0.3)', borderRadius: 12, padding: '10px 14px', marginBottom: 18, color: '#c85a44', fontSize: 13 }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
                      <path d="M7 4.5v3M7 9v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                    {error}
                  </div>
                )}

                <form onSubmit={handleLogin}>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ color: '#4E5651', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Email</label>
                    <input
                      type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email"
                      placeholder="nombre@empresa.com"
                      style={{ ...inputStyle, width: '100%', color: '#121714', fontSize: 14, borderRadius: 12, padding: '11px 14px', boxSizing: 'border-box' }}
                      onFocus={e => e.currentTarget.style.borderColor = '#31AE79'}
                      onBlur={e => e.currentTarget.style.borderColor = 'rgba(18,23,20,0.14)'}
                    />
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ color: '#4E5651', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Contraseña</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password"
                        placeholder="••••••••"
                        style={{ ...inputStyle, width: '100%', color: '#121714', fontSize: 14, borderRadius: 12, padding: '11px 42px 11px 14px', boxSizing: 'border-box' }}
                        onFocus={e => e.currentTarget.style.borderColor = '#31AE79'}
                        onBlur={e => e.currentTarget.style.borderColor = 'rgba(18,23,20,0.14)'}
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)}
                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: showPass ? '#31AE79' : '#858C87', padding: 2, display: 'flex', alignItems: 'center' }}>
                        {showPass
                          ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 2l12 12M6.5 6.7A2 2 0 0 0 9.3 9.5M4.2 4.4C2.7 5.4 1.5 6.6 1 8c1.2 3 4 5 7 5 1.4 0 2.8-.5 3.9-1.3M7 3.1C7.3 3 7.7 3 8 3c3 0 5.8 2 7 5-.4 1-1 1.9-1.8 2.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                          : <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8c1.2-3 4-5 7-5s5.8 2 7 5c-1.2 3-4 5-7 5S2.2 11 1 8z" stroke="currentColor" strokeWidth="1.3"/><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/></svg>
                        }
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={loading}
                    style={{ width: '100%', background: loading ? '#7fc4a3' : 'linear-gradient(135deg, #31AE79, #27a06d)', color: '#07120D', fontWeight: 600, fontSize: 14, padding: '12px', borderRadius: 999, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.8 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    {loading ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(7,18,13,0.3)', borderTopColor: '#07120D', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />Ingresando...</> : 'Ingresar'}
                  </button>
                </form>

                <div style={{ marginTop: 18, textAlign: 'center' }}>
                  <button type="button" onClick={() => { setMode('forgot'); setError('') }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#858C87', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 5 }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#31AE79')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#858C87')}>
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.2"/><path d="M5 5.2c0-1 .7-1.7 1.5-1.7S8 4.3 8 5.2C8 6 7.5 6.5 6.5 7v.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><circle cx="6.5" cy="9.5" r=".5" fill="currentColor"/></svg>
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              </>
            )}

            {/* FORGOT */}
            {mode === 'forgot' && (
              <>
                <button onClick={() => { setMode('login'); setForgotSent(false); setError('') }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#858C87', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 18 }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#121714')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#858C87')}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8 2L4 6L8 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Volver
                </button>

                {!forgotSent ? (
                  <>
                    <div style={{ marginBottom: 22 }}>
                      <div style={{ color: '#121714', fontSize: 17, fontWeight: 600, marginBottom: 2 }}>Recuperar contraseña</div>
                      <div style={{ color: '#4E5651', fontSize: 13 }}>Te enviamos un link para restablecer tu contraseña.</div>
                    </div>
                    {error && <div style={{ background: 'rgba(228,123,104,0.10)', border: '1px solid rgba(228,123,104,0.3)', borderRadius: 12, padding: '10px 14px', marginBottom: 18, color: '#c85a44', fontSize: 13 }}>{error}</div>}
                    <form onSubmit={handleForgotPassword}>
                      <div style={{ marginBottom: 16 }}>
                        <label style={{ color: '#4E5651', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="nombre@empresa.com"
                          style={{ ...inputStyle, width: '100%', color: '#121714', fontSize: 14, borderRadius: 12, padding: '11px 14px', boxSizing: 'border-box' }}
                          onFocus={e => e.currentTarget.style.borderColor = '#31AE79'}
                          onBlur={e => e.currentTarget.style.borderColor = 'rgba(18,23,20,0.14)'}
                        />
                      </div>
                      <button type="submit" disabled={loading}
                        style={{ width: '100%', background: 'linear-gradient(135deg, #31AE79, #27a06d)', color: '#07120D', fontWeight: 600, fontSize: 14, padding: 12, borderRadius: 999, border: 'none', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
                        {loading ? 'Enviando...' : 'Enviar link de recuperación'}
                      </button>
                    </form>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, rgba(49,174,121,0.18), rgba(49,174,121,0.06))', border: '1px solid rgba(49,174,121,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="#31AE79" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <div style={{ color: '#121714', fontWeight: 600, marginBottom: 6 }}>Email enviado</div>
                    <div style={{ color: '#4E5651', fontSize: 13, lineHeight: 1.5 }}>Revisá tu bandeja de entrada y seguí el link para restablecer tu contraseña.</div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div style={{ color: '#858C87', fontSize: 11, textAlign: 'center', marginTop: 24 }}>
          © {new Date().getFullYear()} BRUCK · Todos los derechos reservados
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>
}
