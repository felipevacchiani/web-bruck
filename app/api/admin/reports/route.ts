import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { MONTHS, FILE_CATEGORIES, DOC_STATUSES } from '@/lib/supabase/types'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role, organization_id').eq('id', user.id).single()
  if (!profile || !['admin','super_admin'].includes(profile.role)) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  const isSuperAdmin = profile.role === 'super_admin'

  const sp = req.nextUrl.searchParams
  const clientId   = sp.get('client_id') || ''
  const category   = sp.get('category') || ''
  const status     = sp.get('status') || ''
  const fiscalYear = sp.get('fiscal_year') || ''

  let clientsScopeQuery = admin.from('profiles').select('id, full_name, company, email').eq('role', 'client')
  if (!isSuperAdmin) clientsScopeQuery = clientsScopeQuery.eq('organization_id', profile.organization_id)
  const { data: clients } = await clientsScopeQuery

  const clientMap: Record<string, any> = {}
  for (const c of clients || []) clientMap[c.id] = c

  if (clientId && !isSuperAdmin && !clientMap[clientId]) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  let filesQuery = admin
    .from('files')
    .select('id, name, group_title, document_label, category, tax_subcategory, doc_status, due_date, fiscal_month, fiscal_year, file_size, created_at, client_id')
    .order('created_at', { ascending: false })

  if (clientId)   filesQuery = filesQuery.eq('client_id', clientId)
  else if (!isSuperAdmin) filesQuery = filesQuery.in('client_id', Object.keys(clientMap))
  if (category)   filesQuery = filesQuery.eq('category', category)
  if (status)     filesQuery = filesQuery.eq('doc_status', status)
  if (fiscalYear) filesQuery = filesQuery.eq('fiscal_year', parseInt(fiscalYear))

  const { data: files } = await filesQuery

  const catLabel = (v: string) => FILE_CATEGORIES.find(c => c.value === v)?.label ?? v
  const statusLabel = (v: string) => DOC_STATUSES.find(s => s.value === v)?.label ?? v
  const monthLabel = (m: number | null) => m ? MONTHS[m - 1] : ''

  const header = [
    'Nombre del documento',
    'Título del grupo',
    'Cliente',
    'Empresa',
    'Email',
    'Categoría',
    'Subcategoría impositiva',
    'Estado',
    'Mes fiscal',
    'Año fiscal',
    'Vencimiento',
    'Tamaño (KB)',
    'Fecha de carga',
  ]

  const rows = (files || []).map(f => {
    const cl = clientMap[f.client_id] ?? {}
    return [
      f.name,
      f.group_title || '',
      cl.full_name || '',
      cl.company || '',
      cl.email || '',
      catLabel(f.category),
      f.tax_subcategory || '',
      statusLabel(f.doc_status),
      monthLabel(f.fiscal_month),
      f.fiscal_year || '',
      f.due_date || '',
      f.file_size ? Math.round(f.file_size / 1024) : '',
      new Date(f.created_at).toLocaleDateString('es-AR'),
    ]
  })

  const escape = (v: unknown) => {
    const s = String(v ?? '')
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }

  const csv = [header, ...rows].map(row => row.map(escape).join(',')).join('\r\n')
  const filename = `bruck-reporte-${new Date().toISOString().slice(0,10)}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
