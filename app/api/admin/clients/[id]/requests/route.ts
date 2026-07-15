import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyCompany } from '@/lib/supabase/notifications'
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

  const { data, error } = await (admin.from('requests') as any)
    .select('*').eq('company_id', client.company_id).order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  const { admin, user, client } = await verifyAdminForClient(id)
  if (!admin || !user || !client) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  if (!client.company_id) return NextResponse.json({ error: 'Este cliente no tiene una empresa asignada' }, { status: 400 })

  const body = await req.json()
  const { title, description, category, tax_subcategory, fiscal_month, fiscal_year, due_date } = body
  if (!title) return NextResponse.json({ error: 'title requerido' }, { status: 400 })

  const { data, error } = await (admin.from('requests') as any).insert({
    organization_id: client.organization_id,
    company_id: client.company_id,
    created_by: user.id,
    title, description: description || null,
    category: category || null,
    tax_subcategory: tax_subcategory || null,
    fiscal_month: fiscal_month || null,
    fiscal_year: fiscal_year || null,
    due_date: due_date || null,
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await notifyCompany({
    companyId: client.company_id,
    type: 'request_created',
    title: 'Nueva solicitud',
    message: title,
    link: '/dashboard',
  })

  return NextResponse.json({ data })
}
