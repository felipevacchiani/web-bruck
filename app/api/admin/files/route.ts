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
  if (!['admin','super_admin'].includes(profile?.role)) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 })

  const clientId     = formData.get('client_id') as string
  if (profile.role !== 'super_admin') {
    const { data: targetClient } = await admin.from('profiles').select('organization_id').eq('id', clientId).single()
    if (!targetClient || targetClient.organization_id !== profile.organization_id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }
  }
  const name         = (formData.get('name') as string) || file.name
  const description  = (formData.get('description') as string) || null
  const category     = (formData.get('category') as string) || 'otro'
  const taxSub       = (formData.get('tax_subcategory') as string) || null
  const groupId      = (formData.get('file_group_id') as string) || crypto.randomUUID()
  const groupTitle   = (formData.get('group_title') as string) || name
  const docLabel     = (formData.get('document_label') as string) || file.name
  const fiscalMonth  = formData.get('fiscal_month') ? parseInt(formData.get('fiscal_month') as string) : null
  const fiscalYear   = formData.get('fiscal_year')  ? parseInt(formData.get('fiscal_year') as string)  : null
  const dueDate      = (formData.get('due_date') as string) || null
  const tagsRaw      = (formData.get('tags') as string) || ''
  const tags         = tagsRaw.split(',').map(t => t.trim()).filter(Boolean)

  if (!clientId) return NextResponse.json({ error: 'client_id requerido' }, { status: 400 })

  const ext = file.name.split('.').pop() || 'bin'
  const storagePath = `${clientId}/${crypto.randomUUID()}.${ext}`
  const bytes = await file.arrayBuffer()

  const { error: storageError } = await admin.storage
    .from('client-files')
    .upload(storagePath, bytes, { contentType: file.type || 'application/octet-stream' })

  if (storageError) return NextResponse.json({ error: storageError.message }, { status: 500 })

  const { data: fileRecord, error: dbError } = await admin.from('files').insert({
    client_id:       clientId,
    name,
    description,
    category,
    tax_subcategory: taxSub || null,
    storage_path:    storagePath,
    mime_type:       file.type || null,
    file_size:       file.size,
    file_group_id:   groupId,
    group_title:     groupTitle,
    document_label:  docLabel,
    fiscal_month:    fiscalMonth,
    fiscal_year:     fiscalYear,
    doc_status:      'pendiente',
    due_date:        dueDate || null,
    tags,
  }).select().single()

  if (dbError) {
    await admin.storage.from('client-files').remove([storagePath])
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  await logAudit({
    userId:     user.id,
    userEmail:  user.email,
    action:     'file_upload',
    entityType: 'file',
    entityId:   fileRecord.id,
    details:    { name, category, client_id: clientId, file_size: file.size },
  })

  return NextResponse.json({ file: fileRecord })
}
