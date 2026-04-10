import { createAdminClient, createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminSupabase = createAdminClient()

  const { data: clients } = await adminSupabase
    .from('profiles')
    .select('*')
    .eq('role', 'client')
    .order('created_at', { ascending: false })

  // Contar archivos por cliente en query separada
  const { data: fileCounts } = await adminSupabase
    .from('files')
    .select('client_id')

  const fileCountMap: Record<string, number> = {}
  for (const f of fileCounts || []) {
    fileCountMap[f.client_id] = (fileCountMap[f.client_id] || 0) + 1
  }

  const clientsWithCount = (clients || []).map((c: any) => ({
    ...c,
    file_count: fileCountMap[c.id] ?? 0
  }))

  return (
    <div className="min-h-screen bg-[#0a0a0a]">

      {/* Header */}
      <header className="border-b border-zinc-800 bg-[#0f0f0f]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-white font-bold tracking-widest text-lg">BRUCK</span>
            <span className="text-zinc-700 text-xs uppercase tracking-wider">Panel Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <form action="/api/auth/logout" method="POST">
              <button className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-white text-2xl font-semibold">Clientes</h1>
            <p className="text-zinc-500 text-sm mt-1">{clientsWithCount.length} cliente{clientsWithCount.length !== 1 ? 's' : ''} registrado{clientsWithCount.length !== 1 ? 's' : ''}</p>
          </div>
          <Link
            href="/admin/clients/new"
            className="bg-[#31AE79] hover:bg-[#28a06e] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + Nuevo cliente
          </Link>
        </div>

        {/* Tabla */}
        {clientsWithCount.length === 0 ? (
          <div className="border border-zinc-800 rounded-xl p-12 text-center">
            <p className="text-zinc-500">No hay clientes todavía.</p>
            <Link href="/admin/clients/new" className="text-[#31AE79] text-sm mt-2 inline-block hover:underline">
              Crear el primero →
            </Link>
          </div>
        ) : (
          <div className="border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800 bg-[#111]">
                  <th className="text-left text-zinc-500 text-xs uppercase tracking-wider px-6 py-3 font-medium">Nombre</th>
                  <th className="text-left text-zinc-500 text-xs uppercase tracking-wider px-6 py-3 font-medium hidden md:table-cell">Empresa</th>
                  <th className="text-left text-zinc-500 text-xs uppercase tracking-wider px-6 py-3 font-medium">Email</th>
                  <th className="text-left text-zinc-500 text-xs uppercase tracking-wider px-6 py-3 font-medium hidden sm:table-cell">Archivos</th>
                  <th className="text-left text-zinc-500 text-xs uppercase tracking-wider px-6 py-3 font-medium hidden sm:table-cell">Estado</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {clientsWithCount.map((client, i) => (
                  <tr
                    key={client.id}
                    className={`border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors ${
                      i === clientsWithCount.length - 1 ? 'border-b-0' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <span className="text-white text-sm font-medium">
                        {client.full_name || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-zinc-400 text-sm">{client.company || '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-zinc-400 text-sm">{client.email}</span>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <span className="text-zinc-400 text-sm">{client.file_count}</span>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        client.active
                          ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/50'
                          : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                      }`}>
                        {client.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/clients/${client.id}`}
                        className="text-zinc-400 hover:text-white text-sm transition-colors"
                      >
                        Ver
                      </Link>
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
