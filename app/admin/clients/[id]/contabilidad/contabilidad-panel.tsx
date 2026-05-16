'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import * as XLSX from 'xlsx'
import { MONTHS, CI_MOV_ESTADOS } from '@/lib/supabase/types'

interface Props {
  clientId?: string
  clientName: string
  apiBase?: string
  backHref?: string
  backLabel?: string
  defaultTab?: string
  onBack?: () => void
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
  cuenta_contable_id?: string
  cuenta_contable_nombre?: string
  autoClassified?: boolean
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

function autoClassifyRows(rows: CSVRow[], contables: any[]): CSVRow[] {
  return rows.map(row => {
    if (row.error) return row
    const desc = row.descripcion.toLowerCase()
    for (const c of contables) {
      let kw: string[] = []
      try { kw = JSON.parse(c.keywords || '[]') } catch {}
      if (kw.some(k => k.trim() && desc.includes(k.trim().toLowerCase()))) {
        return { ...row, cuenta_contable_id: c.id, cuenta_contable_nombre: c.nombre, autoClassified: true }
      }
    }
    return row
  })
}

const INP: React.CSSProperties = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', outline: 'none', width: '100%', color: 'white', fontSize: 13, borderRadius: 9, padding: '9px 12px', boxSizing: 'border-box' }
const SEL: React.CSSProperties = { ...{ appearance: 'none' } as any, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', outline: 'none', width: '100%', color: 'white', fontSize: 13, borderRadius: 9, padding: '9px 12px', boxSizing: 'border-box' }
const LBL: React.CSSProperties = { color: '#a1a1aa', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }
const BTN_P: React.CSSProperties = { background: 'linear-gradient(135deg,#31AE79,#27a06d)', color: 'white', fontWeight: 600, fontSize: 13, padding: '9px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }
const BTN_S: React.CSSProperties = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#71717a', fontSize: 12, padding: '7px 13px', borderRadius: 8, cursor: 'pointer' }

export default function ContabilidadPanel({ clientId, clientName, apiBase: apiBaseProp, backHref, backLabel, defaultTab, onBack }: Props) {
  const base = apiBaseProp ?? `/api/admin/ci/${clientId}`

  const [tab, setTab] = useState<Tab>((defaultTab as Tab) || 'dashboard')
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
  const [fEstado, setFEstado] = useState('')
  const [fQ, setFQ] = useState('')
  const [fDesde, setFDesde] = useState('')
  const [fHasta, setFHasta] = useState('')
  const [fOrigen, setFOrigen] = useState('')
  const [fRubro, setFRubro] = useState('')
  const [fContable, setFContable] = useState('')

  // Modal
  const [modal, setModal] = useState<{ type: string; item?: any } | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  // Forms
  const [movForm, setMovForm] = useState({ fecha: '', descripcion: '', monto: '', cuenta_bancaria_id: '', cuenta_contable_id: '', tipo_movimiento: 'gasto', factura: false, comentario: '' })
  const [cuentaForm, setCuentaForm] = useState({ nombre: '', banco: '', numero_cuenta: '', tipo: 'caja', saldo_inicial: '', disponible: '' })
  const [rubroForm, setRubroForm] = useState({ nombre: '' })
  const [contForm, setContForm] = useState({ nombre: '', tipo: 'gasto', rubro_id: '', keywords: '' })
  const [clasificarForm, setClasificarForm] = useState({ cuenta_contable_id: '', estado: 'conciliado', comentario: '' })

  // Movimientos modal mode
  const [movModalMode, setMovModalMode] = useState<'manual' | 'masiva'>('manual')
  const [pasteText, setPasteText] = useState('')
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [bulkResult, setBulkResult] = useState<{ saved: number; errors: number } | null>(null)

  // Grid de filas para carga rápida
  interface GridRow { fecha: string; monto: string; cuenta_contable_id: string; factura: boolean; descripcion: string }
  const newGridRow = (): GridRow => ({ fecha: new Date().toISOString().split('T')[0], monto: '', cuenta_contable_id: '', factura: false, descripcion: '' })
  const [gridRows, setGridRows] = useState<GridRow[]>([newGridRow()])
  const [gridCuenta, setGridCuenta] = useState('')
  const [gridSaving, setGridSaving] = useState(false)
  const [gridResult, setGridResult] = useState<{ saved: number; errors: number } | null>(null)

  const updateGridRow = (i: number, field: keyof GridRow, val: unknown) =>
    setGridRows(rows => rows.map((r, idx) => idx === i ? { ...r, [field]: val } : r))

  const saveGridRows = async () => {
    const valid = gridRows.filter(r => r.fecha && r.descripcion && r.monto)
    if (!valid.length) return
    setGridSaving(true); setGridResult(null)
    let saved = 0; let errors = 0
    for (const r of valid) {
      const contable = contables.find((c: any) => c.id === r.cuenta_contable_id)
      const monto = parseFloat(r.monto) || 0
      const { debito, credito } = calcDebitCredit(monto, contable, 'gasto')
      const tipo = contable ? (contable.tipo === 'ingreso' ? 'ingreso' : contable.tipo === 'gasto' ? 'gasto' : 'transferencia') : 'gasto'
      const res = await fetch(`${base}/movimientos`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha: r.fecha, descripcion: r.descripcion, debito, credito, tipo_movimiento: tipo, cuenta_bancaria_id: gridCuenta || null, cuenta_contable_id: r.cuenta_contable_id || null, factura: r.factura, comentario: null })
      })
      if (res.ok) saved++; else errors++
    }
    setGridResult({ saved, errors })
    setGridSaving(false)
    if (saved) { loadMovs(1); loadDash() }
    if (!errors) { setGridRows([newGridRow()]); setGridResult(null); closeModal() }
  }

  // Bancos tab
  const [bCuenta, setBCuenta] = useState('')
  const [bMes, setBMes] = useState('')
  const [bAnio, setBAnio] = useState('')
  const [bEstado, setBEstado] = useState('')
  const [bTipo, setBTipo] = useState('')
  const [bFactura, setBFactura] = useState('')
  const [bRubro, setBRubro] = useState('')

  // Inline row edits (movimientos)
  const [rowEdits, setRowEdits] = useState<Record<string, Record<string, unknown>>>({})
  const [rowSaving, setRowSaving] = useState<Record<string, boolean>>({})
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
    if (fCuenta)  p.set('cuenta', fCuenta)
    if (fEstado)  p.set('estado', fEstado)
    if (fQ)       p.set('q', fQ)
    if (fDesde)   p.set('desde', fDesde)
    if (fHasta)   p.set('hasta', fHasta)
    if (fOrigen)  p.set('origen', fOrigen)
    if (fRubro)   p.set('rubro', fRubro)
    if (fContable) p.set('contable', fContable)
    const r = await fetch(`${base}/movimientos?${p}`)
    const d = await r.json()
    setMovs(d.data || []); setMovCount(d.count || 0); setMovPage(d.page || 1); setMovPages(d.pages || 1)
  }, [base, fCuenta, fEstado, fQ, fDesde, fHasta, fOrigen, fRubro, fContable])

  const exportMovs = async () => {
    const p = new URLSearchParams({ page: '1', limit: '9999' })
    if (fCuenta)  p.set('cuenta', fCuenta)
    if (fEstado)  p.set('estado', fEstado)
    if (fQ)       p.set('q', fQ)
    if (fDesde)   p.set('desde', fDesde)
    if (fHasta)   p.set('hasta', fHasta)
    if (fOrigen)  p.set('origen', fOrigen)
    if (fRubro)   p.set('rubro', fRubro)
    if (fContable) p.set('contable', fContable)
    const r = await fetch(`${base}/movimientos?${p}`)
    const d = await r.json()
    const rows: any[] = d.data || []
    const headers = ['Fecha', 'Descripción', 'Débito', 'Crédito', 'Cuenta Bancaria', 'Cuenta Contable', 'Rubro', 'Estado', 'Factura', 'Comentario']
    const lines = [
      headers.join(';'),
      ...rows.map(m => [
        m.fecha, `"${(m.descripcion||'').replace(/"/g,'""')}"`,
        m.debito || 0, m.credito || 0,
        m.cuenta_bancaria?.nombre || '',
        m.cuenta_contable?.nombre || '',
        m.rubro?.nombre || '',
        m.estado || '', m.factura ? 'Sí' : 'No',
        `"${(m.comentario||'').replace(/"/g,'""')}"`
      ].join(';'))
    ]
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `movimientos_${new Date().toISOString().slice(0,10)}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  const loadBankMovs = useCallback(async (page = 1) => {
    if (!bCuenta) { setBMovs([]); setBMovCount(0); return }
    const p = new URLSearchParams({ page: String(page), cuenta: bCuenta })
    if (bMes) p.set('mes', bMes)
    if (bAnio) p.set('anio', bAnio)
    if (bEstado) p.set('estado', bEstado)
    if (bTipo) p.set('tipo', bTipo)
    if (bFactura) p.set('factura', bFactura)
    if (bRubro) p.set('rubro', bRubro)
    const r = await fetch(`${base}/movimientos?${p}`)
    const d = await r.json()
    setBMovs(d.data || []); setBMovCount(d.count || 0); setBMovPage(d.page || 1); setBMovPages(d.pages || 1)
  }, [base, bCuenta, bMes, bAnio, bEstado, bTipo, bFactura, bRubro])

  const inlineSave = useCallback(async (id: string, fields: Record<string, unknown>) => {
    setRowSaving(s => ({ ...s, [id]: true }))
    await fetch(`${base}/movimientos/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...fields, clasificacion_origen: 'manual' }) })
    setRowSaving(s => ({ ...s, [id]: false }))
    loadMovs(1)
  }, [base, loadMovs])

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
    if (type === 'clasificar') setClasificarForm({ cuenta_contable_id: item?.cuenta_contable_id || '', estado: 'conciliado', comentario: item?.comentario || '' })
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
        body = { fecha: movForm.fecha, descripcion: movForm.descripcion, debito, credito, cuenta_bancaria_id: movForm.cuenta_bancaria_id || null, cuenta_contable_id: movForm.cuenta_contable_id || null, tipo_movimiento: tipoFinal, factura: movForm.factura, comentario: movForm.comentario || null }
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
      const body = {
        fecha: row.fecha, descripcion: row.descripcion, debito: row.debito, credito: row.credito,
        cuenta_bancaria_id: bCuenta, tipo_movimiento: row.credito > 0 ? 'ingreso' : 'gasto',
        cuenta_contable_id: row.cuenta_contable_id || null,
        estado: row.autoClassified ? 'conciliado' : 'pendiente',
        clasificacion_origen: row.autoClassified ? 'auto' : null,
      }
      const res = await fetch(`${base}/movimientos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      res.ok ? saved++ : errors++
    }
    setSaving(false); setBBulkResult({ saved, errors })
    if (saved > 0) { loadBankMovs(1); loadDash() }
  }

  const handleCSVFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const isExcel = /\.(xlsx|xls)$/i.test(file.name)
    if (isExcel) {
      const reader = new FileReader()
      reader.onload = ev => {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const text = XLSX.utils.sheet_to_csv(ws)
        const rows = autoClassifyRows(parseCSV(text), contables)
        setBPasteText(text)
        setBParsedRows(rows)
        setBBulkModal(true); setBBulkResult(null)
      }
      reader.readAsArrayBuffer(file)
    } else {
      const reader = new FileReader()
      reader.onload = ev => {
        const text = ev.target?.result as string
        const rows = autoClassifyRows(parseCSV(text), contables)
        setBPasteText(text)
        setBParsedRows(rows)
        setBBulkModal(true); setBBulkResult(null)
      }
      reader.readAsText(file, 'UTF-8')
    }
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
    { id: 'bancos', label: 'Bancos' },
    { id: 'cuentas', label: 'Ctas Banc. y Caja' },
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
            {onBack
              ? <button onClick={onBack} style={{ color: '#52525b', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>← {backLabel ?? clientName}</button>
              : <Link href={backHref ?? `/admin/clients/${clientId}`} style={{ color: '#52525b', fontSize: 12, textDecoration: 'none' }}>← {backLabel ?? clientName}</Link>
            }
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
              {/* Filtros */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr 2fr', gap: 8, marginBottom: 8 }}>
                  <div>
                    <div style={{ color: '#52525b', fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Desde</div>
                    <input type="date" value={fDesde} onChange={e => setFDesde(e.target.value)} style={{ ...INP, fontSize: 12, padding: '7px 10px', colorScheme: 'dark' }} />
                  </div>
                  <div>
                    <div style={{ color: '#52525b', fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Hasta</div>
                    <input type="date" value={fHasta} onChange={e => setFHasta(e.target.value)} style={{ ...INP, fontSize: 12, padding: '7px 10px', colorScheme: 'dark' }} />
                  </div>
                  <div>
                    <div style={{ color: '#52525b', fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Origen</div>
                    <select value={fOrigen} onChange={e => setFOrigen(e.target.value)} style={{ ...SEL, fontSize: 12, padding: '7px 10px' }}>
                      <option value="">Todos</option>
                      <option value="banco">Banco</option>
                      <option value="caja">Caja</option>
                    </select>
                  </div>
                  <div>
                    <div style={{ color: '#52525b', fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Estado</div>
                    <select value={fEstado} onChange={e => setFEstado(e.target.value)} style={{ ...SEL, fontSize: 12, padding: '7px 10px' }}>
                      <option value="">Todos</option>
                      {CI_MOV_ESTADOS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ color: '#52525b', fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Rubro</div>
                    <select value={fRubro} onChange={e => setFRubro(e.target.value)} style={{ ...SEL, fontSize: 12, padding: '7px 10px' }}>
                      <option value="">Todos</option>
                      {rubros.map((r: any) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ color: '#52525b', fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Cta. Contable</div>
                    <select value={fContable} onChange={e => setFContable(e.target.value)} style={{ ...SEL, fontSize: 12, padding: '7px 10px' }}>
                      <option value="">Todas</option>
                      {contables.map((c: any) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ color: '#52525b', fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Buscar</div>
                    <input placeholder="Descripción..." value={fQ} onChange={e => setFQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && loadMovs(1)} style={{ ...INP, fontSize: 12, padding: '7px 10px' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div>
                    <div style={{ color: '#52525b', fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Cuenta Bancaria</div>
                    <select value={fCuenta} onChange={e => setFCuenta(e.target.value)} style={{ ...SEL, fontSize: 12, padding: '7px 10px', minWidth: 200 }}>
                      <option value="">Todas las cuentas</option>
                      {cuentas.map((c: any) => <option key={c.id} value={c.id}>{c.nombre}{c.banco ? ` — ${c.banco}` : ''}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }} />
                  {(fDesde || fHasta || fOrigen || fEstado || fRubro || fContable || fQ || fCuenta) && (
                    <button onClick={() => { setFDesde(''); setFHasta(''); setFOrigen(''); setFEstado(''); setFRubro(''); setFContable(''); setFQ(''); setFCuenta('') }} style={{ ...BTN_S, fontSize: 11, color: '#52525b' }}>✕ Limpiar</button>
                  )}
                  <button onClick={() => exportMovs()} style={{ ...BTN_S, color: '#34d399', border: '1px solid rgba(52,211,153,0.3)', fontSize: 12 }}>↓ Exportar</button>
                  <button onClick={() => loadMovs(1)} style={{ ...BTN_P, fontSize: 12, padding: '7px 16px' }}>Aplicar</button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ color: '#52525b', fontSize: 12 }}>{movCount} movimiento{movCount !== 1 ? 's' : ''}</div>
                <button onClick={() => openModal('mov')} style={BTN_P}><span>+</span> Nuevo movimiento</button>
              </div>
              {!movs.length ? (
                <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '48px', textAlign: 'center' }}>
                  <div style={{ color: '#52525b', fontSize: 13 }}>No hay movimientos registrados.</div>
                </div>
              ) : (
                <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        {['Fecha', 'Descripción', 'Monto', 'Cuenta', 'Factura', 'Comentario', 'Est.', ''].map(h => (
                          <th key={h} style={{ textAlign: 'left', color: '#52525b', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '7px 8px', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {movs.map((m: any, i: number) => (
                        <tr key={m.id} style={{ borderTop: i ? '1px solid rgba(255,255,255,0.04)' : undefined }}>
                          <td style={{ padding: '6px 8px', color: '#a1a1aa', fontSize: 11, whiteSpace: 'nowrap' }}>{fmtDate(m.fecha)}</td>
                          <td style={{ padding: '6px 8px', maxWidth: 200 }}>
                            <div style={{ color: 'white', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.descripcion}</div>
                          </td>
                          <td style={{ padding: '6px 8px', whiteSpace: 'nowrap' }}>
                            {m.debito > 0
                              ? <span style={{ color: '#f87171', fontSize: 11, fontWeight: 600 }}>{fmt(m.debito)} <span style={{ color: '#52525b', fontWeight: 400, fontSize: 10 }}>Déb</span></span>
                              : <span style={{ color: '#34d399', fontSize: 11, fontWeight: 600 }}>{fmt(m.credito)} <span style={{ color: '#52525b', fontWeight: 400, fontSize: 10 }}>Créd</span></span>
                            }
                          </td>
                          <td style={{ padding: '6px 8px', color: '#71717a', fontSize: 11, whiteSpace: 'nowrap' }}>{m.cuenta_bancaria?.nombre || '—'}</td>
                          <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={!!((rowEdits[m.id]?.factura ?? m.factura))}
                              onChange={e => {
                                const v = e.target.checked
                                setRowEdits(s => ({ ...s, [m.id]: { ...s[m.id], factura: v } }))
                                inlineSave(m.id, { factura: v })
                              }}
                              style={{ accentColor: '#31AE79', width: 14, height: 14, cursor: 'pointer' }}
                            />
                          </td>
                          <td style={{ padding: '6px 8px', minWidth: 130 }}>
                            <input
                              value={((rowEdits[m.id]?.comentario ?? m.comentario) as string) || ''}
                              onChange={e => setRowEdits(s => ({ ...s, [m.id]: { ...s[m.id], comentario: e.target.value } }))}
                              onBlur={e => inlineSave(m.id, { comentario: e.target.value })}
                              placeholder="Agregar comentario"
                              style={{ ...INP, fontSize: 11, padding: '3px 6px', background: 'transparent', border: '1px solid transparent', color: '#a1a1aa' }}
                              onFocus={e => { e.target.style.borderColor = 'rgba(255,255,255,0.15)'; e.target.style.background = 'rgba(255,255,255,0.04)' }}
                            />
                          </td>
                          <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                            <span title={CI_MOV_ESTADOS.find(e => e.value === m.estado)?.label || m.estado} style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: m.estado === 'conciliado' ? '#34d399' : m.estado === 'pendiente' ? '#fbbf24' : '#f87171', cursor: 'default' }} />
                          </td>
                          <td style={{ padding: '6px 8px', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button onClick={() => openModal('clasificar', m)} style={{ ...BTN_S, fontSize: 10, padding: '3px 8px', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.2)' }}>Clas.</button>
                              <button onClick={() => apiDelete('movimientos', m.id)} style={{ ...BTN_S, fontSize: 10, padding: '3px 7px', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}>✕</button>
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
              <input ref={csvRef} type="file" accept=".csv,.txt,.tsv,.xlsx,.xls" style={{ display: 'none' }} onChange={handleCSVFile} />

              {/* Filtros */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr auto', gap: 8, alignItems: 'end' }}>
                  <div>
                    <div style={{ color: '#52525b', fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Cuenta</div>
                    <select value={bCuenta} onChange={e => setBCuenta(e.target.value)} style={{ ...SEL, fontSize: 12, padding: '7px 10px' }}>
                      <option value="">Todas...</option>
                      {cuentas.map((c: any) => <option key={c.id} value={c.id}>{c.nombre}{c.banco ? ` — ${c.banco}` : ''}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ color: '#52525b', fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Mes</div>
                    <select value={bMes} onChange={e => setBMes(e.target.value)} style={{ ...SEL, fontSize: 12, padding: '7px 10px' }}>
                      <option value="">Todos</option>
                      {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ color: '#52525b', fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Año</div>
                    <select value={bAnio} onChange={e => setBAnio(e.target.value)} style={{ ...SEL, fontSize: 12, padding: '7px 10px' }}>
                      <option value="">Todos</option>
                      {[2026, 2025, 2024, 2023].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ color: '#52525b', fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Estado</div>
                    <select value={bEstado} onChange={e => setBEstado(e.target.value)} style={{ ...SEL, fontSize: 12, padding: '7px 10px' }}>
                      <option value="">Todos</option>
                      {CI_MOV_ESTADOS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ color: '#52525b', fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Tipo</div>
                    <select value={bTipo} onChange={e => setBTipo(e.target.value)} style={{ ...SEL, fontSize: 12, padding: '7px 10px' }}>
                      <option value="">Todos</option>
                      <option value="ingreso">Ingreso</option>
                      <option value="gasto">Gasto</option>
                      <option value="transferencia">Transfer.</option>
                    </select>
                  </div>
                  <div>
                    <div style={{ color: '#52525b', fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Factura</div>
                    <select value={bFactura} onChange={e => setBFactura(e.target.value)} style={{ ...SEL, fontSize: 12, padding: '7px 10px' }}>
                      <option value="">Todos</option>
                      <option value="true">Con</option>
                      <option value="false">Sin</option>
                    </select>
                  </div>
                  <div>
                    <div style={{ color: '#52525b', fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Rubro</div>
                    <select value={bRubro} onChange={e => setBRubro(e.target.value)} style={{ ...SEL, fontSize: 12, padding: '7px 10px' }}>
                      <option value="">Todos</option>
                      {rubros.map((r: any) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                    </select>
                  </div>
                  <button onClick={() => loadBankMovs(1)} style={{ ...BTN_S, fontSize: 12, padding: '7px 14px', whiteSpace: 'nowrap' }}>Filtrar</button>
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
                    <button onClick={() => csvRef.current?.click()} style={{ ...BTN_S, color: '#60a5fa', border: '1px solid rgba(96,165,250,0.3)' }}>📂 Importar archivo</button>
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
              <div style={{ maxWidth: 900, margin: '0 auto' }}>
                {/* Cuenta bancaria global */}
                <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <label style={{ ...LBL, marginBottom: 0, whiteSpace: 'nowrap' }}>Cuenta bancaria</label>
                  <select value={gridCuenta} onChange={e => setGridCuenta(e.target.value)} style={{ ...SEL, maxWidth: 260 }}>
                    <option value="">Sin cuenta</option>
                    {cuentas.map((c: any) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>

                {/* Grilla */}
                <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                        {['#', 'Fecha', 'Importe', 'Cta. Contable', 'Fac.', 'Descripción', ''].map(h => (
                          <th key={h} style={{ textAlign: 'left', color: '#52525b', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '9px 10px', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {gridRows.map((row, i) => {
                        const ctb = contables.find((c: any) => c.id === row.cuenta_contable_id)
                        const ingLabel = ctb ? (ctb.tipo === 'ingreso' ? 'Ing' : ctb.tipo === 'gasto' ? 'Eg' : '~') : null
                        const ingColor = ctb ? (ctb.tipo === 'ingreso' ? '#34d399' : ctb.tipo === 'gasto' ? '#f87171' : '#71717a') : null
                        return (
                          <tr key={i} style={{ borderTop: i ? '1px solid rgba(255,255,255,0.05)' : undefined }}>
                            <td style={{ padding: '7px 10px', color: '#52525b', fontSize: 12, width: 28 }}>{i + 1}</td>
                            <td style={{ padding: '5px 6px', width: 140 }}>
                              <input type="date" value={row.fecha} onChange={e => updateGridRow(i, 'fecha', e.target.value)}
                                style={{ ...INP, padding: '5px 8px', fontSize: 12 }} />
                            </td>
                            <td style={{ padding: '5px 6px', width: 120 }}>
                              <input type="number" step="0.01" value={row.monto} onChange={e => updateGridRow(i, 'monto', e.target.value)}
                                placeholder="0.00" style={{ ...INP, padding: '5px 8px', fontSize: 12 }} />
                            </td>
                            <td style={{ padding: '5px 6px', width: 200 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <select value={row.cuenta_contable_id} onChange={e => updateGridRow(i, 'cuenta_contable_id', e.target.value)}
                                  style={{ ...SEL, padding: '5px 8px', fontSize: 12, flex: 1 }}>
                                  <option value="">Sin cuenta</option>
                                  {contables.map((c: any) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                </select>
                                {ingLabel && <span style={{ fontSize: 11, fontWeight: 700, color: ingColor!, flexShrink: 0 }}>{ingLabel}</span>}
                              </div>
                            </td>
                            <td style={{ padding: '5px 6px', textAlign: 'center', width: 40 }}>
                              <input type="checkbox" checked={row.factura} onChange={e => updateGridRow(i, 'factura', e.target.checked)}
                                style={{ accentColor: '#31AE79', width: 15, height: 15, cursor: 'pointer' }} />
                            </td>
                            <td style={{ padding: '5px 6px' }}>
                              <input value={row.descripcion} onChange={e => updateGridRow(i, 'descripcion', e.target.value)}
                                placeholder="Descripción" style={{ ...INP, padding: '5px 8px', fontSize: 12 }} />
                            </td>
                            <td style={{ padding: '5px 6px', width: 32 }}>
                              {gridRows.length > 1 && (
                                <button onClick={() => setGridRows(rows => rows.filter((_, idx) => idx !== i))}
                                  style={{ ...BTN_S, padding: '3px 7px', color: '#f87171', border: 'none', fontSize: 13 }}>✕</button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <button onClick={() => setGridRows(rows => [...rows, newGridRow()])}
                  style={{ ...BTN_S, fontSize: 12, color: '#31AE79', border: '1px solid rgba(49,174,121,0.3)', marginBottom: 24 }}>
                  + Agregar fila
                </button>

                {gridResult && (
                  <div style={{ marginBottom: 16, padding: '8px 14px', borderRadius: 8, background: gridResult.errors ? 'rgba(239,68,68,0.08)' : 'rgba(52,211,153,0.08)', color: gridResult.errors ? '#f87171' : '#34d399', fontSize: 13 }}>
                    {gridResult.saved} guardado{gridResult.saved !== 1 ? 's' : ''}{gridResult.errors ? ` · ${gridResult.errors} con error` : ''}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button onClick={closeModal} style={BTN_S}>Cancelar</button>
                  <button onClick={saveGridRows} disabled={gridSaving} style={{ ...BTN_P, opacity: gridSaving ? 0.6 : 1 }}>
                    {gridSaving ? 'Guardando...' : `Guardar ${gridRows.filter(r => r.fecha && r.descripcion && r.monto).length} movimiento${gridRows.filter(r => r.fecha && r.descripcion && r.monto).length !== 1 ? 's' : ''}`}
                  </button>
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
                <button onClick={() => csvRef.current?.click()} style={{ ...BTN_S, color: '#60a5fa', border: '1px solid rgba(96,165,250,0.3)', fontSize: 12 }}>📂 Importar desde archivo (CSV / Excel)</button>
              </div>

              <textarea
                value={bPasteText}
                onChange={e => { setBPasteText(e.target.value); setBParsedRows(parseCSV(e.target.value)) }}
                placeholder={'Pegá aquí el extracto bancario...\n\nEjemplo:\n15/01/2025\tTransferencia recibida\t\t50000\n16/01/2025\tPago proveedor\t30000\t'}
                style={{ ...INP, height: 180, fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6, marginBottom: 20 }}
              />

              {bParsedRows.length > 0 && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                    <span style={{ color: '#a1a1aa', fontSize: 13, fontWeight: 600 }}>Vista previa</span>
                    <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 6, background: 'rgba(52,211,153,0.1)', color: '#34d399' }}>{bParsedRows.filter(r => !r.error).length} válidos</span>
                    {bParsedRows.filter(r => r.autoClassified).length > 0 && <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 6, background: 'rgba(96,165,250,0.1)', color: '#60a5fa' }}>✓ {bParsedRows.filter(r => r.autoClassified).length} clasificados automáticamente</span>}
                    {bParsedRows.filter(r => r.error).length > 0 && <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>{bParsedRows.filter(r => r.error).length} con error</span>}
                  </div>
                  <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'auto', marginBottom: 20, maxHeight: 380 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                      <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                          {['#', 'Fecha', 'Descripción', 'Débito', 'Crédito', 'C.Contable', 'Estado'].map(h => (
                            <th key={h} style={{ textAlign: 'left', color: '#52525b', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '8px 12px', fontWeight: 500 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {bParsedRows.map((r, i) => (
                          <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.04)', background: r.error ? 'rgba(239,68,68,0.04)' : undefined }}>
                            <td style={{ padding: '8px 12px', color: '#3f3f46', fontSize: 11 }}>{i + 1}</td>
                            <td style={{ padding: '8px 12px', color: '#a1a1aa', fontSize: 12, whiteSpace: 'nowrap' }}>{r.fecha || '—'}</td>
                            <td style={{ padding: '8px 12px', color: 'white', fontSize: 12, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.descripcion || '—'}</td>
                            <td style={{ padding: '8px 12px', color: '#f87171', fontSize: 12, whiteSpace: 'nowrap' }}>{r.debito > 0 ? fmt(r.debito) : '—'}</td>
                            <td style={{ padding: '8px 12px', color: '#34d399', fontSize: 12, whiteSpace: 'nowrap' }}>{r.credito > 0 ? fmt(r.credito) : '—'}</td>
                            <td style={{ padding: '8px 12px', fontSize: 11 }}>
                              {r.autoClassified ? <span style={{ color: '#60a5fa' }}>✓ {r.cuenta_contable_nombre}</span> : <span style={{ color: '#3f3f46' }}>—</span>}
                            </td>
                            <td style={{ padding: '8px 12px', fontSize: 11 }}>
                              {r.error ? <span style={{ color: '#f87171' }}>⚠ {r.error}</span> : r.autoClassified ? <span style={{ color: '#34d399' }}>Conciliado</span> : <span style={{ color: '#facc15' }}>Pendiente</span>}
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
                  <div><label style={LBL}>Estado</label>
                    <select value={clasificarForm.estado} onChange={e => setClasificarForm(f => ({ ...f, estado: e.target.value }))} style={SEL}>
                      {CI_MOV_ESTADOS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  <div><label style={LBL}>Comentario</label>
                    <textarea
                      value={clasificarForm.comentario}
                      onChange={e => setClasificarForm(f => ({ ...f, comentario: e.target.value }))}
                      placeholder="Opcional..."
                      rows={3}
                      style={{ ...INP, resize: 'vertical', height: 'auto' }}
                    />
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
                      <option value="caja">Caja</option>
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
