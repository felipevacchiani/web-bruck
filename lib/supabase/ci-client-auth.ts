import { createClient } from './server'
import { createAdminClient } from './admin'

/**
 * Verifies the request is from an authenticated client (not admin).
 * Returns { userId, admin } on success, null on failure.
 */
export async function verifyClientAuth() {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: profile } = await (admin.from('profiles') as any)
    .select('role, active').eq('id', user.id).single()
  if (!profile || !profile.active) return null
  // Both admin and client roles can access their own CI data
  return { userId: user.id, admin, role: profile.role as string }
}
