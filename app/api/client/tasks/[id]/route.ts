import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyUser } from '@/lib/supabase/notifications'
import { NextRequest, NextResponse } from 'next/server'

interface Params { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = createAdminClient()
  const { data: task } = await (admin.from('tasks') as any).select('*').eq('id', id).single()
  if (!task || task.assigned_to !== user.id) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await req.json()
  if (!body.status) return NextResponse.json({ error: 'status requerido' }, { status: 400 })

  const { data, error } = await (admin.from('tasks') as any)
    .update({ status: body.status, updated_at: new Date().toISOString() })
    .eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (task.created_by) {
    await notifyUser({
      userId: task.created_by,
      companyId: task.company_id,
      type: 'task_updated',
      title: 'Tarea actualizada',
      message: `${task.title}: ${body.status}`,
      link: `/admin/clients/${user.id}`,
    })
  }

  return NextResponse.json({ data })
}
