import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  return (profile as any)?.role === 'admin' ? supabase : null
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await verifyAdmin()
  if (!supabase) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await req.json()
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: body.full_name,
      company: body.company,
      active: body.active,
    })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await verifyAdmin()
  if (!supabase) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { data: files } = await supabase
    .from('files').select('storage_path').eq('client_id', id)

  const adminSupabase = createAdminClient()

  if (files && files.length > 0) {
    await adminSupabase.storage
      .from('client-files')
      .remove(files.map((f: any) => f.storage_path))
  }

  const { error } = await adminSupabase.auth.admin.deleteUser(id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ success: true })
}
