import { verifyClientAuth } from '@/lib/supabase/ci-client-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const auth = await verifyClientAuth('ver')
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const sp = req.nextUrl.searchParams
  const mes  = parseInt(sp.get('mes')  || '0')
  const anio = parseInt(sp.get('anio') || '0')
  if (!mes || !anio) return NextResponse.json({ error: 'mes y anio requeridos' }, { status: 400 })

  const [{ data: rubros }, { data: presupuestos }, { data: movs }] = await Promise.all([
    (auth.admin.from('bruck_rubros') as any).select('id, nombre, categoria').eq('client_id', auth.userId).eq('estado', 'activo').order('nombre'),
    (auth.admin.from('bruck_presupuestos') as any).select('*').eq('client_id', auth.userId).eq('mes', mes).eq('anio', anio),
    (auth.admin.from('bruck_movimientos') as any).select('rubro_id, debito, credito').eq('client_id', auth.userId).eq('mes', mes).eq('anio', anio),
  ])

  const data = (rubros || []).map((r: any) => {
    const presupuesto = (presupuestos || []).find((p: any) => p.rubro_id === r.id) || null
    const movsRubro = (movs || []).filter((m: any) => m.rubro_id === r.id)
    const realDebito  = movsRubro.reduce((s: number, m: any) => s + (m.debito  || 0), 0)
    const realCredito = movsRubro.reduce((s: number, m: any) => s + (m.credito || 0), 0)
    return { rubro: r, presupuesto, real: { debito: realDebito, credito: realCredito } }
  })

  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const auth = await verifyClientAuth('crear')
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const { rubro_id, mes, anio, monto } = body
  if (!rubro_id || !mes || !anio) return NextResponse.json({ error: 'rubro_id, mes y anio requeridos' }, { status: 400 })

  const { data, error } = await (auth.admin.from('bruck_presupuestos') as any)
    .upsert(
      { client_id: auth.userId, rubro_id, mes, anio, monto: parseFloat(monto) || 0, updated_at: new Date().toISOString() },
      { onConflict: 'rubro_id,mes,anio' }
    )
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
