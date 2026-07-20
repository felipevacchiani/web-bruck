import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { parseSheetUrl, fetchGoogleSheetData } from '@/lib/google-sheets'
import { parseWordDocument } from '@/lib/word-to-html'
import { buildReportHtml, sheetDataToReportBody } from '@/lib/report-template'
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
  return { admin, user, client }
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const { admin, client } = await verifyAdminForClient(id)
  if (!admin || !client) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  if (!client.company_id) return NextResponse.json({ data: [] })

  const { data, error } = await (admin.from('custom_reports') as any)
    .select('id, title, client_display_name, source_type, status, created_at, updated_at, published_at')
    .eq('company_id', client.company_id).order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  const { admin, user, client } = await verifyAdminForClient(id)
  if (!admin || !user || !client) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  if (!client.company_id) return NextResponse.json({ error: 'Este cliente no tiene una empresa asignada' }, { status: 400 })

  const formData = await req.formData()
  const title = (formData.get('title') as string || '').trim()
  const clientDisplayName = (formData.get('client_display_name') as string || '').trim() || null
  const sourceType = formData.get('source_type') as string
  const accentColor = (formData.get('accent_color') as string || '').trim() || '#31AE79'

  if (!title) return NextResponse.json({ error: 'El título es requerido' }, { status: 400 })
  if (!['google_sheet', 'word_docx'].includes(sourceType)) {
    return NextResponse.json({ error: 'Tipo de fuente inválido' }, { status: 400 })
  }

  let bodyHtml: string
  let sourceRef: string | null = null

  if (sourceType === 'google_sheet') {
    const url = (formData.get('url') as string || '').trim()
    if (!url || !parseSheetUrl(url)) return NextResponse.json({ error: 'URL de Google Sheet inválida' }, { status: 400 })
    try {
      const data = await fetchGoogleSheetData(url)
      if (!data.rows.length) return NextResponse.json({ error: 'El Sheet no tiene filas de datos' }, { status: 400 })
      bodyHtml = sheetDataToReportBody(data)
      sourceRef = url
    } catch (e: any) {
      return NextResponse.json({ error: e.message || 'Error al leer el Sheet' }, { status: 502 })
    }
  } else {
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Archivo Word requerido' }, { status: 400 })
    if (!file.name.toLowerCase().endsWith('.docx')) {
      return NextResponse.json({ error: 'El archivo debe ser un .docx' }, { status: 400 })
    }
    try {
      const buffer = Buffer.from(await file.arrayBuffer())
      const { html } = await parseWordDocument(buffer)
      if (!html.trim()) return NextResponse.json({ error: 'No se pudo extraer contenido del documento' }, { status: 400 })
      bodyHtml = html
      sourceRef = file.name
    } catch (e: any) {
      return NextResponse.json({ error: 'No se pudo procesar el documento Word. Verificá que sea un .docx válido.' }, { status: 400 })
    }
  }

  const { data: org } = await (admin.from('organizations') as any).select('name').eq('id', client.organization_id).single()
  const htmlContent = buildReportHtml({ title, clientName: clientDisplayName, bodyHtml, orgName: org?.name, accentColor })

  const { data, error } = await (admin.from('custom_reports') as any).insert({
    organization_id: client.organization_id,
    company_id: client.company_id,
    created_by: user.id,
    title,
    client_display_name: clientDisplayName,
    source_type: sourceType,
    source_ref: sourceRef,
    body_html: bodyHtml,
    accent_color: accentColor,
    html_content: htmlContent,
    status: 'borrador',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
