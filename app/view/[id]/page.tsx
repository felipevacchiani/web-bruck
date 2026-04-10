import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FileViewer from './file-viewer'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ViewPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: file, error } = await supabase
    .from('files')
    .select('*')
    .eq('id', id)
    .eq('client_id', user.id)
    .single()

  if (error || !file) redirect('/dashboard')

  const { data: signedData, error: signedError } = await supabase.storage
    .from('client-files')
    .createSignedUrl(file.storage_path, 3600)

  if (signedError || !signedData) redirect('/dashboard')

  return <FileViewer file={file} signedUrl={signedData.signedUrl} />
}
