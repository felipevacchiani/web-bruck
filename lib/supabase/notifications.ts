import { createAdminClient } from './admin'
import type { NotificationType } from './types'

export async function notifyUser({
  userId,
  companyId,
  type,
  title,
  message,
  link,
}: {
  userId: string
  companyId?: string | null
  type: NotificationType
  title: string
  message?: string
  link?: string
}) {
  try {
    const admin = createAdminClient()
    await (admin.from('notifications') as any).insert({
      user_id:    userId,
      company_id: companyId ?? null,
      type,
      title,
      message:    message ?? null,
      link:       link ?? null,
    })
  } catch {
    // Las notificaciones nunca deben romper el flujo principal
  }
}

// Notifica a todos los usuarios de una empresa (todas las
// memberships vigentes con esa company_id).
export async function notifyCompany({
  companyId,
  type,
  title,
  message,
  link,
}: {
  companyId: string
  type: NotificationType
  title: string
  message?: string
  link?: string
}) {
  try {
    const admin = createAdminClient()
    const { data: members } = await (admin.from('memberships') as any)
      .select('user_id').eq('company_id', companyId).eq('active', true)
    for (const m of members || []) {
      await notifyUser({ userId: m.user_id, companyId, type, title, message, link })
    }
  } catch {
    // Las notificaciones nunca deben romper el flujo principal
  }
}
