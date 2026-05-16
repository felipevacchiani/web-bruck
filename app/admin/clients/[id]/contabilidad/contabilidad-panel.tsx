'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { MONTHS, CI_MOV_ESTADOS } from '@/lib/supabase/types'

interface Props {
  clientId?: string
  clientName: string
  apiBase?: string
  backHref?: string
  backLabel?: string
}

type Tab = 'dashboard' | 'movimientos' | 'bancos' | 'cuentas' | 'contables' | 'rubros'

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(n)
const fmtDate = (d: string) =>
  new Date(d + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })

function cleanNum(s: string): number {
  s = String(s).trim().replace(/\s/g, '')
  if (!s) return 0
  const lastDot = s.lastIndexOf('.')
  const lastComma = s.lastIndexOf(',')
  if (lastComma > lastDot) return parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0
  if (lastDot > lastComma && lastComma !== -1) return parseFloat(s.replace(/,/g, '')) || 0
  return parseFloat(s) || 0
}

function normDate(s: string): string {
  s = s.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  return s
}

interface ParsedRow {
  fecha: string
  descripcion: string
  cuentaName: string
  cuenta_contable_id: string
  monto: number
  debito: number
  credito: number
  tipo_movimiento: string
  error?: string
}

function parsePaste(text: string, contables: any[]): ParsedRow[] {
  return text
    .trim()
    .split('\n')
    .filter(l => l.trim())
    .map(line => {
      const cols = line.split('\t')
      const fecha = normDate(cols[0]?.trim() || '')
      const descripcion = cols[1]?.trim() || ''
      const cuentaName = cols[2]?.trim() || ''
      const monto = cleanNum(cols[3]?.trim() || '0')
      const cont = contables.find(c => c.nombre.toLowerCase() === cuentaName.toLowerCase())
      let debito = 0, credito = 0, tipo_movimiento = 'gasto'
      if (cont) {
        if (cont.tipo === 'ingreso') { credito = Math.abs(monto); tipo_movimiento = 'ingreso' }
        else if (cont.tipo === 'gasto') { debito = Math.abs(monto); tipo_movimiento = 'gasto' }
        else { monto >= 0 ? (credito = monto, tipo_movimiento = 'ingreso') : (debito = Math.abs(monto), tipo_movimiento = 'gasto') }
      } else {
        monto >= 0 ? (credito = monto, tipo_movimiento = 'ingreso') : (debito = Math.abs(monto), tipo_movimiento = 'gasto')
      }
      const error = !fecha
        ? 'Fecha inválida'
        : !descripcion
        ? 'Descripción requerida'
        : !cont && cuentaName
        ? `Cuenta "${cuentaName}" no encontrada`
        : undefined
      return { fecha, descripcion, cuentaName, cuenta_contable_id: cont?.id || '', monto, debito, credito, tipo_movimiento, error }
    })
}

interface CSVRow {
  fecha: string
  descripcion: string
  debito: number
  credito: number
  error?: string
}

function parseCSV(text: string): CSVRow[] {
  const lines = text.trim().split('\n').filter(l => l.trim())
  if (!lines.length) return []
  const firstCol = lines[0]?.split(/[\t;,]/)[0]?.trim() || ''
  const isHeader = isNaN(new Date(normDate(firstCol)).getTime()) || firstCol.toLowerCase().includes('fecha')
  const dataLines = isHeader ? lines.slice(1) : lines
  return dataLines.map(line => {
    const sep = line.includes('\t') ? '\t' : line.includes(';') ? ';' : ','
    const cols = line.split(sep)
    const fecha = normDate(cols[0]?.trim() || '')
    const descripcion = cols[1]?.trim() || ''
    const c2 = cleanNum(cols[2]?.trim() || '0')
    const c3 = cleanNum(cols[3]?.trim() || '0')
    let debito = 0, credito = 0
    if (cols.length <= 3) {
      c2 >= 0 ? (credito = c2) : (debito = Math.abs(c2))
    } else {
      debito = c2; credito = c3
    }
    const error = !fecha ? 'Fecha inválida' : !descripcion ? 'Descripción requerida' : undefined
    return { fecha, descripcion, debito, credito, error }
  })
}

const INP: React.CSSProperties = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', outline: 'none', width: '100%', color: 'white', fontSize: 13, borderRadius: 9, padding: '9px 12px', boxSizing: 'border-box' }
const SEL: React.CSSProperties = { ...{ appearance: 'none' } as any, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', outline: 'none', width: '100%', color: 'white', fontSize: 13, borderRadius: 9, padding: '9px 12px', boxSizing: 'border-box' }
const LBL: React.CSSProperties = { color: '#a1a1aa', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }
const BTN_P: React.CSSProperties = { background: 'linear-gradient(135deg,#31AE79,#27a06d)', color: 'white', fontWeight: 600, fontSize: 13, padding: '9px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }
const BTN_S: React.CSSProperties = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#71717a', fontSize: 12, padding: '7px 13px', borderRadius: 8, cursor: 'pointer' }

export default function ContabilidadPanel({ clientId, clientName, apiBase: apiBaseProp, backHref, backLabel }: Props) {
  const base = apiBaseProp ?? `/api/admin/ci/${clientId}`

  const [tab, setTab] = useState<Tab>('dashboard')
  const [dashboard, setDash] = useState<any>(null)
  const [movs, setMovs] = useState<any[]>([])
  const [movCount, setMovCount] = useState(0)
  const [movPage, setMovPage] = useState(1)
  const [movPages, setMovPages] = useState(1)
  const [cuentas, setCuentas] = useState<any[]>([])
  const [rubros, setRubros] = useState<any[]>([])
  const [contables, setContables] = useState<any[]>([])

  // Filtros movimientos
  const [fCuenta, setFCuenta] = useState('')
  const [fMes, setFMes] = useState('')
  const [fAnio, setFAnio] = useState('')
  const [fEstado, setFEstado] = useState('')
  const [fQ, setFQ] = useState('')

  // Modal
  const [modal, setModal] = useState<{ type: string; item?: any } | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  // Forms
  const [movForm, setMovForm] = useState({ fecha: '', descripcion: '', monto: '', cuenta_bancaria_id: '', cuenta_contable_id: '', tipo_movimiento: 'gasto' })
  const [cuentaForm, setCuentaForm] = useState({ nombre: '', banco: '', numero_cuenta: '', tipo: 'corriente', saldo_inicial: '', disponible: '' })
  const [rubroForm, setRubroForm] = useState({ nombre: '' })
  const [contForm, setContForm] = useState({ nombre: '', tipo: 'gasto', rubro_id: '', keywords: '' })
  const [clasificarForm, setClasificarForm] = useState({ cuenta_contable_id: '', rubro_id: '', estado: 'conciliado' })

  // Movimientos modal mode
  const [movModalMode, setMovModalMode] = useState<'manual' | 'masiva'>('manual')
  const [pasteText, setPasteText] = useState('')
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [bulkResult, setBulkResult] = useState<{ saved: number; errors: number } | null>(null)

  // Bancos tab
  const [bCuenta, setBCuenta] = useState('')
  const [bMes, setBMes] = useState('')
  const [bAnio, setBAnio] = useState('')
  const [bEstado, setBEstado] = useState('')
  const [bMovs, setBMovs] = useState<any[]>([])
  const [bMovCount, setBMovCount] = useState(0)
  const [bMovPage, setBMovPage] = useState(1)
  const [bMovPages, setBMovPages] = useState(1)
  const [bBulkModal, setBBulkModal] = useState(false)
  const [bPasteText, setBPasteText] = useState('')
  const [bParsedRows, setBParsedRows] = useState<CSVRow[]>([])
  const [bBulkResult, setBBulkResult] = useState<{ saved: number; errors: number } | null>(null)
  const csvRef = useRef<HTMLInputElement>(null)

  const loadDash = useCallback(async () => {
    const r = await fetch(`${base}/dashboard`); const d = await r.json(); setDash(d)
  }, [base])
  const loadCuentas = useCallback(async () => {
    const r = await fetch(`${base}/cuentas-bancarias`); const d = await r.json(); setCuentas(d.data || [])
  }, [base])
  const loadRubros = useCallback(async () => {
    const r = await fetch(`${base}/rubros`); const d = await r.json(); setRubros(d.data || [])
  }, [base])
  const loadContab = useCallback(async () => {
    const r = await fetch(`${base}/cuentas-contables`); const d = await r.json(); setContables(d.data || [])
  }, [base])

  const loadMovs = useCallback(async (page = 1) => {
    const p = new URLSearchParams({ page: String(page) })
    if (fCuenta) p.set('cuenta', fCuenta)
    if (fMes) p.set('mes', fMes)
    if (fAnio) p.set('anio', fAnio)
    if (fEstado) p.set('estado', fEstado)
    if (fQ) p.set('q', fQ)
    const r = await fetch(`${base}/movimientos?${p}`)
    const d = await r.json()
    setMovs(d.data || []); setMovCount(d.count || 0); setMovPage(d.page || 1); setMovPages(d.pages || 1)
  }, [base, fCuenta, fMes, fAnio, fEstado, fQ])

  const loadBankMovs = useCallback(async (page = 1) => {
    if (!bCuenta) { setBMovs([]); setBMovCount(0); return }
    const p = new URLSearchParams({ page: String(page), cuenta: bCuenta })
    if (bMes) p.set('mes', bMes)
    if (bAnio) p.set('anio', bAnio)
    if (bEstado) p.set('estado', bEstado)
    const r = await fetch(`${base}/movimientos?${p}`)
    const d = await r.json()
    setBMovs(d.data || []); setBMovCount(d.count || 0); setBMovPage(d.page || 1); setBMovPages(d.pages || 1)
  }, [base, bCuenta, bMes, bAnio, bEstado])

  useEffect(() => { loadDash(); loadCuentas(); loadRubros(); loadContab() }, [loadDash, loadCuentas, loadRubros, loadContab])
  useEffect(() => { if (tab === 'movimientos') loadMovs(1) }, [tab, loadMovs])
  useEffect(() => { if (tab === 'bancos' && bCuenta) loadBankMovs(1) }, [tab, bCuenta, loadBankMovs])

  const selectedContable = contables.find(c => c.id === movForm.cuenta_contable_id)

  function calcDebitCredit(monto: number, contable: any, tipo: string): { debito: number; credito: number } {
    if (contable) {
      if (contable.tipo === 'ingreso') return { debito: 0, credito: Math.abs(monto) }
      if (contable.tipo === 'gasto') return { debito: Math.abs(monto), credito: 0 }
      return monto >= 0 ? { debito: 0, credito: monto } : { debito: Math.abs(monto), credito: 0 }
    }
    if (tipo === 'ingreso') return { debito: 0, credito: Math.abs(monto) }
    return { debito: Math.abs(monto), credito: 0 }
  }

  const openModal = (type: string, item?: any) => {
    setSaveError(''); setBulkResult(null); setPasteText(''); setParsedRows([])
    setMovModalMode('manual')
    if (type === 'mov') setMovForm({
      fecha: item?.fecha || '',
      descripcion: item?.descripcion || '',
      monto: String(item ? (item.credito > 0 ? item.credito : item.debito) : ''),
      cuenta_bancaria_id: item?.cuenta_bancaria_id || '',
      cuenta_contable_id: item?.cuenta_contable_id || '',
      tipo_movimiento: item?.tipo_movimiento || 'gasto',
    })
    if (type === 'cuenta') setCuentaForm({ nombre: item?.nombre || '', banco: item?.banco || '', numero_cuenta: item?.numero_cuenta || '', tipo: item?.tipo || 'corriente', saldo_inicial: String(item?.saldo_inicial || ''), disponible: String(item?.disponible || '') })
    if (type === 'rubro') setRubroForm({ nombre: item?.nombre || '' })
    if (type === 'contable') setContForm({ nombre: item?.nombre || '', tipo: item?.tipo || 'gasto', rubro_id: item?.rubro_id || '', keywords: item?.keywords ? (typeof item.keywords === 'string' ? JSON.parse(item.keywords).join(', ') : item.keywords.join(', ')) : '' })
    if (type === 'clasificar') setClasificarForm({ cuenta_contable_id: item?.cuenta_contable_id || '', rubro_id: item?.rubro_id || '', estado: 'conciliado' })
    setModal({ type, item })
  }
  const closeModal = () => setModal(null)

  const apiDelete = async (endpoint: string, id: string) => {
    if (!confirm('¿Eliminar este elemento?')) return
    await fetch(`${base}/${endpoint}/${id}`, { method: 'DELETE' })
    if (endpoint === 'rubros') { loadRubros(); loadDash() }
    if (endpoint === 'cuentas-bancarias') { loadCuentas(); loadDash() }
    if (endpoint === 'cuentas-contables') { loadContab() }
    if (endpoint === 'movimientos') { loadMovs(movPage); loadBankMovs(bMovPage); loadDash() }
  }

  const saveModal = async () => {
    setSaving(true); setSaveError('')
    try {
      const { type, item } = modal!
      let endpoint = ''; let body: any = {}; const isEdit = !!item?.id

      if (type === 'mov') {
        endpoint = 'movimientos'
        const monto = cleanNum(movForm.monto)
        const { debito, credito } = calcDebitCredit(monto, selectedContable, movForm.tipo_movimiento)
        const tipoFinal = selectedContable
          ? (selectedContable.tipo === 'ingreso' ? 'ingreso' : selectedContable.tipo === 'gasto' ? 'gasto' : movForm.tipo_movimiento)
          : movForm.tipo_movimiento
        body = { fecha: movForm.fecha, descripcion: movForm.descripcion, debito, credito, cuenta_bancaria_id: movForm.cuenta_bancaria_id || null, cuenta_contable_id: movForm.cuenta_contable_id || null, tipo_movimiento: tipoFinal }
        if (!movForm.fecha || !movForm.descripcion) { setSaveError('Fecha y descripción requeridos'); return }
      }
      if (type === 'cuenta') { endpoint = 'cuentas-bancarias'; body = { ...cuentaForm, saldo_inicial: parseFloat(cuentaForm.saldo_inicial) || 0, disponible: parseFloat(cuentaForm.disponible) || 0 } }
      if (type === 'rubro') { endpoint = 'rubros'; body = rubroForm }
      if (type === 'contable') { endpoint = 'cuentas-contables'; body = { ...contForm, keywords: contForm.keywords ? contForm.keywords.split(',').map((k: string) => k.trim()).filter(Boolean) : [] } }
      if (type === 'clasificar') {
        const res = await fetch(`${base}/movimientos/${item.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...clasificarForm, clasificacion_origen: 'manual' }) })
        if (!res.ok) { const d = await res.json(); setSaveError(d.error || 'Error'); return }
        closeModal(); loadMovs(movPage); loadBankMovs(bMovPage); loadDash(); return
      }

      const url = isEdit ? `${base}/${endpoint}/${item.id}` : `${base}/${endpoint}`
      const res = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) { setSaveError(data.error || 'Error al guardar'); return }
      closeModal()
      if (endpoint === 'movimientos') { loadMovs(movPage); loadBankMovs(bMovPage); loadDash() }
      if (endpoint === 'cuentas-bancarias') { loadCuentas(); loadDash() }
      if (endpoint === 'rubros') { loadRubros(); loadDash() }
      if (endpoint === 'cuentas-contables') { loadContab() }
    } finally { setSaving(false) }
  }

  const saveBulkMov = async () => {
    const valid = parsedRows.filter(r => !r.error)
    if (!valid.length) return
    setSaving(true); setBulkResult(null)
    let saved = 0, errors = 0
    for (const row of valid) {
      const body = { fecha: row.fecha, descripcion: row.descripcion, debito: row.debito, credito: row.credito, cuenta_contable_id: row.cuenta_contable_id || null, tipo_movimiento: row.tipo_movimiento, cuenta_bancaria_id: movForm.cuenta_bancaria_id || null }
      const res = await fetch(`${base}/movimientos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      res.ok ? saved++ : errors++
    }
    setSaving(false); setBulkResult({ saved, errors })
    if (saved > 0) { loadMovs(1); loadDash() }
  }

  const saveBankBulk = async () => {
    const valid = bParsedRows.filter(r => !r.error)
    if (!valid.length || !bCuenta) return
    setSaving(true); setBBulkResult(null)
    let saved = 0, errors = 0
    for (const row of valid) {
      const body = { fecha: row.fecha, descripcion: row.descripcion, debito: row.debito, credito: row.credito, cuenta_bancaria_id: bCuenta, tipo_movimiento: row.credito > 0 ? 'ingreso' : 'gasto' }
      const res = await fetch(`${base}/movimientos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      res.ok ? saved++ : errors++
    }
    setSaving(false); setBBulkResult({ saved, errors })
    if (saved > 0) { loadBankMovs(1); loadDash() }
  }

  const handleCSVFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result as string
      setBPasteText(text)
      setBParsedRows(parseCSV(text))
    }
    reader.readAsText(file, 'UTF-8')
    e.target.value = ''
  }

  const conciliarAll = async () => {
    const pendientes = bMovs.filter(m => m.estado !== 'conciliado')
    if (!pendientes.length) return
    if (!confirm(`¿Marcar ${pendientes.length} movimientos como conciliados?`)) return
    for (const m of pendientes) {
      await fetch(`${base}/movimientos/${m.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estado: 'conciliado', clasificacion_origen: 'manual' }) })
    }
    loadBankMovs(bMovPage)
  }

  const statusStyle = (estado: string) => {
    const s = CI_MOV_ESTADOS.find(e => e.value === estado)
    return s ? { color: s.color, background: s.bg, border: `1px solid ${s.border}` } : {}
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'movimientos', label: 'Movimientos' },
    { id: 'bancos', label: '🏦 Bancos' },
    { id: 'cuentas', label: 'Cuentas Bancarias' },
    { id: 'contables', label: 'Cuentas Contables' },
    { id: 'rubros', label: 'Rubros' },
  ]

  const bCuentaObj = cuentas.find(c => c.id === bCuenta)
  const bSaldoCredito = bMovs.reduce((s, m) => s + (m.credito || 0), 0)
  const bSaldoDebito = bMovs.reduce((s, m) => s + (m.debito || 0), 0)

  return (
    <div style={{ minHeight: '100vh', background: '#080808' }}>
      <style>{`
        select option { background: #111; }
        .page-pad { padding: 24px; }
        .tab-cont { overflow-x: auto; }
        @media(max-width:640px){ .page-pad { padding: 14px; } }
        textarea { resize: vertical; }
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
            <Link href={backHref ?? `/admin/clients/${clientId}`} style={{ color: '#52525b', fontSize: 12, textDecoration: 'none' }}>← {backLabel ?? clientName}</Link>
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
                      { label: 'Saldo estimado', value: fmt(dashboard.saldoActual || 0), color: dashboard.saldoActual >= 0 ? '#34d399' : '#f87171' },
                      { label: 'Ingresos este mes', value: fmt(dashboard.ingresosMes || 0), color: '#34d399' },
                      { label: 'Egresos este mes', value: fmt(dashboard.egresosMes || 0), color: '#f87171' },
                      { label: 'Movimientos', value: dashboard.totalMovs || 0, color: 'white' },
                      { label: 'Pendientes', value: dashboard.pendientes || 0, color: '#facc15' },
                      { label: 'Conciliados', value: dashboard.conciliados || 0, color: '#34d399' },
                    ].map(s => (
                      <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px 18px' }}>
                        <div style={{ color: '#71717a', fontSize: 11, marginBottom: 6 }}>{s.label}</div>
                        <div style={{ color: s.color, fontSize: 20, fontWeight: 700 }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                  {dashboard.resumenRubros?.length > 0 ? (
                    <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#a1a1aa', fontSize: 13, fontWeight: 600 }}>Resumen por Rubro</div>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                            {['Rubro', 'Ingresos', 'Egresos', 'Neto'].map(h => (
                              <th key={h} style={{ textAlign: 'left', color: '#52525b', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '8px 14px', fontWeight: 500 }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {dashboard.resumenRubros.map((r: any, i: number) => (
                            <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                              <td style={{ padding: '10px 14px', color: 'white', fontSize: 13 }}>{r.nombre}</td>
                              <td style={{ padding: '10px 14px', color: '#34d399', fontSize: 13 }}>{fmt(r.credito)}</td>
                              <td style={{ padding: '10px 14px', color: '#f87171', fontSize: 13 }}>{fmt(r.debito)}</td>
                              <td style={{ padding: '10px 14px', color: r.credito - r.debito >= 0 ? '#34d399' : '#f87171', fontSize: 13, fontWeight: 600 }}>{fmt(r.credito - r.debito)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '40px', textAlign: 'center' }}>
                      <div style={{ color: '#52525b', fontSize: 13 }}>Sin movimientos clasificados por rubro todavía.</div>
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
                <input placeholder="Buscar..." value={fQ} onChange={e => setFQ(e.target.value)} style={{ ...INP, width: 180 }} />
                <select value={fCuenta} onChange={e => setFCuenta(e.target.value)} style={{ ...SEL, width: 160 }}>
                  <option value="">Todas las cuentas</option>
                  {cuentas.map((c: any) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
                <select value={fMes} onChange={e => setFMes(e.target.value)} style={{ ...SEL, width: 110 }}>
                  <option value="">Mes</option>
                  {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                </select>
                <select value={fAnio} onChange={e => setFAnio(e.target.value)} style={{ ...SEL, width: 90 }}>
                  <option value="">Año</option>
                  {[2026, 2025, 2024, 2023].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <select value={fEstado} onChange={e => setFEstado(e.target.value)} style={{ ...SEL, width: 120 }}>
                  <option value="">Estado</option>
                  {CI_MOV_ESTADOS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <button onClick={() => loadMovs(1)} style={BTN_S}>Filtrar</button>
                <div style={{ flex: 1 }} />
                <button onClick={() => openModal('mov')} style={BTN_P}><span>+</span> Nuevo movimiento</button>
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
                  {movPage > 1 && <button onClick={() => { setMovPage(p => p - 1); loadMovs(movPage - 1) }} style={BTN_S}>← Anterior</button>}
                  <span style={{ color: '#52525b', fontSize: 12, alignSelf: 'center' }}>Pág {movPage} / {movPages}</span>
                  {movPage < movPages && <button onClick={() => { setMovPage(p => p + 1); loadMovs(movPage + 1) }} style={BTN_S}>Siguiente →</button>}
                </div>
              )}
            </div>
          )}

          {/* ── BANCOS ── */}
          {tab === 'bancos' && (
            <div>
              <input ref={csvRef} type="file" accept=".csv,.txt,.tsv" style={{ display: 'none' }} onChange={handleCSVFile} />

              {/* Filtros */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px 18px', marginBottom: 20 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
                  <div style={{ flex: '1 1 200px', minWidth: 200 }}>
                    <label style={LBL}>Cuenta bancaria</label>
                    <select value={bCuenta} onChange={e => setBCuenta(e.target.value)} style={SEL}>
                      <option value="">Seleccionar cuenta...</option>
                      {cuentas.map((c: any) => <option key={c.id} value={c.id}>{c.nombre}{c.banco ? ` — ${c.banco}` : ''}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: '0 1 110px' }}>
                    <label style={LBL}>Mes</label>
                    <select value={bMes} onChange={e => setBMes(e.target.value)} style={SEL}>
                      <option value="">Todos</option>
                      {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: '0 1 90px' }}>
                    <label style={LBL}>Año</label>
                    <select value={bAnio} onChange={e => setBAnio(e.target.value)} style={SEL}>
                      <option value="">Todos</option>
                      {[2026, 2025, 2024, 2023].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: '0 1 120px' }}>
                    <label style={LBL}>Estado</label>
                    <select value={bEstado} onChange={e => setBEstado(e.target.value)} style={SEL}>
                      <option value="">Todos</option>
                      {CI_MOV_ESTADOS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  <button onClick={() => loadBankMovs(1)} style={BTN_S}>Filtrar</button>
                </div>
              </div>

              {!bCuenta ? (
                <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '60px', textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>🏦</div>
                  <div style={{ color: '#52525b', fontSize: 14, marginBottom: 6 }}>Seleccioná una cuenta bancaria para ver sus movimientos</div>
                  <div style={{ color: '#3f3f46', fontSize: 12 }}>Usá el selector de arriba</div>
                </div>
              ) : (
                <>
                  {/* KPIs de la cuenta */}
                  {bCuentaObj && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, marginBottom: 20 }}>
                      {[
                        { label: 'Saldo inicial', value: fmt(bCuentaObj.saldo_inicial || 0), color: 'white' },
                        { label: 'Disponible', value: fmt(bCuentaObj.disponible || 0), color: '#60a5fa' },
                        { label: 'Total créditos', value: fmt(bSaldoCredito), color: '#34d399' },
                        { label: 'Total débitos', value: fmt(bSaldoDebito), color: '#f87171' },
                        { label: 'Movimientos', value: bMovCount, color: 'white' },
                        { label: 'Pendientes', value: bMovs.filter(m => m.estado === 'pendiente').length, color: '#facc15' },
                      ].map(s => (
                        <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 16px' }}>
                          <div style={{ color: '#71717a', fontSize: 11, marginBottom: 4 }}>{s.label}</div>
                          <div style={{ color: s.color, fontSize: 17, fontWeight: 700 }}>{s.value}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Acciones */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                    <button onClick={() => {
                      setSaveError(''); setMovModalMode('manual')
                      setMovForm(f => ({ ...f, cuenta_bancaria_id: bCuenta, fecha: '', descripcion: '', monto: '', cuenta_contable_id: '' }))
                      setModal({ type: 'mov' })
                    }} style={BTN_P}><span>+</span> Movimiento manual</button>
                    <button onClick={() => { setBBulkModal(true); setBPasteText(''); setBParsedRows([]); setBBulkResult(null) }} style={{ ...BTN_S, color: '#a78bfa', border: '1px solid rgba(167,139,250,0.3)' }}>⇓ Carga masiva</button>
                    <button onClick={() => csvRef.current?.click()} style={{ ...BTN_S, color: '#60a5fa', border: '1px solid rgba(96,165,250,0.3)' }}>📂 Importar CSV</button>
                    <div style={{ flex: 1 }} />
                    {bMovs.some(m => m.estado !== 'conciliado') && (
                      <button onClick={conciliarAll} style={{ ...BTN_S, color: '#34d399', border: '1px solid rgba(52,211,153,0.3)' }}>✓ Conciliar todo</button>
                    )}
                  </div>

                  <div style={{ color: '#52525b', fontSize: 12, marginBottom: 10 }}>{bMovCount} movimiento{bMovCount !== 1 ? 's' : ''}</div>

                  {!bMovs.length ? (
                    <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '40px', textAlign: 'center' }}>
                      <div style={{ color: '#52525b', fontSize: 13 }}>No hay movimientos para esta cuenta en el período seleccionado.</div>
                    </div>
                  ) : (
                    <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            {['Fecha', 'Descripción', 'Débito', 'Crédito', 'Estado', 'C.Contable', ''].map(h => (
                              <th key={h} style={{ textAlign: 'left', color: '#52525b', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '9px 12px', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {bMovs.map((m: any, i: number) => (
                            <tr key={m.id} style={{ borderTop: i ? '1px solid rgba(255,255,255,0.04)' : undefined }}>
                              <td style={{ padding: '10px 12px', color: '#a1a1aa', fontSize: 12, whiteSpace: 'nowrap' }}>{fmtDate(m.fecha)}</td>
                              <td style={{ padding: '10px 12px', color: 'white', fontSize: 12, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.descripcion}</td>
                              <td style={{ padding: '10px 12px', color: '#f87171', fontSize: 12, whiteSpace: 'nowrap' }}>{m.debito > 0 ? fmt(m.debito) : '—'}</td>
                              <td style={{ padding: '10px 12px', color: '#34d399', fontSize: 12, whiteSpace: 'nowrap' }}>{m.credito > 0 ? fmt(m.credito) : '—'}</td>
                              <td style={{ padding: '10px 12px' }}>
                                <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6, ...statusStyle(m.estado) }}>
                                  {CI_MOV_ESTADOS.find(e => e.value === m.estado)?.label || m.estado}
                                </span>
                              </td>
                              <td style={{ padding: '10px 12px', color: '#71717a', fontSize: 11, whiteSpace: 'nowrap' }}>{m.cuenta_contable?.nombre || '—'}</td>
                              <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                                <div style={{ display: 'flex', gap: 5 }}>
                                  <button onClick={() => openModal('clasificar', m)} style={{ ...BTN_S, fontSize: 11, padding: '4px 9px', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.2)' }}>Clasificar</button>
                                  {m.estado !== 'conciliado' && (
                                    <button onClick={async () => {
                                      await fetch(`${base}/movimientos/${m.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estado: 'conciliado', clasificacion_origen: 'manual' }) })
                                      loadBankMovs(bMovPage)
                                    }} style={{ ...BTN_S, fontSize: 11, padding: '4px 9px', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}>✓</button>
                                  )}
                                  <button onClick={() => apiDelete('movimientos', m.id)} style={{ ...BTN_S, fontSize: 11, padding: '4px 9px', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}>✕</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {bMovPages > 1 && (
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
                      {bMovPage > 1 && <button onClick={() => { setBMovPage(p => p - 1); loadBankMovs(bMovPage - 1) }} style={BTN_S}>← Anterior</button>}
                      <span style={{ color: '#52525b', fontSize: 12, alignSelf: 'center' }}>Pág {bMovPage} / {bMovPages}</span>
                      {bMovPage < bMovPages && <button onClick={() => { setBMovPage(p => p + 1); loadBankMovs(bMovPage + 1) }} style={BTN_S}>Siguiente →</button>}
                    </div>
                  )}
                </>
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
                      <div style={{ color: '#52525b', fontSize: 11, marginBottom: 12 }}>{c.tipo}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div>
                          <div style={{ color: '#3f3f46', fontSize: 10, marginBottom: 2 }}>Saldo inicial</div>
                          <div style={{ color: '#a1a1aa', fontSize: 15, fontWeight: 600 }}>{fmt(c.saldo_inicial || 0)}</div>
                        </div>
                        <div>
                          <div style={{ color: '#3f3f46', fontSize: 10, marginBottom: 2 }}>Disponible</div>
                          <div style={{ color: '#60a5fa', fontSize: 15, fontWeight: 700 }}>{fmt(c.disponible || 0)}</div>
                        </div>
                      </div>
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
                        {['Nombre', 'Tipo', 'Rubro', 'Keywords', ''].map(h => (
                          <th key={h} style={{ textAlign: 'left', color: '#52525b', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '9px 14px', fontWeight: 500 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {contables.map((c: any, i: number) => {
                        let kw: string[] = []
                        try { kw = JSON.parse(c.keywords || '[]') } catch {}
                        return (
                          <tr key={c.id} style={{ borderTop: i ? '1px solid rgba(255,255,255,0.04)' : undefined }}>
                            <td style={{ padding: '10px 14px', color: 'white', fontSize: 13 }}>{c.nombre}</td>
                            <td style={{ padding: '10px 14px' }}>
                              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: c.tipo === 'ingreso' ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)', color: c.tipo === 'ingreso' ? '#34d399' : '#f87171' }}>{c.tipo}</span>
                            </td>
                            <td style={{ padding: '10px 14px', color: '#71717a', fontSize: 12 }}>{c.rubro?.nombre || '—'}</td>
                            <td style={{ padding: '10px 14px', color: '#52525b', fontSize: 11, maxWidth: 200 }}>
                              {kw.slice(0, 3).join(', ')}{kw.length > 3 ? ` +${kw.length - 3}` : ''}
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                              <div style={{ display: 'flex', gap: 5 }}>
                                <button onClick={() => openModal('contable', c)} style={{ ...BTN_S, fontSize: 11, padding: '3px 8px' }}>✎</button>
                                <button onClick={() => apiDelete('cuentas-contables', c.id)} style={{ ...BTN_S, fontSize: 11, padding: '3px 8px', color: '#f87171' }}>✕</button>
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
                  {rubros.map((r: any) => (
                    <div key={r.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>{r.nombre}</div>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button onClick={() => openModal('rubro', r)} style={{ ...BTN_S, fontSize: 11, padding: '3px 8px' }}>✎</button>
                        <button onClick={() => apiDelete('rubros', r.id)} style={{ ...BTN_S, fontSize: 11, padding: '3px 8px', color: '#f87171' }}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* ══ MODAL MOVIMIENTO — pantalla completa ══ */}
      {modal && modal.type === 'mov' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', background: '#080808' }}>
          {/* Header del modal */}
          <div style={{ background: '#0d0d0d', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 52, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
              <span style={{ color: 'white', fontSize: 15, fontWeight: 700, marginRight: 24 }}>
                {modal.item?.id ? 'Editar movimiento' : 'Nuevo movimiento'}
              </span>
              {!modal.item?.id && (
                <>
                  <button onClick={() => { setMovModalMode('manual'); setBulkResult(null) }} style={{ background: 'none', border: 'none', borderBottom: movModalMode === 'manual' ? '2px solid #31AE79' : '2px solid transparent', color: movModalMode === 'manual' ? '#31AE79' : '#71717a', fontSize: 13, fontWeight: movModalMode === 'manual' ? 600 : 400, padding: '14px 16px', cursor: 'pointer', marginBottom: -1 }}>Manual</button>
                  <button onClick={() => { setMovModalMode('masiva'); setBulkResult(null) }} style={{ background: 'none', border: 'none', borderBottom: movModalMode === 'masiva' ? '2px solid #31AE79' : '2px solid transparent', color: movModalMode === 'masiva' ? '#31AE79' : '#71717a', fontSize: 13, fontWeight: movModalMode === 'masiva' ? 600 : 400, padding: '14px 16px', cursor: 'pointer', marginBottom: -1 }}>Carga masiva</button>
                </>
              )}
            </div>
            <button onClick={closeModal} style={{ ...BTN_S, fontSize: 13 }}>✕ Cerrar</button>
          </div>

          {/* Contenido */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '32px 24px' }}>
            {movModalMode === 'manual' && (
              <div style={{ maxWidth: 560, margin: '0 auto' }}>
                <div style={{ display: 'grid', gap: 18 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={LBL}>Fecha *</label>
                      <input type="date" value={movForm.fecha} onChange={e => setMovForm(f => ({ ...f, fecha: e.target.value }))} style={INP} />
                    </div>
                    <div>
                      <label style={LBL}>Monto *</label>
                      <input type="number" step="0.01" value={movForm.monto} onChange={e => setMovForm(f => ({ ...f, monto: e.target.value }))} style={INP} placeholder="0.00" />
                    </div>
                  </div>
                  <div>
                    <label style={LBL}>Descripción *</label>
                    <input value={movForm.descripcion} onChange={e => setMovForm(f => ({ ...f, descripcion: e.target.value }))} style={INP} placeholder="Concepto del movimiento" />
                  </div>
                  <div>
                    <label style={LBL}>Cuenta Contable</label>
                    <select value={movForm.cuenta_contable_id} onChange={e => setMovForm(f => ({ ...f, cuenta_contable_id: e.target.value }))} style={SEL}>
                      <option value="">Sin cuenta contable</option>
                      {contables.map((c: any) => <option key={c.id} value={c.id}>{c.nombre} ({c.tipo})</option>)}
                    </select>
                    {selectedContable && (
                      <div style={{ color: selectedContable.tipo === 'ingreso' ? '#34d399' : selectedContable.tipo === 'gasto' ? '#f87171' : '#71717a', fontSize: 11, marginTop: 5, paddingLeft: 2 }}>
                        → El monto se registra como {selectedContable.tipo === 'ingreso' ? 'crédito (ingreso)' : selectedContable.tipo === 'gasto' ? 'débito (egreso)' : 'neutro (según signo)'}
                      </div>
                    )}
                  </div>
                  <div>
                    <label style={LBL}>Cuenta bancaria</label>
                    <select value={movForm.cuenta_bancaria_id} onChange={e => setMovForm(f => ({ ...f, cuenta_bancaria_id: e.target.value }))} style={SEL}>
                      <option value="">Sin cuenta</option>
                      {cuentas.map((c: any) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                  </div>
                  {!selectedContable && (
                    <div>
                      <label style={LBL}>Tipo</label>
                      <select value={movForm.tipo_movimiento} onChange={e => setMovForm(f => ({ ...f, tipo_movimiento: e.target.value }))} style={SEL}>
                        <option value="ingreso">Ingreso (crédito)</option>
                        <option value="gasto">Gasto (débito)</option>
                        <option value="transferencia">Transferencia</option>
                      </select>
                    </div>
                  )}
                </div>
                {saveError && <div style={{ color: '#f87171', fontSize: 13, marginTop: 16, padding: '8px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: 8 }}>{saveError}</div>}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 28 }}>
                  <button onClick={closeModal} style={BTN_S}>Cancelar</button>
                  <button onClick={saveModal} disabled={saving} style={{ ...BTN_P, opacity: saving ? 0.6 : 1 }}>{saving ? 'Guardando...' : 'Guardar'}</button>
                </div>
              </div>
            )}

            {movModalMode === 'masiva' && (
              <div style={{ maxWidth: 960, margin: '0 auto' }}>
                <div style={{ marginBottom: 20, padding: '14px 18px', background: 'rgba(49,174,121,0.06)', border: '1px solid rgba(49,174,121,0.15)', borderRadius: 12 }}>
                  <div style={{ color: '#31AE79', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Formato esperado</div>
                  <div style={{ color: '#71717a', fontSize: 13 }}>Copiá y pegá desde Excel o Google Sheets. Cuatro columnas separadas por tabulación:</div>
                  <div style={{ color: '#a1a1aa', fontSize: 12, fontFamily: 'monospace', marginTop: 8, padding: '8px 12px', background: 'rgba(0,0,0,0.3)', borderRadius: 8 }}>Fecha{'\t'}Descripción{'\t'}Cuenta Contable{'\t'}Monto</div>
                  <div style={{ color: '#52525b', fontSize: 11, marginTop: 8 }}>El signo del movimiento (débito/crédito) se determina automáticamente por el tipo de la cuenta contable.</div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={LBL}>Cuenta bancaria (se aplicará a todos los registros)</label>
                  <select value={movForm.cuenta_bancaria_id} onChange={e => setMovForm(f => ({ ...f, cuenta_bancaria_id: e.target.value }))} style={{ ...SEL, maxWidth: 320 }}>
                    <option value="">Sin cuenta bancaria</option>
                    {cuentas.map((c: any) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>

                <textarea
                  value={pasteText}
                  onChange={e => { setPasteText(e.target.value); setParsedRows(parsePaste(e.target.value, contables)) }}
                  placeholder={'Pegá aquí los datos desde Excel / Google Sheets...\n\nEjemplo:\n15/01/2025\tPago de alquiler\tAlquileres\t150000\n20/01/2025\tCobro honorarios\tHonorarios\t80000'}
                  style={{ ...INP, height: 180, fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6, marginBottom: 20 }}
                />

                {parsedRows.length > 0 && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <span style={{ color: '#a1a1aa', fontSize: 13, fontWeight: 600 }}>Vista previa</span>
                      <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 6, background: 'rgba(52,211,153,0.1)', color: '#34d399' }}>{parsedRows.filter(r => !r.error).length} válidos</span>
                      {parsedRows.filter(r => r.error).length > 0 && <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>{parsedRows.filter(r => r.error).length} con error</span>}
                    </div>
                    <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'auto', marginBottom: 20, maxHeight: 380 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
                        <thead>
                          <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                            {['#', 'Fecha', 'Descripción', 'Cuenta Contable', 'Monto', 'Tipo', 'Estado'].map(h => (
                              <th key={h} style={{ textAlign: 'left', color: '#52525b', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '8px 12px', fontWeight: 500 }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {parsedRows.map((r, i) => (
                            <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.04)', background: r.error ? 'rgba(239,68,68,0.04)' : undefined }}>
                              <td style={{ padding: '8px 12px', color: '#3f3f46', fontSize: 11 }}>{i + 1}</td>
                              <td style={{ padding: '8px 12px', color: '#a1a1aa', fontSize: 12 }}>{r.fecha || '—'}</td>
                              <td style={{ padding: '8px 12px', color: 'white', fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.descripcion || '—'}</td>
                              <td style={{ padding: '8px 12px', color: r.cuenta_contable_id ? '#a1a1aa' : '#f87171', fontSize: 12 }}>{r.cuentaName || '—'}</td>
                              <td style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600, color: r.credito > 0 ? '#34d399' : '#f87171' }}>{r.credito > 0 ? `+${fmt(r.credito)}` : r.debito > 0 ? `-${fmt(r.debito)}` : fmt(r.monto)}</td>
                              <td style={{ padding: '8px 12px' }}>
                                <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 5, background: r.tipo_movimiento === 'ingreso' ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)', color: r.tipo_movimiento === 'ingreso' ? '#34d399' : '#f87171' }}>{r.tipo_movimiento}</span>
                              </td>
                              <td style={{ padding: '8px 12px', fontSize: 11 }}>
                                {r.error ? <span style={{ color: '#f87171' }}>⚠ {r.error}</span> : <span style={{ color: '#34d399' }}>✓ OK</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {bulkResult && (
                      <div style={{ padding: '10px 16px', borderRadius: 10, background: bulkResult.errors > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(52,211,153,0.08)', border: `1px solid ${bulkResult.errors > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(52,211,153,0.2)'}`, marginBottom: 16, fontSize: 13, color: 'white' }}>
                        ✓ {bulkResult.saved} guardados{bulkResult.errors > 0 ? `, ${bulkResult.errors} con error` : ' correctamente'}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                      <button onClick={() => { setPasteText(''); setParsedRows([]); setBulkResult(null) }} style={BTN_S}>Limpiar</button>
                      <button onClick={saveBulkMov} disabled={saving || parsedRows.filter(r => !r.error).length === 0} style={{ ...BTN_P, opacity: (saving || parsedRows.filter(r => !r.error).length === 0) ? 0.6 : 1 }}>
                        {saving ? 'Importando...' : `Importar ${parsedRows.filter(r => !r.error).length} registro${parsedRows.filter(r => !r.error).length !== 1 ? 's' : ''}`}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ MODAL BANCO — carga masiva / importación CSV ══ */}
      {bBulkModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', background: '#080808' }}>
          <div style={{ background: '#0d0d0d', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 52, flexShrink: 0 }}>
            <span style={{ color: 'white', fontSize: 15, fontWeight: 700 }}>🏦 Carga masiva bancaria — {bCuentaObj?.nombre}</span>
            <button onClick={() => setBBulkModal(false)} style={{ ...BTN_S, fontSize: 13 }}>✕ Cerrar</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '32px 24px' }}>
            <div style={{ maxWidth: 960, margin: '0 auto' }}>
              <div style={{ marginBottom: 20, padding: '14px 18px', background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.15)', borderRadius: 12 }}>
                <div style={{ color: '#60a5fa', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Formato de importación</div>
                <div style={{ color: '#71717a', fontSize: 13 }}>Pegá desde tu extracto bancario (Excel/Sheets) o importá un archivo CSV. Formatos aceptados:</div>
                <div style={{ color: '#a1a1aa', fontSize: 12, fontFamily: 'monospace', marginTop: 8, padding: '6px 12px', background: 'rgba(0,0,0,0.3)', borderRadius: 8 }}>Fecha{'\t'}Descripción{'\t'}Débito{'\t'}Crédito</div>
                <div style={{ color: '#a1a1aa', fontSize: 12, fontFamily: 'monospace', marginTop: 4, padding: '6px 12px', background: 'rgba(0,0,0,0.3)', borderRadius: 8 }}>Fecha{'\t'}Descripción{'\t'}Monto {'(positivo = crédito, negativo = débito)'}</div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <button onClick={() => csvRef.current?.click()} style={{ ...BTN_S, color: '#60a5fa', border: '1px solid rgba(96,165,250,0.3)', fontSize: 12 }}>📂 Importar desde archivo CSV</button>
              </div>

              <textarea
                value={bPasteText}
                onChange={e => { setBPasteText(e.target.value); setBParsedRows(parseCSV(e.target.value)) }}
                placeholder={'Pegá aquí el extracto bancario...\n\nEjemplo:\n15/01/2025\tTransferencia recibida\t\t50000\n16/01/2025\tPago proveedor\t30000\t'}
                style={{ ...INP, height: 180, fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6, marginBottom: 20 }}
              />

              {bParsedRows.length > 0 && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <span style={{ color: '#a1a1aa', fontSize: 13, fontWeight: 600 }}>Vista previa</span>
                    <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 6, background: 'rgba(52,211,153,0.1)', color: '#34d399' }}>{bParsedRows.filter(r => !r.error).length} válidos</span>
                    {bParsedRows.filter(r => r.error).length > 0 && <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>{bParsedRows.filter(r => r.error).length} con error</span>}
                  </div>
                  <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'auto', marginBottom: 20, maxHeight: 380 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
                      <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                          {['#', 'Fecha', 'Descripción', 'Débito', 'Crédito', 'Estado'].map(h => (
                            <th key={h} style={{ textAlign: 'left', color: '#52525b', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '8px 12px', fontWeight: 500 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {bParsedRows.map((r, i) => (
                          <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.04)', background: r.error ? 'rgba(239,68,68,0.04)' : undefined }}>
                            <td style={{ padding: '8px 12px', color: '#3f3f46', fontSize: 11 }}>{i + 1}</td>
                            <td style={{ padding: '8px 12px', color: '#a1a1aa', fontSize: 12 }}>{r.fecha || '—'}</td>
                            <td style={{ padding: '8px 12px', color: 'white', fontSize: 12, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.descripcion || '—'}</td>
                            <td style={{ padding: '8px 12px', color: '#f87171', fontSize: 12 }}>{r.debito > 0 ? fmt(r.debito) : '—'}</td>
                            <td style={{ padding: '8px 12px', color: '#34d399', fontSize: 12 }}>{r.credito > 0 ? fmt(r.credito) : '—'}</td>
                            <td style={{ padding: '8px 12px', fontSize: 11 }}>
                              {r.error ? <span style={{ color: '#f87171' }}>⚠ {r.error}</span> : <span style={{ color: '#34d399' }}>✓ OK</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {bBulkResult && (
                    <div style={{ padding: '10px 16px', borderRadius: 10, background: bBulkResult.errors > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(52,211,153,0.08)', border: `1px solid ${bBulkResult.errors > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(52,211,153,0.2)'}`, marginBottom: 16, fontSize: 13, color: 'white' }}>
                      ✓ {bBulkResult.saved} importados{bBulkResult.errors > 0 ? `, ${bBulkResult.errors} con error` : ' correctamente'}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button onClick={() => { setBPasteText(''); setBParsedRows([]); setBBulkResult(null) }} style={BTN_S}>Limpiar</button>
                    <button onClick={saveBankBulk} disabled={saving || bParsedRows.filter(r => !r.error).length === 0} style={{ ...BTN_P, opacity: (saving || bParsedRows.filter(r => !r.error).length === 0) ? 0.6 : 1 }}>
                      {saving ? 'Importando...' : `Importar ${bParsedRows.filter(r => !r.error).length} registro${bParsedRows.filter(r => !r.error).length !== 1 ? 's' : ''}`}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ MODALES PEQUEÑOS: clasificar, cuenta, rubro, contable ══ */}
      {modal && modal.type !== 'mov' && (
        <div onClick={closeModal} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, padding: '24px', width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>

            {modal.type === 'clasificar' && (
              <>
                <div style={{ color: 'white', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Clasificar movimiento</div>
                <div style={{ color: '#71717a', fontSize: 13, marginBottom: 20 }}>{modal.item?.descripcion}</div>
                <div style={{ display: 'grid', gap: 14 }}>
                  <div><label style={LBL}>Cuenta Contable</label>
                    <select value={clasificarForm.cuenta_contable_id} onChange={e => setClasificarForm(f => ({ ...f, cuenta_contable_id: e.target.value }))} style={SEL}>
                      <option value="">Sin cuenta contable</option>
                      {contables.map((c: any) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                  </div>
                  <div><label style={LBL}>Rubro</label>
                    <select value={clasificarForm.rubro_id} onChange={e => setClasificarForm(f => ({ ...f, rubro_id: e.target.value }))} style={SEL}>
                      <option value="">Sin rubro</option>
                      {rubros.map((r: any) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                    </select>
                  </div>
                  <div><label style={LBL}>Estado</label>
                    <select value={clasificarForm.estado} onChange={e => setClasificarForm(f => ({ ...f, estado: e.target.value }))} style={SEL}>
                      {CI_MOV_ESTADOS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                </div>
              </>
            )}

            {modal.type === 'cuenta' && (
              <>
                <div style={{ color: 'white', fontSize: 16, fontWeight: 700, marginBottom: 20 }}>{modal.item?.id ? 'Editar cuenta' : 'Nueva cuenta bancaria'}</div>
                <div style={{ display: 'grid', gap: 14 }}>
                  <div><label style={LBL}>Nombre *</label><input value={cuentaForm.nombre} onChange={e => setCuentaForm(f => ({ ...f, nombre: e.target.value }))} style={INP} placeholder="Ej: Cuenta corriente BNA" /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div><label style={LBL}>Banco</label><input value={cuentaForm.banco} onChange={e => setCuentaForm(f => ({ ...f, banco: e.target.value }))} style={INP} placeholder="BNA, Galicia..." /></div>
                    <div><label style={LBL}>Número</label><input value={cuentaForm.numero_cuenta} onChange={e => setCuentaForm(f => ({ ...f, numero_cuenta: e.target.value }))} style={INP} /></div>
                  </div>
                  <div><label style={LBL}>Tipo</label>
                    <select value={cuentaForm.tipo} onChange={e => setCuentaForm(f => ({ ...f, tipo: e.target.value }))} style={SEL}>
                      <option value="corriente">Corriente</option>
                      <option value="ahorro">Ahorro</option>
                      <option value="caja_ahorro">Caja de ahorro</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div><label style={LBL}>Saldo inicial</label><input type="number" value={cuentaForm.saldo_inicial} onChange={e => setCuentaForm(f => ({ ...f, saldo_inicial: e.target.value }))} style={INP} placeholder="0.00" /></div>
                    <div><label style={LBL}>Disponible actual</label><input type="number" value={cuentaForm.disponible} onChange={e => setCuentaForm(f => ({ ...f, disponible: e.target.value }))} style={INP} placeholder="0.00" /></div>
                  </div>
                </div>
              </>
            )}

            {modal.type === 'rubro' && (
              <>
                <div style={{ color: 'white', fontSize: 16, fontWeight: 700, marginBottom: 20 }}>{modal.item?.id ? 'Editar rubro' : 'Nuevo rubro'}</div>
                <div style={{ display: 'grid', gap: 14 }}>
                  <div><label style={LBL}>Nombre *</label><input value={rubroForm.nombre} onChange={e => setRubroForm(f => ({ ...f, nombre: e.target.value }))} style={INP} placeholder="Ej: Servicios, Sueldos, Alquileres..." /></div>
                </div>
              </>
            )}

            {modal.type === 'contable' && (
              <>
                <div style={{ color: 'white', fontSize: 16, fontWeight: 700, marginBottom: 20 }}>{modal.item?.id ? 'Editar cuenta contable' : 'Nueva cuenta contable'}</div>
                <div style={{ display: 'grid', gap: 14 }}>
                  <div><label style={LBL}>Nombre *</label><input value={contForm.nombre} onChange={e => setContForm(f => ({ ...f, nombre: e.target.value }))} style={INP} placeholder="Ej: Honorarios, Alquileres..." /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div><label style={LBL}>Tipo</label>
                      <select value={contForm.tipo} onChange={e => setContForm(f => ({ ...f, tipo: e.target.value }))} style={SEL}>
                        <option value="ingreso">Ingreso</option>
                        <option value="gasto">Gasto</option>
                        <option value="neutro">Neutro</option>
                      </select>
                    </div>
                    <div><label style={LBL}>Rubro</label>
                      <select value={contForm.rubro_id} onChange={e => setContForm(f => ({ ...f, rubro_id: e.target.value }))} style={SEL}>
                        <option value="">Sin rubro</option>
                        {rubros.map((r: any) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={LBL}>Keywords (separadas por coma)</label>
                    <input value={contForm.keywords} onChange={e => setContForm(f => ({ ...f, keywords: e.target.value }))} style={INP} placeholder="pago, honorario, factura..." />
                    <div style={{ color: '#52525b', fontSize: 11, marginTop: 4 }}>Se usan para auto-clasificar movimientos</div>
                  </div>
                </div>
              </>
            )}

            {saveError && <div style={{ color: '#f87171', fontSize: 13, marginTop: 14, padding: '8px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: 8 }}>{saveError}</div>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 22 }}>
              <button onClick={closeModal} style={BTN_S}>Cancelar</button>
              <button onClick={saveModal} disabled={saving} style={{ ...BTN_P, opacity: saving ? 0.6 : 1 }}>{saving ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
