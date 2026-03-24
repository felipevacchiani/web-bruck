import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ClientDashboard from './client-dashboard'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: files } = await supabase
    .from('files')
    .select('*')
    .eq('client_id', user.id)
    .order('created_at', { ascending: false })

  return <ClientDashboard profile={profile} files={files ?? []} />
}
