import { verifyClientAuth } from '@/lib/supabase/ci-client-auth'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function GET(req: NextRequest) {
  const auth = await verifyClientAuth()
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const sp = req.nextUrl.searchParams
  const cuenta   = sp.get('cuenta')   || ''
  const mes      = sp.get('mes')      || ''
  const anio     = sp.get('anio')     || ''
  const estado   = sp.get('estado')   || ''
  const q        = sp.get('q')        || ''
  const rubro    = sp.get('rubro')    || ''
  const tipo     = sp.get('tipo')     || ''
  const factura  = sp.get('factura')  || ''
  const desde    = sp.get('desde')    || ''
  const hasta    = sp.get('hasta')    || ''
  const origen   = sp.get('origen')   || ''
  const contable = sp.get('contable') || ''
  const page     = Math.max(1, parseInt(sp.get('page') || '1'))
  const limit    = Math.min(9999, parseInt(sp.get('limit') || '50'))
  const offset   = (page - 1) * limit

  // Resolver IDs de cuentas bancarias por origen (banco/caja)
  let cuentaIdsForOrigen: string[] | null = null
  if (origen) {
    const { data: cuentasOrigen } = await (auth.admin.from('bruck_cuentas_bancarias') as any)
      .select('id').eq('client_id', auth.userId).eq('tipo', origen)
    cuentaIdsForOrigen = (cuentasOrigen || []).map((c: any) => c.id)
  }

  let query = (auth.admin.from('bruck_movimientos') as any)
    .select(`id, client_id, fecha, descripcion, debito, credito, tipo_movimiento, estado, clasificacion_origen, comentario, factura, cuenta_bancaria_id, cuenta_contable_id, rubro_id, mes, anio, created_at, updated_at, cuenta_bancaria:bruck_cuentas_bancarias(nombre), cuenta_contable:bruck_cuentas_contables(nombre), rubro:bruck_rubros(nombre, categoria)`, { count: 'exact' })
    .eq('client_id', auth.userId)
    .order('fecha', { ascending: false })
    .range(offset, offset + limit - 1)

  if (cuenta)   query = query.eq('cuenta_bancaria_id', cuenta)
  if (mes)      query = query.eq('mes', parseInt(mes))
  if (anio)     query = query.eq('anio', parseInt(anio))
  if (estado)   query = query.eq('estado', estado)
  if (q)        query = query.ilike('descripcion', `%${q}%`)
  if (rubro)    query = query.eq('rubro_id', rubro)
  if (tipo)     query = query.eq('tipo_movimiento', tipo)
  if (factura)  query = query.eq('factura', factura === 'true')
  if (desde)    query = query.gte('fecha', desde)
  if (hasta)    query = query.lte('fecha', hasta)
  if (contable) query = query.eq('cuenta_contable_id', contable)
  if (cuentaIdsForOrigen !== null) {
    if (cuentaIdsForOrigen.length === 0) query = query.eq('id', 'none')
    else query = query.in('cuenta_bancaria_id', cuentaIdsForOrigen)
  }

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, count, page, pages: Math.ceil((count||0)/limit) })
}

export async function POST(req: NextRequest) {
  const auth = await verifyClientAuth()
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const { fecha, descripcion, debito, credito, cuenta_bancaria_id } = body
  if (!fecha || !descripcion) return NextResponse.json({ error: 'fecha y descripcion requeridos' }, { status: 400 })

  const fechaObj   = new Date(fecha)
  const mes        = fechaObj.getMonth() + 1
  const anio       = fechaObj.getFullYear()
  const hashRaw    = `${auth.userId}|${fecha}|${descripcion}|${debito||0}|${credito||0}`
  const hash_dedup = crypto.createHash('sha256').update(hashRaw).digest('hex')

  const { data, error } = await (auth.admin.from('bruck_movimientos') as any).insert({
    client_id: auth.userId, cuenta_bancaria_id: cuenta_bancaria_id || null,
    fecha, descripcion,
    debito:  parseFloat(debito)  || 0,
    credito: parseFloat(credito) || 0,
    mes, anio, hash_dedup,
    tipo_movimiento: body.tipo_movimiento || 'gasto',
    cuenta_contable_id: body.cuenta_contable_id || null,
    estado: body.estado || 'pendiente',
    clasificacion_origen: body.clasificacion_origen || null,
  }).select(`*, cuenta_bancaria:bruck_cuentas_bancarias(nombre), cuenta_contable:bruck_cuentas_contables(nombre), rubro:bruck_rubros(nombre, categoria)`).single()

  if (error?.code === '23505') return NextResponse.json({ error: 'Movimiento duplicado' }, { status: 409 })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
