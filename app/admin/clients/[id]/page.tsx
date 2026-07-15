import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import ClientDetail from './client-detail'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ClientDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: myProfile } = await supabase.from('profiles').select('role, organization_id').eq('id', user.id).single()

  const { data: client } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .eq('role', 'client')
    .single()

  if (!client) notFound()
  if (myProfile?.role !== 'super_admin' && client.organization_id !== myProfile?.organization_id) notFound()

  const { data: files } = await supabase
    .from('files')
    .select('*')
    .eq('client_id', id)
    .order('created_at', { ascending: false })

  return <ClientDetail client={client} files={files ?? []} />
}
