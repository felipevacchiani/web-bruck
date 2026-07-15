import { verifyClientAuth } from '@/lib/supabase/ci-client-auth'
import { NextRequest, NextResponse } from 'next/server'

function periodKey(anio: number, mes: number) { return anio * 12 + mes }

function buildRange(desde: { mes: number; anio: number }, hasta: { mes: number; anio: number }) {
  const out: { mes: number; anio: number }[] = []
  let k = periodKey(desde.anio, desde.mes)
  const end = periodKey(hasta.anio, hasta.mes)
  while (k <= end) {
    const anio = Math.floor((k - 1) / 12)
    const mes = k - anio * 12
    out.push({ mes, anio })
    k++
  }
  return out
}

export async function GET(req: NextRequest) {
  const auth = await verifyClientAuth('ver')
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const now = new Date()
  const sp = req.nextUrl.searchParams
  const [desdeAnio, desdeMes] = (sp.get('desde') || '').split('-').map(Number)
  const [hastaAnio, hastaMes] = (sp.get('hasta') || '').split('-').map(Number)

  const desde = desdeAnio && desdeMes
    ? { anio: desdeAnio, mes: desdeMes }
    : (() => { const d = new Date(now.getFullYear(), now.getMonth() - 3, 1); return { anio: d.getFullYear(), mes: d.getMonth() + 1 } })()
  const hasta = hastaAnio && hastaMes
    ? { anio: hastaAnio, mes: hastaMes }
    : (() => { const d = new Date(now.getFullYear(), now.getMonth() + 3, 1); return { anio: d.getFullYear(), mes: d.getMonth() + 1 } })()

  const periodos = buildRange(desde, hasta)
  const currentKey = periodKey(now.getFullYear(), now.getMonth() + 1)

  const [{ data: cuentas }, { data: rubros }] = await Promise.all([
    (auth.admin.from('bruck_cuentas_bancarias') as any).select('saldo_inicial').eq('client_id', auth.userId),
    (auth.admin.from('bruck_rubros') as any).select('id, categoria').eq('client_id', auth.userId),
  ])
  const saldoInicialTotal = (cuentas || []).reduce((s: number, c: any) => s + (c.saldo_inicial || 0), 0)
  const rubroCategoria: Record<string, string> = {}
  for (const r of rubros || []) rubroCategoria[r.id] = r.categoria

  // Saldo previo al inicio del rango: saldo inicial + neto de todos los movimientos anteriores al rango
  const { data: movsPrevios } = await (auth.admin.from('bruck_movimientos') as any)
    .select('debito, credito, anio, mes')
    .eq('client_id', auth.userId)
  const desdeKey = periodKey(desde.anio, desde.mes)
  let saldoBase = saldoInicialTotal
  for (const m of movsPrevios || []) {
    if (periodKey(m.anio, m.mes) < desdeKey) saldoBase += (m.credito || 0) - (m.debito || 0)
  }

  // Presupuestos de todo el rango (para los períodos futuros)
  const { data: presupuestos } = await (auth.admin.from('bruck_presupuestos') as any)
    .select('rubro_id, mes, anio, monto').eq('client_id', auth.userId)

  let saldo = saldoBase
  const data = periodos.map(({ mes, anio }) => {
    const key = periodKey(anio, mes)
    const esReal = key <= currentKey
    let ingresos = 0, egresos = 0

    if (esReal) {
      const movs = (movsPrevios || []).filter((m: any) => m.anio === anio && m.mes === mes)
      ingresos = movs.reduce((s: number, m: any) => s + (m.credito || 0), 0)
      egresos  = movs.reduce((s: number, m: any) => s + (m.debito  || 0), 0)
    } else {
      const pres = (presupuestos || []).filter((p: any) => p.anio === anio && p.mes === mes)
      for (const p of pres) {
        const cat = rubroCategoria[p.rubro_id]
        if (cat === 'ingreso') ingresos += p.monto || 0
        else if (cat === 'egreso') egresos += p.monto || 0
      }
    }

    const neto = ingresos - egresos
    saldo += neto
    return { mes, anio, ingresos, egresos, neto, saldo, origen: esReal ? 'real' : 'proyectado' }
  })

  return NextResponse.json({ data, saldoInicial: saldoBase })
}
