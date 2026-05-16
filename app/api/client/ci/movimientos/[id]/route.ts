import { verifyClientAuth } from '@/lib/supabase/ci-client-auth'
import { NextRequest, NextResponse } from 'next/server'

interface P { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: P) {
  const { id } = await params
  const auth = await verifyClientAuth()
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const allowed = ['estado', 'cuenta_contable_id', 'rubro_id', 'tipo_movimiento', 'descripcion', 'clasificacion_origen', 'comentario', 'factura']
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const k of allowed) { if (k in body) update[k] = body[k] }

  const { data, error } = await (auth.admin.from('bruck_movimientos') as any)
    .update(update).eq('id', id).eq('client_id', auth.userId)
    .select(`*, cuenta_bancaria:bruck_cuentas_bancarias(nombre), cuenta_contable:bruck_cuentas_contables(nombre), rubro:bruck_rubros(nombre, categoria)`).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(_req: NextRequest, { params }: P) {
  const { id } = await params
  const auth = await verifyClientAuth()
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { error } = await (auth.admin.from('bruck_movimientos') as any)
    .delete().eq('id', id).eq('client_id', auth.userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
