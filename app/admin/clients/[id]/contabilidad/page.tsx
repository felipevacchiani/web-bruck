import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import ContabilidadPanel from './contabilidad-panel'

interface Props { params: Promise<{ id: string }> }

export default async function ContabilidadPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: me } = await (admin.from('profiles') as any).select('role').eq('id', user.id).single()
  if (me?.role !== 'admin') redirect('/dashboard')

  const { data: client } = await (admin.from('profiles') as any)
    .select('id, full_name, company, email').eq('id', id).eq('role', 'client').single()
  if (!client) notFound()

  return <ContabilidadPanel clientId={id} clientName={client.full_name || client.company || client.email} />
}
