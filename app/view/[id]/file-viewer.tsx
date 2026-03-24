'use client'

import { useRouter } from 'next/navigation'
import type { FileRecord } from '@/lib/supabase/types'

interface Props {
  file: FileRecord
  signedUrl: string
}

export default function FileViewer({ file, signedUrl }: Props) {
  const router = useRouter()

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a]">

      {/* Header fijo */}
      <header className="flex-shrink-0 border-b border-zinc-800 bg-[#0f0f0f] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors flex items-center gap-1.5"
          >
            ← Volver
          </button>
          <span className="text-zinc-700">|</span>
          <span className="text-white text-sm font-medium">{file.name}</span>
          {file.description && (
            <span className="text-zinc-500 text-sm hidden sm:inline">· {file.description}</span>
          )}
        </div>
        <span className="text-white font-bold tracking-widest text-sm">BRUCK</span>
      </header>

      {/* iframe — ocupa todo el espacio restante */}
      <div className="flex-1 relative">
        <iframe
          src={signedUrl}
          className="absolute inset-0 w-full h-full border-0"
          title={file.name}
          sandbox="allow-scripts allow-same-origin"
          // 'allow-same-origin' necesario para que el HTML pueda cargar sus recursos
          // 'allow-scripts' necesario para HTML interactivo
          // NO incluir 'allow-downloads', 'allow-forms', 'allow-popups'
        />
      </div>
    </div>
  )
}
