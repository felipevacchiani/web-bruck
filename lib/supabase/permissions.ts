import type { SupabaseClient } from '@supabase/supabase-js'
import type { PermissionModule, PermissionAction } from './types'

/**
 * Chequea si un usuario tiene una acción concedida sobre un módulo,
 * vía la plantilla de permisos de su membership (Fase 1, Paso 5b).
 * Si el usuario no tiene membership o plantilla asignada, se permite
 * por defecto (fail-open) para no romper cuentas creadas antes de que
 * este modelo existiera -- profiles.role sigue siendo el fallback real.
 */
export async function hasPermission(
  admin: SupabaseClient,
  userId: string,
  moduleArg: PermissionModule,
  action: PermissionAction
): Promise<boolean> {
  const { data: membership } = await (admin.from('memberships') as any)
    .select('permission_template_id')
    .eq('user_id', userId)
    .maybeSingle()

  const templateId = membership?.permission_template_id
  if (!templateId) return true

  const { data: grant } = await (admin.from('permission_template_actions') as any)
    .select('id')
    .eq('template_id', templateId)
    .eq('module', moduleArg)
    .eq('action', action)
    .maybeSingle()

  return !!grant
}
