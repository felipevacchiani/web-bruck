'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return }
    if (password.length < 8) { setError('Mínimo 8 caracteres'); return }
    setLoading(true); setError('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError('Error al actualizar. El link puede haber expirado.') }
    else { setDone(true); setTimeout(() => router.push('/login'), 3000) }
    setLoading(false)
  }

  const inputStyle: React.CSSProperties = { background: '#FFFFFF', border: '1px solid rgba(18,23,20,0.14)', outline: 'none', transition: 'border-color 0.15s' }

  const EyeBtn = ({ show, toggle }: { show: boolean, toggle: () => void }) => (
    <button type="button" onClick={toggle}
      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: show ? '#31AE79' : '#858C87', display: 'flex', alignItems: 'center', padding: 2 }}>
      {show
        ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 2l12 12M6.5 6.7A2 2 0 0 0 9.3 9.5M4.2 4.4C2.7 5.4 1.5 6.6 1 8c1.2 3 4 5 7 5 1.4 0 2.8-.5 3.9-1.3M7 3.1C7.3 3 7.7 3 8 3c3 0 5.8 2 7 5-.4 1-1 1.9-1.8 2.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
        : <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8c1.2-3 4-5 7-5s5.8 2 7 5c-1.2 3-4 5-7 5S2.2 11 1 8z" stroke="currentColor" strokeWidth="1.3"/><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/></svg>
      }
    </button>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F3EFE5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #31AE79, #99D0B8)', marginBottom: 14 }}>
            <span style={{ color: '#07120D', fontWeight: 900, fontSize: 20 }}>B</span>
          </div>
          <div style={{ color: '#121714', fontWeight: 900, letterSpacing: '0.22em', fontSize: 20 }}>BRUCK</div>
        </div>

        <div style={{ borderRadius: 20, overflow: 'hidden', background: '#FFFFFF', border: '1px solid rgba(18,23,20,0.08)', boxShadow: '0 20px 60px rgba(18,23,20,0.10)' }}>
          <div style={{ height: 3, background: 'linear-gradient(90deg, #31AE79, #99D0B8)' }} />
          <div style={{ padding: '28px 28px 24px' }}>
            {done ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(49,174,121,0.12)', border: '1px solid rgba(49,174,121,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="#31AE79" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div style={{ color: '#121714', fontWeight: 600, marginBottom: 6 }}>Contraseña actualizada</div>
                <div style={{ color: '#4E5651', fontSize: 13 }}>Redirigiendo al login...</div>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 22 }}>
                  <div style={{ color: '#121714', fontSize: 17, fontWeight: 600, marginBottom: 2 }}>Nueva contraseña</div>
                  <div style={{ color: '#4E5651', fontSize: 13 }}>Elegí una contraseña segura para tu cuenta.</div>
                </div>
                {error && (
                  <div style={{ display: 'flex', gap: 8, background: 'rgba(228,123,104,0.10)', border: '1px solid rgba(228,123,104,0.3)', borderRadius: 12, padding: '10px 14px', marginBottom: 18, color: '#c85a44', fontSize: 13 }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/><path d="M7 4.5v3M7 9v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                    {error}
                  </div>
                )}
                <form onSubmit={handleReset}>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ color: '#4E5651', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Nueva contraseña</label>
                    <div style={{ position: 'relative' }}>
                      <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required placeholder="Mínimo 8 caracteres"
                        style={{ ...inputStyle, width: '100%', color: '#121714', fontSize: 14, borderRadius: 12, padding: '11px 42px 11px 14px', boxSizing: 'border-box' }}
                        onFocus={e => e.currentTarget.style.borderColor = '#31AE79'}
                        onBlur={e => e.currentTarget.style.borderColor = 'rgba(18,23,20,0.14)'}
                      />
                      <EyeBtn show={showPass} toggle={() => setShowPass(!showPass)} />
                    </div>
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ color: '#4E5651', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Confirmar contraseña</label>
                    <div style={{ position: 'relative' }}>
                      <input type={showConfirm ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} required placeholder="Repetir contraseña"
                        style={{ ...inputStyle, width: '100%', color: '#121714', fontSize: 14, borderRadius: 12, padding: '11px 42px 11px 14px', boxSizing: 'border-box' }}
                        onFocus={e => e.currentTarget.style.borderColor = '#31AE79'}
                        onBlur={e => e.currentTarget.style.borderColor = 'rgba(18,23,20,0.14)'}
                      />
                      <EyeBtn show={showConfirm} toggle={() => setShowConfirm(!showConfirm)} />
                    </div>
                  </div>
                  <button type="submit" disabled={loading}
                    style={{ width: '100%', background: 'linear-gradient(135deg, #31AE79, #27a06d)', color: '#07120D', fontWeight: 600, fontSize: 14, padding: 12, borderRadius: 999, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    {loading ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(7,18,13,0.3)', borderTopColor: '#07120D', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />Actualizando...</> : 'Actualizar contraseña'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
