import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAudit } from '@/lib/supabase/audit'
import { NextRequest, NextResponse } from 'next/server'

interface Params { params: Promise<{ id: string }> }

async function verifyAdminAndGetUser(clientId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { admin: null, user: null }
  const admin = createAdminClient()
  const { data: profile } = await (admin.from('profiles') as any).select('role, organization_id').eq('id', user.id).single()
  if (!['admin','super_admin'].includes(profile?.role)) return { admin: null, user: null, organizationId: null }
  if (profile.role !== 'super_admin') {
    const { data: client } = await (admin.from('profiles') as any).select('organization_id').eq('id', clientId).single()
    if (!client || client.organization_id !== profile.organization_id) return { admin: null, user: null, organizationId: null }
  }
  return { admin, user, organizationId: profile.organization_id }
}

// Devuelve la membership del cliente (con su plantilla actual) y
// todas las plantillas disponibles en la organización, para poblar
// el selector en la ficha de cliente.
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const { admin } = await verifyAdminAndGetUser(id)
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { data: membership, error: membershipError } = await (admin.from('memberships') as any)
    .select('id, permission_template_id, companies(organization_id)')
    .eq('user_id', id)
    .maybeSingle()
  if (membershipError) return NextResponse.json({ error: membershipError.message }, { status: 500 })
  if (!membership) return NextResponse.json({ error: 'El cliente no tiene una empresa/membership asignada' }, { status: 404 })

  const organizationId = membership.companies?.organization_id
  const { data: templates, error: templatesError } = await (admin.from('permission_templates') as any)
    .select('id, name, description')
    .eq('organization_id', organizationId)
    .order('name')
  if (templatesError) return NextResponse.json({ error: templatesError.message }, { status: 500 })

  return NextResponse.json({
    membershipId: membership.id,
    currentTemplateId: membership.permission_template_id,
    templates,
  })
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params
  const { admin, user, organizationId } = await verifyAdminAndGetUser(id)
  if (!admin || !user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await req.json()
  if (!body.permission_template_id) return NextResponse.json({ error: 'permission_template_id requerido' }, { status: 400 })

  const { error } = await (admin.from('memberships') as any)
    .update({ permission_template_id: body.permission_template_id })
    .eq('user_id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAudit({
    userId:         user.id,
    userEmail:      user.email,
    organizationId,
    action:     'client_update',
    entityType: 'client',
    entityId:   id,
    details:    { permission_template_id: body.permission_template_id },
  })

  return NextResponse.json({ ok: true })
}
