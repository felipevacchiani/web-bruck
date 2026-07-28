import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAudit } from '@/lib/supabase/audit'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role, organization_id').eq('id', user.id).single()
  if (!profile || !['admin','super_admin'].includes(profile.role)) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  if (!profile.organization_id) return NextResponse.json({ error: 'Tu cuenta no tiene una organización asignada' }, { status: 400 })

  const body = await req.json()
  const { email, full_name, company, password } = body
  if (!email || !password) return NextResponse.json({ error: 'Email y contraseña requeridos' }, { status: 400 })

  const { data: newUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

  const { error: profileError } = await admin.from('profiles').update({
    full_name: full_name || null,
    company: company || null,
    role: 'client',
    active: true,
    organization_id: profile.organization_id,
  }).eq('id', newUser.user.id)

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })

  const { data: companyRow } = await (admin.from('companies') as any).insert({
    organization_id: profile.organization_id,
    name: company || full_name || email,
  }).select().single()

  if (companyRow) {
    await admin.from('profiles').update({ company_id: companyRow.id }).eq('id', newUser.user.id)

    const { data: estandarTpl } = await (admin.from('permission_templates') as any)
      .select('id').eq('organization_id', profile.organization_id).eq('name', 'Cliente Estándar').maybeSingle()

    await (admin.from('memberships') as any).insert({
      user_id: newUser.user.id,
      company_id: companyRow.id,
      role: 'cliente',
      permission_template_id: estandarTpl?.id || null,
    })
  }

  await logAudit({
    userId:         user.id,
    userEmail:      user.email,
    organizationId: profile.organization_id,
    action:     'client_create',
    entityType: 'client',
    entityId:   newUser.user.id,
    details:    { email, full_name, company },
  })

  return NextResponse.json({ ok: true, id: newUser.user.id })
}
