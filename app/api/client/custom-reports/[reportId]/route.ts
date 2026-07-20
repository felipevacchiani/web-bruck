import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

interface Params { params: Promise<{ reportId: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { reportId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await (admin.from('profiles') as any).select('company_id, active').eq('id', user.id).single()
  if (!profile || !profile.active) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: report } = await (admin.from('custom_reports') as any)
    .select('*').eq('id', reportId).eq('company_id', profile.company_id).eq('status', 'publicado').single()
  if (!report) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json({ data: report })
}
