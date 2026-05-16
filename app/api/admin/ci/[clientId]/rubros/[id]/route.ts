import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

interface P { params: Promise<{ clientId: string; id: string }> }

async function verifyAdmin() {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: p } = await (admin.from('profiles') as any).select('role').eq('id', user.id).single()
  return p?.role === 'admin' ? admin : null
}

export async function PUT(req: NextRequest, { params }: P) {
  const { clientId, id } = await params
  const admin = await verifyAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await req.json()
  const { data, error } = await (admin.from('bruck_rubros') as any)
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id).eq('client_id', clientId).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(_req: NextRequest, { params }: P) {
  const { clientId, id } = await params
  const admin = await verifyAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { error } = await (admin.from('bruck_rubros') as any)
    .delete().eq('id', id).eq('client_id', clientId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
