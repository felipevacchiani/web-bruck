import { verifyClientAuth } from '@/lib/supabase/ci-client-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const auth = await verifyClientAuth()
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { data, error } = await (auth.admin.from('bruck_cuentas_contables') as any)
    .select('*, rubro:bruck_rubros(nombre, categoria)')
    .eq('client_id', auth.userId).order('nombre')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const auth = await verifyClientAuth()
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const body = await req.json()
  if (!body.nombre) return NextResponse.json({ error: 'nombre requerido' }, { status: 400 })
  const keywords = Array.isArray(body.keywords) ? JSON.stringify(body.keywords) : (body.keywords || '[]')
  const { data, error } = await (auth.admin.from('bruck_cuentas_contables') as any).insert({
    client_id: auth.userId, nombre: body.nombre,
    tipo: body.tipo || 'gasto', rubro_id: body.rubro_id || null, keywords,
  }).select('*, rubro:bruck_rubros(nombre, categoria)').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
