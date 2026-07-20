import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AUDIT_ACTION_LABELS, type AuditAction } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

function formatDatetime(str: string) {
  return new Date(str).toLocaleString('es-AR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

function daysUntil(dateStr: string): number {
  const today = new Date(); today.setHours(0,0,0,0)
  const due   = new Date(dateStr); due.setHours(0,0,0,0)
  return Math.round((due.getTime() - today.getTime()) / 86400000)
}

const ACTION_COLORS: Record<AuditAction, string> = {
  file_upload:        '#34d399',
  file_delete:        '#f87171',
  file_status_change: '#60a5fa',
  file_update:        '#a78bfa',
  client_create:      '#34d399',
  client_update:      '#fbbf24',
  client_delete:      '#f87171',
}

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminSupabase = createAdminClient()

  const { data: myProfile } = await adminSupabase.from('profiles').select('role, organization_id').eq('id', user.id).single()
  const isSuperAdmin = myProfile?.role === 'super_admin'

  let clientsQuery = adminSupabase.from('profiles').select('*').eq('role', 'client').order('created_at', { ascending: false })
  if (!isSuperAdmin) clientsQuery = clientsQuery.eq('organization_id', myProfile?.organization_id)

  let recentAuditQuery = adminSupabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(6)
  if (!isSuperAdmin) {
    const { data: orgAdmins } = await adminSupabase.from('profiles').select('id').eq('organization_id', myProfile?.organization_id).eq('role', 'admin')
    recentAuditQuery = recentAuditQuery.in('user_id', (orgAdmins || []).map((a: any) => a.id))
  }

  const [
    { data: clients },
    { data: allFiles },
    { data: recentAudit },
    { data: dueDateFiles },
  ] = await Promise.all([
    clientsQuery,
    adminSupabase.from('files').select('client_id, doc_status, due_date'),
    recentAuditQuery,
    adminSupabase.from('files').select('id, client_id, due_date, doc_status').not('due_date', 'is', null),
  ])

  const scopedClientIds = new Set((clients || []).map((c: any) => c.id))
  const scopedFiles = isSuperAdmin ? (allFiles || []) : (allFiles || []).filter((f: any) => scopedClientIds.has(f.client_id))
  const scopedDueDateFiles = isSuperAdmin ? (dueDateFiles || []) : (dueDateFiles || []).filter((f: any) => scopedClientIds.has(f.client_id))

  const fileCountMap: Record<string, number> = {}
  for (const f of scopedFiles) fileCountMap[f.client_id] = (fileCountMap[f.client_id] || 0) + 1

  const list = (clients || []).map((c: any) => ({ ...c, file_count: fileCountMap[c.id] ?? 0 }))

  const totalFiles    = scopedFiles.length
  const activeCount   = list.filter((c: any) => c.active).length
  const pendingDocs   = scopedFiles.filter((f: any) => f.doc_status === 'pendiente').length
  const approvedDocs  = scopedFiles.filter((f: any) => f.doc_status === 'aprobado').length

  const today = new Date(); today.setHours(0,0,0,0)
  const overdueDocs = scopedDueDateFiles.filter((f: any) => {
    if (f.doc_status === 'aprobado') return false
    return daysUntil(f.due_date!) < 0
  }).length
  const soonDocs = scopedDueDateFiles.filter((f: any) => {
    if (f.doc_status === 'aprobado') return false
    const d = daysUntil(f.due_date!)
    return d >= 0 && d <= 7
  }).length

  return (
    <div style={{ minHeight: '100vh', background: '#F3EFE5' }}>
      <style>{`
        .stats-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; margin-bottom: 20px; }
        .stats-grid-2 { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; margin-bottom: 28px; }
        .bottom-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
        .client-table-wrap { display: block; }
        .client-cards-wrap { display: none; }
        .page-pad { padding: 32px 24px; }
        .header-pad { padding: 0 24px; }
        .nav-pills { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 28px; }
        @media(max-width:860px){
          .bottom-grid { grid-template-columns: 1fr; }
        }
        @media(max-width:640px){
          .stats-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
          .stats-grid-2 { grid-template-columns: 1fr 1fr; gap: 10px; }
          .stat-last { grid-column: 1 / -1; }
          .client-table-wrap { display: none; }
          .client-cards-wrap { display: flex; flex-direction: column; gap: 10px; }
          .page-pad { padding: 20px 14px; }
          .header-pad { padding: 0 14px; }
          .admin-label { display: none; }
        }
      `}</style>

      <header style={{ position: 'sticky', top: 0, zIndex: 10, borderBottom: '1px solid rgba(18,23,20,0.08)', background: 'rgba(243,239,229,0.92)', backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="header-pad" style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,rgba(49,174,121,0.2),rgba(49,174,121,0.08))', border: '1px solid rgba(49,174,121,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#31AE79', fontWeight: 900, fontSize: 13 }}>B</span>
              </div>
              <span style={{ color: '#121714', fontWeight: 900, letterSpacing: '0.2em', fontSize: 13 }}>BRUCK</span>
              <div className="admin-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 1, height: 16, background: 'rgba(18,23,20,0.14)' }} />
                <span style={{ color: '#858C87', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Panel Admin</span>
              </div>
            </div>
            <form action="/api/auth/logout" method="POST">
              <button style={{ background: 'rgba(18,23,20,0.04)', border: '1px solid rgba(18,23,20,0.12)', color: '#4E5651', fontSize: 12, padding: '6px 12px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4.5 2H2v8h2.5M8 8.5L11 6 8 3.5M11 6H4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="page-pad">

          {/* Navegación módulos */}
          <div className="nav-pills">
            {[
              { href: '/admin', label: '🏠 Inicio', active: true },
              { href: '/admin/alertas', label: `⚠ Alertas${overdueDocs + soonDocs > 0 ? ` (${overdueDocs + soonDocs})` : ''}`, active: false },
              { href: '/admin/reportes', label: '📊 Reportes', active: false },
              { href: '/admin/auditoria', label: '📋 Auditoría', active: false },
              ...(isSuperAdmin ? [{ href: '/admin/organizaciones', label: '🏢 Organizaciones', active: false }] : []),
            ].map(n => (
              <Link key={n.href} href={n.href} style={{
                fontSize: 12, fontWeight: 500, padding: '7px 14px', borderRadius: 9,
                textDecoration: 'none',
                background: n.active ? 'linear-gradient(135deg,rgba(49,174,121,0.15),rgba(49,174,121,0.06))' : 'rgba(18,23,20,0.05)',
                border: n.active ? '1px solid rgba(49,174,121,0.3)' : '1px solid rgba(18,23,20,0.12)',
                color: n.active ? '#31AE79' : '#4E5651',
              }}>
                {n.label}
              </Link>
            ))}
          </div>

          {/* KPIs principales */}
          <div className="stats-grid">
            {[
              { label: 'Clientes totales', value: list.length,  icon: '👥', extra: '' },
              { label: 'Activos',          value: activeCount,  icon: '✅', extra: '' },
              { label: 'Archivos subidos', value: totalFiles,   icon: '📄', extra: 'stat-last' },
            ].map(s => (
              <div key={s.label} className={s.extra} style={{ background: '#FFFFFF', border: '1px solid rgba(18,23,20,0.16)', borderRadius: 16, padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(18,23,20,0.05)' }}>
                <div>
                  <div style={{ color: '#4E5651', fontSize: 12, marginBottom: 4 }}>{s.label}</div>
                  <div style={{ color: '#121714', fontSize: 26, fontWeight: 700 }}>{s.value}</div>
                </div>
                <span style={{ fontSize: 26, opacity: 0.5 }}>{s.icon}</span>
              </div>
            ))}
          </div>

          {/* KPIs documentos */}
          <div className="stats-grid-2">
            {[
              { label: 'Pendientes',  value: pendingDocs,  color: '#facc15', bg: 'rgba(250,204,21,0.06)',  border: 'rgba(250,204,21,0.15)'  },
              { label: 'Aprobados',   value: approvedDocs, color: '#34d399', bg: 'rgba(52,211,153,0.06)',  border: 'rgba(52,211,153,0.15)'  },
              { label: 'Vencidos',    value: overdueDocs,  color: '#f87171', bg: 'rgba(239,68,68,0.06)',   border: 'rgba(239,68,68,0.15)', extra: 'stat-last'   },
            ].map(s => (
              <div key={s.label} className={(s as any).extra || ''} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 14, padding: '14px 18px' }}>
                <div style={{ color: '#4E5651', fontSize: 11, marginBottom: 4 }}>{s.label}</div>
                <div style={{ color: s.color, fontSize: 22, fontWeight: 700 }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Alerta urgente si hay vencidos */}
          {(overdueDocs > 0 || soonDocs > 0) && (
            <Link href="/admin/alertas" style={{ textDecoration: 'none', display: 'block', marginBottom: 24 }}>
              <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18 }}>⚠</span>
                  <div>
                    <div style={{ color: '#f87171', fontSize: 13, fontWeight: 600 }}>
                      {overdueDocs > 0 ? `${overdueDocs} documento${overdueDocs!==1?'s':''} vencido${overdueDocs!==1?'s':''}` : ''}
                      {overdueDocs > 0 && soonDocs > 0 ? ' · ' : ''}
                      {soonDocs > 0 ? `${soonDocs} vence${soonDocs!==1?'n':''} esta semana` : ''}
                    </div>
                    <div style={{ color: '#4E5651', fontSize: 12, marginTop: 2 }}>Ver panel de alertas →</div>
                  </div>
                </div>
              </div>
            </Link>
          )}

          <div className="bottom-grid">
            {/* Tabla clientes */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 12 }}>
                <div>
                  <div style={{ color: '#121714', fontSize: 15, fontWeight: 600 }}>Clientes</div>
                  <div style={{ color: '#4E5651', fontSize: 12, marginTop: 2 }}>{list.length} registrado{list.length !== 1 ? 's' : ''}</div>
                </div>
                <Link href="/admin/clients/new" style={{ background: 'linear-gradient(135deg,#31AE79,#27a06d)', color: '#121714', fontWeight: 600, fontSize: 12, padding: '8px 14px', borderRadius: 9, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5, boxShadow: '0 4px 16px rgba(49,174,121,0.28)', whiteSpace: 'nowrap' }}>
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  Nuevo
                </Link>
              </div>

              {list.length === 0 ? (
                <div style={{ border: '1px solid rgba(18,23,20,0.08)', borderRadius: 14, padding: '40px 24px', textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 10, opacity: 0.3 }}>👥</div>
                  <div style={{ color: '#4E5651', fontWeight: 500, fontSize: 14 }}>No hay clientes todavía</div>
                  <Link href="/admin/clients/new" style={{ color: '#31AE79', fontSize: 13, textDecoration: 'none', display: 'inline-block', marginTop: 8 }}>Crear el primero →</Link>
                </div>
              ) : (
                <>
                  <div className="client-table-wrap" style={{ border: '1px solid rgba(18,23,20,0.10)', borderRadius: 14, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(18,23,20,0.08)', background: 'rgba(18,23,20,0.05)' }}>
                          {['Cliente','Empresa','Email','Archivos','Estado',''].map((h,i) => (
                            <th key={i} style={{ textAlign:'left', color:'#858C87', fontSize:11, letterSpacing:'0.08em', textTransform:'uppercase', padding:'10px 16px', fontWeight:500 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {list.map((client: any, i: number) => (
                          <tr key={client.id} style={{ borderBottom: i===list.length-1?'none':'1px solid rgba(18,23,20,0.04)' }}>
                            <td style={{ padding:'12px 16px' }}>
                              <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                                <div style={{ width:30, height:30, borderRadius:8, background:'rgba(49,174,121,0.1)', border:'1px solid rgba(49,174,121,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                  <span style={{ color:'#31AE79', fontWeight:700, fontSize:12 }}>{(client.full_name||client.email).charAt(0).toUpperCase()}</span>
                                </div>
                                <span style={{ color:'#121714', fontSize:13, fontWeight:500 }}>{client.full_name||'—'}</span>
                              </div>
                            </td>
                            <td style={{ padding:'12px 16px', color:'#4E5651', fontSize:12 }}>{client.company||'—'}</td>
                            <td style={{ padding:'12px 16px', color:'#4E5651', fontSize:12 }}>{client.email}</td>
                            <td style={{ padding:'12px 16px', color:'#4E5651', fontSize:12 }}>{client.file_count}</td>
                            <td style={{ padding:'12px 16px' }}>
                              <span style={{ fontSize:11, fontWeight:500, padding:'3px 9px', borderRadius:20, background:client.active?'rgba(52,211,153,0.08)':'rgba(18,23,20,0.04)', border:client.active?'1px solid rgba(52,211,153,0.2)':'1px solid rgba(18,23,20,0.12)', color:client.active?'#34d399':'#4E5651' }}>
                                {client.active?'Activo':'Inactivo'}
                              </span>
                            </td>
                            <td style={{ padding:'12px 16px', textAlign:'right' }}>
                              <Link href={`/admin/clients/${client.id}`} style={{ color:'#4E5651', fontSize:12, textDecoration:'none', border:'1px solid rgba(18,23,20,0.12)', padding:'5px 11px', borderRadius:7, display:'inline-block' }}>Ver →</Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="client-cards-wrap">
                    {list.map((client: any) => (
                      <Link key={client.id} href={`/admin/clients/${client.id}`} style={{ textDecoration:'none', background:'#FFFFFF', border:'1px solid rgba(18,23,20,0.16)', borderRadius:13, padding:'13px 15px', display:'block', boxShadow:'0 1px 3px rgba(18,23,20,0.05)' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                          <div style={{ width:40, height:40, borderRadius:11, background:'rgba(49,174,121,0.1)', border:'1px solid rgba(49,174,121,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                            <span style={{ color:'#31AE79', fontWeight:700, fontSize:15 }}>{(client.full_name||client.email).charAt(0).toUpperCase()}</span>
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ color:'#121714', fontSize:14, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{client.full_name||'Sin nombre'}</div>
                            <div style={{ color:'#4E5651', fontSize:12, marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{client.company||client.email}</div>
                          </div>
                          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:5, flexShrink:0 }}>
                            <span style={{ fontSize:11, fontWeight:500, padding:'2px 8px', borderRadius:20, background:client.active?'rgba(52,211,153,0.08)':'rgba(18,23,20,0.04)', border:client.active?'1px solid rgba(52,211,153,0.2)':'1px solid rgba(18,23,20,0.12)', color:client.active?'#34d399':'#4E5651' }}>
                              {client.active?'Activo':'Inactivo'}
                            </span>
                            <span style={{ color:'#858C87', fontSize:11 }}>{client.file_count} archivo{client.file_count!==1?'s':''}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Actividad reciente */}
            <div>
              <div style={{ color: '#121714', fontSize: 15, fontWeight: 600, marginBottom: 14 }}>Actividad reciente</div>
              {!recentAudit?.length ? (
                <div style={{ border: '1px solid rgba(18,23,20,0.08)', borderRadius: 14, padding: '32px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: 28, marginBottom: 10, opacity: 0.3 }}>📋</div>
                  <div style={{ color: '#4E5651', fontSize: 13 }}>Sin actividad registrada</div>
                </div>
              ) : (
                <div style={{ border: '1px solid rgba(18,23,20,0.10)', borderRadius: 14, overflow: 'hidden' }}>
                  {recentAudit.map((log: any, i: number) => {
                    const color = ACTION_COLORS[log.action as AuditAction] ?? '#4E5651'
                    const details = log.details || {}
                    return (
                      <div key={log.id} style={{ padding: '11px 14px', borderBottom: i===recentAudit.length-1?'none':'1px solid rgba(18,23,20,0.04)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, marginTop: 5, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: '#4E5651', fontSize: 12, fontWeight: 500 }}>
                            {AUDIT_ACTION_LABELS[log.action as AuditAction] ?? log.action}
                          </div>
                          {(details.name || details.email) && (
                            <div style={{ color: '#858C87', fontSize: 11, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {details.name || details.email}
                            </div>
                          )}
                          <div style={{ color: '#858C87', fontSize: 11, marginTop: 2 }}>{formatDatetime(log.created_at)}</div>
                        </div>
                      </div>
                    )
                  })}
                  <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(18,23,20,0.04)', textAlign: 'center' }}>
                    <Link href="/admin/auditoria" style={{ color: '#858C87', fontSize: 12, textDecoration: 'none' }}>Ver todo →</Link>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
