import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await (admin.from('profiles') as any).select('company_id, active').eq('id', user.id).single()
  if (!profile || !profile.active) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (!profile.company_id) return NextResponse.json({ data: [] })

  const { data, error } = await (admin.from('requests') as any)
    .select('*').eq('company_id', profile.company_id).order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
