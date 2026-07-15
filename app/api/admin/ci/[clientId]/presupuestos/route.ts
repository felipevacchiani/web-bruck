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
  const mes  = parseInt(sp.get('mes')  || '0')
  const anio = parseInt(sp.get('anio') || '0')
  if (!mes || !anio) return NextResponse.json({ error: 'mes y anio requeridos' }, { status: 400 })

  const [{ data: rubros }, { data: presupuestos }, { data: movs }] = await Promise.all([
    (admin.from('bruck_rubros') as any).select('id, nombre, categoria').eq('client_id', clientId).eq('estado', 'activo').order('nombre'),
    (admin.from('bruck_presupuestos') as any).select('*').eq('client_id', clientId).eq('mes', mes).eq('anio', anio),
    (admin.from('bruck_movimientos') as any).select('rubro_id, debito, credito').eq('client_id', clientId).eq('mes', mes).eq('anio', anio),
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

export async function POST(req: NextRequest, { params }: P) {
  const { clientId } = await params
  const admin = await verifyAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await req.json()
  const { rubro_id, mes, anio, monto } = body
  if (!rubro_id || !mes || !anio) return NextResponse.json({ error: 'rubro_id, mes y anio requeridos' }, { status: 400 })

  const { data, error } = await (admin.from('bruck_presupuestos') as any)
    .upsert(
      { client_id: clientId, rubro_id, mes, anio, monto: parseFloat(monto) || 0, updated_at: new Date().toISOString() },
      { onConflict: 'rubro_id,mes,anio' }
    )
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
