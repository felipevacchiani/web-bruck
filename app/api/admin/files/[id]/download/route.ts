import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

interface Params { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = createAdminClient()
  const { data: file } = await admin.from('files').select('storage_path, name, client_id').eq('id', id).single()
  if (!file) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const { data: profile } = await admin.from('profiles').select('role, organization_id').eq('id', user.id).single()
  const isAdminRole = ['admin','super_admin'].includes(profile?.role)
  if (!isAdminRole && (file as any).client_id !== user.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  if (isAdminRole && profile?.role !== 'super_admin') {
    const { data: targetClient } = await admin.from('profiles').select('organization_id').eq('id', (file as any).client_id).single()
    if (!targetClient || (targetClient as any).organization_id !== profile.organization_id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }
  }

  const { data: signed } = await admin.storage
    .from('client-files')
    .createSignedUrl((file as any).storage_path, 60)

  if (!signed?.signedUrl) return NextResponse.json({ error: 'Error generando link' }, { status: 500 })

  return NextResponse.redirect(signed.signedUrl)
}
