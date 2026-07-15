import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

interface Params { params: Promise<{ id: string }> }

async function verifyAdminForClient(clientId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { admin: null, client: null }
  const admin = createAdminClient()
  const { data: profile } = await (admin.from('profiles') as any).select('role, organization_id').eq('id', user.id).single()
  if (!['admin','super_admin'].includes(profile?.role)) return { admin: null, client: null }

  const { data: client } = await (admin.from('profiles') as any).select('company_id, organization_id').eq('id', clientId).single()
  if (!client) return { admin: null, client: null }
  if (profile.role !== 'super_admin' && client.organization_id !== profile.organization_id) {
    return { admin: null, client: null }
  }
  return { admin, client }
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const { admin, client } = await verifyAdminForClient(id)
  if (!admin || !client) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  if (!client.company_id) return NextResponse.json({ data: null })

  const { data, error } = await (admin.from('companies') as any).select('*').eq('id', client.company_id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params
  const { admin, client } = await verifyAdminForClient(id)
  if (!admin || !client) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  if (!client.company_id) return NextResponse.json({ error: 'Este cliente no tiene una empresa asignada' }, { status: 400 })

  const body = await req.json()
  const allowed = ['name', 'cuit', 'razon_social', 'direccion', 'telefono', 'email_contacto', 'logo_url', 'info_societaria', 'sucursales', 'responsables']
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of allowed) { if (key in body) update[key] = body[key] }

  const { data, error } = await (admin.from('companies') as any).update(update).eq('id', client.company_id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
