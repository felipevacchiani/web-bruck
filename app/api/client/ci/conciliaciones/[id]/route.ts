import { verifyClientAuth } from '@/lib/supabase/ci-client-auth'
import { NextRequest, NextResponse } from 'next/server'

interface P { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: P) {
  const { id } = await params
  const auth = await verifyClientAuth('editar')
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const allowed = ['estado', 'saldo_apertura', 'saldo_cierre', 'observaciones']
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const k of allowed) { if (k in body) update[k] = body[k] }
  if (update.estado === 'abierto') update.fecha_cierre = null
  if (update.estado === 'cerrado') update.fecha_cierre = new Date().toISOString().split('T')[0]

  const { data, error } = await (auth.admin.from('bruck_conciliaciones') as any)
    .update(update).eq('id', id).eq('client_id', auth.userId)
    .select('*, cuenta_bancaria:bruck_cuentas_bancarias(nombre)').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(_req: NextRequest, { params }: P) {
  const { id } = await params
  const auth = await verifyClientAuth('eliminar')
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { error } = await (auth.admin.from('bruck_conciliaciones') as any)
    .delete().eq('id', id).eq('client_id', auth.userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
