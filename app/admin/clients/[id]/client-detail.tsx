'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Profile, FileRecord, FileCategory } from '@/lib/supabase/types'
import { FILE_CATEGORIES } from '@/lib/supabase/types'

interface Props { client: Profile; files: FileRecord[] }

export default function ClientDetail({ client, files: initialFiles }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState(initialFiles)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadForm, setUploadForm] = useState({ name: '', description: '', category: 'financiero' as FileCategory })
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [editingClient, setEditingClient] = useState(false)
  const [activeTab, setActiveTab] = useState<FileCategory | 'todos'>('todos')
  const [clientForm, setClientForm] = useState({ full_name: client.full_name || '', company: client.company || '', active: client.active })

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    const file = fileInputRef.current?.files?.[0]
    if (!file) return
    if (!file.name.endsWith('.html') && !file.name.endsWith('.htm')) { setUploadError('Solo se permiten archivos HTML (.html, .htm)'); return }
    setUploading(true); setUploadError('')
    const formData = new FormData()
    formData.append('file', file)
    formData.append('client_id', client.id)
    formData.append('name', uploadForm.name || file.name.replace(/\.(html?)/i, ''))
    formData.append('description', uploadForm.description)
    formData.append('category', uploadForm.category)
    const res = await fetch('/api/admin/files', { method: 'POST', body: formData })
    const data = await res.json()
    if (!res.ok) { setUploadError(data.error || 'Error al subir el archivo') }
    else { setFiles(prev => [data.file, ...prev]); setShowUpload(false); setUploadForm({ name: '', description: '', category: 'financiero' }); if (fileInputRef.current) fileInputRef.current.value = '' }
    setUploading(false)
  }

  const handleDelete = async (fileId: string, storagePath: string) => {
    if (!confirm('¿Eliminar este archivo? Esta acción no se puede deshacer.')) return
    setDeletingId(fileId)
    const res = await fetch(`/api/admin/files/${fileId}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ storage_path: storagePath }) })
    if (res.ok) setFiles(prev => prev.filter(f => f.id !== fileId))
    setDeletingId(null)
  }

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch(`/api/admin/clients/${client.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(clientForm) })
    if (res.ok) { setEditingClient(false); router.refresh() }
  }

  const handleDeleteClient = async () => {
    if (!confirm(`¿Eliminar al cliente ${client.full_name || client.email}? Se eliminarán todos sus archivos.`)) return
    const res = await fetch(`/api/admin/clients/${client.id}`, { method: 'DELETE' })
    if (res.ok) router.push('/admin')
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
  const filteredFiles = activeTab === 'todos' ? files : files.filter(f => (f.category || 'otro') === activeTab)
  const countByCategory = (cat: FileCategory) => files.filter(f => (f.category || 'otro') === cat).length

  const inputStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', outline: 'none', transition: 'border-color 0.15s', width: '100%', color: 'white', fontSize: 13, borderRadius: 9, padding: '9px 12px', boxSizing: 'border-box' }

  return (
    <div style={{ minHeight: '100vh', background: '#080808' }}>
      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 10, borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(10,10,10,0.97)', backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link href="/admin" style={{ color: '#52525b', fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M8 2.5L4 6.5L8 10.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Clientes
            </Link>
            <span style={{ color: '#3f3f46' }}>/</span>
            <span style={{ color: '#a1a1aa', fontSize: 13 }}>{client.full_name || client.email}</span>
          </div>
          <span style={{ color: 'white', fontWeight: 900, letterSpacing: '0.2em', fontSize: 12 }}>BRUCK</span>
        </div>
      </header>

      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 24px' }}>
        {/* Client card */}
        <div style={{ background: 'rgba(14,14,14,0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, overflow: 'hidden', marginBottom: 24 }}>
          <div style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(49,174,121,0.1)', border: '1px solid rgba(49,174,121,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: '#31AE79', fontWeight: 700, fontSize: 18 }}>{(client.full_name || client.email).charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: 'white', fontSize: 16, fontWeight: 600 }}>{client.full_name || client.email}</span>
                    <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 9px', borderRadius: 20, background: client.active ? 'rgba(52,211,153,0.08)' : 'rgba(255,255,255,0.04)', border: client.active ? '1px solid rgba(52,211,153,0.2)' : '1px solid rgba(255,255,255,0.08)', color: client.active ? '#34d399' : '#71717a' }}>
                      {client.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  {client.company && <div style={{ color: '#71717a', fontSize: 13, marginTop: 2 }}>{client.company}</div>}
                  <div style={{ color: '#52525b', fontSize: 13 }}>{client.email}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button onClick={() => setEditingClient(!editingClient)}
                  style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#a1a1aa', fontSize: 12, padding: '6px 14px', borderRadius: 8, cursor: 'pointer' }}>
                  Editar
                </button>
                <button onClick={handleDeleteClient}
                  style={{ background: 'none', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 12, padding: '6px 14px', borderRadius: 8, cursor: 'pointer' }}>
                  Eliminar
                </button>
              </div>
            </div>

            {editingClient && (
              <form onSubmit={handleUpdateClient} style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20, marginTop: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={{ color: '#a1a1aa', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Nombre</label>
                    <input value={clientForm.full_name} onChange={e => setClientForm(f => ({ ...f, full_name: e.target.value }))} style={inputStyle}
                      onFocus={e => e.currentTarget.style.borderColor = 'rgba(49,174,121,0.55)'}
                      onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'} />
                  </div>
                  <div>
                    <label style={{ color: '#a1a1aa', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Empresa</label>
                    <input value={clientForm.company} onChange={e => setClientForm(f => ({ ...f, company: e.target.value }))} style={inputStyle}
                      onFocus={e => e.currentTarget.style.borderColor = 'rgba(49,174,121,0.55)'}
                      onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'} />
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 16, width: 'fit-content' }}>
                  <input type="checkbox" checked={clientForm.active} onChange={e => setClientForm(f => ({ ...f, active: e.target.checked }))} style={{ accentColor: '#31AE79' }} />
                  <span style={{ color: '#a1a1aa', fontSize: 13 }}>Cuenta activa</span>
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="submit" style={{ background: 'linear-gradient(135deg, #31AE79, #27a06d)', color: 'white', fontWeight: 600, fontSize: 13, padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer' }}>Guardar</button>
                  <button type="button" onClick={() => setEditingClient(false)} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#71717a', fontSize: 13, padding: '8px 18px', borderRadius: 8, cursor: 'pointer' }}>Cancelar</button>
                </div>
              </form>
            )}
          </div>

          {/* Stats bar */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.015)', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 20 }}>
            <span style={{ color: '#52525b', fontSize: 12 }}>Total: <span style={{ color: '#a1a1aa', fontWeight: 600 }}>{files.length}</span></span>
            {FILE_CATEGORIES.map(cat => countByCategory(cat.value) > 0 && (
              <span key={cat.value} style={{ color: '#52525b', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>{cat.icon}</span><span style={{ color: '#71717a' }}>{countByCategory(cat.value)}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Files section */}
        <div>
          {/* Tabs + upload button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: 4, gap: 2, flexWrap: 'wrap' }}>
              <button onClick={() => setActiveTab('todos')}
                style={{ padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer', background: activeTab === 'todos' ? 'rgba(255,255,255,0.1)' : 'none', color: activeTab === 'todos' ? 'white' : '#71717a' }}>
                Todos ({files.length})
              </button>
              {FILE_CATEGORIES.map(cat => (
                <button key={cat.value} onClick={() => setActiveTab(cat.value)}
                  style={{ padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer', background: activeTab === cat.value ? 'rgba(49,174,121,0.15)' : 'none', color: activeTab === cat.value ? '#31AE79' : '#71717a', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span>{cat.icon}</span>
                  <span>{cat.label.replace('Informes ', '')}</span>
                  {countByCategory(cat.value) > 0 && <span style={{ opacity: 0.7 }}>({countByCategory(cat.value)})</span>}
                </button>
              ))}
            </div>
            <button onClick={() => setShowUpload(!showUpload)}
              style={{ background: 'linear-gradient(135deg, #31AE79, #27a06d)', color: 'white', fontWeight: 600, fontSize: 12, padding: '8px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 3px 12px rgba(49,174,121,0.25)' }}>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
              Subir archivo
            </button>
          </div>

          {/* Upload form */}
          {showUpload && (
            <div style={{ background: 'rgba(14,14,14,0.9)', border: '1px solid rgba(49,174,121,0.2)', borderRadius: 14, padding: 20, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#31AE79' }} />
                <span style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>Subir archivo HTML</span>
              </div>
              {uploadError && (
                <div style={{ background: 'rgba(239,68,68,0.09)', border: '1px solid rgba(239,68,68,0.22)', borderRadius: 10, padding: '9px 12px', marginBottom: 14, color: '#f87171', fontSize: 13 }}>{uploadError}</div>
              )}
              <form onSubmit={handleUpload}>
                {/* Category picker */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ color: '#a1a1aa', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Categoría</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {FILE_CATEGORIES.map(cat => (
                      <button key={cat.value} type="button" onClick={() => setUploadForm(f => ({ ...f, category: cat.value }))}
                        style={{ padding: '10px 8px', borderRadius: 10, border: uploadForm.category === cat.value ? '1px solid rgba(49,174,121,0.4)' : '1px solid rgba(255,255,255,0.08)', background: uploadForm.category === cat.value ? 'rgba(49,174,121,0.1)' : 'rgba(255,255,255,0.03)', color: uploadForm.category === cat.value ? '#31AE79' : '#71717a', cursor: 'pointer', fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <span style={{ fontSize: 16 }}>{cat.icon}</span>
                        <span>{cat.label.replace('Informes ', '')}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ color: '#a1a1aa', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Archivo HTML <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="file" ref={fileInputRef} accept=".html,.htm" required
                    style={{ ...inputStyle, padding: '8px 12px' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div>
                    <label style={{ color: '#a1a1aa', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Nombre visible</label>
                    <input value={uploadForm.name} onChange={e => setUploadForm(f => ({ ...f, name: e.target.value }))} placeholder="(usa el nombre del archivo)" style={inputStyle}
                      onFocus={e => e.currentTarget.style.borderColor = 'rgba(49,174,121,0.55)'}
                      onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'} />
                  </div>
                  <div>
                    <label style={{ color: '#a1a1aa', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Descripción</label>
                    <input value={uploadForm.description} onChange={e => setUploadForm(f => ({ ...f, description: e.target.value }))} placeholder="Ej: Balance Q1 2025" style={inputStyle}
                      onFocus={e => e.currentTarget.style.borderColor = 'rgba(49,174,121,0.55)'}
                      onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="submit" disabled={uploading}
                    style={{ background: 'linear-gradient(135deg, #31AE79, #27a06d)', color: 'white', fontWeight: 600, fontSize: 13, padding: '9px 20px', borderRadius: 9, border: 'none', cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {uploading ? <><span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />Subiendo...</> : 'Subir archivo'}
                  </button>
                  <button type="button" onClick={() => setShowUpload(false)}
                    style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#71717a', fontSize: 13, padding: '9px 18px', borderRadius: 9, cursor: 'pointer' }}>
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* File list */}
          {filteredFiles.length === 0 ? (
            <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '40px 24px', textAlign: 'center' }}>
              <p style={{ color: '#52525b', fontSize: 13 }}>{activeTab === 'todos' ? 'No hay archivos para este cliente.' : 'No hay archivos en esta categoría.'}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {filteredFiles.map(file => {
                const cat = FILE_CATEGORIES.find(c => c.value === (file.category || 'otro'))
                return (
                  <div key={file.id} style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16 }}>
                      {cat?.icon || '📄'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: 'white', fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
                      <div style={{ display: 'flex', gap: 12, marginTop: 2 }}>
                        {file.description && <span style={{ color: '#52525b', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.description}</span>}
                        <span style={{ color: '#3f3f46', fontSize: 12, flexShrink: 0 }}>{formatDate(file.created_at)}</span>
                      </div>
                    </div>
                    <span style={{ color: '#3f3f46', fontSize: 11, padding: '3px 8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 6, flexShrink: 0 }}>
                      {cat?.label || 'Otro'}
                    </span>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => router.push(`/view/${file.id}`)}
                        style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#a1a1aa', fontSize: 12, padding: '5px 12px', borderRadius: 7, cursor: 'pointer' }}>
                        Ver
                      </button>
                      <button onClick={() => handleDelete(file.id, file.storage_path)} disabled={deletingId === file.id}
                        style={{ background: 'none', border: '1px solid rgba(239,68,68,0.18)', color: '#f87171', fontSize: 12, padding: '5px 12px', borderRadius: 7, cursor: 'pointer', opacity: deletingId === file.id ? 0.4 : 0.7 }}>
                        {deletingId === file.id ? '...' : 'Eliminar'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
