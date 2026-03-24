'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'login' | 'forgot'>('login')
  const [forgotSent, setForgotSent] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email o contraseña incorrectos')
      setLoading(false)
      return
    }

    // Obtener rol para redirigir correctamente
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    router.push(profile?.role === 'admin' ? '/admin' : '/dashboard')
    router.refresh()
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setError('Error al enviar el email. Verificá la dirección.')
    } else {
      setForgotSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-10">
          <span className="text-2xl font-bold tracking-widest text-white">BRUCK</span>
          <p className="text-zinc-500 text-sm mt-1 tracking-wide">PORTAL DE CLIENTES</p>
        </div>

        {/* Card */}
        <div className="bg-[#111] border border-zinc-800 rounded-xl p-8">

          {mode === 'login' && (
            <>
              <h1 className="text-white text-xl font-semibold mb-6">Iniciar sesión</h1>

              {error && (
                <div className="bg-red-950/50 border border-red-800 text-red-400 text-sm rounded-lg px-4 py-3 mb-5">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-zinc-400 text-sm block mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#31AE79] transition-colors placeholder:text-zinc-600"
                    placeholder="tu@email.com"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 text-sm block mb-1.5">Contraseña</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#31AE79] transition-colors"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#31AE79] hover:bg-[#28a06e] text-white font-medium py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {loading ? 'Ingresando...' : 'Ingresar'}
                </button>
              </form>

              <button
                onClick={() => { setMode('forgot'); setError('') }}
                className="text-zinc-500 hover:text-zinc-300 text-sm mt-5 block text-center w-full transition-colors"
              >
                Olvidé mi contraseña
              </button>
            </>
          )}

          {mode === 'forgot' && (
            <>
              <h1 className="text-white text-xl font-semibold mb-2">Recuperar contraseña</h1>

              {!forgotSent ? (
                <>
                  <p className="text-zinc-500 text-sm mb-6">
                    Ingresá tu email y te enviamos un link para restablecer tu contraseña.
                  </p>

                  {error && (
                    <div className="bg-red-950/50 border border-red-800 text-red-400 text-sm rounded-lg px-4 py-3 mb-5">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div>
                      <label className="text-zinc-400 text-sm block mb-1.5">Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#31AE79] transition-colors placeholder:text-zinc-600"
                        placeholder="tu@email.com"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#31AE79] hover:bg-[#28a06e] text-white font-medium py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Enviando...' : 'Enviar link de recuperación'}
                    </button>
                  </form>
                </>
              ) : (
                <div className="text-center py-4">
                  <div className="text-3xl mb-3">✓</div>
                  <p className="text-white font-medium mb-2">Email enviado</p>
                  <p className="text-zinc-400 text-sm">
                    Revisá tu bandeja de entrada y seguí el link para restablecer tu contraseña.
                  </p>
                </div>
              )}

              <button
                onClick={() => { setMode('login'); setForgotSent(false); setError('') }}
                className="text-zinc-500 hover:text-zinc-300 text-sm mt-5 block text-center w-full transition-colors"
              >
                ← Volver al login
              </button>
            </>
          )}
        </div>

        <p className="text-zinc-700 text-xs text-center mt-6">
          © {new Date().getFullYear()} BRUCK · Todos los derechos reservados
        </p>
      </div>
    </div>
  )
}
