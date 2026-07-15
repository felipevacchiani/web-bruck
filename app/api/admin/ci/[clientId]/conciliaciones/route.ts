import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

interface P { params: Promise<{ clientId: string }> }

async function verifyAdmin(clientId: string) {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: p } = await (admin.from('profiles') as any).select('role, organization_id').eq('id', user.id).single()
  if (!['admin','super_admin'].includes(p?.role)) return null
  if (p.role !== 'super_admin') {
    const { data: client } = await (admin.from('profiles') as any).select('organization_id').eq('id', clientId).single()
    if (!client || client.organization_id !== p.organization_id) return null
  }
  return admin
}

function prevPeriod(mes: number, anio: number) {
  return mes === 1 ? { mes: 12, anio: anio - 1 } : { mes: mes - 1, anio }
}

export async function GET(req: NextRequest, { params }: P) {
  const { clientId } = await params
  const admin = await verifyAdmin(clientId)
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const sp = req.nextUrl.searchParams
  const cuenta = sp.get('cuenta') || ''
  const mes    = sp.get('mes')    ? parseInt(sp.get('mes')!)    : null
  const anio   = sp.get('anio')   ? parseInt(sp.get('anio')!)   : null

  if (!mes || !anio) {
    let query = (admin.from('bruck_conciliaciones') as any)
      .select('*, cuenta_bancaria:bruck_cuentas_bancarias(nombre)')
      .eq('client_id', clientId)
      .order('anio', { ascending: false }).order('mes', { ascending: false })
    if (cuenta) query = query.eq('cuenta_bancaria_id', cuenta)
    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  }

  if (!cuenta) return NextResponse.json({ error: 'cuenta requerida' }, { status: 400 })

  const { data: cuentaObj } = await (admin.from('bruck_cuentas_bancarias') as any)
    .select('id, saldo_inicial').eq('id', cuenta).eq('client_id', clientId).single()
  if (!cuentaObj) return NextResponse.json({ error: 'Cuenta no encontrada' }, { status: 404 })

  const { data: existing } = await (admin.from('bruck_conciliaciones') as any)
    .select('*').eq('cuenta_bancaria_id', cuenta).eq('mes', mes).eq('anio', anio).maybeSingle()

  const prev = prevPeriod(mes, anio)
  const { data: prevConc } = await (admin.from('bruck_conciliaciones') as any)
    .select('saldo_cierre').eq('cuenta_bancaria_id', cuenta).eq('mes', prev.mes).eq('anio', prev.anio).eq('estado', 'cerrado').maybeSingle()

  const saldoApertura = prevConc ? prevConc.saldo_cierre : (cuentaObj.saldo_inicial || 0)

  const { data: movs } = await (admin.from('bruck_movimientos') as any)
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

export async function POST(req: NextRequest, { params }: P) {
  const { clientId } = await params
  const admin = await verifyAdmin(clientId)
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await req.json()
  const { cuenta_bancaria_id, mes, anio, saldo_apertura, saldo_cierre } = body
  if (!cuenta_bancaria_id || !mes || !anio) {
    return NextResponse.json({ error: 'cuenta_bancaria_id, mes y anio requeridos' }, { status: 400 })
  }

  const { data, error } = await (admin.from('bruck_conciliaciones') as any).insert({
    client_id: clientId,
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
