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

export async function GET(req: NextRequest, { params }: P) {
  const { clientId } = await params
  const admin = await verifyAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const sp = req.nextUrl.searchParams
  const cuenta = sp.get('cuenta') || ''
  const mes    = sp.get('mes')    ? parseInt(sp.get('mes')!)    : null
  const anio   = sp.get('anio')   ? parseInt(sp.get('anio')!)   : null

  const now = new Date()
  const mesActual  = mes  ?? now.getMonth() + 1
  const anioActual = anio ?? now.getFullYear()

  let movQuery = (admin.from('bruck_movimientos') as any)
    .select('debito, credito, estado, mes, anio, factura, cuenta_contable_id, rubro_id, cuenta_bancaria_id, rubro:bruck_rubros(nombre, categoria)')
    .eq('client_id', clientId)
  if (cuenta) movQuery = movQuery.eq('cuenta_bancaria_id', cuenta)

  const [{ data: movs }, { data: cuentas }] = await Promise.all([
    movQuery,
    (admin.from('bruck_cuentas_bancarias') as any)
      .select('id, nombre, saldo_inicial, disponible, tipo')
      .eq('client_id', clientId),
  ])

  const allMovs = movs || []
  const movsDelPeriodo = allMovs.filter((m: any) => m.mes === mesActual && m.anio === anioActual)

  const totalMovs    = movsDelPeriodo.length
  const pendientes   = movsDelPeriodo.filter((m: any) => m.estado === 'pendiente').length
  const conciliados  = movsDelPeriodo.filter((m: any) => m.estado === 'conciliado').length
  const sinFactura   = movsDelPeriodo.filter((m: any) => !m.factura).length
  const ingresosMes  = movsDelPeriodo.reduce((s: number, m: any) => s + (m.credito || 0), 0)
  const egresosMes   = movsDelPeriodo.reduce((s: number, m: any) => s + (m.debito  || 0), 0)
  const saldoMes     = ingresosMes - egresosMes

  const cuentaObj    = cuenta ? (cuentas || []).find((c: any) => c.id === cuenta) : null
  const saldoInicial = cuentaObj ? (cuentaObj.saldo_inicial || 0) : (cuentas || []).reduce((s: number, c: any) => s + (c.saldo_inicial || 0), 0)
  const totalCred    = allMovs.reduce((s: number, m: any) => s + (m.credito || 0), 0)
  const totalDeb     = allMovs.reduce((s: number, m: any) => s + (m.debito  || 0), 0)
  const saldoActual  = saldoInicial + totalCred - totalDeb

  const resumenRubros: Record<string, any> = {}
  for (const m of movsDelPeriodo) {
    if (!m.rubro_id) continue
    if (!resumenRubros[m.rubro_id]) resumenRubros[m.rubro_id] = { nombre: m.rubro?.nombre || '—', debito: 0, credito: 0 }
    resumenRubros[m.rubro_id].debito  += m.debito  || 0
    resumenRubros[m.rubro_id].credito += m.credito || 0
  }

  return NextResponse.json({
    totalMovs, pendientes, conciliados, sinFactura,
    ingresosMes, egresosMes, saldoMes, saldoActual,
    mesActual, anioActual,
    resumenRubros: Object.values(resumenRubros),
    cuentas: cuentas || [],
  })
}
