import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // Usar adminClient para leer el perfil (bypasea RLS)
  const adminSupabase = createAdminClient()
  const { data: profile } = await adminSupabase
    .from('profiles').select('role').eq('id', user.id).single()

  if (profile?.role !== 'admin')
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { email, password, full_name, company } = await req.json()
  if (!email || !password)
    return NextResponse.json({ error: 'Email y contraseña son requeridos' }, { status: 400 })
  if (password.length < 8)
    return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })

  const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'client', full_name, company },
  })

  if (createError)
    return NextResponse.json({ error: createError.message }, { status: 400 })

  await adminSupabase
    .from('profiles')
    .update({ full_name, company, role: 'client' })
    .eq('id', newUser.user.id)

  return NextResponse.json({ success: true, id: newUser.user.id })
}
