import { verifyClientAuth } from '@/lib/supabase/ci-client-auth'
import { NextRequest, NextResponse } from 'next/server'

// Resuelve el período anterior (mes/año) para encadenar saldo de cierre → apertura.
function prevPeriod(mes: number, anio: number) {
  return mes === 1 ? { mes: 12, anio: anio - 1 } : { mes: mes - 1, anio }
}

export async function GET(req: NextRequest) {
  const auth = await verifyClientAuth('ver')
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const sp = req.nextUrl.searchParams
  const cuenta = sp.get('cuenta') || ''
  const mes    = sp.get('mes')    ? parseInt(sp.get('mes')!)    : null
  const anio   = sp.get('anio')   ? parseInt(sp.get('anio')!)   : null

  // Sin período: devuelve el historial de conciliaciones (opcionalmente filtrado por cuenta)
  if (!mes || !anio) {
    let query = (auth.admin.from('bruck_conciliaciones') as any)
      .select('*, cuenta_bancaria:bruck_cuentas_bancarias(nombre)')
      .eq('client_id', auth.userId)
      .order('anio', { ascending: false }).order('mes', { ascending: false })
    if (cuenta) query = query.eq('cuenta_bancaria_id', cuenta)
    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  }

  if (!cuenta) return NextResponse.json({ error: 'cuenta requerida' }, { status: 400 })

  const { data: cuentaObj } = await (auth.admin.from('bruck_cuentas_bancarias') as any)
    .select('id, saldo_inicial').eq('id', cuenta).eq('client_id', auth.userId).single()
  if (!cuentaObj) return NextResponse.json({ error: 'Cuenta no encontrada' }, { status: 404 })

  const { data: existing } = await (auth.admin.from('bruck_conciliaciones') as any)
    .select('*').eq('cuenta_bancaria_id', cuenta).eq('mes', mes).eq('anio', anio).maybeSingle()

  const prev = prevPeriod(mes, anio)
  const { data: prevConc } = await (auth.admin.from('bruck_conciliaciones') as any)
    .select('saldo_cierre').eq('cuenta_bancaria_id', cuenta).eq('mes', prev.mes).eq('anio', prev.anio).eq('estado', 'cerrado').maybeSingle()

  const saldoApertura = prevConc ? prevConc.saldo_cierre : (cuentaObj.saldo_inicial || 0)

  const { data: movs } = await (auth.admin.from('bruck_movimientos') as any)
    .select('debito, credito, estado')
    .eq('cuenta_bancaria_id', cuenta).eq('mes', mes).eq('anio', anio)

  const totalCredito = (movs || []).reduce((s: number, m: any) => s + (m.credito || 0), 0)
  const totalDebito  = (movs || []).reduce((s: number, m: any) => s + (m.debito  || 0), 0)
  const pendientes   = (movs || []).filter((m: any) => m.estado === 'pendiente').length

  return NextResponse.json({
    existing: existing || null,
    sugerido: {
      saldo_apertura: saldoApertura,
      saldo_cierre: saldoApertura + totalCredito - totalDebito,
      movimientos_count: (movs || []).length,
      movimientos_pendientes: pendientes,
    },
  })
}

export async function POST(req: NextRequest) {
  const auth = await verifyClientAuth('crear')
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const { cuenta_bancaria_id, mes, anio, saldo_apertura, saldo_cierre } = body
  if (!cuenta_bancaria_id || !mes || !anio) {
    return NextResponse.json({ error: 'cuenta_bancaria_id, mes y anio requeridos' }, { status: 400 })
  }

  const { data, error } = await (auth.admin.from('bruck_conciliaciones') as any).insert({
    client_id: auth.userId,
    cuenta_bancaria_id, mes, anio,
    saldo_apertura: parseFloat(saldo_apertura) || 0,
    saldo_cierre: parseFloat(saldo_cierre) || 0,
    estado: 'cerrado',
    fecha_cierre: new Date().toISOString().split('T')[0],
    observaciones: body.observaciones || null,
  }).select('*, cuenta_bancaria:bruck_cuentas_bancarias(nombre)').single()

  if (error?.code === '23505') return NextResponse.json({ error: 'Ya existe una conciliación para ese período' }, { status: 409 })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
