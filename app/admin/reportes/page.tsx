'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FILE_CATEGORIES, DOC_STATUSES, FISCAL_YEARS, type FileCategory, type DocStatus } from '@/lib/supabase/types'

interface Client {
  id: string
  full_name: string | null
  company: string | null
  email: string
}

export default function ReportesPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [clientId, setClientId] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const [fiscalYear, setFiscalYear] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/admin/clients-list')
      .then(r => r.json())
      .then(d => setClients(d.clients || []))
      .catch(() => {})
  }, [])

  function buildUrl() {
    const params = new URLSearchParams()
    if (clientId)   params.set('client_id', clientId)
    if (category)   params.set('category', category)
    if (status)     params.set('status', status)
    if (fiscalYear) params.set('fiscal_year', fiscalYear)
    return `/api/admin/reports?${params.toString()}`
  }

  async function handleExport() {
    setLoading(true)
    try {
      const res = await fetch(buildUrl())
      if (!res.ok) { alert('Error al generar el reporte'); return }
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `bruck-reporte-${new Date().toISOString().slice(0,10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setLoading(false)
    }
  }

  const select: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    color: 'white',
    fontSize: 13,
    padding: '10px 14px',
    width: '100%',
    outline: 'none',
    appearance: 'none' as const,
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080808' }}>
      <style>{`
        .page-pad { padding: 32px 24px; }
        select option { background: #111; color: white; }
        @media(max-width:640px){ .page-pad { padding: 20px 14px; } }
      `}</style>

      <header style={{ position: 'sticky', top: 0, zIndex: 10, borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(10,10,10,0.97)', backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 24px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,rgba(49,174,121,0.2),rgba(49,174,121,0.08))', border: '1px solid rgba(49,174,121,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#31AE79', fontWeight: 900, fontSize: 13 }}>B</span>
              </div>
              <span style={{ color: 'white', fontWeight: 900, letterSpacing: '0.2em', fontSize: 13 }}>BRUCK</span>
            </Link>
            <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />
            <span style={{ color: '#52525b', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Reportes</span>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#71717a', fontSize: 12, padding: '6px 12px', borderRadius: 8, cursor: 'pointer' }}>Salir</button>
          </form>
        </div>
      </header>

      <main style={{ maxWidth: 700, margin: '0 auto' }}>
        <div className="page-pad">
          <div style={{ color: 'white', fontSize: 17, fontWeight: 600, marginBottom: 6 }}>Exportar reporte</div>
          <div style={{ color: '#71717a', fontSize: 13, marginBottom: 28 }}>
            Generá un archivo CSV con el detalle de los documentos. Usá los filtros para acotar los resultados.
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '24px 20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ color: '#71717a', fontSize: 12, display: 'block', marginBottom: 6 }}>Cliente</label>
                <select style={select} value={clientId} onChange={e => setClientId(e.target.value)}>
                  <option value="">Todos los clientes</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.full_name || c.company || c.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ color: '#71717a', fontSize: 12, display: 'block', marginBottom: 6 }}>Categoría</label>
                <select style={select} value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="">Todas</option>
                  {FILE_CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ color: '#71717a', fontSize: 12, display: 'block', marginBottom: 6 }}>Estado</label>
                <select style={select} value={status} onChange={e => setStatus(e.target.value)}>
                  <option value="">Todos</option>
                  {DOC_STATUSES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ color: '#71717a', fontSize: 12, display: 'block', marginBottom: 6 }}>Año fiscal</label>
                <select style={select} value={fiscalYear} onChange={e => setFiscalYear(e.target.value)}>
                  <option value="">Todos</option>
                  {FISCAL_YEARS.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

            </div>

            <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={handleExport}
                disabled={loading}
                style={{
                  background: loading ? 'rgba(49,174,121,0.4)' : 'linear-gradient(135deg,#31AE79,#27a06d)',
                  color: 'white', fontWeight: 600, fontSize: 13,
                  padding: '10px 20px', borderRadius: 10, border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8,
                  boxShadow: '0 4px 16px rgba(49,174,121,0.28)',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1v8M4 7l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {loading ? 'Generando...' : 'Exportar CSV'}
              </button>
            </div>
          </div>

          {/* Info */}
          <div style={{ marginTop: 24, background: 'rgba(49,174,121,0.05)', border: '1px solid rgba(49,174,121,0.12)', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ color: '#31AE79', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>El reporte incluye</div>
            <div style={{ color: '#71717a', fontSize: 12, lineHeight: 1.7 }}>
              Nombre del documento · Título del grupo · Cliente y empresa · Categoría · Estado · Período fiscal · Fecha de vencimiento · Tamaño · Fecha de carga
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
