'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Profile, FileRecord } from '@/lib/supabase/types'

interface Props {
  client: Profile
  files: FileRecord[]
}

export default function ClientDetail({ client, files: initialFiles }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState(initialFiles)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadForm, setUploadForm] = useState({ name: '', description: '' })
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [editingClient, setEditingClient] = useState(false)
  const [clientForm, setClientForm] = useState({
    full_name: client.full_name || '',
    company: client.company || '',
    active: client.active,
  })

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    const file = fileInputRef.current?.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.html') && !file.name.endsWith('.htm')) {
      setUploadError('Solo se permiten archivos HTML (.html, .htm)')
      return
    }

    setUploading(true)
    setUploadError('')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('client_id', client.id)
    formData.append('name', uploadForm.name || file.name.replace(/\.(html?)/i, ''))
    formData.append('description', uploadForm.description)

    const res = await fetch('/api/admin/files', { method: 'POST', body: formData })
    const data = await res.json()

    if (!res.ok) {
      setUploadError(data.error || 'Error al subir el archivo')
    } else {
      setFiles(prev => [data.file, ...prev])
      setShowUpload(false)
      setUploadForm({ name: '', description: '' })
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
    setUploading(false)
  }

  const handleDelete = async (fileId: string, storagePath: string) => {
    if (!confirm('¿Eliminar este archivo? Esta acción no se puede deshacer.')) return
    setDeletingId(fileId)

    const res = await fetch(`/api/admin/files/${fileId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storage_path: storagePath }),
    })

    if (res.ok) {
      setFiles(prev => prev.filter(f => f.id !== fileId))
    }
    setDeletingId(null)
  }

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch(`/api/admin/clients/${client.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clientForm),
    })
    if (res.ok) {
      setEditingClient(false)
      router.refresh()
    }
  }

  const handleDeleteClient = async () => {
    if (!confirm(`¿Eliminar al cliente ${client.full_name || client.email}? Se eliminarán todos sus archivos.`)) return
    const res = await fetch(`/api/admin/clients/${client.id}`, { method: 'DELETE' })
    if (res.ok) router.push('/admin')
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric'
  })

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <header className="border-b border-zinc-800 bg-[#0f0f0f]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/admin" className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">← Clientes</Link>
          <span className="text-zinc-700">|</span>
          <span className="text-white font-bold tracking-widest text-sm">BRUCK</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">

        {/* Datos del cliente */}
        <div className="bg-[#111] border border-zinc-800 rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-white text-xl font-semibold">{client.full_name || client.email}</h1>
              {client.company && <p className="text-zinc-400 text-sm mt-0.5">{client.company}</p>}
              <p className="text-zinc-500 text-sm">{client.email}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditingClient(!editingClient)}
                className="text-zinc-400 hover:text-white text-sm border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded-lg transition-colors"
              >
                Editar
              </button>
              <button
                onClick={handleDeleteClient}
                className="text-red-500 hover:text-red-400 text-sm border border-red-900/50 hover:border-red-700/50 px-3 py-1.5 rounded-lg transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>

          {editingClient && (
            <form onSubmit={handleUpdateClient} className="border-t border-zinc-800 pt-4 mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-400 text-sm block mb-1">Nombre</label>
                  <input value={clientForm.full_name}
                    onChange={e => setClientForm(f => ({ ...f, full_name: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#31AE79]" />
                </div>
                <div>
                  <label className="text-zinc-400 text-sm block mb-1">Empresa</label>
                  <input value={clientForm.company}
                    onChange={e => setClientForm(f => ({ ...f, company: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#31AE79]" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={clientForm.active}
                    onChange={e => setClientForm(f => ({ ...f, active: e.target.checked }))}
                    className="accent-[#31AE79]" />
                  <span className="text-zinc-400 text-sm">Cuenta activa</span>
                </label>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="bg-[#31AE79] hover:bg-[#28a06e] text-white text-sm px-4 py-2 rounded-lg transition-colors">Guardar</button>
                <button type="button" onClick={() => setEditingClient(false)} className="text-zinc-400 text-sm border border-zinc-700 px-4 py-2 rounded-lg transition-colors">Cancelar</button>
              </div>
            </form>
          )}
        </div>

        {/* Archivos */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white text-lg font-medium">
              Archivos
              <span className="text-zinc-600 text-sm font-normal ml-2">({files.length})</span>
            </h2>
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="bg-[#31AE79] hover:bg-[#28a06e] text-white text-sm px-4 py-2 rounded-lg transition-colors"
            >
              + Subir archivo
            </button>
          </div>

          {/* Formulario de subida */}
          {showUpload && (
            <div className="bg-[#111] border border-zinc-800 rounded-xl p-6 mb-4">
              <h3 className="text-white text-sm font-medium mb-4">Subir archivo HTML</h3>
              {uploadError && (
                <div className="bg-red-950/50 border border-red-800 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">{uploadError}</div>
              )}
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="text-zinc-400 text-sm block mb-1">Archivo HTML <span className="text-red-500">*</span></label>
                  <input type="file" ref={fileInputRef} accept=".html,.htm" required
                    className="w-full bg-zinc-900 border border-zinc-700 text-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none file:bg-zinc-800 file:text-zinc-300 file:border-0 file:rounded file:px-3 file:py-1 file:text-xs file:mr-3" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-zinc-400 text-sm block mb-1">Nombre visible</label>
                    <input value={uploadForm.name}
                      onChange={e => setUploadForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="(opcional, usa el nombre del archivo)"
                      className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#31AE79]" />
                  </div>
                  <div>
                    <label className="text-zinc-400 text-sm block mb-1">Descripción</label>
                    <input value={uploadForm.description}
                      onChange={e => setUploadForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Informe mensual, reporte, etc."
                      className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#31AE79]" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={uploading}
                    className="bg-[#31AE79] hover:bg-[#28a06e] text-white text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
                    {uploading ? 'Subiendo...' : 'Subir'}
                  </button>
                  <button type="button" onClick={() => setShowUpload(false)}
                    className="text-zinc-400 text-sm border border-zinc-700 px-4 py-2 rounded-lg">Cancelar</button>
                </div>
              </form>
            </div>
          )}

          {/* Lista de archivos */}
          {files.length === 0 ? (
            <div className="border border-zinc-800 rounded-xl p-8 text-center">
              <p className="text-zinc-500 text-sm">No hay archivos asignados a este cliente.</p>
            </div>
          ) : (
            <div className="border border-zinc-800 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800 bg-[#111]">
                    <th className="text-left text-zinc-500 text-xs uppercase tracking-wider px-6 py-3 font-medium">Nombre</th>
                    <th className="text-left text-zinc-500 text-xs uppercase tracking-wider px-6 py-3 font-medium hidden md:table-cell">Descripción</th>
                    <th className="text-left text-zinc-500 text-xs uppercase tracking-wider px-6 py-3 font-medium hidden sm:table-cell">Subido</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file, i) => (
                    <tr key={file.id} className={`border-b border-zinc-800/50 ${i === files.length - 1 ? 'border-b-0' : ''}`}>
                      <td className="px-6 py-4">
                        <span className="text-white text-sm">{file.name}</span>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className="text-zinc-500 text-sm">{file.description || '—'}</span>
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <span className="text-zinc-500 text-sm">{formatDate(file.created_at)}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(file.id, file.storage_path)}
                          disabled={deletingId === file.id}
                          className="text-red-500/70 hover:text-red-400 text-sm transition-colors disabled:opacity-30"
                        >
                          {deletingId === file.id ? 'Eliminando...' : 'Eliminar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
