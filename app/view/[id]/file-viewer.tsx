'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { FileRecord } from '@/lib/supabase/types'
import { FILE_CATEGORIES } from '@/lib/supabase/types'

interface VersionEntry { id: string; version: number; created_at: string }
interface Props { file: FileRecord; signedUrl: string; versions?: VersionEntry[] }

const fmtDate = (d: string) => new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

export default function FileViewer({ file, signedUrl, versions = [] }: Props) {
  const router = useRouter()
  const [htmlContent, setHtmlContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [showVersions, setShowVersions] = useState(false)
  const cat = FILE_CATEGORIES.find(c => c.value === (file.category || 'otro'))

  useEffect(() => {
    fetch(signedUrl)
      .then(res => { if (!res.ok) throw new Error(); return res.text() })
      .then(html => { setHtmlContent(html); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [signedUrl])

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#F3EFE5' }}>
      <header style={{ flexShrink: 0, borderBottom: '1px solid rgba(18,23,20,0.08)', background: 'rgba(243,239,229,0.94)', backdropFilter: 'blur(12px)', padding: '0 18px', height: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <button onClick={() => router.push('/dashboard')}
            style={{ background: 'rgba(18,23,20,0.04)', border: '1px solid rgba(18,23,20,0.12)', color: '#4E5651', fontSize: 12, padding: '5px 12px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.color = '#4E5651'; e.currentTarget.style.borderColor = 'rgba(18,23,20,0.18)' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#4E5651'; e.currentTarget.style.borderColor = 'rgba(18,23,20,0.12)' }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8 2L4 6L8 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Volver
          </button>
          <div style={{ width: 1, height: 16, background: 'rgba(18,23,20,0.12)', flexShrink: 0 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            {cat && <span style={{ fontSize: 16, flexShrink: 0 }}>{cat.icon}</span>}
            <span style={{ color: '#121714', fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
            {file.description && <span style={{ color: '#858C87', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>· {file.description}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span style={{ color: '#858C87', fontSize: 11, whiteSpace: 'nowrap' }} title="Fecha de esta versión">
            Actualizado {fmtDate(file.created_at)}
          </span>
          {versions.length > 0 && (
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowVersions(s => !s)} style={{ background: 'rgba(18,23,20,0.04)', border: '1px solid rgba(18,23,20,0.12)', color: '#4E5651', fontSize: 11, padding: '4px 10px', borderRadius: 7, cursor: 'pointer' }}>
                v{file.version} · Historial ({versions.length})
              </button>
              {showVersions && (
                <>
                  <div onClick={() => setShowVersions(false)} style={{ position: 'fixed', inset: 0, zIndex: 19 }} />
                  <div style={{ position: 'absolute', top: 32, right: 0, width: 240, background: '#FFFFFF', border: '1px solid rgba(18,23,20,0.14)', borderRadius: 12, boxShadow: '0 12px 32px rgba(0,0,0,0.5)', zIndex: 20, overflow: 'hidden' }}>
                    {versions.map(v => (
                      <a key={v.id} href={`/view/${v.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', borderBottom: '1px solid rgba(18,23,20,0.06)', color: '#4E5651', fontSize: 12, textDecoration: 'none' }}>
                        <span>Versión {v.version}</span>
                        <span style={{ color: '#858C87', fontSize: 11 }}>{fmtDate(v.created_at)}</span>
                      </a>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          {cat && (
            <span style={{ color: '#858C87', fontSize: 11, padding: '3px 8px', background: 'rgba(18,23,20,0.06)', border: '1px solid rgba(18,23,20,0.10)', borderRadius: 6 }}>
              {cat.label}
            </span>
          )}
          <span style={{ color: '#121714', fontWeight: 900, letterSpacing: '0.2em', fontSize: 11 }}>BRUCK</span>
        </div>
      </header>

      <div style={{ flex: 1, position: 'relative' }}>
        {loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, background: '#F3EFE5' }}>
            <div style={{ width: 32, height: 32, border: '2px solid rgba(49,174,121,0.2)', borderTopColor: '#31AE79', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            <span style={{ color: '#858C87', fontSize: 13 }}>Cargando documento...</span>
          </div>
        )}
        {error && !loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7.5" stroke="#f87171" strokeWidth="1.5"/><path d="M10 6.5v4M10 12.5v.5" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            <p style={{ color: '#4E5651', fontSize: 13 }}>No se pudo cargar el documento.</p>
            <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', color: '#31AE79', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>
              Volver al portal
            </button>
          </div>
        )}
        {!loading && !error && htmlContent && (
          <iframe srcDoc={htmlContent} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', backgroundColor: 'white', colorScheme: 'light' } as React.CSSProperties}
            title={file.name} sandbox="allow-scripts allow-same-origin" />
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
