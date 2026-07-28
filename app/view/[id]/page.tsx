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
  const { data: profile } = await admin.from('profiles').select('role, organization_id').eq('id', user.id).single()
  const isAdminRole = ['admin','super_admin'].includes(profile?.role)

  // Admin ve archivos de su organización; super_admin cualquiera; cliente solo los suyos
  const query = admin.from('files').select('*').eq('id', id)
  if (!isAdminRole) query.eq('client_id', user.id)
  const { data: file, error } = await query.single()

  if (error || !file) redirect(isAdminRole ? '/admin' : '/dashboard')

  if (isAdminRole && profile && profile.role !== 'super_admin') {
    const { data: fileOwner } = await admin.from('profiles').select('organization_id').eq('id', (file as any).client_id).single()
    if (!fileOwner || (fileOwner as any).organization_id !== profile.organization_id) redirect('/admin')
  }

  const { data: signedData } = await admin.storage
    .from('client-files')
    .createSignedUrl(file.storage_path, 3600)

  if (!signedData) redirect(['admin','super_admin'].includes(profile?.role) ? '/admin' : '/dashboard')

  // Historial de versiones anteriores (Fase 3: versionado inmutable)
  const versions: { id: string; version: number; created_at: string }[] = []
  let cursor = (file as any).previous_version_id as string | null
  while (cursor) {
    const { data: prev } = await admin.from('files').select('id, version, created_at, previous_version_id').eq('id', cursor).single()
    if (!prev) break
    versions.push({ id: (prev as any).id, version: (prev as any).version, created_at: (prev as any).created_at })
    cursor = (prev as any).previous_version_id
  }

  return <FileViewer file={file} signedUrl={signedData.signedUrl} versions={versions} />
}
