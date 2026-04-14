import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

interface Params { params: Promise<{ id: string }> }

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin' ? admin : null
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const admin = await verifyAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await req.json()
  const { error } = await admin.from('profiles').update({
    full_name: body.full_name,
    company: body.company,
    active: body.active,
  }).eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const admin = await verifyAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  // 1. Obtener y eliminar archivos del storage
  const { data: files } = await admin.from('files').select('storage_path').eq('client_id', id)
  if (files?.length) {
    const paths = files.map((f: any) => f.storage_path)
    await admin.storage.from('client-files').remove(paths)
  }

  // 2. Eliminar registros de files
  await admin.from('files').delete().eq('client_id', id)

  // 3. Eliminar usuario de Auth (profiles se elimina por cascade)
  const { error } = await admin.auth.admin.deleteUser(id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
