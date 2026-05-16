import { verifyClientAuth } from '@/lib/supabase/ci-client-auth'
import { NextRequest, NextResponse } from 'next/server'

interface P { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: P) {
  const { id } = await params
  const auth = await verifyClientAuth()
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const body = await req.json()
  if (Array.isArray(body.keywords)) body.keywords = JSON.stringify(body.keywords)
  const { data, error } = await (auth.admin.from('bruck_cuentas_contables') as any)
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id).eq('client_id', auth.userId)
    .select('*, rubro:bruck_rubros(nombre, categoria)').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(_req: NextRequest, { params }: P) {
  const { id } = await params
  const auth = await verifyClientAuth()
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { error } = await (auth.admin.from('bruck_cuentas_contables') as any)
    .delete().eq('id', id).eq('client_id', auth.userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
