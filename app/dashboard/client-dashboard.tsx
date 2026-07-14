'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile, FileRecord, FileCategory } from '@/lib/supabase/types'
import { FILE_CATEGORIES, TAX_SUBCATEGORIES } from '@/lib/supabase/types'
import ContabilidadPanel from '@/app/admin/clients/[id]/contabilidad/contabilidad-panel'

interface Props { profile: Profile; files: FileRecord[] }

const fmt = (d:string) => new Date(d).toLocaleDateString('es-AR',{day:'2-digit',month:'short',year:'numeric'})
const fmtSize = (b:number|null) => { if(!b)return ''; if(b<1024)return `${b} B`; if(b<1024*1024)return `${(b/1024).toFixed(1)} KB`; return `${(b/(1024*1024)).toFixed(1)} MB` }
const fileIcon = (mime:string|null,name:string) => {
  if(mime?.startsWith('image/')) return '🖼️'
  if(mime==='application/pdf'||name.endsWith('.pdf')) return '📕'
  if(mime?.includes('spreadsheet')||name.endsWith('.xlsx')) return '📗'
  if(mime?.includes('word')||name.endsWith('.docx')) return '📘'
  if(mime==='text/html'||name.endsWith('.html')) return '🌐'
  return '📄'
}

export default function ClientDashboard({ profile, files }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [activeCategory, setActiveCategory] = useState<FileCategory|'todos'>('todos')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [informesOpen, setInformesOpen] = useState(true)
  const [contabTab, setContabTab] = useState<string | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const CI_TABS = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'movimientos', label: 'Movimientos', icon: '↕' },
    { id: 'bancos', label: 'Bancos', icon: '🏦' },
    { id: 'cuentas', label: 'Ctas Banc. y Caja', icon: '💳' },
    { id: 'contables', label: 'Cuentas Contables', icon: '📒' },
    { id: 'rubros', label: 'Rubros', icon: '🏷' },
    { id: 'conciliaciones', label: 'Conciliaciones', icon: '🧮' },
  ]

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/login'); router.refresh() }
  const handleDownload = async (id:string,name:string) => {
    const res = await fetch(`/api/admin/files/${id}/download`)
    if(!res.ok) return
    const blob = await res.blob(); const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href=url; a.download=name; a.click(); URL.revokeObjectURL(url)
  }

  const filteredFiles = activeCategory==='todos' ? files : files.filter(f=>f.category===activeCategory)
  const countBy = (cat:FileCategory) => files.filter(f=>f.category===cat).length
  const grouped = filteredFiles.reduce<Record<string,FileRecord[]>>((acc,f)=>{ const k=f.file_group_id||f.id; if(!acc[k]) acc[k]=[]; acc[k].push(f); return acc },{})
  const toggleGroup = (k:string) => setExpandedGroups(p=>{ const n=new Set(p); n.has(k)?n.delete(k):n.add(k); return n })
  const isHTML = (f:FileRecord) => f.mime_type==='text/html'||f.name.endsWith('.html')||f.name.endsWith('.htm')

  const activeCatLabel = activeCategory==='todos' ? 'Todos los documentos' : FILE_CATEGORIES.find(c=>c.value===activeCategory)?.label||'Documentos'
  const groupCount = Object.keys(grouped).length

  return (
    <div style={{ minHeight:'100vh', background:'#080808', display:'flex', flexDirection:'column' }}>
      <style>{`
        .db-sidebar { width:220px; flex-shrink:0; border-right:1px solid rgba(255,255,255,0.06); background:#0a0a0a; display:flex; flex-direction:column; transition:width 0.2s ease, opacity 0.2s ease; overflow:hidden; }
        .db-sidebar.collapsed { width:0; opacity:0; border-right:none; }
        .db-sidebar-mobile { display:none; }
        .db-main-pad { padding: 28px 28px; }
        @media(max-width:768px){
          .db-sidebar { display:none; }
          .db-sidebar-mobile { display:flex; flex-direction:column; position:fixed; left:0; top:52px; bottom:0; width:260px; background:#0a0a0a; border-right:1px solid rgba(255,255,255,0.08); z-index:16; transform:translateX(-100%); transition:transform 0.25s ease; }
          .db-sidebar-mobile.open { transform:translateX(0); }
          .db-main-pad { padding: 20px 14px; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Header */}
      <header style={{ borderBottom:'1px solid rgba(255,255,255,0.06)', background:'rgba(10,10,10,0.97)', backdropFilter:'blur(12px)', flexShrink:0, position:'sticky', top:0, zIndex:20 }}>
        <div style={{ padding:'0 16px', height:52, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <button onClick={()=>{ if(window.innerWidth<=768) setSidebarOpen(o=>!o); else setSidebarCollapsed(o=>!o) }} style={{ background:'none', border:'none', cursor:'pointer', color:'#71717a', padding:4, display:'flex', alignItems:'center' }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 4.5h14M2 9h14M2 13.5h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
            <div style={{ display:'flex', alignItems:'center', gap:9 }}>
              <div style={{ width:28, height:28, borderRadius:8, background:'linear-gradient(135deg,rgba(49,174,121,0.2),rgba(49,174,121,0.08))', border:'1px solid rgba(49,174,121,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ color:'#31AE79', fontWeight:900, fontSize:12 }}>B</span>
              </div>
              <span style={{ color:'white', fontWeight:900, letterSpacing:'0.18em', fontSize:13 }}>BRUCK</span>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:28, height:28, borderRadius:'50%', background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <span style={{ color:'#d4d4d8', fontSize:11, fontWeight:600 }}>{(profile.full_name||profile.email).charAt(0).toUpperCase()}</span>
              </div>
              <div style={{ display:'none' }} className="db-name">
                <div style={{ color:'white', fontSize:12, fontWeight:500 }}>{profile.full_name||profile.email}</div>
                {profile.company && <div style={{ color:'#52525b', fontSize:11 }}>{profile.company}</div>}
              </div>
            </div>
            <button onClick={handleLogout} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'#71717a', fontSize:12, padding:'6px 12px', borderRadius:8, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4.5 2H2v8h2.5M8 8.5L11 6 8 3.5M11 6H4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Salir
            </button>
          </div>
        </div>
      </header>

      <div style={{ display:'flex', flex:1, overflow:'hidden', position:'relative' }}>
        {/* Overlay mobile */}
        {sidebarOpen && <div onClick={()=>setSidebarOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:15 }} />}

        {/* Sidebar mobile (slide-in) */}
        <div className={`db-sidebar-mobile${sidebarOpen?' open':''}`}>
          <div style={{ padding:'16px 10px', flex:1, overflowY:'auto' }}>
            {/* INFORMES */}
            <button onClick={()=>setInformesOpen(o=>!o)} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 10px', borderRadius:9, border:'none', background:'none', cursor:'pointer', marginBottom:4 }}>
              <span style={{ color:'#52525b', fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase' }}>Informes</span>
              <span style={{ color:'#52525b', fontSize:12 }}>{informesOpen ? '▾' : '▸'}</span>
            </button>
            {informesOpen && [
              {value:'todos' as const,label:'Todos',icon:'📋',count:files.length},
              ...FILE_CATEGORIES.map(c=>({...c,count:countBy(c.value)}))
            ].map(cat=>(
              <button key={cat.value} onClick={()=>{ setActiveCategory(cat.value as any); setContabTab(null); setSidebarOpen(false) }}
                style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 10px 8px 20px', borderRadius:9, border:activeCategory===cat.value&&!contabTab?'1px solid rgba(49,174,121,0.25)':'1px solid transparent', background:activeCategory===cat.value&&!contabTab?'rgba(49,174,121,0.1)':'none', cursor:'pointer', color:activeCategory===cat.value&&!contabTab?'#31AE79':'#71717a', marginBottom:2, textAlign:'left' }}>
                <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                  <span style={{ fontSize:14 }}>{cat.icon}</span>
                  <span style={{ fontSize:13, fontWeight:activeCategory===cat.value&&!contabTab?500:400 }}>{cat.label}</span>
                </div>
                {cat.count>0 && <span style={{ fontSize:11, padding:'1px 7px', borderRadius:5, background:'rgba(255,255,255,0.06)', color:'#71717a' }}>{cat.count}</span>}
              </button>
            ))}

            {/* CONTABILIDAD INTERNA */}
            <div style={{ marginTop:16, paddingTop:16, borderTop:'1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ color:'#52525b', fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', padding:'0 10px', marginBottom:6 }}>Contabilidad</div>
              {CI_TABS.map(t => (
                <button key={t.id} onClick={()=>{ setContabTab(t.id); setSidebarOpen(false) }}
                  style={{ width:'100%', display:'flex', alignItems:'center', gap:9, padding:'8px 10px', borderRadius:9, background:contabTab===t.id?'rgba(49,174,121,0.1)':'none', border:contabTab===t.id?'1px solid rgba(49,174,121,0.25)':'1px solid transparent', color:contabTab===t.id?'#31AE79':'#71717a', cursor:'pointer', textAlign:'left', marginBottom:2 }}>
                  <span style={{ fontSize:14 }}>{t.icon}</span>
                  <span style={{ fontSize:13 }}>{t.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div style={{ padding:'12px 16px', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ color:'white', fontSize:13, fontWeight:500 }}>{profile.full_name||profile.email}</div>
            {profile.company && <div style={{ color:'#52525b', fontSize:12 }}>{profile.company}</div>}
          </div>
        </div>

        {/* Sidebar desktop */}
        <aside className={`db-sidebar${sidebarCollapsed?' collapsed':''}`}>
          <nav style={{ padding:'16px 10px', flex:1, overflowY:'auto' }}>
            {/* INFORMES */}
            <button onClick={()=>setInformesOpen(o=>!o)} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 10px', borderRadius:9, border:'none', background:'none', cursor:'pointer', marginBottom:4 }}>
              <span style={{ color:'#52525b', fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase' }}>Informes</span>
              <span style={{ color:'#52525b', fontSize:11 }}>{informesOpen ? '▾' : '▸'}</span>
            </button>
            {informesOpen && [
              {value:'todos' as const,label:'Todos',icon:'📋',count:files.length},
              ...FILE_CATEGORIES.map(c=>({...c,count:countBy(c.value)}))
            ].map(cat=>(
              <button key={cat.value} onClick={()=>{ setActiveCategory(cat.value as any); setContabTab(null) }}
                style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 10px 7px 20px', borderRadius:9, border:activeCategory===cat.value&&!contabTab?'1px solid rgba(49,174,121,0.25)':'1px solid transparent', background:activeCategory===cat.value&&!contabTab?'rgba(49,174,121,0.1)':'none', cursor:'pointer', color:activeCategory===cat.value&&!contabTab?'#31AE79':'#71717a', marginBottom:2, textAlign:'left' }}>
                <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                  <span style={{ fontSize:14 }}>{cat.icon}</span>
                  <span style={{ fontSize:13, fontWeight:activeCategory===cat.value&&!contabTab?500:400 }}>{cat.label}</span>
                </div>
                {cat.count>0 && <span style={{ fontSize:11, padding:'1px 7px', borderRadius:5, background:activeCategory===cat.value&&!contabTab?'rgba(49,174,121,0.2)':'rgba(255,255,255,0.05)', color:activeCategory===cat.value&&!contabTab?'#31AE79':'#52525b' }}>{cat.count}</span>}
              </button>
            ))}

            {/* CONTABILIDAD INTERNA */}
            <div style={{ marginTop:16, paddingTop:16, borderTop:'1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ color:'#52525b', fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', padding:'0 10px', marginBottom:6 }}>Contabilidad</div>
              {CI_TABS.map(t => (
                <button key={t.id} onClick={()=>setContabTab(t.id)}
                  style={{ width:'100%', display:'flex', alignItems:'center', gap:9, padding:'7px 10px', borderRadius:9, background:contabTab===t.id?'rgba(49,174,121,0.1)':'none', border:contabTab===t.id?'1px solid rgba(49,174,121,0.25)':'1px solid transparent', color:contabTab===t.id?'#31AE79':'#71717a', cursor:'pointer', textAlign:'left', marginBottom:2 }}>
                  <span style={{ fontSize:14 }}>{t.icon}</span>
                  <span style={{ fontSize:13 }}>{t.label}</span>
                </button>
              ))}
            </div>
          </nav>
          <div style={{ padding:'12px 16px', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ color:'white', fontSize:12, fontWeight:500 }}>{profile.full_name||profile.email}</div>
            {profile.company && <div style={{ color:'#52525b', fontSize:11 }}>{profile.company}</div>}
          </div>
        </aside>

        {/* Main */}
        <main style={{ flex:1, overflowY:'auto' }}>
          {contabTab !== null ? (
            <ContabilidadPanel
              key={contabTab}
              clientName={profile.full_name || profile.company || profile.email}
              apiBase="/api/client/ci"
              backHref="#"
              backLabel="Mi portal"
              defaultTab={contabTab}
              onBack={() => setContabTab(null)}
            />
          ) : (
          <div className="db-main-pad">
            <div style={{ maxWidth:820, margin:'0 auto' }}>
              <div style={{ marginBottom:20 }}>
                <h1 style={{ color:'white', fontSize:18, fontWeight:600, margin:0 }}>{activeCatLabel}</h1>
                <p style={{ color:'#52525b', fontSize:13, marginTop:4, margin:0 }}>
                  {groupCount===0?'Sin documentos en esta categoría':`${groupCount} documento${groupCount!==1?'s':''}`}
                </p>
              </div>

              {groupCount===0 ? (
                <div style={{ border:'1px solid rgba(255,255,255,0.06)', borderRadius:16, padding:'60px 24px', textAlign:'center' }}>
                  <div style={{ fontSize:36, marginBottom:12, opacity:0.25 }}>{activeCategory==='todos'?'📂':FILE_CATEGORIES.find(c=>c.value===activeCategory)?.icon}</div>
                  <p style={{ color:'#52525b', fontSize:13 }}>
                    {activeCategory==='todos'?'No tenés archivos disponibles aún':`No hay archivos en ${FILE_CATEGORIES.find(c=>c.value===activeCategory)?.label}`}
                  </p>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {Object.entries(grouped).map(([gk,gf])=>{
                    const first = gf[0]
                    const cat = FILE_CATEGORIES.find(c=>c.value===first.category)
                    const taxSub = TAX_SUBCATEGORIES.find(s=>s.value===first.tax_subcategory)
                    const expanded = expandedGroups.has(gk)
                    const multi = gf.length>1

                    return (
                      <div key={gk} style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, overflow:'hidden' }}>
                        <div
                          onClick={()=>{ if(multi) toggleGroup(gk); else if(isHTML(first)) router.push(`/view/${first.id}`) }}
                          style={{ padding:'14px 16px', display:'flex', alignItems:'center', gap:12, cursor:'pointer' }}
                          onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.background='rgba(255,255,255,0.04)'}
                          onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.background='transparent'}
                        >
                          <div style={{ width:40,height:40,borderRadius:11,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:18 }}>
                            {taxSub?.icon||cat?.icon||'📄'}
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ color:'white', fontSize:14, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{first.group_title||first.name}</div>
                            <div style={{ display:'flex', gap:8, marginTop:3, flexWrap:'wrap' }}>
                              {taxSub && <span style={{ color:'#31AE79', fontSize:12 }}>{taxSub.label}</span>}
                              {first.description && <span style={{ color:'#52525b', fontSize:12 }}>{first.description}</span>}
                              <span style={{ color:'#3f3f46', fontSize:12 }}>{fmt(first.created_at)}</span>
                            </div>
                          </div>
                          <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
                            {multi && <span style={{ color:'#31AE79', fontSize:11, padding:'3px 8px', background:'rgba(49,174,121,0.08)', border:'1px solid rgba(49,174,121,0.15)', borderRadius:6 }}>{gf.length} docs</span>}
                            {!multi && !isHTML(first) && (
                              <button onClick={e=>{e.stopPropagation();handleDownload(first.id,first.name)}} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'#a1a1aa', fontSize:11, padding:'5px 10px', borderRadius:6, cursor:'pointer' }}>
                                Descargar
                              </button>
                            )}
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color:'#52525b', transform:multi&&expanded?'rotate(90deg)':'none', transition:'transform 0.15s', flexShrink:0 }}>
                              <path d="M3 7h8M7.5 3.5L11 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        </div>

                        {multi && expanded && (
                          <div style={{ borderTop:'1px solid rgba(255,255,255,0.05)', background:'rgba(0,0,0,0.15)' }}>
                            {gf.map(f=>(
                              <div key={f.id}
                                onClick={()=>{ if(isHTML(f)) router.push(`/view/${f.id}`) }}
                                style={{ padding:'10px 16px 10px 68px', display:'flex', alignItems:'center', gap:10, borderBottom:'1px solid rgba(255,255,255,0.03)', cursor:isHTML(f)?'pointer':'default' }}
                                onMouseEnter={e=>{ if(isHTML(f))(e.currentTarget as HTMLDivElement).style.background='rgba(255,255,255,0.03)' }}
                                onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.background='transparent'}
                              >
                                <span style={{ fontSize:16, flexShrink:0 }}>{fileIcon(f.mime_type,f.name)}</span>
                                <div style={{ flex:1, minWidth:0 }}>
                                  <span style={{ color:'#d4d4d8', fontSize:13, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', display:'block' }}>{f.document_label||f.name}</span>
                                  {f.file_size && <span style={{ color:'#3f3f46', fontSize:11 }}>{fmtSize(f.file_size)}</span>}
                                </div>
                                {!isHTML(f) && (
                                  <button onClick={e=>{e.stopPropagation();handleDownload(f.id,f.name)}} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'#a1a1aa', fontSize:11, padding:'4px 10px', borderRadius:6, cursor:'pointer', flexShrink:0 }}>
                                    Descargar
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
          )}
        </main>
      </div>
    </div>
  )
}
