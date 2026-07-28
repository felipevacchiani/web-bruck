import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAudit } from '@/lib/supabase/audit'
import { notifyUser } from '@/lib/supabase/notifications'
import { NextRequest, NextResponse } from 'next/server'

interface Params { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role, organization_id').eq('id', user.id).single()
  if (!profile || !['admin','super_admin'].includes(profile.role)) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { data: existing } = await (admin.from('files') as any).select('is_current, client_id').eq('id', id).single()
  if (existing && !existing.is_current) {
    return NextResponse.json({ error: 'Versión histórica: es inmutable, no se puede editar' }, { status: 409 })
  }
  if (existing && profile.role !== 'super_admin') {
    const { data: targetClient } = await (admin.from('profiles') as any).select('organization_id').eq('id', existing.client_id).single()
    if (!targetClient || targetClient.organization_id !== profile.organization_id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }
  }

  const body = await req.json().catch(() => ({}))
  const allowed = ['doc_status', 'due_date', 'fiscal_month', 'fiscal_year', 'group_title', 'description', 'tags']
  const update: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }

  if (!Object.keys(update).length) return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })

  const { data, error } = await admin.from('files').update(update).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (update.doc_status === 'aprobado' && existing?.client_id) {
    await notifyUser({
      userId: existing.client_id,
      type: 'document_approved',
      title: 'Documento aprobado',
      message: (data as any)?.group_title || (data as any)?.name || undefined,
      link: '/dashboard',
    })
  }

  const action = 'doc_status' in update ? 'file_status_change' : 'file_update'
  await logAudit({
    userId:         user.id,
    userEmail:      user.email,
    organizationId: profile.organization_id,
    action,
    entityType: 'file',
    entityId:   id,
    details:    update as Record<string, unknown>,
  })

  return NextResponse.json({ file: data })
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role, organization_id').eq('id', user.id).single()
  if (!profile || !['admin','super_admin'].includes(profile.role)) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await req.json().catch(() => ({}))

  // Fetch file info for audit before deleting
  const { data: fileInfo } = await (admin.from('files') as any).select('name, client_id, is_current').eq('id', id).single()
  if (fileInfo && !fileInfo.is_current) {
    return NextResponse.json({ error: 'Versión histórica: es inmutable, no se puede eliminar' }, { status: 409 })
  }
  if (fileInfo && profile.role !== 'super_admin') {
    const { data: targetClient } = await (admin.from('profiles') as any).select('organization_id').eq('id', fileInfo.client_id).single()
    if (!targetClient || targetClient.organization_id !== profile.organization_id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }
  }

  if (body.storage_path) {
    await admin.storage.from('client-files').remove([body.storage_path])
  }

  const { error } = await admin.from('files').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAudit({
    userId:         user.id,
    userEmail:      user.email,
    organizationId: profile.organization_id,
    action:     'file_delete',
    entityType: 'file',
    entityId:   id,
    details:    { name: fileInfo?.name, client_id: fileInfo?.client_id },
  })

  return NextResponse.json({ ok: true })
}
