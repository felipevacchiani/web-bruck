import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

interface P { params: Promise<{ clientId: string }> }

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

export async function GET(_req: NextRequest, { params }: P) {
  const { clientId } = await params
  const admin = await verifyAdmin(clientId)
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { data, error } = await (admin.from('bruck_cuentas_contables') as any)
    .select('*, rubro:bruck_rubros(nombre, categoria)')
    .eq('client_id', clientId).order('nombre')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest, { params }: P) {
  const { clientId } = await params
  const admin = await verifyAdmin(clientId)
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await req.json()
  if (!body.nombre) return NextResponse.json({ error: 'nombre requerido' }, { status: 400 })

  const keywords = Array.isArray(body.keywords) ? JSON.stringify(body.keywords) : (body.keywords || '[]')

  const { data, error } = await (admin.from('bruck_cuentas_contables') as any).insert({
    client_id: clientId, nombre: body.nombre,
    tipo: body.tipo || 'gasto', rubro_id: body.rubro_id || null, keywords,
  }).select('*, rubro:bruck_rubros(nombre, categoria)').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
