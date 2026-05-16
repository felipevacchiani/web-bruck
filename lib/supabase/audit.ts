import { createAdminClient } from './admin'
import type { AuditAction } from './types'

export async function logAudit({
  userId,
  userEmail,
  action,
  entityType,
  entityId,
  details,
}: {
  userId: string
  userEmail?: string
  action: AuditAction
  entityType: string
  entityId?: string
  details?: Record<string, unknown>
}) {
  try {
    const admin = createAdminClient()
    await (admin.from('audit_logs') as any).insert({
      user_id:     userId,
      user_email:  userEmail ?? null,
      action,
      entity_type: entityType,
      entity_id:   entityId ?? null,
      details:     details ?? {},
    })
  } catch {
    // Audit failures must never break the main flow
  }
}
