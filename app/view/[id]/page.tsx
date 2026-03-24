// app/view/[id]/page.tsx  — SERVER COMPONENT
// Genera la signed URL en el servidor (nunca expone service role al browser)
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FileViewer from './file-viewer'

interface Props {
  params: { id: string }
}

export default async function ViewPage({ params }: Props) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verificar que el archivo pertenece a este cliente (RLS lo garantiza igual)
  const { data: file, error } = await supabase
    .from('files')
    .select('*')
    .eq('id', params.id)
    .eq('client_id', user.id)  // doble verificación explícita
    .single()

  if (error || !file) redirect('/dashboard')

  // Generar signed URL — expira en 1 hora (3600 segundos)
  const { data: signedData, error: signedError } = await supabase.storage
    .from('client-files')
    .createSignedUrl(file.storage_path, 3600)

  if (signedError || !signedData) redirect('/dashboard')

  return (
    <FileViewer
      file={file}
      signedUrl={signedData.signedUrl}
    />
  )
}
