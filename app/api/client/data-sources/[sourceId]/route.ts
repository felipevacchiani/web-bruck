import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { fetchGoogleSheetData } from '@/lib/google-sheets'
import { NextRequest, NextResponse } from 'next/server'

interface Params { params: Promise<{ sourceId: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { sourceId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await (admin.from('profiles') as any).select('company_id, active').eq('id', user.id).single()
  if (!profile || !profile.active) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: source } = await (admin.from('data_sources') as any).select('*').eq('id', sourceId).eq('company_id', profile.company_id).single()
  if (!source) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

  try {
    const result = await fetchGoogleSheetData(source.url)
    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error al leer el Sheet' }, { status: 502 })
  }
}
