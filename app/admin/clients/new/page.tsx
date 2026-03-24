'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewClientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    full_name: '',
    company: '',
    email: '',
    password: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/admin/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Error al crear el cliente')
      setLoading(false)
      return
    }

    router.push('/admin')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <header className="border-b border-zinc-800 bg-[#0f0f0f]">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/admin" className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">← Clientes</Link>
          <span className="text-zinc-700">|</span>
          <span className="text-white font-bold tracking-widest text-sm">BRUCK</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-white text-2xl font-semibold mb-8">Nuevo cliente</h1>

        <div className="bg-[#111] border border-zinc-800 rounded-xl p-8">
          {error && (
            <div className="bg-red-950/50 border border-red-800 text-red-400 text-sm rounded-lg px-4 py-3 mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-zinc-400 text-sm block mb-1.5">Nombre completo</label>
                <input
                  value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#31AE79] transition-colors"
                  placeholder="Juan Pérez"
                />
              </div>
              <div>
                <label className="text-zinc-400 text-sm block mb-1.5">Empresa</label>
                <input
                  value={form.company}
                  onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#31AE79] transition-colors"
                  placeholder="Acme S.A."
                />
              </div>
            </div>

            <div>
              <label className="text-zinc-400 text-sm block mb-1.5">Email <span className="text-red-500">*</span></label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
                className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#31AE79] transition-colors"
                placeholder="cliente@empresa.com"
              />
            </div>

            <div>
              <label className="text-zinc-400 text-sm block mb-1.5">Contraseña inicial <span className="text-red-500">*</span></label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
                minLength={8}
                className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#31AE79] transition-colors"
                placeholder="Mínimo 8 caracteres"
              />
              <p className="text-zinc-600 text-xs mt-1">El cliente puede cambiarla luego desde "Olvidé mi contraseña"</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-[#31AE79] hover:bg-[#28a06e] text-white font-medium px-6 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                {loading ? 'Creando...' : 'Crear cliente'}
              </button>
              <Link
                href="/admin"
                className="text-zinc-400 hover:text-white px-6 py-2.5 rounded-lg text-sm transition-colors border border-zinc-700 hover:border-zinc-500"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
