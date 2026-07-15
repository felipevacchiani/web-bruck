import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hasPermission } from '@/lib/supabase/permissions'
import { notifyUser } from '@/lib/supabase/notifications'
import { NextRequest, NextResponse } from 'next/server'

interface Params { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await (admin.from('profiles') as any).select('company_id, active, role').eq('id', user.id).single()
  if (!profile || !profile.active) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  if (profile.role !== 'admin' && profile.role !== 'super_admin') {
    const allowed = await hasPermission(admin, user.id, 'archivos', 'crear')
    if (!allowed) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { data: request } = await (admin.from('requests') as any).select('*').eq('id', id).single()
  if (!request) return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
  if (request.company_id !== profile.company_id) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  if (request.status === 'completada') return NextResponse.json({ error: 'Esta solicitud ya fue completada' }, { status: 409 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 })

  const ext = file.name.split('.').pop() || 'bin'
  const storagePath = `${user.id}/${crypto.randomUUID()}.${ext}`
  const bytes = await file.arrayBuffer()

  const { error: storageError } = await admin.storage
    .from('client-files')
    .upload(storagePath, bytes, { contentType: file.type || 'application/octet-stream' })
  if (storageError) return NextResponse.json({ error: storageError.message }, { status: 500 })

  const { data: fileRecord, error: dbError } = await (admin.from('files') as any).insert({
    client_id:       user.id,
    company_id:      profile.company_id,
    name:            file.name,
    description:     `Subido en respuesta a la solicitud: ${request.title}`,
    category:        request.category || 'otro',
    tax_subcategory: request.tax_subcategory || null,
    storage_path:    storagePath,
    mime_type:       file.type || null,
    file_size:       file.size,
    file_group_id:   crypto.randomUUID(),
    group_title:     request.title,
    document_label:  file.name,
    fiscal_month:    request.fiscal_month,
    fiscal_year:     request.fiscal_year,
    doc_status:      'pendiente',
  }).select().single()

  if (dbError) {
    await admin.storage.from('client-files').remove([storagePath])
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  const { error: reqError } = await (admin.from('requests') as any)
    .update({ status: 'completada', file_id: fileRecord.id, completed_at: new Date().toISOString() })
    .eq('id', id)
  if (reqError) return NextResponse.json({ error: reqError.message }, { status: 500 })

  if (request.created_by) {
    await notifyUser({
      userId: request.created_by,
      companyId: profile.company_id,
      type: 'request_completed',
      title: 'Solicitud completada',
      message: request.title,
      link: `/admin/clients/${user.id}`,
    })
  }

  return NextResponse.json({ ok: true, file: fileRecord })
}
