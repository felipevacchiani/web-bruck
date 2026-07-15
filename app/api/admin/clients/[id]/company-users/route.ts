import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAudit } from '@/lib/supabase/audit'
import { NextRequest, NextResponse } from 'next/server'

interface Params { params: Promise<{ id: string }> }

async function verifyAdminForClient(clientId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { admin: null, user: null, client: null }
  const admin = createAdminClient()
  const { data: profile } = await (admin.from('profiles') as any).select('role, organization_id').eq('id', user.id).single()
  if (!['admin','super_admin'].includes(profile?.role)) return { admin: null, user: null, client: null }

  const { data: client } = await (admin.from('profiles') as any).select('company_id, organization_id').eq('id', clientId).single()
  if (!client) return { admin: null, user: null, client: null }
  if (profile.role !== 'super_admin' && client.organization_id !== profile.organization_id) {
    return { admin: null, user: null, client: null }
  }
  return { admin, user, client, organizationId: client.organization_id }
}

// Lista los usuarios que pertenecen a la misma empresa que el cliente `id`,
// con su plantilla de permisos actual, y las plantillas disponibles
// de la organización para poblar el selector de "Invitar usuario".
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const { admin, client, organizationId } = await verifyAdminForClient(id)
  if (!admin || !client) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  if (!client.company_id) return NextResponse.json({ users: [], templates: [] })

  const [{ data: companyUsers }, { data: memberships }, { data: templates }] = await Promise.all([
    (admin.from('profiles') as any).select('id, email, full_name, active, created_at').eq('company_id', client.company_id).eq('role', 'client'),
    (admin.from('memberships') as any).select('user_id, permission_template_id').eq('company_id', client.company_id),
    (admin.from('permission_templates') as any).select('id, name').eq('organization_id', organizationId).order('name'),
  ])

  const templateByUser: Record<string, string | null> = {}
  for (const m of memberships || []) templateByUser[m.user_id] = m.permission_template_id

  const users = (companyUsers || []).map((u: any) => ({
    ...u,
    permission_template_id: templateByUser[u.id] || null,
    permission_template_name: (templates || []).find((t: any) => t.id === templateByUser[u.id])?.name || null,
  }))

  return NextResponse.json({ users, templates: templates || [] })
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  const { admin, user, client, organizationId } = await verifyAdminForClient(id)
  if (!admin || !user || !client) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  if (!client.company_id) return NextResponse.json({ error: 'Este cliente no tiene una empresa asignada' }, { status: 400 })

  const body = await req.json()
  const { email, full_name, password, permission_template_id } = body
  if (!email || !password) return NextResponse.json({ error: 'Email y contraseña requeridos' }, { status: 400 })

  const { data: newUser, error: authError } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
  })
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

  const { error: profileError } = await (admin.from('profiles') as any).update({
    full_name: full_name || null,
    role: 'client',
    active: true,
    organization_id: organizationId,
    company_id: client.company_id,
  }).eq('id', newUser.user.id)
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })

  await (admin.from('memberships') as any).insert({
    user_id: newUser.user.id,
    company_id: client.company_id,
    role: 'cliente',
    permission_template_id: permission_template_id || null,
  })

  await logAudit({
    userId: user.id, userEmail: user.email, action: 'client_create',
    entityType: 'client', entityId: newUser.user.id,
    details: { email, full_name, invited_to_company: client.company_id },
  })

  return NextResponse.json({ ok: true, id: newUser.user.id })
}
