import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role, organization_id').eq('id', user.id).single()
  if (!profile || !['admin','super_admin'].includes(profile.role)) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  let query = admin
    .from('profiles')
    .select('id, full_name, company, email')
    .eq('role', 'client')
    .order('full_name', { ascending: true })
  if (profile.role !== 'super_admin') query = query.eq('organization_id', profile.organization_id)

  const { data: clients } = await query

  return NextResponse.json({ clients: clients || [] })
}
