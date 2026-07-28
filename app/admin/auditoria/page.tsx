import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AUDIT_ACTION_LABELS, type AuditAction } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

function formatDatetime(str: string) {
  return new Date(str).toLocaleString('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const ACTION_COLORS: Record<AuditAction, { color: string; bg: string; border: string }> = {
  file_upload:        { color: '#34d399', bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.2)'  },
  file_delete:        { color: '#f87171', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)'   },
  file_status_change: { color: '#60a5fa', bg: 'rgba(96,165,250,0.08)',  border: 'rgba(96,165,250,0.2)'  },
  file_update:        { color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.2)' },
  client_create:      { color: '#34d399', bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.2)'  },
  client_update:      { color: '#fbbf24', bg: 'rgba(250,204,21,0.08)',  border: 'rgba(250,204,21,0.2)'  },
  client_delete:      { color: '#f87171', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)'   },
}

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; action?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminSb = createAdminClient()
  const { data: profile } = await adminSb.from('profiles').select('role, organization_id').eq('id', user.id).single()
  if (!['admin','super_admin'].includes(profile?.role)) redirect('/dashboard')
  const isSuperAdmin = profile?.role === 'super_admin'

  const sp = await searchParams
  const page   = Math.max(1, parseInt(sp.page || '1'))
  const action = sp.action || ''
  const limit  = 50
  const offset = (page - 1) * limit

  let query = adminSb
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (action) query = query.eq('action', action)

  if (!isSuperAdmin) query = query.eq('organization_id', profile?.organization_id)

  const { data: logs, count } = await query

  const totalPages = Math.ceil((count || 0) / limit)

  return (
    <div style={{ minHeight: '100vh', background: '#F3EFE5' }}>
      <style>{`
        .page-pad { padding: 32px 24px; }
        .audit-table { display: block; }
        .audit-cards { display: none; }
        @media(max-width:640px){
          .page-pad { padding: 20px 14px; }
          .audit-table { display: none; }
          .audit-cards { display: flex; flex-direction: column; gap: 8px; }
        }
      `}</style>

      <header style={{ position: 'sticky', top: 0, zIndex: 10, borderBottom: '1px solid rgba(18,23,20,0.08)', background: 'rgba(243,239,229,0.92)', backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,rgba(49,174,121,0.2),rgba(49,174,121,0.08))', border: '1px solid rgba(49,174,121,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#31AE79', fontWeight: 900, fontSize: 13 }}>B</span>
              </div>
              <span style={{ color: '#121714', fontWeight: 900, letterSpacing: '0.2em', fontSize: 13 }}>BRUCK</span>
            </Link>
            <div style={{ width: 1, height: 16, background: 'rgba(18,23,20,0.14)' }} />
            <span style={{ color: '#858C87', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Auditoría</span>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button style={{ background: 'rgba(18,23,20,0.04)', border: '1px solid rgba(18,23,20,0.12)', color: '#4E5651', fontSize: 12, padding: '6px 12px', borderRadius: 8, cursor: 'pointer' }}>Salir</button>
          </form>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="page-pad">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ color: '#121714', fontSize: 17, fontWeight: 600 }}>Registro de actividad</div>
              <div style={{ color: '#4E5651', fontSize: 13, marginTop: 2 }}>{count || 0} evento{(count||0)!==1?'s':''} registrado{(count||0)!==1?'s':''}</div>
            </div>

            {/* Filtros */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(['', 'file_upload', 'file_delete', 'file_status_change', 'client_create', 'client_delete'] as const).map(a => (
                <Link
                  key={a}
                  href={`/admin/auditoria${a ? `?action=${a}` : ''}`}
                  style={{
                    fontSize: 11,
                    padding: '5px 11px',
                    borderRadius: 7,
                    textDecoration: 'none',
                    border: action === a ? '1px solid rgba(49,174,121,0.4)' : '1px solid rgba(18,23,20,0.12)',
                    background: action === a ? 'rgba(49,174,121,0.1)' : 'rgba(18,23,20,0.05)',
                    color: action === a ? '#31AE79' : '#4E5651',
                  }}
                >
                  {a ? AUDIT_ACTION_LABELS[a as AuditAction] : 'Todos'}
                </Link>
              ))}
            </div>
          </div>

          {!logs?.length ? (
            <div style={{ border: '1px solid rgba(18,23,20,0.08)', borderRadius: 16, padding: '56px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>📋</div>
              <div style={{ color: '#4E5651', fontWeight: 500 }}>No hay eventos registrados</div>
              <div style={{ color: '#858C87', fontSize: 13, marginTop: 6 }}>La actividad aparecerá aquí a partir de ahora</div>
            </div>
          ) : (
            <>
              {/* Tabla desktop */}
              <div className="audit-table" style={{ border: '1px solid rgba(18,23,20,0.10)', borderRadius: 16, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(18,23,20,0.08)', background: 'rgba(18,23,20,0.05)' }}>
                      {['Fecha','Acción','Entidad','Detalles','Usuario'].map((h,i) => (
                        <th key={i} style={{ textAlign:'left', color:'#858C87', fontSize:11, letterSpacing:'0.08em', textTransform:'uppercase', padding:'10px 16px', fontWeight:500 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log: any, i: number) => {
                      const c = ACTION_COLORS[log.action as AuditAction] ?? { color:'#4E5651', bg:'transparent', border:'rgba(18,23,20,0.08)' }
                      const details = log.details || {}
                      return (
                        <tr key={log.id} style={{ borderBottom: i===logs.length-1?'none':'1px solid rgba(18,23,20,0.04)' }}>
                          <td style={{ padding:'12px 16px', color:'#858C87', fontSize:12, whiteSpace:'nowrap' }}>{formatDatetime(log.created_at)}</td>
                          <td style={{ padding:'12px 16px' }}>
                            <span style={{ fontSize:11, fontWeight:600, padding:'3px 9px', borderRadius:20, background:c.bg, border:`1px solid ${c.border}`, color:c.color, whiteSpace:'nowrap' }}>
                              {AUDIT_ACTION_LABELS[log.action as AuditAction] ?? log.action}
                            </span>
                          </td>
                          <td style={{ padding:'12px 16px', color:'#4E5651', fontSize:12 }}>
                            <span style={{ textTransform:'capitalize' }}>{log.entity_type}</span>
                          </td>
                          <td style={{ padding:'12px 16px', color:'#858C87', fontSize:12, maxWidth:280 }}>
                            {details.name && <span style={{ color:'#4E5651' }}>{details.name}</span>}
                            {details.email && !details.name && <span style={{ color:'#4E5651' }}>{details.email}</span>}
                            {details.doc_status && <span style={{ color:'#4E5651' }}> → {details.doc_status}</span>}
                            {details.files_deleted != null && <span style={{ color:'#4E5651' }}> ({details.files_deleted} archivos)</span>}
                          </td>
                          <td style={{ padding:'12px 16px', color:'#858C87', fontSize:12 }}>{log.user_email || '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Cards mobile */}
              <div className="audit-cards">
                {logs.map((log: any) => {
                  const c = ACTION_COLORS[log.action as AuditAction] ?? { color:'#4E5651', bg:'transparent', border:'rgba(18,23,20,0.08)' }
                  const details = log.details || {}
                  return (
                    <div key={log.id} style={{ background:'#FFFFFF', border:'1px solid rgba(18,23,20,0.16)', borderRadius:12, padding:'12px 14px', boxShadow:'0 1px 3px rgba(18,23,20,0.05)' }}>
                      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10, marginBottom:6 }}>
                        <span style={{ fontSize:11, fontWeight:600, padding:'3px 9px', borderRadius:20, background:c.bg, border:`1px solid ${c.border}`, color:c.color }}>
                          {AUDIT_ACTION_LABELS[log.action as AuditAction] ?? log.action}
                        </span>
                        <span style={{ color:'#858C87', fontSize:11, whiteSpace:'nowrap' }}>{formatDatetime(log.created_at)}</span>
                      </div>
                      {(details.name || details.email) && (
                        <div style={{ color:'#4E5651', fontSize:13 }}>{details.name || details.email}</div>
                      )}
                      <div style={{ color:'#858C87', fontSize:12, marginTop:4 }}>{log.user_email}</div>
                    </div>
                  )
                })}
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:20 }}>
                  {page > 1 && (
                    <Link href={`/admin/auditoria?page=${page-1}${action?`&action=${action}`:''}`} style={{ color:'#4E5651', fontSize:12, border:'1px solid rgba(18,23,20,0.12)', padding:'6px 14px', borderRadius:8, textDecoration:'none' }}>
                      ← Anterior
                    </Link>
                  )}
                  <span style={{ color:'#858C87', fontSize:12 }}>Página {page} de {totalPages}</span>
                  {page < totalPages && (
                    <Link href={`/admin/auditoria?page=${page+1}${action?`&action=${action}`:''}`} style={{ color:'#4E5651', fontSize:12, border:'1px solid rgba(18,23,20,0.12)', padding:'6px 14px', borderRadius:8, textDecoration:'none' }}>
                      Siguiente →
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
