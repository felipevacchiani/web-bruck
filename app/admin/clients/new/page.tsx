'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewClientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({ full_name: '', company: '', email: '', password: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setLoading(true)
    const res = await fetch('/api/admin/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Error al crear el cliente'); setLoading(false); return }
    router.push('/admin'); router.refresh()
  }

  const inp: React.CSSProperties = { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', outline:'none', transition:'border-color 0.15s', width:'100%', color:'white', fontSize:14, borderRadius:10, padding:'11px 14px', boxSizing:'border-box' }
  const lbl: React.CSSProperties = { color:'#a1a1aa', fontSize:11, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', display:'block', marginBottom:6 }

  return (
    <div style={{ minHeight:'100vh', background:'#080808' }}>
      <style>{`
        .nc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .nc-pad { padding: 36px 24px; }
        .hpad { padding: 0 24px; }
        @media(max-width:640px){
          .nc-grid { grid-template-columns: 1fr; gap: 14px; }
          .nc-pad { padding: 20px 14px; }
          .hpad { padding: 0 14px; }
        }
      `}</style>

      <header style={{ position:'sticky', top:0, zIndex:10, borderBottom:'1px solid rgba(255,255,255,0.06)', background:'rgba(10,10,10,0.97)', backdropFilter:'blur(12px)' }}>
        <div style={{ maxWidth:720, margin:'0 auto' }}>
          <div className="hpad" style={{ height:52, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <Link href="/admin" style={{ color:'#52525b', fontSize:13, textDecoration:'none', display:'flex', alignItems:'center', gap:5 }}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M8 2.5L4 6.5L8 10.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Clientes
              </Link>
              <span style={{ color:'#3f3f46' }}>/</span>
              <span style={{ color:'#a1a1aa', fontSize:13 }}>Nuevo cliente</span>
            </div>
            <span style={{ color:'white', fontWeight:900, letterSpacing:'0.2em', fontSize:12 }}>BRUCK</span>
          </div>
        </div>
      </header>

      <main style={{ maxWidth:720, margin:'0 auto' }}>
        <div className="nc-pad">
          <div style={{ marginBottom:28 }}>
            <div style={{ color:'white', fontSize:20, fontWeight:600 }}>Nuevo cliente</div>
            <div style={{ color:'#71717a', fontSize:13, marginTop:4 }}>Completá los datos para crear la cuenta.</div>
          </div>

          <div style={{ background:'rgba(14,14,14,0.8)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:18, overflow:'hidden' }}>
            <div style={{ height:1, background:'linear-gradient(90deg,transparent,rgba(49,174,121,0.4),transparent)' }} />
            <div style={{ padding:24 }}>
              {error && (
                <div style={{ display:'flex', gap:8, background:'rgba(239,68,68,0.09)', border:'1px solid rgba(239,68,68,0.22)', borderRadius:12, padding:'10px 14px', marginBottom:20, color:'#f87171', fontSize:13 }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink:0, marginTop:1 }}><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/><path d="M7 4.5v3M7 9v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="nc-grid" style={{ marginBottom:16 }}>
                  <div>
                    <label style={lbl}>Nombre completo</label>
                    <input value={form.full_name} onChange={e=>setForm(f=>({...f,full_name:e.target.value}))} placeholder="Juan Pérez" style={inp}
                      onFocus={e=>e.currentTarget.style.borderColor='rgba(49,174,121,0.55)'}
                      onBlur={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'} />
                  </div>
                  <div>
                    <label style={lbl}>Empresa</label>
                    <input value={form.company} onChange={e=>setForm(f=>({...f,company:e.target.value}))} placeholder="Acme S.A." style={inp}
                      onFocus={e=>e.currentTarget.style.borderColor='rgba(49,174,121,0.55)'}
                      onBlur={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'} />
                  </div>
                </div>

                <div style={{ marginBottom:16 }}>
                  <label style={lbl}>Email <span style={{ color:'#ef4444' }}>*</span></label>
                  <input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} required placeholder="cliente@empresa.com" style={inp}
                    onFocus={e=>e.currentTarget.style.borderColor='rgba(49,174,121,0.55)'}
                    onBlur={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'} />
                </div>

                <div style={{ marginBottom:28 }}>
                  <label style={lbl}>Contraseña inicial <span style={{ color:'#ef4444' }}>*</span></label>
                  <div style={{ position:'relative' }}>
                    <input type={showPass?'text':'password'} value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} required minLength={8} placeholder="Mínimo 8 caracteres"
                      style={{ ...inp, paddingRight:42 }}
                      onFocus={e=>e.currentTarget.style.borderColor='rgba(49,174,121,0.55)'}
                      onBlur={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'} />
                    <button type="button" onClick={()=>setShowPass(!showPass)}
                      style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:showPass?'#31AE79':'#52525b', display:'flex', alignItems:'center', padding:2 }}>
                      {showPass
                        ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 2l12 12M6.5 6.7A2 2 0 0 0 9.3 9.5M4.2 4.4C2.7 5.4 1.5 6.6 1 8c1.2 3 4 5 7 5 1.4 0 2.8-.5 3.9-1.3M7 3.1C7.3 3 7.7 3 8 3c3 0 5.8 2 7 5-.4 1-1 1.9-1.8 2.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                        : <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8c1.2-3 4-5 7-5s5.8 2 7 5c-1.2 3-4 5-7 5S2.2 11 1 8z" stroke="currentColor" strokeWidth="1.3"/><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/></svg>}
                    </button>
                  </div>
                  <div style={{ color:'#52525b', fontSize:12, marginTop:6 }}>El cliente puede cambiarla desde "Olvidé mi contraseña"</div>
                </div>

                <div style={{ display:'flex', gap:10 }}>
                  <button type="submit" disabled={loading}
                    style={{ flex:1, background:'linear-gradient(135deg,#31AE79,#27a06d)', color:'white', fontWeight:600, fontSize:14, padding:'12px', borderRadius:10, border:'none', cursor:loading?'not-allowed':'pointer', boxShadow:'0 4px 16px rgba(49,174,121,0.25)', opacity:loading?0.7:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                    {loading ? <><span style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', display:'inline-block', animation:'spin 0.7s linear infinite' }} />Creando...</> : 'Crear cliente'}
                  </button>
                  <Link href="/admin" style={{ color:'#71717a', fontSize:13, padding:'12px 18px', borderRadius:10, border:'1px solid rgba(255,255,255,0.09)', textDecoration:'none', display:'flex', alignItems:'center', whiteSpace:'nowrap' }}>
                    Cancelar
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
