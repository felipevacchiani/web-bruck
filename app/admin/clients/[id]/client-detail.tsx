'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Profile, FileRecord, FileCategory, TaxSubcategory, DocStatus } from '@/lib/supabase/types'
import { FILE_CATEGORIES, TAX_SUBCATEGORIES, DOC_STATUSES, MONTHS, FISCAL_YEARS } from '@/lib/supabase/types'

interface Props { client: Profile; files: FileRecord[] }

const fmt = (d: string) => new Date(d).toLocaleDateString('es-AR', { day:'2-digit', month:'short', year:'numeric' })
const fmtSize = (b: number | null) => {
  if (!b) return ''
  if (b < 1024) return `${b} B`
  if (b < 1024*1024) return `${(b/1024).toFixed(1)} KB`
  return `${(b/(1024*1024)).toFixed(1)} MB`
}
const fileIcon = (mime: string|null, name: string) => {
  if (mime?.startsWith('image/')) return '🖼️'
  if (mime==='application/pdf'||name.endsWith('.pdf')) return '📕'
  if (mime?.includes('spreadsheet')||name.endsWith('.xlsx')||name.endsWith('.xls')) return '📗'
  if (mime?.includes('word')||name.endsWith('.docx')||name.endsWith('.doc')) return '📘'
  if (mime==='text/html'||name.endsWith('.html')||name.endsWith('.htm')) return '🌐'
  return '📄'
}

const daysUntilDue = (due: string | null): number | null => {
  if (!due) return null
  const diff = new Date(due).getTime() - new Date().setHours(0,0,0,0)
  return Math.ceil(diff / 86400000)
}

const DueBadge = ({ due }: { due: string | null }) => {
  const days = daysUntilDue(due)
  if (days === null) return null
  if (days < 0)  return <span style={{ fontSize:11, padding:'2px 8px', borderRadius:6, background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.25)', color:'#f87171', fontWeight:600 }}>Vencido</span>
  if (days === 0) return <span style={{ fontSize:11, padding:'2px 8px', borderRadius:6, background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.25)', color:'#f87171', fontWeight:600 }}>Vence hoy</span>
  if (days <= 5)  return <span style={{ fontSize:11, padding:'2px 8px', borderRadius:6, background:'rgba(250,204,21,0.1)', border:'1px solid rgba(250,204,21,0.25)', color:'#facc15', fontWeight:600 }}>Vence en {days}d</span>
  return <span style={{ fontSize:11, padding:'2px 8px', borderRadius:6, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'#71717a' }}>{new Date(due!).toLocaleDateString('es-AR',{day:'2-digit',month:'short'})}</span>
}

const StatusBadge = ({ status, onClick }: { status: DocStatus; onClick?: () => void }) => {
  const s = DOC_STATUSES.find(d => d.value === status) || DOC_STATUSES[0]
  return (
    <span
      onClick={onClick}
      style={{ fontSize:11, padding:'2px 9px', borderRadius:6, background:s.bg, border:`1px solid ${s.border}`, color:s.color, fontWeight:500, cursor:onClick?'pointer':'default', whiteSpace:'nowrap' }}
    >
      {s.label}
    </span>
  )
}

const INP: React.CSSProperties = { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', outline:'none', width:'100%', color:'white', fontSize:13, borderRadius:9, padding:'9px 12px', boxSizing:'border-box', transition:'border-color 0.15s' }
const LBL: React.CSSProperties = { color:'#a1a1aa', fontSize:11, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', display:'block', marginBottom:6 }
const SEL: React.CSSProperties = { ...{} as any, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', outline:'none', width:'100%', color:'white', fontSize:13, borderRadius:9, padding:'9px 12px', boxSizing:'border-box' as any }

interface DocEntry { label: string; file: File|null }
interface UF {
  groupTitle: string
  category: FileCategory
  taxSub: TaxSubcategory | null
  description: string
  fiscalMonth: number | null
  fiscalYear: number | null
  dueDate: string
  tags: string
  docs: DocEntry[]
}
const defForm = (): UF => ({
  groupTitle: '', category: 'financiero', taxSub: null, description: '',
  fiscalMonth: new Date().getMonth() + 1,
  fiscalYear: new Date().getFullYear(),
  dueDate: '',
  tags: '',
  docs: [{ label: '', file: null }]
})

export default function ClientDetail({ client, files: initialFiles }: Props) {
  const router = useRouter()
  const [files, setFiles] = useState(initialFiles)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [form, setForm] = useState<UF>(defForm())
  const [showUpload, setShowUpload] = useState(false)
  const [editing, setEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<FileCategory|'todos'>('todos')
  const [filterYear, setFilterYear] = useState<number|null>(null)
  const [filterMonth, setFilterMonth] = useState<number|null>(null)
  const [filterTag, setFilterTag] = useState<string|null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [deletingId, setDeletingId] = useState<string|null>(null)
  const [clientForm, setClientForm] = useState({ full_name: client.full_name||'', company: client.company||'', active: client.active })
  const [permTemplates, setPermTemplates] = useState<{id:string; name:string; description:string|null}[]>([])
  const [currentTemplateId, setCurrentTemplateId] = useState<string|null>(null)
  const [savingPerm, setSavingPerm] = useState(false)
  const fileRefs = useRef<(HTMLInputElement|null)[]>([])

  useEffect(() => {
    fetch(`/api/admin/clients/${client.id}/permission-template`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return
        setPermTemplates(data.templates || [])
        setCurrentTemplateId(data.currentTemplateId)
      })
  }, [client.id])

  const changeTemplate = async (templateId: string) => {
    setSavingPerm(true)
    const res = await fetch(`/api/admin/clients/${client.id}/permission-template`, {
      method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ permission_template_id: templateId })
    })
    if (res.ok) setCurrentTemplateId(templateId)
    setSavingPerm(false)
  }

  const availableYears = [...new Set(files.map(f => f.fiscal_year).filter(Boolean) as number[])].sort((a,b)=>b-a)
  const availableTags = [...new Set(files.flatMap(f => f.tags||[]))].sort()

  const filtered = files.filter(f => {
    if (activeTab !== 'todos' && f.category !== activeTab) return false
    if (filterYear  !== null && f.fiscal_year  !== filterYear)  return false
    if (filterMonth !== null && f.fiscal_month !== filterMonth) return false
    if (filterTag   !== null && !(f.tags||[]).includes(filterTag)) return false
    return true
  })

  const grouped = filtered.reduce<Record<string,FileRecord[]>>((acc,f) => {
    const k = f.file_group_id||f.id; if(!acc[k]) acc[k]=[]; acc[k].push(f); return acc
  }, {})

  const toggleGroup = (k:string) => setExpandedGroups(p=>{ const n=new Set(p); n.has(k)?n.delete(k):n.add(k); return n })
  const countBy = (cat:FileCategory) => files.filter(f=>f.category===cat).length
  const isHTML = (f:FileRecord) => f.mime_type==='text/html'||f.name.endsWith('.html')||f.name.endsWith('.htm')

  const addDoc = () => setForm(f=>({...f, docs:[...f.docs,{label:'',file:null}]}))
  const removeDoc = (i:number) => setForm(f=>({...f, docs:f.docs.filter((_,j)=>j!==i)}))
  const setDocLabel = (i:number,label:string) => setForm(f=>{const d=[...f.docs];d[i]={...d[i],label};return{...f,docs:d}})
  const setDocFile  = (i:number,file:File|null) => setForm(f=>{const d=[...f.docs];d[i]={...d[i],file};return{...f,docs:d}})

  const cycleStatus = async (gf: FileRecord[]) => {
    const current = gf[0].doc_status
    const order: DocStatus[] = ['pendiente','visto','aprobado']
    const next = order[(order.indexOf(current)+1) % order.length]
    await Promise.all(gf.map(f =>
      fetch(`/api/admin/files/${f.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doc_status: next })
      })
    ))
    setFiles(p => p.map(f => gf.find(gff=>gff.id===f.id) ? {...f, doc_status:next} : f))
  }

  const handleUpload = async (e:React.FormEvent) => {
    e.preventDefault()
    const valid = form.docs.filter(d=>d.file)
    if (!valid.length) { setUploadError('Seleccioná al menos un archivo'); return }
    if (!form.groupTitle.trim()) { setUploadError('Ingresá un título para el grupo'); return }
    setUploading(true); setUploadError('')
    const groupId = crypto.randomUUID()
    const newFiles: FileRecord[] = []
    for (const doc of valid) {
      const fd = new FormData()
      fd.append('file', doc.file!)
      fd.append('client_id', client.id)
      fd.append('name', doc.file!.name)
      fd.append('description', form.description)
      fd.append('category', form.category)
      if (form.taxSub) fd.append('tax_subcategory', form.taxSub)
      fd.append('file_group_id', groupId)
      fd.append('group_title', form.groupTitle)
      fd.append('document_label', doc.label||doc.file!.name)
      if (form.fiscalMonth) fd.append('fiscal_month', String(form.fiscalMonth))
      if (form.fiscalYear)  fd.append('fiscal_year',  String(form.fiscalYear))
      if (form.dueDate)     fd.append('due_date', form.dueDate)
      if (form.tags)        fd.append('tags', form.tags)
      const res = await fetch('/api/admin/files', { method:'POST', body:fd })
      const data = await res.json()
      if (!res.ok) { setUploadError(data.error||'Error al subir'); setUploading(false); return }
      newFiles.push(data.file)
    }
    setFiles(p=>[...newFiles,...p]); setShowUpload(false); setForm(defForm()); fileRefs.current=[]; setUploading(false)
  }

  const deleteFile = async (id:string, sp:string) => {
    if (!confirm('¿Eliminar este archivo?')) return
    setDeletingId(id)
    const res = await fetch(`/api/admin/files/${id}`, { method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({storage_path:sp}) })
    if (res.ok) setFiles(p=>p.filter(f=>f.id!==id))
    setDeletingId(null)
  }

  const deleteGroup = async (gf:FileRecord[]) => {
    if (!confirm(`¿Eliminar "${gf[0]?.group_title||'este grupo'}" y sus ${gf.length} archivo(s)?`)) return
    for (const f of gf) await fetch(`/api/admin/files/${f.id}`, { method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({storage_path:f.storage_path}) })
    const ids = new Set(gf.map(f=>f.id))
    setFiles(p=>p.filter(f=>!ids.has(f.id)))
  }

  const updateClient = async (e:React.FormEvent) => {
    e.preventDefault()
    const res = await fetch(`/api/admin/clients/${client.id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify(clientForm) })
    if (res.ok) { setEditing(false); router.refresh() }
  }

  const deleteClient = async () => {
    if (!confirm(`¿Eliminar a ${client.full_name||client.email}? Se eliminarán todos sus archivos.`)) return
    const res = await fetch(`/api/admin/clients/${client.id}`, { method:'DELETE' })
    if (res.ok) router.push('/admin')
  }

  const download = async (id:string, name:string) => {
    const res = await fetch(`/api/admin/files/${id}/download`)
    if (!res.ok) return
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href=url; a.download=name; a.click(); URL.revokeObjectURL(url)
  }

  const urgentCount = files.filter(f => { const d = daysUntilDue(f.due_date); return d !== null && d <= 5 }).length

  return (
    <div style={{ minHeight:'100vh', background:'#080808' }}>
      <style>{`
        .cd-hpad { padding: 0 24px; }
        .cd-pad { padding: 28px 24px; }
        .cd-edit-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
        .cd-3col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
        .cd-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .cd-tabs { display: flex; align-items: center; flex-wrap: wrap; gap: 2px; }
        .cd-top-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 10px; }
        .cd-doc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 8px; }
        .cd-cat-grid { display: grid; grid-template-columns: repeat(5,1fr); gap: 8px; }
        .cd-tax-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 8px; }
        .cd-actions { display: flex; gap: 8px; flex-shrink: 0; }
        .cd-client-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
        .group-row { padding: 12px 16px; display: flex; align-items: center; gap: 12px; }
        .group-meta { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .doc-row-indent { padding-left: 64px; }
        .filter-bar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
        @media(max-width:640px){
          .cd-hpad { padding: 0 14px; }
          .cd-pad { padding: 18px 14px; }
          .cd-edit-grid { grid-template-columns: 1fr; }
          .cd-doc-grid { grid-template-columns: 1fr; }
          .cd-cat-grid { grid-template-columns: repeat(3,1fr); }
          .cd-tax-grid { grid-template-columns: 1fr; }
          .cd-client-top { flex-direction: column; gap: 12px; }
          .cd-actions { width: 100%; }
          .cd-3col { grid-template-columns: 1fr; }
          .cd-2col { grid-template-columns: 1fr; }
          .group-meta { display: none; }
          .stat-bar { display: none !important; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        select option { background: #1a1a1a; color: white; }
      `}</style>

      <header style={{ position:'sticky', top:0, zIndex:10, borderBottom:'1px solid rgba(255,255,255,0.06)', background:'rgba(10,10,10,0.97)', backdropFilter:'blur(12px)' }}>
        <div style={{ maxWidth:1000, margin:'0 auto' }}>
          <div className="cd-hpad" style={{ height:52, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <Link href="/admin" style={{ color:'#52525b', fontSize:13, textDecoration:'none', display:'flex', alignItems:'center', gap:5 }}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M8 2.5L4 6.5L8 10.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Clientes
              </Link>
              <span style={{ color:'#3f3f46' }}>/</span>
              <span style={{ color:'#a1a1aa', fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:180 }}>{client.full_name||client.email}</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              {urgentCount > 0 && (
                <span style={{ fontSize:11, padding:'3px 9px', borderRadius:6, background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.25)', color:'#f87171', fontWeight:600 }}>
                  ⚠️ {urgentCount} venc.
                </span>
              )}
              <span style={{ color:'white', fontWeight:900, letterSpacing:'0.2em', fontSize:12 }}>BRUCK</span>
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth:1000, margin:'0 auto' }}>
        <div className="cd-pad">

          <div style={{ background:'rgba(14,14,14,0.8)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:18, overflow:'hidden', marginBottom:24 }}>
            <div style={{ padding:'20px 20px' }}>
              <div className="cd-client-top">
                <div style={{ display:'flex', alignItems:'center', gap:14, minWidth:0 }}>
                  <div style={{ width:48, height:48, borderRadius:14, background:'rgba(49,174,121,0.1)', border:'1px solid rgba(49,174,121,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <span style={{ color:'#31AE79', fontWeight:700, fontSize:18 }}>{(client.full_name||client.email).charAt(0).toUpperCase()}</span>
                  </div>
                  <div style={{ minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                      <span style={{ color:'white', fontSize:15, fontWeight:600 }}>{client.full_name||client.email}</span>
                      <span style={{ fontSize:11, fontWeight:500, padding:'2px 9px', borderRadius:20, background:client.active?'rgba(52,211,153,0.08)':'rgba(255,255,255,0.04)', border:client.active?'1px solid rgba(52,211,153,0.2)':'1px solid rgba(255,255,255,0.08)', color:client.active?'#34d399':'#71717a', whiteSpace:'nowrap' }}>
                        {client.active?'Activo':'Inactivo'}
                      </span>
                    </div>
                    {client.company && <div style={{ color:'#71717a', fontSize:13, marginTop:2 }}>{client.company}</div>}
                    <div style={{ color:'#52525b', fontSize:12, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{client.email}</div>
                    {permTemplates.length > 0 && (
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:8 }}>
                        <span style={{ color:'#52525b', fontSize:11, textTransform:'uppercase', letterSpacing:'0.05em' }}>Permisos</span>
                        <select
                          value={currentTemplateId ?? ''}
                          disabled={savingPerm}
                          onChange={e => changeTemplate(e.target.value)}
                          style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', outline:'none', color:'white', fontSize:12, borderRadius:7, padding:'4px 8px' }}
                          title={permTemplates.find(t => t.id === currentTemplateId)?.description ?? ''}
                        >
                          {permTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
                <div className="cd-actions">
                  <Link href={`/admin/clients/${client.id}/contabilidad`} style={{ background:'linear-gradient(135deg,rgba(49,174,121,0.15),rgba(49,174,121,0.06))', border:'1px solid rgba(49,174,121,0.3)', color:'#31AE79', fontSize:12, padding:'7px 14px', borderRadius:8, cursor:'pointer', textDecoration:'none', display:'flex', alignItems:'center', gap:5, whiteSpace:'nowrap' }}>
                    📊 Contabilidad
                  </Link>
                  <button onClick={()=>setEditing(!editing)} style={{ background:'none', border:'1px solid rgba(255,255,255,0.1)', color:'#a1a1aa', fontSize:12, padding:'7px 14px', borderRadius:8, cursor:'pointer' }}>Editar</button>
                  <button onClick={deleteClient} style={{ background:'none', border:'1px solid rgba(239,68,68,0.2)', color:'#f87171', fontSize:12, padding:'7px 14px', borderRadius:8, cursor:'pointer' }}>Eliminar</button>
                </div>
              </div>

              {editing && (
                <form onSubmit={updateClient} style={{ borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:20, marginTop:20 }}>
                  <div className="cd-edit-grid">
                    <div>
                      <label style={LBL}>Nombre</label>
                      <input value={clientForm.full_name} onChange={e=>setClientForm(f=>({...f,full_name:e.target.value}))} style={INP} onFocus={e=>e.currentTarget.style.borderColor='rgba(49,174,121,0.55)'} onBlur={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'} />
                    </div>
                    <div>
                      <label style={LBL}>Empresa</label>
                      <input value={clientForm.company} onChange={e=>setClientForm(f=>({...f,company:e.target.value}))} style={INP} onFocus={e=>e.currentTarget.style.borderColor='rgba(49,174,121,0.55)'} onBlur={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'} />
                    </div>
                  </div>
                  <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', marginBottom:16, width:'fit-content' }}>
                    <input type="checkbox" checked={clientForm.active} onChange={e=>setClientForm(f=>({...f,active:e.target.checked}))} style={{ accentColor:'#31AE79' }} />
                    <span style={{ color:'#a1a1aa', fontSize:13 }}>Cuenta activa</span>
                  </label>
                  <div style={{ display:'flex', gap:8 }}>
                    <button type="submit" style={{ background:'linear-gradient(135deg,#31AE79,#27a06d)', color:'white', fontWeight:600, fontSize:13, padding:'9px 20px', borderRadius:8, border:'none', cursor:'pointer' }}>Guardar</button>
                    <button type="button" onClick={()=>setEditing(false)} style={{ background:'none', border:'1px solid rgba(255,255,255,0.1)', color:'#71717a', fontSize:13, padding:'9px 18px', borderRadius:8, cursor:'pointer' }}>Cancelar</button>
                  </div>
                </form>
              )}
            </div>

            <div className="stat-bar" style={{ borderTop:'1px solid rgba(255,255,255,0.05)', background:'rgba(255,255,255,0.015)', padding:'10px 20px', display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
              <span style={{ color:'#52525b', fontSize:12 }}>Total: <span style={{ color:'#a1a1aa', fontWeight:600 }}>{files.length}</span></span>
              {FILE_CATEGORIES.map(cat=>countBy(cat.value)>0&&(
                <span key={cat.value} style={{ color:'#52525b', fontSize:12, display:'flex', alignItems:'center', gap:4 }}>
                  <span>{cat.icon}</span><span style={{ color:'#71717a' }}>{cat.label}</span>
                  <span style={{ color:'#a1a1aa', fontWeight:600 }}>({countBy(cat.value)})</span>
                </span>
              ))}
            </div>
          </div>

          <div className="cd-top-row">
            <div style={{ display:'flex', alignItems:'center', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:4, overflowX:'auto', maxWidth:'100%' }}>
              <div className="cd-tabs">
                <button onClick={()=>setActiveTab('todos')} style={{ padding:'6px 12px', borderRadius:7, fontSize:12, fontWeight:500, border:'none', cursor:'pointer', background:activeTab==='todos'?'rgba(255,255,255,0.1)':'none', color:activeTab==='todos'?'white':'#71717a', whiteSpace:'nowrap' }}>
                  Todos ({files.length})
                </button>
                {FILE_CATEGORIES.map(cat=>(
                  <button key={cat.value} onClick={()=>setActiveTab(cat.value)} style={{ padding:'6px 10px', borderRadius:7, fontSize:12, fontWeight:500, border:'none', cursor:'pointer', background:activeTab===cat.value?'rgba(49,174,121,0.15)':'none', color:activeTab===cat.value?'#31AE79':'#71717a', display:'flex', alignItems:'center', gap:4, whiteSpace:'nowrap' }}>
                    <span>{cat.icon}</span><span>{cat.label}</span>
                    {countBy(cat.value)>0&&<span style={{ opacity:0.7 }}>({countBy(cat.value)})</span>}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={()=>setShowUpload(!showUpload)} style={{ background:'linear-gradient(135deg,#31AE79,#27a06d)', color:'white', fontWeight:600, fontSize:12, padding:'8px 16px', borderRadius:9, border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:6, boxShadow:'0 3px 12px rgba(49,174,121,0.25)', whiteSpace:'nowrap', flexShrink:0 }}>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
              Subir archivos
            </button>
          </div>

          {availableYears.length > 0 && (
            <div className="filter-bar">
              <span style={{ color:'#52525b', fontSize:11, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase' }}>Período:</span>
              <button onClick={()=>{setFilterYear(null);setFilterMonth(null)}} style={{ padding:'4px 10px', borderRadius:6, fontSize:12, border:'none', cursor:'pointer', background:filterYear===null?'rgba(255,255,255,0.1)':'rgba(255,255,255,0.04)', color:filterYear===null?'white':'#71717a' }}>
                Todos
              </button>
              {availableYears.map(y=>(
                <button key={y} onClick={()=>{setFilterYear(filterYear===y?null:y);setFilterMonth(null)}} style={{ padding:'4px 10px', borderRadius:6, fontSize:12, border:'none', cursor:'pointer', background:filterYear===y?'rgba(49,174,121,0.15)':'rgba(255,255,255,0.04)', color:filterYear===y?'#31AE79':'#71717a', fontWeight:filterYear===y?600:400 }}>
                  {y}
                </button>
              ))}
              {filterYear !== null && (
                <>
                  <span style={{ color:'#3f3f46', fontSize:11 }}>|</span>
                  {[...new Set(files.filter(f=>f.fiscal_year===filterYear).map(f=>f.fiscal_month).filter(Boolean) as number[])].sort((a,b)=>a-b).map(m=>(
                    <button key={m} onClick={()=>setFilterMonth(filterMonth===m?null:m)} style={{ padding:'4px 10px', borderRadius:6, fontSize:12, border:'none', cursor:'pointer', background:filterMonth===m?'rgba(96,165,250,0.15)':'rgba(255,255,255,0.04)', color:filterMonth===m?'#60a5fa':'#71717a' }}>
                      {MONTHS[m-1]}
                    </button>
                  ))}
                </>
              )}
            </div>
          )}

          {availableTags.length > 0 && (
            <div className="filter-bar">
              <span style={{ color:'#52525b', fontSize:11, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase' }}>Etiquetas:</span>
              {availableTags.map(t=>(
                <button key={t} onClick={()=>setFilterTag(filterTag===t?null:t)} style={{ padding:'4px 10px', borderRadius:6, fontSize:12, border:'none', cursor:'pointer', background:filterTag===t?'rgba(250,204,21,0.15)':'rgba(255,255,255,0.04)', color:filterTag===t?'#facc15':'#71717a' }}>
                  #{t}
                </button>
              ))}
            </div>
          )}

          {showUpload && (
            <div style={{ background:'rgba(14,14,14,0.95)', border:'1px solid rgba(49,174,121,0.2)', borderRadius:16, padding:20, marginBottom:20 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:18 }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:'#31AE79' }} />
                <span style={{ color:'white', fontSize:14, fontWeight:600 }}>Nuevo grupo de archivos</span>
              </div>
              {uploadError && <div style={{ background:'rgba(239,68,68,0.09)', border:'1px solid rgba(239,68,68,0.22)', borderRadius:10, padding:'9px 12px', marginBottom:16, color:'#f87171', fontSize:13 }}>{uploadError}</div>}
              <form onSubmit={handleUpload}>
                <div style={{ marginBottom:16 }}>
                  <label style={LBL}>Título del grupo <span style={{ color:'#ef4444' }}>*</span></label>
                  <input value={form.groupTitle} onChange={e=>setForm(f=>({...f,groupTitle:e.target.value}))} placeholder="Ej: 931 - Abril 2025, Balance Q1" style={INP} onFocus={e=>e.currentTarget.style.borderColor='rgba(49,174,121,0.55)'} onBlur={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'} />
                </div>

                <div className="cd-3col" style={{ marginBottom:16 }}>
                  <div>
                    <label style={LBL}>Mes fiscal</label>
                    <select value={form.fiscalMonth||''} onChange={e=>setForm(f=>({...f,fiscalMonth:e.target.value?parseInt(e.target.value):null}))} style={SEL}>
                      <option value="">Sin mes</option>
                      {MONTHS.map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={LBL}>Año fiscal</label>
                    <select value={form.fiscalYear||''} onChange={e=>setForm(f=>({...f,fiscalYear:e.target.value?parseInt(e.target.value):null}))} style={SEL}>
                      <option value="">Sin año</option>
                      {FISCAL_YEARS.map(y=><option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={LBL}>Fecha de vencimiento</label>
                    <input type="date" value={form.dueDate} onChange={e=>setForm(f=>({...f,dueDate:e.target.value}))} style={INP} onFocus={e=>e.currentTarget.style.borderColor='rgba(49,174,121,0.55)'} onBlur={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'} />
                  </div>
                </div>

                <div style={{ marginBottom:16 }}>
                  <label style={LBL}>Categoría</label>
                  <div className="cd-cat-grid">
                    {FILE_CATEGORIES.map(cat=>(
                      <button key={cat.value} type="button" onClick={()=>setForm(f=>({...f,category:cat.value,taxSub:null}))} style={{ padding:'10px 8px', borderRadius:10, border:form.category===cat.value?'1px solid rgba(49,174,121,0.4)':'1px solid rgba(255,255,255,0.08)', background:form.category===cat.value?'rgba(49,174,121,0.1)':'rgba(255,255,255,0.03)', color:form.category===cat.value?'#31AE79':'#71717a', cursor:'pointer', fontSize:12, fontWeight:500, display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                        <span style={{ fontSize:15 }}>{cat.icon}</span><span>{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {form.category==='impuestos' && (
                  <div style={{ marginBottom:16, padding:14, background:'rgba(49,174,121,0.04)', border:'1px solid rgba(49,174,121,0.1)', borderRadius:12 }}>
                    <label style={LBL}>Tipo de impuesto</label>
                    <div className="cd-tax-grid">
                      {TAX_SUBCATEGORIES.map(sub=>(
                        <button key={sub.value} type="button" onClick={()=>setForm(f=>({...f,taxSub:sub.value}))} style={{ padding:'10px 12px', borderRadius:10, border:form.taxSub===sub.value?'1px solid rgba(49,174,121,0.5)':'1px solid rgba(255,255,255,0.08)', background:form.taxSub===sub.value?'rgba(49,174,121,0.12)':'rgba(255,255,255,0.02)', color:form.taxSub===sub.value?'#31AE79':'#71717a', cursor:'pointer', fontSize:12, fontWeight:500, textAlign:'left', display:'flex', alignItems:'center', gap:8 }}>
                          <span>{sub.icon}</span><span>{sub.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ marginBottom:16 }}>
                  <label style={LBL}>Etiquetas <span style={{ color:'#52525b', textTransform:'none', fontWeight:400 }}>(separadas por coma, opcional)</span></label>
                  <input value={form.tags} onChange={e=>setForm(f=>({...f,tags:e.target.value}))} placeholder="Ej: urgente, socio-A, revisar" style={INP} onFocus={e=>e.currentTarget.style.borderColor='rgba(49,174,121,0.55)'} onBlur={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'} />
                </div>

                <div style={{ marginBottom:18 }}>
                  <label style={LBL}>Descripción (opcional)</label>
                  <input value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Ej: Período Abril 2025" style={INP} onFocus={e=>e.currentTarget.style.borderColor='rgba(49,174,121,0.55)'} onBlur={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'} />
                </div>

                <div style={{ marginBottom:20 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                    <label style={{ ...LBL, marginBottom:0 }}>Documentos del grupo</label>
                    <button type="button" onClick={addDoc} style={{ background:'rgba(49,174,121,0.1)', border:'1px solid rgba(49,174,121,0.2)', color:'#31AE79', fontSize:12, padding:'4px 12px', borderRadius:7, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                      Agregar
                    </button>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {form.docs.map((doc,i)=>(
                      <div key={i} style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:14 }}>
                        <div className="cd-doc-grid">
                          <div>
                            <label style={{ ...LBL, fontSize:10 }}>Nombre del documento</label>
                            <input value={doc.label} onChange={e=>setDocLabel(i,e.target.value)} placeholder="Ej: Acuse, DJ, Pago, VEP" style={INP} onFocus={e=>e.currentTarget.style.borderColor='rgba(49,174,121,0.55)'} onBlur={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'} />
                          </div>
                          <div>
                            <label style={{ ...LBL, fontSize:10 }}>Archivo <span style={{ color:'#ef4444' }}>*</span></label>
                            <input type="file" ref={el=>{fileRefs.current[i]=el}} onChange={e=>setDocFile(i,e.target.files?.[0]??null)} style={{ ...INP, padding:'7px 10px', fontSize:12 }} />
                          </div>
                        </div>
                        {doc.file && <div style={{ fontSize:11, color:'#52525b', marginTop:4 }}>📎 {doc.file.name} · {fmtSize(doc.file.size)}</div>}
                        {form.docs.length>1 && <button type="button" onClick={()=>removeDoc(i)} style={{ marginTop:8, background:'none', border:'none', color:'#f87171', fontSize:11, cursor:'pointer', opacity:0.7 }}>✕ Quitar</button>}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display:'flex', gap:8 }}>
                  <button type="submit" disabled={uploading} style={{ flex:1, background:'linear-gradient(135deg,#31AE79,#27a06d)', color:'white', fontWeight:600, fontSize:13, padding:'10px', borderRadius:9, border:'none', cursor:uploading?'not-allowed':'pointer', opacity:uploading?0.7:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                    {uploading ? <><span style={{ width:13,height:13,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'white',borderRadius:'50%',display:'inline-block',animation:'spin 0.7s linear infinite' }} />Subiendo...</> : `Subir ${form.docs.filter(d=>d.file).length} archivo(s)`}
                  </button>
                  <button type="button" onClick={()=>{setShowUpload(false);setForm(defForm())}} style={{ background:'none', border:'1px solid rgba(255,255,255,0.1)', color:'#71717a', fontSize:13, padding:'10px 16px', borderRadius:9, cursor:'pointer' }}>Cancelar</button>
                </div>
              </form>
            </div>
          )}

          {Object.keys(grouped).length===0 ? (
            <div style={{ border:'1px solid rgba(255,255,255,0.06)', borderRadius:14, padding:'40px 24px', textAlign:'center' }}>
              <p style={{ color:'#52525b', fontSize:13 }}>{activeTab==='todos'?'No hay archivos para este cliente.':'No hay archivos en esta categoría.'}</p>
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
                    <div className="group-row">
                      <div style={{ width:36,height:36,borderRadius:9,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.06)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:16 }}>
                        {taxSub?.icon||cat?.icon||'📄'}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                          <span style={{ color:'white', fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{first.group_title||first.name}</span>
                          {(first.fiscal_month || first.fiscal_year) && (
                            <span style={{ fontSize:11, padding:'2px 7px', borderRadius:5, background:'rgba(96,165,250,0.08)', border:'1px solid rgba(96,165,250,0.15)', color:'#60a5fa', whiteSpace:'nowrap' }}>
                              {first.fiscal_month ? MONTHS[first.fiscal_month-1] : ''}{first.fiscal_month && first.fiscal_year ? ' ' : ''}{first.fiscal_year||''}
                            </span>
                          )}
                        </div>
                        <div style={{ display:'flex', gap:8, marginTop:4, flexWrap:'wrap', alignItems:'center' }}>
                          {taxSub && <span style={{ color:'#31AE79', fontSize:11 }}>{taxSub.label}</span>}
                          {first.description && <span style={{ color:'#52525b', fontSize:11 }}>{first.description}</span>}
                          <span style={{ color:'#3f3f46', fontSize:11 }}>{fmt(first.created_at)}</span>
                          <DueBadge due={first.due_date} />
                          {(first.tags||[]).map(t=>(
                            <span key={t} style={{ fontSize:10, padding:'2px 7px', borderRadius:5, background:'rgba(250,204,21,0.08)', border:'1px solid rgba(250,204,21,0.18)', color:'#facc15' }}>#{t}</span>
                          ))}
                        </div>
                      </div>
                      <div className="group-meta" style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
                        <StatusBadge status={first.doc_status} onClick={()=>cycleStatus(gf)} />
                        <span style={{ color:'#52525b', fontSize:11, padding:'3px 8px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.04)', borderRadius:6 }}>{cat?.label}</span>
                        {multi && <span style={{ color:'#31AE79', fontSize:11, padding:'3px 8px', background:'rgba(49,174,121,0.08)', border:'1px solid rgba(49,174,121,0.15)', borderRadius:6 }}>{gf.length} docs</span>}
                      </div>
                      <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                        {multi ? (
                          <button onClick={()=>toggleGroup(gk)} style={{ background:'none', border:'1px solid rgba(255,255,255,0.1)', color:'#a1a1aa', fontSize:12, padding:'5px 12px', borderRadius:7, cursor:'pointer' }}>
                            {expanded?'Ocultar':'Ver'}
                          </button>
                        ) : isHTML(first) ? (
                          <button onClick={()=>router.push(`/view/${first.id}`)} style={{ background:'none', border:'1px solid rgba(255,255,255,0.1)', color:'#a1a1aa', fontSize:12, padding:'5px 12px', borderRadius:7, cursor:'pointer' }}>Ver</button>
                        ) : (
                          <button onClick={()=>download(first.id,first.name)} style={{ background:'none', border:'1px solid rgba(255,255,255,0.1)', color:'#a1a1aa', fontSize:12, padding:'5px 12px', borderRadius:7, cursor:'pointer' }}>↓</button>
                        )}
                        <button onClick={()=>deleteGroup(gf)} style={{ background:'none', border:'1px solid rgba(239,68,68,0.18)', color:'#f87171', fontSize:12, padding:'5px 12px', borderRadius:7, cursor:'pointer', opacity:0.7 }}>Eliminar</button>
                      </div>
                    </div>

                    {multi && expanded && (
                      <div style={{ borderTop:'1px solid rgba(255,255,255,0.05)', background:'rgba(0,0,0,0.2)' }}>
                        {gf.map(f=>(
                          <div key={f.id} className="doc-row-indent" style={{ padding:'10px 16px', display:'flex', alignItems:'center', gap:10, borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                            <span style={{ fontSize:14, flexShrink:0 }}>{fileIcon(f.mime_type,f.name)}</span>
                            <div style={{ flex:1, minWidth:0 }}>
                              <span style={{ color:'#d4d4d8', fontSize:12, fontWeight:500 }}>{f.document_label||f.name}</span>
                              {f.file_size && <span style={{ color:'#3f3f46', fontSize:11, marginLeft:6 }}>{fmtSize(f.file_size)}</span>}
                            </div>
                            <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                              {isHTML(f) ? (
                                <button onClick={()=>router.push(`/view/${f.id}`)} style={{ background:'none', border:'1px solid rgba(255,255,255,0.08)', color:'#71717a', fontSize:11, padding:'4px 10px', borderRadius:6, cursor:'pointer' }}>Ver</button>
                              ) : (
                                <button onClick={()=>download(f.id,f.name)} style={{ background:'none', border:'1px solid rgba(255,255,255,0.08)', color:'#71717a', fontSize:11, padding:'4px 10px', borderRadius:6, cursor:'pointer' }}>↓</button>
                              )}
                              <button onClick={()=>deleteFile(f.id,f.storage_path)} disabled={deletingId===f.id} style={{ background:'none', border:'1px solid rgba(239,68,68,0.15)', color:'#f87171', fontSize:11, padding:'4px 10px', borderRadius:6, cursor:'pointer', opacity:deletingId===f.id?0.4:0.6 }}>
                                {deletingId===f.id?'...':'✕'}
                              </button>
                            </div>
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
      </main>
    </div>
  )
}
