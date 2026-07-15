import { createClient } from './server'
import { createAdminClient } from './admin'
import { hasPermission } from './permissions'
import type { PermissionAction } from './types'

/**
 * Verifies the request is from an authenticated user with access to
 * Contabilidad Interna, y que su plantilla de permisos (Fase 1, Paso 5b)
 * concede la acción pedida. Admin siempre pasa (acceso total).
 * Returns { userId, admin, role } on success, null on failure.
 */
export async function verifyClientAuth(action: PermissionAction = 'ver') {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: profile } = await (admin.from('profiles') as any)
    .select('role, active').eq('id', user.id).single()
  if (!profile || !profile.active) return null

  if (!['admin','super_admin'].includes(profile.role)) {
    const allowed = await hasPermission(admin, user.id, 'contabilidad', action)
    if (!allowed) return null
  }

  // Both admin and client roles can access their own CI data
  return { userId: user.id, admin, role: profile.role as string }
}
