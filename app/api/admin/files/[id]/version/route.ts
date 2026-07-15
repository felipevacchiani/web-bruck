import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAudit } from '@/lib/supabase/audit'
import { NextRequest, NextResponse } from 'next/server'

interface Params { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await (admin.from('profiles') as any).select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { data: prev } = await (admin.from('files') as any).select('*').eq('id', id).single()
  if (!prev) return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
  if (!prev.is_current) return NextResponse.json({ error: 'Solo se puede versionar la versión vigente' }, { status: 409 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 })

  const ext = file.name.split('.').pop() || 'bin'
  const storagePath = `${prev.client_id}/${crypto.randomUUID()}.${ext}`
  const bytes = await file.arrayBuffer()

  const { error: storageError } = await admin.storage
    .from('client-files')
    .upload(storagePath, bytes, { contentType: file.type || 'application/octet-stream' })
  if (storageError) return NextResponse.json({ error: storageError.message }, { status: 500 })

  const { data: newFile, error: dbError } = await (admin.from('files') as any).insert({
    client_id:            prev.client_id,
    name:                 file.name,
    description:          prev.description,
    category:             prev.category,
    tax_subcategory:      prev.tax_subcategory,
    storage_path:         storagePath,
    mime_type:            file.type || null,
    file_size:            file.size,
    file_group_id:        prev.file_group_id,
    group_title:          prev.group_title,
    document_label:       prev.document_label,
    fiscal_month:         prev.fiscal_month,
    fiscal_year:          prev.fiscal_year,
    doc_status:           'pendiente',
    due_date:             prev.due_date,
    tags:                 prev.tags,
    version:              (prev.version || 1) + 1,
    is_current:           true,
    previous_version_id:  prev.id,
  }).select().single()

  if (dbError) {
    await admin.storage.from('client-files').remove([storagePath])
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  const { error: updateError } = await (admin.from('files') as any).update({ is_current: false }).eq('id', prev.id)
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  await logAudit({
    userId:     user.id,
    userEmail:  user.email,
    action:     'file_update',
    entityType: 'file',
    entityId:   newFile.id,
    details:    { name: file.name, previous_version_id: prev.id, version: newFile.version },
  })

  return NextResponse.json({ file: newFile })
}
