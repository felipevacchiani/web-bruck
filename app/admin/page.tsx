import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminSupabase = createAdminClient()
  const { data: clients } = await adminSupabase
    .from('profiles').select('*').eq('role', 'client').order('created_at', { ascending: false })
  const { data: fileCounts } = await adminSupabase.from('files').select('client_id')

  const fileCountMap: Record<string, number> = {}
  for (const f of fileCounts || []) fileCountMap[f.client_id] = (fileCountMap[f.client_id] || 0) + 1

  const list = (clients || []).map((c: any) => ({ ...c, file_count: fileCountMap[c.id] ?? 0 }))
  const totalFiles = (fileCounts || []).length
  const activeCount = list.filter((c: any) => c.active).length

  return (
    <div style={{ minHeight: '100vh', background: '#080808' }}>
      <style>{`
        .stats-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; margin-bottom: 32px; }
        .client-table-wrap { display: block; }
        .client-cards-wrap { display: none; }
        .page-pad { padding: 32px 24px; }
        .header-pad { padding: 0 24px; }
        @media(max-width:640px){
          .stats-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
          .stat-3rd { grid-column: 1 / -1; }
          .client-table-wrap { display: none; }
          .client-cards-wrap { display: flex; flex-direction: column; gap: 10px; }
          .page-pad { padding: 20px 14px; }
          .header-pad { padding: 0 14px; }
          .admin-label { display: none; }
        }
      `}</style>

      <header style={{ position: 'sticky', top: 0, zIndex: 10, borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(10,10,10,0.97)', backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="header-pad" style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,rgba(49,174,121,0.2),rgba(49,174,121,0.08))', border: '1px solid rgba(49,174,121,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#31AE79', fontWeight: 900, fontSize: 13 }}>B</span>
              </div>
              <span style={{ color: 'white', fontWeight: 900, letterSpacing: '0.2em', fontSize: 13 }}>BRUCK</span>
              <div className="admin-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />
                <span style={{ color: '#52525b', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Panel Admin</span>
              </div>
            </div>
            <form action="/api/auth/logout" method="POST">
              <button style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#71717a', fontSize: 12, padding: '6px 12px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4.5 2H2v8h2.5M8 8.5L11 6 8 3.5M11 6H4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="page-pad">
          <div className="stats-grid">
            {[
              { label: 'Clientes totales', value: list.length, icon: '👥', extra: '' },
              { label: 'Activos', value: activeCount, icon: '✅', extra: '' },
              { label: 'Archivos subidos', value: totalFiles, icon: '📄', extra: 'stat-3rd' },
            ].map(s => (
              <div key={s.label} className={s.extra} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ color: '#71717a', fontSize: 12, marginBottom: 4 }}>{s.label}</div>
                  <div style={{ color: 'white', fontSize: 26, fontWeight: 700 }}>{s.value}</div>
                </div>
                <span style={{ fontSize: 26, opacity: 0.5 }}>{s.icon}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12 }}>
            <div>
              <div style={{ color: 'white', fontSize: 17, fontWeight: 600 }}>Clientes</div>
              <div style={{ color: '#71717a', fontSize: 13, marginTop: 2 }}>{list.length} cliente{list.length !== 1 ? 's' : ''} registrado{list.length !== 1 ? 's' : ''}</div>
            </div>
            <Link href="/admin/clients/new" style={{ background: 'linear-gradient(135deg,#31AE79,#27a06d)', color: 'white', fontWeight: 600, fontSize: 13, padding: '9px 16px', borderRadius: 10, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 16px rgba(49,174,121,0.28)', whiteSpace: 'nowrap' }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              Nuevo cliente
            </Link>
          </div>

          {list.length === 0 ? (
            <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '56px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>👥</div>
              <div style={{ color: '#a1a1aa', fontWeight: 500, marginBottom: 8 }}>No hay clientes todavía</div>
              <Link href="/admin/clients/new" style={{ color: '#31AE79', fontSize: 13, textDecoration: 'none' }}>Crear el primero →</Link>
            </div>
          ) : (
            <>
              {/* Tabla desktop */}
              <div className="client-table-wrap" style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                      {['Cliente','Empresa','Email','Archivos','Estado',''].map((h,i) => (
                        <th key={i} style={{ textAlign:'left', color:'#52525b', fontSize:11, letterSpacing:'0.08em', textTransform:'uppercase', padding:'10px 18px', fontWeight:500 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((client: any, i: number) => (
                      <tr key={client.id} style={{ borderBottom: i===list.length-1?'none':'1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding:'14px 18px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <div style={{ width:32, height:32, borderRadius:9, background:'rgba(49,174,121,0.1)', border:'1px solid rgba(49,174,121,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                              <span style={{ color:'#31AE79', fontWeight:700, fontSize:13 }}>{(client.full_name||client.email).charAt(0).toUpperCase()}</span>
                            </div>
                            <span style={{ color:'white', fontSize:13, fontWeight:500 }}>{client.full_name||'—'}</span>
                          </div>
                        </td>
                        <td style={{ padding:'14px 18px', color:'#71717a', fontSize:13 }}>{client.company||'—'}</td>
                        <td style={{ padding:'14px 18px', color:'#71717a', fontSize:13 }}>{client.email}</td>
                        <td style={{ padding:'14px 18px', color:'#71717a', fontSize:13 }}>{client.file_count}</td>
                        <td style={{ padding:'14px 18px' }}>
                          <span style={{ fontSize:12, fontWeight:500, padding:'3px 10px', borderRadius:20, background:client.active?'rgba(52,211,153,0.08)':'rgba(255,255,255,0.04)', border:client.active?'1px solid rgba(52,211,153,0.2)':'1px solid rgba(255,255,255,0.08)', color:client.active?'#34d399':'#71717a' }}>
                            {client.active?'Activo':'Inactivo'}
                          </span>
                        </td>
                        <td style={{ padding:'14px 18px', textAlign:'right' }}>
                          <Link href={`/admin/clients/${client.id}`} style={{ color:'#71717a', fontSize:12, textDecoration:'none', border:'1px solid rgba(255,255,255,0.08)', padding:'5px 12px', borderRadius:7, display:'inline-block' }}>Ver →</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards mobile */}
              <div className="client-cards-wrap">
                {list.map((client: any) => (
                  <Link key={client.id} href={`/admin/clients/${client.id}`} style={{ textDecoration:'none', background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'14px 16px', display:'block' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{ width:42, height:42, borderRadius:12, background:'rgba(49,174,121,0.1)', border:'1px solid rgba(49,174,121,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <span style={{ color:'#31AE79', fontWeight:700, fontSize:16 }}>{(client.full_name||client.email).charAt(0).toUpperCase()}</span>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ color:'white', fontSize:14, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{client.full_name||'Sin nombre'}</div>
                        <div style={{ color:'#71717a', fontSize:12, marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{client.company||client.email}</div>
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:5, flexShrink:0 }}>
                        <span style={{ fontSize:11, fontWeight:500, padding:'2px 8px', borderRadius:20, background:client.active?'rgba(52,211,153,0.08)':'rgba(255,255,255,0.04)', border:client.active?'1px solid rgba(52,211,153,0.2)':'1px solid rgba(255,255,255,0.08)', color:client.active?'#34d399':'#71717a' }}>
                          {client.active?'Activo':'Inactivo'}
                        </span>
                        <span style={{ color:'#52525b', fontSize:11 }}>{client.file_count} archivo{client.file_count!==1?'s':''}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
