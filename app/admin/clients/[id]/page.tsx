import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import ClientDetail from './client-detail'

interface Props {
  params: { id: string }
}

export default async function ClientDetailPage({ params }: Props) {
  const supabase = await createClient()

  const { data: client } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.id)
    .eq('role', 'client')
    .single()

  if (!client) notFound()

  const { data: files } = await supabase
    .from('files')
    .select('*')
    .eq('client_id', params.id)
    .order('created_at', { ascending: false })

  return <ClientDetail client={client} files={files ?? []} />
}
