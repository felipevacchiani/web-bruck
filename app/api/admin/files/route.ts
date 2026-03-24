// app/api/admin/files/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin')
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const formData = await req.formData()
  const file = formData.get('file') as File
  const client_id = formData.get('client_id') as string
  const name = formData.get('name') as string
  const description = formData.get('description') as string

  if (!file || !client_id)
    return NextResponse.json({ error: 'Archivo y cliente son requeridos' }, { status: 400 })

  // Validar que es HTML
  if (!file.name.match(/\.(html?|htm)$/i))
    return NextResponse.json({ error: 'Solo se permiten archivos HTML' }, { status: 400 })

  // Path: client_id/timestamp-filename.html (evita colisiones)
  const timestamp = Date.now()
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storagePath = `${client_id}/${timestamp}-${safeName}`

  // Subir al bucket privado
  const fileBuffer = await file.arrayBuffer()
  const { error: uploadError } = await supabase.storage
    .from('client-files')
    .upload(storagePath, fileBuffer, {
      contentType: 'text/html',
      upsert: false,
    })

  if (uploadError)
    return NextResponse.json({ error: `Error al subir: ${uploadError.message}` }, { status: 500 })

  // Registrar en la base de datos
  const { data: fileRecord, error: dbError } = await supabase
    .from('files')
    .insert({
      client_id,
      name: name || file.name.replace(/\.(html?|htm)$/i, ''),
      description: description || null,
      storage_path: storagePath,
      file_size: file.size,
    })
    .select()
    .single()

  if (dbError) {
    // Si falla la DB, eliminar el archivo del storage
    await supabase.storage.from('client-files').remove([storagePath])
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, file: fileRecord })
}
