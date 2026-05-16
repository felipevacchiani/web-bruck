import { verifyClientAuth } from '@/lib/supabase/ci-client-auth'
import { NextResponse } from 'next/server'

export async function GET() {
  const auth = await verifyClientAuth()
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const id = auth.userId
  const now = new Date()
  const mesActual  = now.getMonth() + 1
  const anioActual = now.getFullYear()

  const [{ data: movs }, { data: cuentas }, { data: rubros }] = await Promise.all([
    (auth.admin.from('bruck_movimientos') as any).select('debito, credito, estado, mes, anio, rubro_id, rubro:bruck_rubros(nombre, categoria)').eq('client_id', id),
    (auth.admin.from('bruck_cuentas_bancarias') as any).select('saldo_inicial').eq('client_id', id).eq('estado', 'activa'),
    (auth.admin.from('bruck_rubros') as any).select('id, nombre, categoria').eq('client_id', id),
  ])

  const totalMovs    = (movs || []).length
  const pendientes   = (movs || []).filter((m: any) => m.estado === 'pendiente').length
  const conciliados  = (movs || []).filter((m: any) => m.estado === 'conciliado').length
  const movsEsteMes  = (movs || []).filter((m: any) => m.mes === mesActual && m.anio === anioActual)
  const ingresosMes  = movsEsteMes.reduce((s: number, m: any) => s + (m.credito || 0), 0)
  const egresosMes   = movsEsteMes.reduce((s: number, m: any) => s + (m.debito  || 0), 0)
  const saldoInicial = (cuentas || []).reduce((s: number, c: any) => s + (c.saldo_inicial || 0), 0)
  const totalCreditos = (movs || []).reduce((s: number, m: any) => s + (m.credito || 0), 0)
  const totalDebitos  = (movs || []).reduce((s: number, m: any) => s + (m.debito  || 0), 0)
  const saldoActual  = saldoInicial + totalCreditos - totalDebitos

  const resumenRubros: Record<string, any> = {}
  for (const m of movs || []) {
    if (!m.rubro_id) continue
    if (!resumenRubros[m.rubro_id]) resumenRubros[m.rubro_id] = { nombre: m.rubro?.nombre || '—', categoria: m.rubro?.categoria || '—', debito: 0, credito: 0 }
    resumenRubros[m.rubro_id].debito  += m.debito  || 0
    resumenRubros[m.rubro_id].credito += m.credito || 0
  }

  return NextResponse.json({
    totalMovs, pendientes, conciliados, ingresosMes, egresosMes, saldoActual,
    mesActual, anioActual,
    resumenRubros: Object.values(resumenRubros),
    cantCuentas: (cuentas || []).length,
    cantRubros:  (rubros  || []).length,
  })
}
