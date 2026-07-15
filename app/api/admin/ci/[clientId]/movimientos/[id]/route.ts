import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

interface P { params: Promise<{ clientId: string; id: string }> }

async function verifyAdmin(clientId: string) {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: p } = await (admin.from('profiles') as any).select('role, organization_id').eq('id', user.id).single()
  if (!['admin','super_admin'].includes(p?.role)) return null
  if (p.role !== 'super_admin') {
    const { data: client } = await (admin.from('profiles') as any).select('organization_id').eq('id', clientId).single()
    if (!client || client.organization_id !== p.organization_id) return null
  }
  return admin
}

export async function PUT(req: NextRequest, { params }: P) {
  const { clientId, id } = await params
  const admin = await verifyAdmin(clientId)
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await req.json()
  const allowed = ['estado', 'cuenta_contable_id', 'rubro_id', 'tipo_movimiento', 'descripcion', 'clasificacion_origen', 'comentario', 'factura']
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const k of allowed) { if (k in body) update[k] = body[k] }

  const { data, error } = await (admin.from('bruck_movimientos') as any)
    .update(update).eq('id', id).eq('client_id', clientId)
    .select(`
      *,
      cuenta_bancaria:bruck_cuentas_bancarias(nombre),
      cuenta_contable:bruck_cuentas_contables(nombre),
      rubro:bruck_rubros(nombre, categoria)
    `).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(_req: NextRequest, { params }: P) {
  const { clientId, id } = await params
  const admin = await verifyAdmin(clientId)
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { error } = await (admin.from('bruck_movimientos') as any)
    .delete().eq('id', id).eq('client_id', clientId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
