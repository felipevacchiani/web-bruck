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

  const now = new Date()
  const mesActual = now.getMonth() + 1
  const anioActual = now.getFullYear()

  const [
    { data: movs },
    { data: cuentas },
    { data: rubros },
  ] = await Promise.all([
    (admin.from('bruck_movimientos') as any).select('debito, credito, estado, mes, anio, rubro_id, rubro:bruck_rubros(nombre, categoria)').eq('client_id', clientId),
    (admin.from('bruck_cuentas_bancarias') as any).select('saldo_inicial').eq('client_id', clientId).eq('estado', 'activa'),
    (admin.from('bruck_rubros') as any).select('id, nombre, categoria').eq('client_id', clientId),
  ])

  const totalMovs     = (movs || []).length
  const pendientes    = (movs || []).filter((m: any) => m.estado === 'pendiente').length
  const conciliados   = (movs || []).filter((m: any) => m.estado === 'conciliado').length

  const movsEsteMes   = (movs || []).filter((m: any) => m.mes === mesActual && m.anio === anioActual)
  const ingresosMes   = movsEsteMes.reduce((s: number, m: any) => s + (m.credito || 0), 0)
  const egresosMes    = movsEsteMes.reduce((s: number, m: any) => s + (m.debito  || 0), 0)

  const saldoInicial  = (cuentas || []).reduce((s: number, c: any) => s + (c.saldo_inicial || 0), 0)
  const totalCreditos = (movs || []).reduce((s: number, m: any) => s + (m.credito || 0), 0)
  const totalDebitos  = (movs || []).reduce((s: number, m: any) => s + (m.debito  || 0), 0)
  const saldoActual   = saldoInicial + totalCreditos - totalDebitos

  // Resumen por rubro
  const resumenRubros: Record<string, { nombre: string; categoria: string; debito: number; credito: number }> = {}
  for (const m of movs || []) {
    if (!m.rubro_id) continue
    if (!resumenRubros[m.rubro_id]) {
      resumenRubros[m.rubro_id] = { nombre: m.rubro?.nombre || '—', categoria: m.rubro?.categoria || '—', debito: 0, credito: 0 }
    }
    resumenRubros[m.rubro_id].debito  += m.debito  || 0
    resumenRubros[m.rubro_id].credito += m.credito || 0
  }

  return NextResponse.json({
    totalMovs, pendientes, conciliados,
    ingresosMes, egresosMes,
    saldoActual,
    mesActual, anioActual,
    resumenRubros: Object.values(resumenRubros),
    cantCuentas: (cuentas || []).length,
    cantRubros:  (rubros  || []).length,
  })
}
