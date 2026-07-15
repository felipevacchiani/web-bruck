'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Org {
  id: string
  name: string
  slug: string
  active: boolean
  created_at: string
  empresas_count: number
  consultores: { id: string; email: string; full_name: string | null }[]
}

const INP: React.CSSProperties = { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', outline:'none', width:'100%', color:'white', fontSize:13, borderRadius:9, padding:'9px 12px', boxSizing:'border-box' }
const LBL: React.CSSProperties = { color:'#a1a1aa', fontSize:11, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', display:'block', marginBottom:6 }
const BTN_P: React.CSSProperties = { background:'linear-gradient(135deg,#31AE79,#27a06d)', color:'white', fontWeight:600, fontSize:13, padding:'9px 18px', borderRadius:9, border:'none', cursor:'pointer' }

const defForm = () => ({ org_name: '', consultor_full_name: '', consultor_email: '', consultor_password: '' })

export default function OrganizacionesPanel() {
  const [orgs, setOrgs] = useState<Org[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState(defForm())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [togglingId, setTogglingId] = useState<string|null>(null)

  const load = async () => {
    setLoading(true)
    const r = await fetch('/api/super-admin/organizations')
    const d = await r.json()
    setOrgs(d.data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const toggleActive = async (o: Org) => {
    const action = o.active ? 'suspender' : 'reactivar'
    if (!confirm(`¿${action.charAt(0).toUpperCase()+action.slice(1)} "${o.name}"? ${o.active ? 'Todos sus usuarios perderán acceso inmediatamente.' : 'Sus usuarios recuperarán el acceso.'}`)) return
    setTogglingId(o.id)
    await fetch(`/api/super-admin/organizations/${o.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !o.active }),
    })
    setTogglingId(null)
    load()
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setError('')
    const res = await fetch('/api/super-admin/organizations', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    })
    const d = await res.json()
    setSaving(false)
    if (!res.ok) { setError(d.error || 'Error al crear la organización'); return }
    setShowNew(false); setForm(defForm()); load()
  }

  return (
    <div style={{ minHeight:'100vh', background:'#080808' }}>
      <header style={{ position:'sticky', top:0, zIndex:10, borderBottom:'1px solid rgba(255,255,255,0.06)', background:'rgba(10,10,10,0.97)', backdropFilter:'blur(12px)' }}>
        <div style={{ maxWidth:1000, margin:'0 auto', padding:'0 24px', height:52, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <Link href="/admin" style={{ color:'#52525b', fontSize:13, textDecoration:'none' }}>← Admin</Link>
            <div style={{ width:1, height:14, background:'rgba(255,255,255,0.1)' }} />
            <span style={{ color:'#31AE79', fontSize:12, fontWeight:600 }}>🏢 Organizaciones (Super Admin)</span>
          </div>
        </div>
      </header>

      <main style={{ maxWidth:1000, margin:'0 auto', padding:'28px 24px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <div>
            <div style={{ color:'white', fontSize:18, fontWeight:700 }}>Organizaciones</div>
            <div style={{ color:'#71717a', fontSize:13, marginTop:2 }}>Cada organización es un consultor/líder independiente con sus propias empresas y usuarios.</div>
          </div>
          <button onClick={()=>setShowNew(true)} style={BTN_P}>+ Nueva organización</button>
        </div>

        {loading ? (
          <div style={{ color:'#52525b', fontSize:13, padding:40, textAlign:'center' }}>Cargando…</div>
        ) : orgs.length===0 ? (
          <div style={{ border:'1px solid rgba(255,255,255,0.06)', borderRadius:14, padding:48, textAlign:'center' }}>
            <div style={{ color:'#52525b', fontSize:13 }}>No hay organizaciones todavía.</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {orgs.map(o => (
              <div key={o.id} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:18 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                  <div>
                    <span style={{ color:'white', fontSize:15, fontWeight:600 }}>{o.name}</span>
                    <span style={{ color:'#52525b', fontSize:12, marginLeft:8 }}>/{o.slug}</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontSize:11, fontWeight:500, padding:'3px 9px', borderRadius:20, background:o.active?'rgba(52,211,153,0.08)':'rgba(255,255,255,0.04)', border:o.active?'1px solid rgba(52,211,153,0.2)':'1px solid rgba(255,255,255,0.08)', color:o.active?'#34d399':'#71717a' }}>
                      {o.active?'Activa':'Inactiva'}
                    </span>
                    <button onClick={()=>toggleActive(o)} disabled={togglingId===o.id} style={{ background:'none', border:'1px solid rgba(255,255,255,0.1)', color:'#71717a', fontSize:11, padding:'4px 10px', borderRadius:7, cursor:'pointer', opacity:togglingId===o.id?0.5:1 }}>
                      {togglingId===o.id ? '…' : (o.active ? 'Suspender' : 'Reactivar')}
                    </button>
                  </div>
                </div>
                <div style={{ display:'flex', gap:20, fontSize:12, color:'#71717a', marginBottom: o.consultores.length ? 10 : 0 }}>
                  <span>{o.empresas_count} empresa{o.empresas_count!==1?'s':''}</span>
                </div>
                {o.consultores.length > 0 && (
                  <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                    {o.consultores.map(c => (
                      <div key={c.id} style={{ color:'#a1a1aa', fontSize:12 }}>👤 {c.full_name || c.email} <span style={{ color:'#52525b' }}>({c.email})</span></div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {showNew && (
        <div style={{ position:'fixed', inset:0, zIndex:50, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'#0d0d0d', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, padding:24, maxWidth:440, width:'100%' }}>
            <div style={{ color:'white', fontSize:16, fontWeight:700, marginBottom:4 }}>Nueva organización</div>
            <div style={{ color:'#71717a', fontSize:12, marginBottom:18 }}>Crea el consultor y su cuenta de acceso inicial.</div>
            {error && <div style={{ background:'rgba(239,68,68,0.09)', border:'1px solid rgba(239,68,68,0.22)', borderRadius:10, padding:'9px 12px', marginBottom:14, color:'#f87171', fontSize:13 }}>{error}</div>}
            <form onSubmit={submit}>
              <div style={{ marginBottom:14 }}>
                <label style={LBL}>Nombre de la organización</label>
                <input required value={form.org_name} onChange={e=>setForm(f=>({...f,org_name:e.target.value}))} placeholder="Ej: Estudio Pérez & Asoc." style={INP} />
              </div>
              <div style={{ marginBottom:14 }}>
                <label style={LBL}>Nombre del consultor</label>
                <input value={form.consultor_full_name} onChange={e=>setForm(f=>({...f,consultor_full_name:e.target.value}))} placeholder="Ej: Juan Pérez" style={INP} />
              </div>
              <div style={{ marginBottom:14 }}>
                <label style={LBL}>Email del consultor</label>
                <input required type="email" value={form.consultor_email} onChange={e=>setForm(f=>({...f,consultor_email:e.target.value}))} placeholder="juan@estudio.com" style={INP} />
              </div>
              <div style={{ marginBottom:20 }}>
                <label style={LBL}>Contraseña inicial</label>
                <input required type="text" value={form.consultor_password} onChange={e=>setForm(f=>({...f,consultor_password:e.target.value}))} placeholder="Mínimo 6 caracteres" style={INP} />
              </div>
              <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                <button type="button" onClick={()=>{setShowNew(false);setError('')}} style={{ background:'none', border:'1px solid rgba(255,255,255,0.1)', color:'#71717a', fontSize:13, padding:'9px 16px', borderRadius:9, cursor:'pointer' }}>Cancelar</button>
                <button type="submit" disabled={saving} style={{ ...BTN_P, opacity:saving?0.6:1 }}>{saving?'Creando…':'Crear organización'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
