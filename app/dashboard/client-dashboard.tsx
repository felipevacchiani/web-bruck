'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile, FileRecord } from '@/lib/supabase/types'

interface Props {
  profile: Profile
  files: FileRecord[]
}

export default function ClientDashboard({ profile, files }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: '2-digit', month: 'short', year: 'numeric'
    })
  }

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '—'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">

      {/* Header */}
      <header className="border-b border-zinc-800 bg-[#0f0f0f]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-white font-bold tracking-widest text-lg">BRUCK</span>
          <div className="flex items-center gap-4">
            <span className="text-zinc-400 text-sm">
              {profile.full_name || profile.email}
              {profile.company && <span className="text-zinc-600"> · {profile.company}</span>}
            </span>
            <button
              onClick={handleLogout}
              className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-6 py-10">

        <div className="mb-8">
          <h1 className="text-white text-2xl font-semibold">Mis documentos</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {files.length === 0
              ? 'No tenés archivos disponibles aún'
              : `${files.length} archivo${files.length !== 1 ? 's' : ''} disponible${files.length !== 1 ? 's' : ''}`
            }
          </p>
        </div>

        {files.length === 0 ? (
          <div className="border border-zinc-800 rounded-xl p-12 text-center">
            <div className="text-zinc-700 text-4xl mb-3">○</div>
            <p className="text-zinc-500">No hay archivos disponibles todavía.</p>
          </div>
        ) : (
          <div className="border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800 bg-[#111]">
                  <th className="text-left text-zinc-500 text-xs uppercase tracking-wider px-6 py-3 font-medium">Nombre</th>
                  <th className="text-left text-zinc-500 text-xs uppercase tracking-wider px-6 py-3 font-medium hidden md:table-cell">Descripción</th>
                  <th className="text-left text-zinc-500 text-xs uppercase tracking-wider px-6 py-3 font-medium hidden sm:table-cell">Tamaño</th>
                  <th className="text-left text-zinc-500 text-xs uppercase tracking-wider px-6 py-3 font-medium hidden sm:table-cell">Fecha</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {files.map((file, i) => (
                  <tr
                    key={file.id}
                    className={`border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors ${
                      i === files.length - 1 ? 'border-b-0' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <span className="text-white text-sm font-medium">{file.name}</span>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-zinc-500 text-sm">{file.description || '—'}</span>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <span className="text-zinc-500 text-sm">{formatSize(file.file_size)}</span>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <span className="text-zinc-500 text-sm">{formatDate(file.created_at)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => router.push(`/view/${file.id}`)}
                        className="bg-[#31AE79]/10 hover:bg-[#31AE79]/20 text-[#31AE79] border border-[#31AE79]/30 hover:border-[#31AE79]/60 text-sm px-4 py-1.5 rounded-lg transition-all"
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
