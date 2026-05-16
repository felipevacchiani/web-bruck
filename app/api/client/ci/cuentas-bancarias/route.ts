import { verifyClientAuth } from '@/lib/supabase/ci-client-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const auth = await verifyClientAuth()
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { data, error } = await (auth.admin.from('bruck_cuentas_bancarias') as any)
    .select('*').eq('client_id', auth.userId).order('nombre')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const auth = await verifyClientAuth()
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const body = await req.json()
  if (!body.nombre) return NextResponse.json({ error: 'nombre requerido' }, { status: 400 })
  const { data, error } = await (auth.admin.from('bruck_cuentas_bancarias') as any).insert({
    client_id: auth.userId, nombre: body.nombre, banco: body.banco || null,
    numero_cuenta: body.numero_cuenta || null, tipo: body.tipo || 'corriente',
    saldo_inicial: parseFloat(body.saldo_inicial) || 0,
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
