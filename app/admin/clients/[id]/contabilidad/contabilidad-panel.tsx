'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { MONTHS, CI_CATEGORIAS, CI_MOV_ESTADOS } from '@/lib/supabase/types'

interface Props { clientId: string; clientName: string }

type Tab = 'dashboard' | 'movimientos' | 'cuentas' | 'rubros' | 'contables'

const API = (clientId: string) => `/api/admin/ci/${clientId}`

const fmt = (n: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(n)
const fmtDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })

const INP: React.CSSProperties = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', outline: 'none', width: '100%', color: 'white', fontSize: 13, borderRadius: 9, padding: '9px 12px', boxSizing: 'border-box' }
const SEL: React.CSSProperties = { ...{ appearance: 'none' } as any, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', outline: 'none', width: '100%', color: 'white', fontSize: 13, borderRadius: 9, padding: '9px 12px', boxSizing: 'border-box' }
const LBL: React.CSSProperties = { color: '#a1a1aa', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }
const BTN_P: React.CSSProperties = { background: 'linear-gradient(135deg,#31AE79,#27a06d)', color: 'white', fontWeight: 600, fontSize: 13, padding: '9px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }
const BTN_S: React.CSSProperties = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#71717a', fontSize: 12, padding: '7px 13px', borderRadius: 8, cursor: 'pointer' }

export default function ContabilidadPanel({ clientId, clientName }: Props) {
  const [tab, setTab]       = useState<Tab>('dashboard')
  const [dashboard, setDash] = useState<any>(null)
  const [movs, setMovs]     = useState<any[]>([])
  const [movCount, setMovCount] = useState(0)
  const [movPage, setMovPage]   = useState(1)
  const [movPages, setMovPages] = useState(1)
  const [cuentas, setCuentas]   = useState<any[]>([])
  const [rubros, setRubros]     = useState<any[]>([])
  const [contables, setContables] = useState<any[]>([])
  const [loading, setLoading]   = useState(false)

  // Filtros movimientos
  const [fCuenta, setFCuenta]  = useState('')
  const [fMes,    setFMes]     = useState('')
  const [fAnio,   setFAnio]    = useState('')
  const [fEstado, setFEstado]  = useState('')
  const [fQ,      setFQ]       = useState('')

  // Modal genérico
  const [modal, setModal] = useState<{ type: string; item?: any } | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  // Forms
  const [movForm, setMovForm]   = useState({ fecha: '', descripcion: '', debito: '', credito: '', cuenta_bancaria_id: '', tipo_movimiento: 'gasto' })
  const [cuentaForm, setCuentaForm] = useState({ nombre: '', banco: '', numero_cuenta: '', tipo: 'corriente', saldo_inicial: '' })
  const [rubroForm, setRubroForm]   = useState({ nombre: '', categoria: 'egreso' })
  const [contForm, setContForm]     = useState({ nombre: '', tipo: 'gasto', rubro_id: '', keywords: '' })
  const [clasificarForm, setClasificarForm] = useState({ cuenta_contable_id: '', rubro_id: '', estado: 'conciliado' })

  const base = API(clientId)

  const loadDash    = useCallback(async () => { const r = await fetch(`${base}/dashboard`); const d = await r.json(); setDash(d) }, [base])
  const loadCuentas = useCallback(async () => { const r = await fetch(`${base}/cuentas-bancarias`); const d = await r.json(); setCuentas(d.data || []) }, [base])
  const loadRubros  = useCallback(async () => { const r = await fetch(`${base}/rubros`); const d = await r.json(); setRubros(d.data || []) }, [base])
  const loadContab  = useCallback(async () => { const r = await fetch(`${base}/cuentas-contables`); const d = await r.json(); setContables(d.data || []) }, [base])

  const loadMovs = useCallback(async (page = 1) => {
    const params = new URLSearchParams({ page: String(page) })
    if (fCuenta) params.set('cuenta', fCuenta)
    if (fMes)    params.set('mes', fMes)
    if (fAnio)   params.set('anio', fAnio)
    if (fEstado) params.set('estado', fEstado)
    if (fQ)      params.set('q', fQ)
    const r = await fetch(`${base}/movimientos?${params}`)
    const d = await r.json()
    setMovs(d.data || [])
    setMovCount(d.count || 0)
    setMovPage(d.page || 1)
    setMovPages(d.pages || 1)
  }, [base, fCuenta, fMes, fAnio, fEstado, fQ])

  useEffect(() => { loadDash(); loadCuentas(); loadRubros(); loadContab() }, [loadDash, loadCuentas, loadRubros, loadContab])
  useEffect(() => { if (tab === 'movimientos') loadMovs(1) }, [tab, loadMovs])

  const openModal = (type: string, item?: any) => {
    setSaveError('')
    if (type === 'mov') setMovForm({ fecha: item?.fecha || '', descripcion: item?.descripcion || '', debito: String(item?.debito || ''), credito: String(item?.credito || ''), cuenta_bancaria_id: item?.cuenta_bancaria_id || '', tipo_movimiento: item?.tipo_movimiento || 'gasto' })
    if (type === 'cuenta') setCuentaForm({ nombre: item?.nombre || '', banco: item?.banco || '', numero_cuenta: item?.numero_cuenta || '', tipo: item?.tipo || 'corriente', saldo_inicial: String(item?.saldo_inicial || '') })
    if (type === 'rubro') setRubroForm({ nombre: item?.nombre || '', categoria: item?.categoria || 'egreso' })
    if (type === 'contable') setContForm({ nombre: item?.nombre || '', tipo: item?.tipo || 'gasto', rubro_id: item?.rubro_id || '', keywords: item?.keywords ? (typeof item.keywords === 'string' ? JSON.parse(item.keywords).join(', ') : item.keywords.join(', ')) : '' })
    if (type === 'clasificar') setClasificarForm({ cuenta_contable_id: item?.cuenta_contable_id || '', rubro_id: item?.rubro_id || '', estado: 'conciliado' })
    setModal({ type, item })
  }
  const closeModal = () => setModal(null)

  const apiDelete = async (endpoint: string, id: string) => {
    if (!confirm('¿Eliminar este elemento?')) return
    await fetch(`${base}/${endpoint}/${id}`, { method: 'DELETE' })
    if (endpoint === 'rubros')            { loadRubros(); loadDash() }
    if (endpoint === 'cuentas-bancarias') { loadCuentas(); loadDash() }
    if (endpoint === 'cuentas-contables') { loadContab() }
    if (endpoint === 'movimientos')       { loadMovs(movPage); loadDash() }
  }

  const saveModal = async () => {
    setSaving(true); setSaveError('')
    try {
      const { type, item } = modal!
      let endpoint = ''; let body: any = {}; let isEdit = !!item?.id

      if (type === 'mov') {
        endpoint = 'movimientos'
        body = movForm
        if (!isEdit && (!movForm.fecha || !movForm.descripcion)) { setSaveError('Fecha y descripción requeridos'); return }
      }
      if (type === 'cuenta') { endpoint = 'cuentas-bancarias'; body = cuentaForm }
      if (type === 'rubro')  { endpoint = 'rubros'; body = rubroForm }
      if (type === 'contable') {
        endpoint = 'cuentas-contables'
        body = { ...contForm, keywords: contForm.keywords ? contForm.keywords.split(',').map((k: string) => k.trim()).filter(Boolean) : [] }
      }
      if (type === 'clasificar') {
        const id = item?.id
        const res = await fetch(`${base}/movimientos/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...clasificarForm, clasificacion_origen: 'manual' }) })
        if (!res.ok) { const d = await res.json(); setSaveError(d.error || 'Error'); return }
        closeModal(); loadMovs(movPage); loadDash(); return
      }

      const url  = isEdit ? `${base}/${endpoint}/${item.id}` : `${base}/${endpoint}`
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) { setSaveError(data.error || 'Error al guardar'); return }

      closeModal()
      if (endpoint === 'movimientos')       { loadMovs(movPage); loadDash() }
      if (endpoint === 'cuentas-bancarias') { loadCuentas(); loadDash() }
      if (endpoint === 'rubros')            { loadRubros(); loadDash() }
      if (endpoint === 'cuentas-contables') { loadContab() }
    } finally { setSaving(false) }
  }

  const statusStyle = (estado: string) => {
    const s = CI_MOV_ESTADOS.find(e => e.value === estado)
    return s ? { color: s.color, background: s.bg, border: `1px solid ${s.border}` } : {}
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'dashboard',   label: 'Dashboard' },
    { id: 'movimientos', label: 'Movimientos' },
    { id: 'cuentas',     label: 'Cuentas Bancarias' },
    { id: 'contables',   label: 'Cuentas Contables' },
    { id: 'rubros',      label: 'Rubros' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#080808' }}>
      <style>{`
        select option { background: #111; }
        .page-pad { padding: 24px; }
        .tab-cont { overflow-x: auto; }
        @media(max-width:640px){ .page-pad { padding: 14px; } }
      `}</style>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 10, borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(10,10,10,0.97)', backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <Link href="/admin" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg,rgba(49,174,121,0.2),rgba(49,174,121,0.08))', border: '1px solid rgba(49,174,121,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: '#31AE79', fontWeight: 900, fontSize: 12 }}>B</span>
              </div>
            </Link>
            <Link href={`/admin/clients/${clientId}`} style={{ color: '#52525b', fontSize: 12, textDecoration: 'none' }}>← {clientName}</Link>
            <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.1)' }} />
            <span style={{ color: '#31AE79', fontSize: 12, fontWeight: 600 }}>Contabilidad Interna</span>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#71717a', fontSize: 12, padding: '5px 11px', borderRadius: 8, cursor: 'pointer' }}>Salir</button>
          </form>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(10,10,10,0.7)' }}>
        <div className="tab-cont" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', gap: 0 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ background: 'none', border: 'none', borderBottom: tab === t.id ? '2px solid #31AE79' : '2px solid transparent', color: tab === t.id ? '#31AE79' : '#71717a', fontSize: 13, fontWeight: tab === t.id ? 600 : 400, padding: '12px 16px', cursor: 'pointer', whiteSpace: 'nowrap', marginBottom: -1 }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <main style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div className="page-pad">

          {/* ── DASHBOARD ── */}
          {tab === 'dashboard' && (
            <div>
              {!dashboard ? (
                <div style={{ color: '#52525b', fontSize: 13, textAlign: 'center', padding: 48 }}>Cargando...</div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 24 }}>
                    {[
                      { label: 'Saldo estimado',    value: fmt(dashboard.saldoActual || 0),   color: dashboard.saldoActual >= 0 ? '#34d399' : '#f87171' },
                      { label: 'Ingresos este mes', value: fmt(dashboard.ingresosMes || 0),   color: '#34d399' },
                      { label: 'Egresos este mes',  value: fmt(dashboard.egresosMes  || 0),   color: '#f87171' },
                      { label: 'Movimientos',        value: dashboard.totalMovs || 0,           color: 'white' },
                      { label: 'Pendientes',         value: dashboard.pendientes || 0,          color: '#facc15' },
                      { label: 'Conciliados',        value: dashboard.conciliados || 0,         color: '#34d399' },
                    ].map(s => (
                      <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px 18px' }}>
                        <div style={{ color: '#71717a', fontSize: 11, marginBottom: 6 }}>{s.label}</div>
                        <div style={{ color: s.color, fontSize: 20, fontWeight: 700 }}>{s.value}</div>
                      </div>
                    ))}
                  </div>

                  {dashboard.resumenRubros?.length > 0 && (
                    <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#a1a1aa', fontSize: 13, fontWeight: 600 }}>Resumen por Rubro</div>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                            {['Rubro', 'Categoría', 'Ingresos', 'Egresos', 'Neto'].map(h => (
                              <th key={h} style={{ textAlign: 'left', color: '#52525b', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '8px 14px', fontWeight: 500 }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {dashboard.resumenRubros.map((r: any, i: number) => (
                            <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                              <td style={{ padding: '10px 14px', color: 'white', fontSize: 13 }}>{r.nombre}</td>
                              <td style={{ padding: '10px 14px' }}>
                                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: r.categoria === 'ingreso' ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)', color: r.categoria === 'ingreso' ? '#34d399' : '#f87171', fontWeight: 600 }}>
                                  {CI_CATEGORIAS.find(c => c.value === r.categoria)?.label || r.categoria}
                                </span>
                              </td>
                              <td style={{ padding: '10px 14px', color: '#34d399', fontSize: 13 }}>{fmt(r.credito)}</td>
                              <td style={{ padding: '10px 14px', color: '#f87171', fontSize: 13 }}>{fmt(r.debito)}</td>
                              <td style={{ padding: '10px 14px', color: r.credito - r.debito >= 0 ? '#34d399' : '#f87171', fontSize: 13, fontWeight: 600 }}>{fmt(r.credito - r.debito)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {!dashboard.resumenRubros?.length && (
                    <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '40px', textAlign: 'center' }}>
                      <div style={{ color: '#52525b', fontSize: 13 }}>Sin movimientos clasificados por rubro todavía.</div>
                      <div style={{ color: '#3f3f46', fontSize: 12, marginTop: 6 }}>Cargá movimientos y clasificalos para ver el resumen.</div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── MOVIMIENTOS ── */}
          {tab === 'movimientos' && (
            <div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16, alignItems: 'flex-end' }}>
                <input placeholder="Buscar descripción..." value={fQ} onChange={e => setFQ(e.target.value)} style={{ ...INP, width: 200 }} />
                <select value={fCuenta} onChange={e => setFCuenta(e.target.value)} style={{ ...SEL, width: 160 }}>
                  <option value="">Todas las cuentas</option>
                  {cuentas.map((c: any) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
                <select value={fMes} onChange={e => setFMes(e.target.value)} style={{ ...SEL, width: 110 }}>
                  <option value="">Mes</option>
                  {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                </select>
                <select value={fAnio} onChange={e => setFAnio(e.target.value)} style={{ ...SEL, width: 90 }}>
                  <option value="">Año</option>
                  {[2025, 2024, 2023].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <select value={fEstado} onChange={e => setFEstado(e.target.value)} style={{ ...SEL, width: 120 }}>
                  <option value="">Estado</option>
                  {CI_MOV_ESTADOS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <button onClick={() => loadMovs(1)} style={{ ...BTN_S }}>Filtrar</button>
                <div style={{ flex: 1 }} />
                <button onClick={() => openModal('mov')} style={BTN_P}>
                  <span>+</span> Nuevo movimiento
                </button>
              </div>

              <div style={{ color: '#52525b', fontSize: 12, marginBottom: 10 }}>{movCount} movimiento{movCount !== 1 ? 's' : ''}</div>

              {!movs.length ? (
                <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '48px', textAlign: 'center' }}>
                  <div style={{ color: '#52525b', fontSize: 13 }}>No hay movimientos registrados.</div>
                </div>
              ) : (
                <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        {['Fecha', 'Descripción', 'Cuenta', 'Débito', 'Crédito', 'Estado', 'Rubro / C.Contable', ''].map(h => (
                          <th key={h} style={{ textAlign: 'left', color: '#52525b', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '9px 12px', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {movs.map((m: any, i: number) => (
                        <tr key={m.id} style={{ borderTop: i ? '1px solid rgba(255,255,255,0.04)' : undefined }}>
                          <td style={{ padding: '10px 12px', color: '#a1a1aa', fontSize: 12, whiteSpace: 'nowrap' }}>{fmtDate(m.fecha)}</td>
                          <td style={{ padding: '10px 12px', color: 'white', fontSize: 12, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.descripcion}</td>
                          <td style={{ padding: '10px 12px', color: '#71717a', fontSize: 12, whiteSpace: 'nowrap' }}>{m.cuenta_bancaria?.nombre || '—'}</td>
                          <td style={{ padding: '10px 12px', color: '#f87171', fontSize: 12, whiteSpace: 'nowrap' }}>{m.debito > 0 ? fmt(m.debito) : '—'}</td>
                          <td style={{ padding: '10px 12px', color: '#34d399', fontSize: 12, whiteSpace: 'nowrap' }}>{m.credito > 0 ? fmt(m.credito) : '—'}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6, ...statusStyle(m.estado) }}>
                              {CI_MOV_ESTADOS.find(e => e.value === m.estado)?.label || m.estado}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', color: '#52525b', fontSize: 11, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {m.rubro?.nombre && <span style={{ color: '#71717a' }}>{m.rubro.nombre}</span>}
                            {m.cuenta_contable?.nombre && <span style={{ color: '#52525b' }}>{m.rubro?.nombre ? ' / ' : ''}{m.cuenta_contable.nombre}</span>}
                            {!m.rubro?.nombre && !m.cuenta_contable?.nombre && '—'}
                          </td>
                          <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', gap: 5 }}>
                              <button onClick={() => openModal('clasificar', m)} style={{ ...BTN_S, fontSize: 11, padding: '4px 9px', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.2)' }}>Clasificar</button>
                              <button onClick={() => apiDelete('movimientos', m.id)} style={{ ...BTN_S, fontSize: 11, padding: '4px 9px', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}>✕</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {movPages > 1 && (
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
                  {movPage > 1 && <button onClick={() => { setMovPage(p => p-1); loadMovs(movPage-1) }} style={BTN_S}>← Anterior</button>}
                  <span style={{ color: '#52525b', fontSize: 12, alignSelf: 'center' }}>Pág {movPage} / {movPages}</span>
                  {movPage < movPages && <button onClick={() => { setMovPage(p => p+1); loadMovs(movPage+1) }} style={BTN_S}>Siguiente →</button>}
                </div>
              )}
            </div>
          )}

          {/* ── CUENTAS BANCARIAS ── */}
          {tab === 'cuentas' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <button onClick={() => openModal('cuenta')} style={BTN_P}>+ Nueva cuenta</button>
              </div>
              {!cuentas.length ? (
                <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '48px', textAlign: 'center' }}>
                  <div style={{ color: '#52525b', fontSize: 13 }}>No hay cuentas bancarias cargadas.</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 12 }}>
                  {cuentas.map((c: any) => (
                    <div key={c.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '16px 18px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                        <div style={{ color: 'white', fontSize: 14, fontWeight: 600 }}>{c.nombre}</div>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button onClick={() => openModal('cuenta', c)} style={{ ...BTN_S, fontSize: 11, padding: '3px 8px' }}>✎</button>
                          <button onClick={() => apiDelete('cuentas-bancarias', c.id)} style={{ ...BTN_S, fontSize: 11, padding: '3px 8px', color: '#f87171' }}>✕</button>
                        </div>
                      </div>
                      <div style={{ color: '#71717a', fontSize: 12, marginBottom: 4 }}>{c.banco || '—'} · {c.numero_cuenta || 'sin número'}</div>
                      <div style={{ color: '#52525b', fontSize: 11, marginBottom: 10 }}>{c.tipo}</div>
                      <div style={{ color: '#34d399', fontSize: 15, fontWeight: 700 }}>{fmt(c.saldo_inicial)}</div>
                      <div style={{ color: '#3f3f46', fontSize: 11, marginTop: 2 }}>saldo inicial</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── CUENTAS CONTABLES ── */}
          {tab === 'contables' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <button onClick={() => openModal('contable')} style={BTN_P}>+ Nueva cuenta contable</button>
              </div>
              {!contables.length ? (
                <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '48px', textAlign: 'center' }}>
                  <div style={{ color: '#52525b', fontSize: 13 }}>No hay cuentas contables cargadas.</div>
                </div>
              ) : (
                <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        {['Nombre','Tipo','Rubro','Keywords',''].map(h => (
                          <th key={h} style={{ textAlign:'left', color:'#52525b', fontSize:10, letterSpacing:'0.08em', textTransform:'uppercase', padding:'9px 14px', fontWeight:500 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {contables.map((c: any, i: number) => {
                        let kw: string[] = []
                        try { kw = JSON.parse(c.keywords || '[]') } catch {}
                        return (
                          <tr key={c.id} style={{ borderTop: i ? '1px solid rgba(255,255,255,0.04)' : undefined }}>
                            <td style={{ padding:'10px 14px', color:'white', fontSize:13 }}>{c.nombre}</td>
                            <td style={{ padding:'10px 14px' }}>
                              <span style={{ fontSize:11, padding:'2px 8px', borderRadius:6, background: c.tipo==='ingreso'?'rgba(52,211,153,0.08)':'rgba(248,113,113,0.08)', color: c.tipo==='ingreso'?'#34d399':'#f87171' }}>{c.tipo}</span>
                            </td>
                            <td style={{ padding:'10px 14px', color:'#71717a', fontSize:12 }}>{c.rubro?.nombre || '—'}</td>
                            <td style={{ padding:'10px 14px', color:'#52525b', fontSize:11, maxWidth:200 }}>
                              {kw.slice(0,3).join(', ')}{kw.length > 3 ? ` +${kw.length-3}` : ''}
                            </td>
                            <td style={{ padding:'10px 14px' }}>
                              <div style={{ display:'flex', gap:5 }}>
                                <button onClick={() => openModal('contable', c)} style={{ ...BTN_S, fontSize:11, padding:'3px 8px' }}>✎</button>
                                <button onClick={() => apiDelete('cuentas-contables', c.id)} style={{ ...BTN_S, fontSize:11, padding:'3px 8px', color:'#f87171' }}>✕</button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── RUBROS ── */}
          {tab === 'rubros' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <button onClick={() => openModal('rubro')} style={BTN_P}>+ Nuevo rubro</button>
              </div>
              {!rubros.length ? (
                <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '48px', textAlign: 'center' }}>
                  <div style={{ color: '#52525b', fontSize: 13 }}>No hay rubros creados.</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 10 }}>
                  {rubros.map((r: any) => {
                    const cat = CI_CATEGORIAS.find(c => c.value === r.categoria)
                    return (
                      <div key={r.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ color: 'white', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{r.nombre}</div>
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, color: cat?.color || '#71717a', background: `${cat?.color}18` || 'rgba(255,255,255,0.04)' }}>
                            {cat?.label || r.categoria}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button onClick={() => openModal('rubro', r)} style={{ ...BTN_S, fontSize: 11, padding: '3px 8px' }}>✎</button>
                          <button onClick={() => apiDelete('rubros', r.id)} style={{ ...BTN_S, fontSize: 11, padding: '3px 8px', color: '#f87171' }}>✕</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* ── MODALES ── */}
      {modal && (
        <div onClick={closeModal} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, padding: '24px', width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>

            {/* Movimiento */}
            {modal.type === 'mov' && (
              <>
                <div style={{ color: 'white', fontSize: 16, fontWeight: 700, marginBottom: 20 }}>{modal.item?.id ? 'Editar movimiento' : 'Nuevo movimiento'}</div>
                <div style={{ display: 'grid', gap: 14 }}>
                  <div><label style={LBL}>Fecha *</label><input type="date" value={movForm.fecha} onChange={e => setMovForm(f => ({...f, fecha: e.target.value}))} style={INP} /></div>
                  <div><label style={LBL}>Descripción *</label><input value={movForm.descripcion} onChange={e => setMovForm(f => ({...f, descripcion: e.target.value}))} style={INP} placeholder="Concepto del movimiento" /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div><label style={LBL}>Débito (egreso)</label><input type="number" value={movForm.debito} onChange={e => setMovForm(f => ({...f, debito: e.target.value}))} style={INP} placeholder="0.00" /></div>
                    <div><label style={LBL}>Crédito (ingreso)</label><input type="number" value={movForm.credito} onChange={e => setMovForm(f => ({...f, credito: e.target.value}))} style={INP} placeholder="0.00" /></div>
                  </div>
                  <div><label style={LBL}>Cuenta bancaria</label>
                    <select value={movForm.cuenta_bancaria_id} onChange={e => setMovForm(f => ({...f, cuenta_bancaria_id: e.target.value}))} style={SEL}>
                      <option value="">Sin cuenta</option>
                      {cuentas.map((c: any) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                  </div>
                  <div><label style={LBL}>Tipo</label>
                    <select value={movForm.tipo_movimiento} onChange={e => setMovForm(f => ({...f, tipo_movimiento: e.target.value}))} style={SEL}>
                      <option value="ingreso">Ingreso</option>
                      <option value="gasto">Gasto</option>
                      <option value="transferencia">Transferencia</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Clasificar */}
            {modal.type === 'clasificar' && (
              <>
                <div style={{ color: 'white', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Clasificar movimiento</div>
                <div style={{ color: '#71717a', fontSize: 13, marginBottom: 20 }}>{modal.item?.descripcion}</div>
                <div style={{ display: 'grid', gap: 14 }}>
                  <div><label style={LBL}>Cuenta Contable</label>
                    <select value={clasificarForm.cuenta_contable_id} onChange={e => setClasificarForm(f => ({...f, cuenta_contable_id: e.target.value}))} style={SEL}>
                      <option value="">Sin cuenta contable</option>
                      {contables.map((c: any) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                  </div>
                  <div><label style={LBL}>Rubro</label>
                    <select value={clasificarForm.rubro_id} onChange={e => setClasificarForm(f => ({...f, rubro_id: e.target.value}))} style={SEL}>
                      <option value="">Sin rubro</option>
                      {rubros.map((r: any) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                    </select>
                  </div>
                  <div><label style={LBL}>Estado</label>
                    <select value={clasificarForm.estado} onChange={e => setClasificarForm(f => ({...f, estado: e.target.value}))} style={SEL}>
                      {CI_MOV_ESTADOS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Cuenta bancaria */}
            {modal.type === 'cuenta' && (
              <>
                <div style={{ color: 'white', fontSize: 16, fontWeight: 700, marginBottom: 20 }}>{modal.item?.id ? 'Editar cuenta' : 'Nueva cuenta bancaria'}</div>
                <div style={{ display: 'grid', gap: 14 }}>
                  <div><label style={LBL}>Nombre *</label><input value={cuentaForm.nombre} onChange={e => setCuentaForm(f => ({...f, nombre: e.target.value}))} style={INP} placeholder="Ej: Cuenta corriente BNA" /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div><label style={LBL}>Banco</label><input value={cuentaForm.banco} onChange={e => setCuentaForm(f => ({...f, banco: e.target.value}))} style={INP} placeholder="BNA, Galicia..." /></div>
                    <div><label style={LBL}>Número</label><input value={cuentaForm.numero_cuenta} onChange={e => setCuentaForm(f => ({...f, numero_cuenta: e.target.value}))} style={INP} /></div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div><label style={LBL}>Tipo</label>
                      <select value={cuentaForm.tipo} onChange={e => setCuentaForm(f => ({...f, tipo: e.target.value}))} style={SEL}>
                        <option value="corriente">Corriente</option>
                        <option value="ahorro">Ahorro</option>
                        <option value="caja_ahorro">Caja de ahorro</option>
                        <option value="otro">Otro</option>
                      </select>
                    </div>
                    <div><label style={LBL}>Saldo inicial</label><input type="number" value={cuentaForm.saldo_inicial} onChange={e => setCuentaForm(f => ({...f, saldo_inicial: e.target.value}))} style={INP} placeholder="0.00" /></div>
                  </div>
                </div>
              </>
            )}

            {/* Rubro */}
            {modal.type === 'rubro' && (
              <>
                <div style={{ color: 'white', fontSize: 16, fontWeight: 700, marginBottom: 20 }}>{modal.item?.id ? 'Editar rubro' : 'Nuevo rubro'}</div>
                <div style={{ display: 'grid', gap: 14 }}>
                  <div><label style={LBL}>Nombre *</label><input value={rubroForm.nombre} onChange={e => setRubroForm(f => ({...f, nombre: e.target.value}))} style={INP} placeholder="Ej: Servicios, Sueldos..." /></div>
                  <div><label style={LBL}>Categoría</label>
                    <select value={rubroForm.categoria} onChange={e => setRubroForm(f => ({...f, categoria: e.target.value}))} style={SEL}>
                      {CI_CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Cuenta contable */}
            {modal.type === 'contable' && (
              <>
                <div style={{ color: 'white', fontSize: 16, fontWeight: 700, marginBottom: 20 }}>{modal.item?.id ? 'Editar cuenta contable' : 'Nueva cuenta contable'}</div>
                <div style={{ display: 'grid', gap: 14 }}>
                  <div><label style={LBL}>Nombre *</label><input value={contForm.nombre} onChange={e => setContForm(f => ({...f, nombre: e.target.value}))} style={INP} placeholder="Ej: Honorarios, Alquileres..." /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div><label style={LBL}>Tipo</label>
                      <select value={contForm.tipo} onChange={e => setContForm(f => ({...f, tipo: e.target.value}))} style={SEL}>
                        <option value="ingreso">Ingreso</option>
                        <option value="gasto">Gasto</option>
                        <option value="neutro">Neutro</option>
                      </select>
                    </div>
                    <div><label style={LBL}>Rubro</label>
                      <select value={contForm.rubro_id} onChange={e => setContForm(f => ({...f, rubro_id: e.target.value}))} style={SEL}>
                        <option value="">Sin rubro</option>
                        {rubros.map((r: any) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={LBL}>Keywords (separadas por coma)</label>
                    <input value={contForm.keywords} onChange={e => setContForm(f => ({...f, keywords: e.target.value}))} style={INP} placeholder="pago, honorario, factura..." />
                    <div style={{ color: '#52525b', fontSize: 11, marginTop: 4 }}>Se usan para auto-clasificar movimientos</div>
                  </div>
                </div>
              </>
            )}

            {saveError && <div style={{ color: '#f87171', fontSize: 13, marginTop: 14, padding: '8px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: 8 }}>{saveError}</div>}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 22 }}>
              <button onClick={closeModal} style={BTN_S}>Cancelar</button>
              <button onClick={saveModal} disabled={saving} style={{ ...BTN_P, opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
