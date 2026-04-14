import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FileViewer from './file-viewer'

interface Props { params: Promise<{ id: string }> }

export default async function ViewPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()

  // Admin puede ver cualquier archivo; cliente solo los suyos
  const query = admin.from('files').select('*').eq('id', id)
  if (profile?.role !== 'admin') query.eq('client_id', user.id)
  const { data: file, error } = await query.single()

  if (error || !file) redirect(profile?.role === 'admin' ? '/admin' : '/dashboard')

  const { data: signedData } = await admin.storage
    .from('client-files')
    .createSignedUrl(file.storage_path, 3600)

  if (!signedData) redirect(profile?.role === 'admin' ? '/admin' : '/dashboard')

  return <FileViewer file={file} signedUrl={signedData.signedUrl} />
}
