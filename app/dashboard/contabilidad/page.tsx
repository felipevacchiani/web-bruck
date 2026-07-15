import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import ContabilidadPanel from '@/app/admin/clients/[id]/contabilidad/contabilidad-panel'

export const dynamic = 'force-dynamic'

export default async function ClienteContabilidadPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: profile } = await (admin.from('profiles') as any)
    .select('full_name, company, email, role, active').eq('id', user.id).single()

  if (!profile || !profile.active) redirect('/login')
  if (['admin','super_admin'].includes(profile.role)) redirect('/admin')

  const clientName = profile.full_name || profile.company || profile.email
  const params = await searchParams
  const defaultTab = params.tab || 'dashboard'

  return (
    <ContabilidadPanel
      clientName={clientName}
      apiBase="/api/client/ci"
      backHref="/dashboard"
      backLabel="Mi portal"
      defaultTab={defaultTab}
    />
  )
}
