// app/api/admin/clients/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin' ? supabase : null
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await verifyAdmin()
  if (!supabase) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await req.json()
  const { error } = await supabase
    .from('profiles')
    .update({ full_name: body.full_name, company: body.company, active: body.active })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await verifyAdmin()
  if (!supabase) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  // Obtener archivos para eliminar del storage
  const { data: files } = await supabase
    .from('files').select('storage_path').eq('client_id', params.id)

  const adminSupabase = createAdminClient()

  // Eliminar archivos del storage
  if (files && files.length > 0) {
    await adminSupabase.storage
      .from('client-files')
      .remove(files.map(f => f.storage_path))
  }

  // Eliminar usuario (cascada elimina perfil y archivos en DB)
  const { error } = await adminSupabase.auth.admin.deleteUser(params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ success: true })
}
