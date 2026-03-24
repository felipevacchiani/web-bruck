// app/api/admin/clients/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  // Verificar que quien llama es admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin')
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { email, password, full_name, company } = await req.json()

  if (!email || !password)
    return NextResponse.json({ error: 'Email y contraseña son requeridos' }, { status: 400 })
  if (password.length < 8)
    return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })

  // Usar service role para crear usuario (omite confirmación de email)
  const adminSupabase = createAdminClient()

  const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // no requiere confirmación por email
    user_metadata: { role: 'client', full_name, company },
  })

  if (createError)
    return NextResponse.json({ error: createError.message }, { status: 400 })

  // Actualizar perfil con nombre y empresa (el trigger ya lo creó)
  await adminSupabase
    .from('profiles')
    .update({ full_name, company, role: 'client' })
    .eq('id', newUser.user.id)

  return NextResponse.json({ success: true, id: newUser.user.id })
}
