import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

interface P { params: Promise<{ clientId: string }> }

async function verifyAdmin() {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: p } = await (admin.from('profiles') as any).select('role').eq('id', user.id).single()
  return p?.role === 'admin' ? admin : null
}

export async function GET(req: NextRequest, { params }: P) {
  const { clientId } = await params
  const admin = await verifyAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const sp = req.nextUrl.searchParams
  const cuenta  = sp.get('cuenta')  || ''
  const mes     = sp.get('mes')     || ''
  const anio    = sp.get('anio')    || ''
  const estado  = sp.get('estado')  || ''
  const q       = sp.get('q')       || ''
  const page    = Math.max(1, parseInt(sp.get('page') || '1'))
  const limit   = 50
  const offset  = (page - 1) * limit

  let query = (admin.from('bruck_movimientos') as any)
    .select(`
      id, client_id, fecha, descripcion, debito, credito, tipo_movimiento,
      estado, clasificacion_origen, comentario,
      cuenta_bancaria_id, cuenta_contable_id, rubro_id,
      mes, anio, created_at, updated_at,
      cuenta_bancaria:bruck_cuentas_bancarias(nombre),
      cuenta_contable:bruck_cuentas_contables(nombre),
      rubro:bruck_rubros(nombre, categoria)
    `, { count: 'exact' })
    .eq('client_id', clientId)
    .order('fecha', { ascending: false })
    .range(offset, offset + limit - 1)

  if (cuenta)  query = query.eq('cuenta_bancaria_id', cuenta)
  if (mes)     query = query.eq('mes', parseInt(mes))
  if (anio)    query = query.eq('anio', parseInt(anio))
  if (estado)  query = query.eq('estado', estado)
  if (q)       query = query.ilike('descripcion', `%${q}%`)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, count, page, pages: Math.ceil((count||0)/limit) })
}

export async function POST(req: NextRequest, { params }: P) {
  const { clientId } = await params
  const admin = await verifyAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await req.json()
  const { fecha, descripcion, debito, credito, cuenta_bancaria_id } = body
  if (!fecha || !descripcion) return NextResponse.json({ error: 'fecha y descripcion requeridos' }, { status: 400 })

  const fechaObj  = new Date(fecha)
  const mes       = fechaObj.getMonth() + 1
  const anio      = fechaObj.getFullYear()
  const hashRaw   = `${clientId}|${fecha}|${descripcion}|${debito||0}|${credito||0}`
  const hash_dedup = crypto.createHash('sha256').update(hashRaw).digest('hex')

  const { data, error } = await (admin.from('bruck_movimientos') as any).insert({
    client_id: clientId, cuenta_bancaria_id: cuenta_bancaria_id || null,
    fecha, descripcion,
    debito:  parseFloat(debito)  || 0,
    credito: parseFloat(credito) || 0,
    mes, anio, hash_dedup,
    tipo_movimiento: body.tipo_movimiento || 'gasto',
    estado: 'pendiente',
  }).select(`
    *,
    cuenta_bancaria:bruck_cuentas_bancarias(nombre),
    cuenta_contable:bruck_cuentas_contables(nombre),
    rubro:bruck_rubros(nombre, categoria)
  `).single()

  if (error?.code === '23505') return NextResponse.json({ error: 'Movimiento duplicado' }, { status: 409 })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
