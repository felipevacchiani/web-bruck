'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile, FileRecord, FileCategory } from '@/lib/supabase/types'
import { FILE_CATEGORIES } from '@/lib/supabase/types'

interface Props { profile: Profile; files: FileRecord[] }

export default function ClientDashboard({ profile, files }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [activeCategory, setActiveCategory] = useState<FileCategory | 'todos'>('todos')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
  const formatSize = (bytes: number | null) => {
    if (!bytes) return '—'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const filteredFiles = activeCategory === 'todos' ? files : files.filter(f => (f.category || 'otro') === activeCategory)
  const countByCategory = (cat: FileCategory) => files.filter(f => (f.category || 'otro') === cat).length
  const activeCategoryLabel = activeCategory === 'todos' ? 'Todos los documentos' : FILE_CATEGORIES.find(c => c.value === activeCategory)?.label || 'Documentos'

  const NavBtn = ({ cat, label, icon, count, active }: { cat: FileCategory | 'todos', label: string, icon: string, count: number, active: boolean }) => (
    <button onClick={() => { setActiveCategory(cat); setSidebarOpen(false) }}
      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 9, border: active ? (cat === 'todos' ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(49,174,121,0.25)') : '1px solid transparent', background: active ? (cat === 'todos' ? 'rgba(255,255,255,0.07)' : 'rgba(49,174,121,0.1)') : 'none', cursor: 'pointer', color: active ? (cat === 'todos' ? 'white' : '#31AE79') : '#71717a', marginBottom: 2, textAlign: 'left' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <span style={{ fontSize: 15 }}>{icon}</span>
        <span style={{ fontSize: 13, fontWeight: active ? 500 : 400 }}>{label}</span>
      </div>
      {count > 0 && (
        <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 5, background: active ? (cat === 'todos' ? 'rgba(255,255,255,0.12)' : 'rgba(49,174,121,0.2)') : 'rgba(255,255,255,0.05)', color: active ? (cat === 'todos' ? '#d4d4d8' : '#31AE79') : '#52525b' }}>
          {count}
        </span>
      )}
    </button>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#080808', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(10,10,10,0.97)', backdropFilter: 'blur(12px)', flexShrink: 0, position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ padding: '0 20px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Mobile toggle */}
            <button onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#71717a', padding: 4, display: 'flex', alignItems: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 4.5h14M2 9h14M2 13.5h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, rgba(49,174,121,0.2), rgba(49,174,121,0.08))', border: '1px solid rgba(49,174,121,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#31AE79', fontWeight: 900, fontSize: 12 }}>B</span>
              </div>
              <span style={{ color: 'white', fontWeight: 900, letterSpacing: '0.18em', fontSize: 13 }}>BRUCK</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#d4d4d8', fontSize: 11, fontWeight: 600 }}>{(profile.full_name || profile.email).charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <div style={{ color: 'white', fontSize: 12, fontWeight: 500, lineHeight: 1.2 }}>{profile.full_name || profile.email}</div>
                {profile.company && <div style={{ color: '#52525b', fontSize: 11, lineHeight: 1.2 }}>{profile.company}</div>}
              </div>
            </div>
            <button onClick={handleLogout}
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#71717a', fontSize: 12, padding: '6px 12px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4.5 2H2v8h2.5M8 8.5L11 6 8 3.5M11 6H4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Salir
            </button>
          </div>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div onClick={() => setSidebarOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 15 }} />
        )}

        {/* Sidebar */}
        <aside style={{
          width: 220, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.06)',
          background: '#0a0a0a', display: 'flex', flexDirection: 'column',
          position: 'fixed' as const, left: sidebarOpen ? 0 : -220, top: 52, bottom: 0,
          zIndex: 16, transition: 'left 0.2s ease',
          // show inline on desktop
        }}>
          <nav style={{ padding: '16px 10px', flex: 1, overflowY: 'auto' }}>
            <div style={{ color: '#3f3f46', fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0 6px', marginBottom: 8 }}>Categorías</div>
            <NavBtn cat="todos" label="Todos" icon="📋" count={files.length} active={activeCategory === 'todos'} />
            <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '8px 6px' }} />
            {FILE_CATEGORIES.map(cat => (
              <NavBtn key={cat.value} cat={cat.value} label={cat.label} icon={cat.icon} count={countByCategory(cat.value)} active={activeCategory === cat.value} />
            ))}
          </nav>
          <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ color: '#3f3f46', fontSize: 12 }}>{files.length} archivo{files.length !== 1 ? 's' : ''}</span>
          </div>
        </aside>

        {/* Static sidebar for desktop */}
        <aside style={{ width: 220, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.06)', background: '#0a0a0a', display: 'flex', flexDirection: 'column' }}>
          <nav style={{ padding: '16px 10px', flex: 1, overflowY: 'auto' }}>
            <div style={{ color: '#3f3f46', fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0 6px', marginBottom: 8 }}>Categorías</div>
            <NavBtn cat="todos" label="Todos" icon="📋" count={files.length} active={activeCategory === 'todos'} />
            <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '8px 6px' }} />
            {FILE_CATEGORIES.map(cat => (
              <NavBtn key={cat.value} cat={cat.value} label={cat.label} icon={cat.icon} count={countByCategory(cat.value)} active={activeCategory === cat.value} />
            ))}
          </nav>
          <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ color: '#3f3f46', fontSize: 12 }}>{files.length} archivo{files.length !== 1 ? 's' : ''}</span>
          </div>
        </aside>

        {/* Main */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '28px 28px' }}>
          <div style={{ maxWidth: 820, margin: '0 auto' }}>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ color: 'white', fontSize: 18, fontWeight: 600, margin: 0 }}>{activeCategoryLabel}</h1>
              <p style={{ color: '#52525b', fontSize: 13, marginTop: 4, margin: 0 }}>
                {filteredFiles.length === 0 ? 'Sin archivos en esta categoría' : `${filteredFiles.length} archivo${filteredFiles.length !== 1 ? 's' : ''}`}
              </p>
            </div>

            {filteredFiles.length === 0 ? (
              <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '60px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.25 }}>{activeCategory === 'todos' ? '📂' : FILE_CATEGORIES.find(c => c.value === activeCategory)?.icon}</div>
                <p style={{ color: '#52525b', fontSize: 13 }}>
                  {activeCategory === 'todos' ? 'No tenés archivos disponibles aún' : `No hay archivos en ${FILE_CATEGORIES.find(c => c.value === activeCategory)?.label}`}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filteredFiles.map(file => {
                  const cat = FILE_CATEGORIES.find(c => c.value === (file.category || 'otro'))
                  return (
                    <div key={file.id}
                      onClick={() => router.push(`/view/${file.id}`)}
                      style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', transition: 'background 0.15s, border-color 0.15s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.045)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.13)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.025)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>
                        {cat?.icon || '📄'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: 'white', fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
                        <div style={{ display: 'flex', gap: 10, marginTop: 3 }}>
                          {file.description && <span style={{ color: '#52525b', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.description}</span>}
                          <span style={{ color: '#3f3f46', fontSize: 12, flexShrink: 0 }}>{formatDate(file.created_at)}</span>
                          {file.file_size && <span style={{ color: '#3f3f46', fontSize: 12, flexShrink: 0 }}>{formatSize(file.file_size)}</span>}
                        </div>
                      </div>
                      <span style={{ color: '#3f3f46', fontSize: 11, padding: '3px 8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 6, flexShrink: 0 }}>
                        {cat?.label || 'Otro'}
                      </span>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, color: '#3f3f46' }}>
                        <path d="M3 7h8M7.5 3.5L11 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
