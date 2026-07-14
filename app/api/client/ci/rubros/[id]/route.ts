import { verifyClientAuth } from '@/lib/supabase/ci-client-auth'
import { NextRequest, NextResponse } from 'next/server'

interface P { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: P) {
  const { id } = await params
  const auth = await verifyClientAuth('editar')
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const body = await req.json()
  const { data, error } = await (auth.admin.from('bruck_rubros') as any)
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id).eq('client_id', auth.userId).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(_req: NextRequest, { params }: P) {
  const { id } = await params
  const auth = await verifyClientAuth('eliminar')
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { error } = await (auth.admin.from('bruck_rubros') as any)
    .delete().eq('id', id).eq('client_id', auth.userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
