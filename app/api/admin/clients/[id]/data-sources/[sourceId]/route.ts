import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { fetchGoogleSheetData } from '@/lib/google-sheets'
import { NextRequest, NextResponse } from 'next/server'

interface Params { params: Promise<{ id: string; sourceId: string }> }

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
  const { id, sourceId } = await params
  const { admin, client } = await verifyAdminForClient(id)
  if (!admin || !client) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { data: source } = await (admin.from('data_sources') as any).select('*').eq('id', sourceId).eq('company_id', client.company_id).single()
  if (!source) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

  try {
    const result = await fetchGoogleSheetData(source.url)
    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error al leer el Sheet' }, { status: 502 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id, sourceId } = await params
  const { admin, client } = await verifyAdminForClient(id)
  if (!admin || !client) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { error } = await (admin.from('data_sources') as any).delete().eq('id', sourceId).eq('company_id', client.company_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
