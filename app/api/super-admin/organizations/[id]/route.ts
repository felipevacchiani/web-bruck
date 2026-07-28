import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAudit } from '@/lib/supabase/audit'
import { NextRequest, NextResponse } from 'next/server'

interface Params { params: Promise<{ id: string }> }

async function verifySuperAdmin() {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return { admin: null, user: null }
  const admin = createAdminClient()
  const { data: profile } = await (admin.from('profiles') as any).select('role').eq('id', user.id).single()
  return profile?.role === 'super_admin' ? { admin, user } : { admin: null, user: null }
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params
  const { admin, user } = await verifySuperAdmin()
  if (!admin || !user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await req.json()
  if (typeof body.active !== 'boolean') return NextResponse.json({ error: 'active (boolean) requerido' }, { status: 400 })

  const { data: org, error } = await (admin.from('organizations') as any)
    .update({ active: body.active, updated_at: new Date().toISOString() })
    .eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAudit({
    userId:         user.id,
    userEmail:      user.email,
    organizationId: id,
    action:     'client_update',
    entityType: 'organization',
    entityId:   id,
    details:    { active: body.active, org_name: org?.name },
  })

  return NextResponse.json({ organization: org })
}
