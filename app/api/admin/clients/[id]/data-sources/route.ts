import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { parseSheetUrl } from '@/lib/google-sheets'
import { NextRequest, NextResponse } from 'next/server'

interface Params { params: Promise<{ id: string }> }

async function verifyAdminForClient(clientId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { admin: null, user: null, client: null }
  const admin = createAdminClient()
  const { data: profile } = await (admin.from('profiles') as any).select('role, organization_id').eq('id', user.id).single()
  if (!['admin','super_admin'].includes(profile?.role)) return { admin: null, user: null, client: null }

  const { data: client } = await (admin.from('profiles') as any).select('company_id, organization_id').eq('id', clientId).single()
  if (!client) return { admin: null, user: null, client: null }
  if (profile.role !== 'super_admin' && client.organization_id !== profile.organization_id) {
    return { admin: null, user: null, client: null }
  }
  return { admin, user, client }
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const { admin, client } = await verifyAdminForClient(id)
  if (!admin || !client) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  if (!client.company_id) return NextResponse.json({ data: [] })

  const { data, error } = await (admin.from('data_sources') as any)
    .select('*').eq('company_id', client.company_id).order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  const { admin, user, client } = await verifyAdminForClient(id)
  if (!admin || !user || !client) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  if (!client.company_id) return NextResponse.json({ error: 'Este cliente no tiene una empresa asignada' }, { status: 400 })

  const body = await req.json()
  const { name, url } = body
  if (!name || !url) return NextResponse.json({ error: 'name y url requeridos' }, { status: 400 })
  if (!parseSheetUrl(url)) return NextResponse.json({ error: 'URL de Google Sheet inválida' }, { status: 400 })

  const { data, error } = await (admin.from('data_sources') as any).insert({
    organization_id: client.organization_id,
    company_id: client.company_id,
    created_by: user.id,
    name, url, type: 'google_sheet',
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
