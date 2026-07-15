import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAudit } from '@/lib/supabase/audit'
import { NextRequest, NextResponse } from 'next/server'

async function verifySuperAdmin() {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return { admin: null, user: null }
  const admin = createAdminClient()
  const { data: profile } = await (admin.from('profiles') as any).select('role').eq('id', user.id).single()
  return profile?.role === 'super_admin' ? { admin, user } : { admin: null, user: null }
}

function slugify(s: string) {
  return s.toLowerCase().trim()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export async function GET() {
  const { admin } = await verifySuperAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { data: orgs, error } = await (admin.from('organizations') as any)
    .select('*').order('created_at')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const [{ data: companies }, { data: consultores }] = await Promise.all([
    (admin.from('companies') as any).select('id, organization_id'),
    (admin.from('profiles') as any).select('id, organization_id, email, full_name, role').in('role', ['admin', 'super_admin']),
  ])

  const data = (orgs || []).map((o: any) => ({
    ...o,
    empresas_count: (companies || []).filter((c: any) => c.organization_id === o.id).length,
    consultores: (consultores || []).filter((c: any) => c.organization_id === o.id && c.role === 'admin'),
  }))

  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const { admin, user } = await verifySuperAdmin()
  if (!admin || !user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await req.json()
  const { org_name, consultor_email, consultor_password, consultor_full_name } = body
  if (!org_name || !consultor_email || !consultor_password) {
    return NextResponse.json({ error: 'org_name, consultor_email y consultor_password requeridos' }, { status: 400 })
  }

  const baseSlug = slugify(org_name) || 'org'
  let slug = baseSlug
  let n = 1
  while (true) {
    const { data: exists } = await (admin.from('organizations') as any).select('id').eq('slug', slug).maybeSingle()
    if (!exists) break
    slug = `${baseSlug}-${++n}`
  }

  const { data: org, error: orgError } = await (admin.from('organizations') as any)
    .insert({ name: org_name, slug }).select().single()
  if (orgError) return NextResponse.json({ error: orgError.message }, { status: 500 })

  // Sembrar las mismas plantillas de permisos base que tiene BRUCK
  // (v10 + v17), para que el nuevo consultor pueda usar el modelo
  // de permisos desde el primer día.
  const FULL = ['ver', 'crear', 'editar', 'eliminar']
  const OPERATIVO = ['ver', 'crear', 'editar']
  const seedTemplates: { name: string; description: string; perModule: Record<string, string[]> }[] = [
    { name: 'Cliente Estándar', description: 'Acceso completo a sus propios archivos y contabilidad interna', perModule: { archivos: FULL, contabilidad: FULL } },
    { name: 'Auditor', description: 'Solo lectura de archivos y contabilidad interna, sin capacidad de modificar datos', perModule: { archivos: ['ver'], contabilidad: ['ver'] } },
    { name: 'Director', description: 'Acceso de solo lectura a información estratégica: dashboards, reportes, documentación y contabilidad', perModule: { archivos: ['ver'], contabilidad: ['ver'] } },
    { name: 'Gerencia Administrativa', description: 'Acceso prácticamente completo: documentación, contabilidad, bancos', perModule: { archivos: FULL, contabilidad: FULL } },
    { name: 'Tesorería', description: 'Orientado al manejo financiero: registrar movimientos, conciliar cuentas, consultar bancos', perModule: { archivos: ['ver'], contabilidad: OPERATIVO } },
    { name: 'Administración', description: 'Acceso operativo: cargar documentación, gestionar vencimientos, registrar movimientos', perModule: { archivos: OPERATIVO, contabilidad: OPERATIVO } },
    { name: 'Recursos Humanos', description: 'Acceso únicamente a información laboral; sin acceso a datos financieros', perModule: { archivos: ['ver'] } },
  ]
  for (const tpl of seedTemplates) {
    const { data: tplRow } = await (admin.from('permission_templates') as any)
      .insert({ organization_id: org.id, name: tpl.name, description: tpl.description }).select().single()
    if (tplRow) {
      for (const [moduleName, actions] of Object.entries(tpl.perModule)) {
        for (const action of actions) {
          await (admin.from('permission_template_actions') as any)
            .insert({ template_id: tplRow.id, module: moduleName, action })
        }
      }
    }
  }

  const { data: newUser, error: authError } = await admin.auth.admin.createUser({
    email: consultor_email,
    password: consultor_password,
    email_confirm: true,
  })
  if (authError) {
    await (admin.from('organizations') as any).delete().eq('id', org.id)
    return NextResponse.json({ error: authError.message }, { status: 500 })
  }

  const { error: profileError } = await (admin.from('profiles') as any).update({
    full_name: consultor_full_name || null,
    role: 'admin',
    organization_id: org.id,
    active: true,
  }).eq('id', newUser.user.id)
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })

  await logAudit({
    userId:     user.id,
    userEmail:  user.email,
    action:     'client_create',
    entityType: 'organization',
    entityId:   org.id,
    details:    { org_name, slug, consultor_email },
  })

  return NextResponse.json({ organization: org, consultorId: newUser.user.id })
}
