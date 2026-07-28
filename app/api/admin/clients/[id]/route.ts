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
  const { data: profile } = await admin.from('profiles').select('role, organization_id').eq('id', user.id).single()
  if (!profile || !['admin','super_admin'].includes(profile.role)) return { admin: null, user: null, organizationId: null }
  if (profile.role !== 'super_admin') {
    const { data: client } = await admin.from('profiles').select('organization_id').eq('id', clientId).single()
    if (!client || client.organization_id !== profile.organization_id) return { admin: null, user: null, organizationId: null }
  }
  return { admin, user, organizationId: profile.organization_id }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const { admin, user, organizationId } = await verifyAdminAndGetUser(id)
  if (!admin || !user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await req.json()
  const { error } = await admin.from('profiles').update({
    full_name: body.full_name,
    company: body.company,
    active: body.active,
  }).eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAudit({
    userId:         user.id,
    userEmail:      user.email,
    organizationId,
    action:     'client_update',
    entityType: 'client',
    entityId:   id,
    details:    { full_name: body.full_name, company: body.company, active: body.active },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const { admin, user, organizationId } = await verifyAdminAndGetUser(id)
  if (!admin || !user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  // Fetch client info for audit before deleting
  const { data: clientInfo } = await admin.from('profiles').select('email, full_name').eq('id', id).single()

  // 1. Obtener y eliminar archivos del storage
  const { data: files } = await admin.from('files').select('storage_path').eq('client_id', id)
  if (files?.length) {
    const paths = files.map((f: any) => f.storage_path)
    await admin.storage.from('client-files').remove(paths)
  }

  // 2. Eliminar registros de files
  await admin.from('files').delete().eq('client_id', id)

  // 3. Eliminar usuario de Auth (profiles se elimina por cascade)
  const { error } = await admin.auth.admin.deleteUser(id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAudit({
    userId:         user.id,
    userEmail:      user.email,
    organizationId,
    action:     'client_delete',
    entityType: 'client',
    entityId:   id,
    details:    { email: clientInfo?.email, full_name: clientInfo?.full_name, files_deleted: files?.length ?? 0 },
  })

  return NextResponse.json({ ok: true })
}
