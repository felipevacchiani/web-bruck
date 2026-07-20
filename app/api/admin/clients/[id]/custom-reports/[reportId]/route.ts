import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { fetchGoogleSheetData } from '@/lib/google-sheets'
import { buildReportHtml, sheetDataToReportBody } from '@/lib/report-template'
import { promoteBoldNumberedHeadings } from '@/lib/report-format'
import { NextRequest, NextResponse } from 'next/server'

interface Params { params: Promise<{ id: string; reportId: string }> }

async function verifyAdminForClient(clientId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { admin: null, client: null }
  const admin = createAdminClient()
  const { data: profile } = await (admin.from('profiles') as any).select('role, organization_id').eq('id', user.id).single()
  if (!['admin','super_admin'].includes(profile?.role)) return { admin: null, client: null }

  const { data: client } = await (admin.from('profiles') as any).select('company_id, organization_id').eq('id', clientId).single()
  if (!client) return { admin: null, client: null }
  if (profile.role !== 'super_admin' && client.organization_id !== profile.organization_id) {
    return { admin: null, client: null }
  }
  return { admin, client }
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id, reportId } = await params
  const { admin, client } = await verifyAdminForClient(id)
  if (!admin || !client) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { data, error } = await (admin.from('custom_reports') as any).select('*').eq('id', reportId).eq('company_id', client.company_id).single()
  if (error || !data) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json({ data })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id, reportId } = await params
  const { admin, client } = await verifyAdminForClient(id)
  if (!admin || !client) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { data: report } = await (admin.from('custom_reports') as any).select('*').eq('id', reportId).eq('company_id', client.company_id).single()
  if (!report) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const body = await req.json()
  const update: Record<string, any> = {}

  if (typeof body.title === 'string' && body.title.trim()) update.title = body.title.trim()
  if ('client_display_name' in body) update.client_display_name = (body.client_display_name || '').trim() || null
  if (typeof body.accent_color === 'string' && /^#[0-9a-fA-F]{3,6}$/.test(body.accent_color)) update.accent_color = body.accent_color
  if (typeof body.body_html === 'string') update.body_html = body.body_html

  if (body.regenerate && report.source_type === 'google_sheet') {
    try {
      const sheetData = await fetchGoogleSheetData(report.source_ref)
      update.body_html = sheetDataToReportBody(sheetData)
    } catch (e: any) {
      return NextResponse.json({ error: e.message || 'Error al releer el Sheet' }, { status: 502 })
    }
  }

  if (body.fix_headings) {
    update.body_html = promoteBoldNumberedHeadings(update.body_html !== undefined ? update.body_html : report.body_html)
  }

  const needsRebuild = update.title || 'client_display_name' in update || update.accent_color || update.body_html !== undefined
  if (needsRebuild) {
    const { data: org } = await (admin.from('organizations') as any).select('name').eq('id', client.organization_id).single()
    update.html_content = buildReportHtml({
      title: update.title || report.title,
      clientName: 'client_display_name' in update ? update.client_display_name : report.client_display_name,
      bodyHtml: update.body_html !== undefined ? update.body_html : report.body_html,
      orgName: org?.name,
      accentColor: update.accent_color || report.accent_color,
    })
  }

  if (body.status === 'publicado' && report.status !== 'publicado') {
    update.status = 'publicado'
    update.published_at = new Date().toISOString()
  } else if (body.status === 'borrador') {
    update.status = 'borrador'
  }

  if (Object.keys(update).length === 0) return NextResponse.json({ data: report })

  const { data, error } = await (admin.from('custom_reports') as any).update(update).eq('id', reportId).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id, reportId } = await params
  const { admin, client } = await verifyAdminForClient(id)
  if (!admin || !client) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { error } = await (admin.from('custom_reports') as any).delete().eq('id', reportId).eq('company_id', client.company_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
