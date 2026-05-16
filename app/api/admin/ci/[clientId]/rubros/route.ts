import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

interface P { params: Promise<{ clientId: string }> }

async function verifyAdmin() {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: p } = await (admin.from('profiles') as any).select('role').eq('id', user.id).single()
  return p?.role === 'admin' ? admin : null
}

export async function GET(_req: NextRequest, { params }: P) {
  const { clientId } = await params
  const admin = await verifyAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { data, error } = await (admin.from('bruck_rubros') as any)
    .select('*').eq('client_id', clientId).order('nombre')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest, { params }: P) {
  const { clientId } = await params
  const admin = await verifyAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await req.json()
  const { nombre } = body
  if (!nombre) return NextResponse.json({ error: 'nombre requerido' }, { status: 400 })

  const { data, error } = await (admin.from('bruck_rubros') as any)
    .insert({ client_id: clientId, nombre, categoria: 'egreso' }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
