import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

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

  // Actualizar perfil
  await adminSupabase
    .from('profiles')
    .update({ full_name, company, role: 'client' })
    .eq('id', newUser.user.id)

  // INSERT en clients
  const { error: clientError } = await adminSupabase
    .from('clients')
    .insert({
      id: newUser.user.id,
      email,
      full_name: full_name || '',
      company: company || '',
      status: 'active',
    })

  if (clientError)
    return NextResponse.json({ error: 'Usuario creado pero error en tabla clients: ' + clientError.message }, { status: 500 })

  return NextResponse.json({ success: true, id: newUser.user.id })
}
