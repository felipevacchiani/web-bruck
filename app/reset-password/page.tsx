'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return }
    if (password.length < 8) { setError('Mínimo 8 caracteres'); return }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError('Error al actualizar. El link puede haber expirado.')
    } else {
      setDone(true)
      setTimeout(() => router.push('/login'), 2000)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <span className="text-2xl font-bold tracking-widest text-white">BRUCK</span>
        </div>
        <div className="bg-[#111] border border-zinc-800 rounded-xl p-8">
          <h1 className="text-white text-xl font-semibold mb-6">Nueva contraseña</h1>

          {done ? (
            <div className="text-center py-4">
              <div className="text-3xl mb-3">✓</div>
              <p className="text-white font-medium">Contraseña actualizada</p>
              <p className="text-zinc-400 text-sm mt-1">Redirigiendo al login...</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-950/50 border border-red-800 text-red-400 text-sm rounded-lg px-4 py-3 mb-5">
                  {error}
                </div>
              )}
              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="text-zinc-400 text-sm block mb-1.5">Nueva contraseña</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                    className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#31AE79] transition-colors"
                    placeholder="Mínimo 8 caracteres" />
                </div>
                <div>
                  <label className="text-zinc-400 text-sm block mb-1.5">Confirmar contraseña</label>
                  <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
                    className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#31AE79] transition-colors"
                    placeholder="Repetir contraseña" />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-[#31AE79] hover:bg-[#28a06e] text-white font-medium py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 mt-2">
                  {loading ? 'Actualizando...' : 'Actualizar contraseña'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
