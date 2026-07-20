import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { MONTHS } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

function daysUntil(dateStr: string): number {
  const today = new Date(); today.setHours(0,0,0,0)
  const due   = new Date(dateStr); due.setHours(0,0,0,0)
  return Math.round((due.getTime() - today.getTime()) / 86400000)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-AR', { day:'2-digit', month:'short', year:'numeric' })
}

export default async function AlertasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminSb = createAdminClient()
  const { data: profile } = await adminSb.from('profiles').select('role, organization_id').eq('id', user.id).single()
  if (!['admin','super_admin'].includes(profile?.role)) redirect('/dashboard')
  const isSuperAdmin = profile?.role === 'super_admin'

  let clientsQuery = adminSb.from('profiles').select('id, full_name, company, email').eq('role', 'client')
  if (!isSuperAdmin) clientsQuery = clientsQuery.eq('organization_id', profile?.organization_id)
  const { data: clients } = await clientsQuery

  const clientMap: Record<string, any> = {}
  for (const c of clients || []) clientMap[c.id] = c

  // Fetch all files with due_date, joined con perfiles de cliente
  const { data: rawFiles } = await adminSb
    .from('files')
    .select('id, name, due_date, doc_status, category, client_id, group_title, fiscal_month, fiscal_year')
    .not('due_date', 'is', null)
    .order('due_date', { ascending: true })

  const today = new Date(); today.setHours(0,0,0,0)

  const files = (rawFiles || [])
    .filter(f => isSuperAdmin || clientMap[f.client_id])
    .map(f => ({
      ...f,
      days: daysUntil(f.due_date!),
      client: clientMap[f.client_id] ?? null,
    }))

  const overdue  = files.filter(f => f.days < 0 && f.doc_status !== 'aprobado')
  const today_   = files.filter(f => f.days === 0 && f.doc_status !== 'aprobado')
  const upcoming = files.filter(f => f.days > 0 && f.days <= 30 && f.doc_status !== 'aprobado')
  const approved = files.filter(f => f.doc_status === 'aprobado')

  function FileRow({ f, urgency }: { f: any; urgency: 'red' | 'yellow' | 'blue' | 'green' }) {
    const colors = {
      red:    { bg: 'rgba(239,68,68,0.07)',  border: 'rgba(239,68,68,0.18)',  text: '#f87171' },
      yellow: { bg: 'rgba(250,204,21,0.07)', border: 'rgba(250,204,21,0.18)', text: '#fbbf24' },
      blue:   { bg: 'rgba(96,165,250,0.07)', border: 'rgba(96,165,250,0.18)', text: '#60a5fa' },
      green:  { bg: 'rgba(52,211,153,0.07)', border: 'rgba(52,211,153,0.18)', text: '#34d399' },
    }
    const c = colors[urgency]
    const clientLabel = f.client?.full_name || f.client?.company || f.client?.email || '—'
    const daysLabel = f.days < 0
      ? `Vencido hace ${Math.abs(f.days)} día${Math.abs(f.days)!==1?'s':''}`
      : f.days === 0
      ? 'Vence hoy'
      : `Vence en ${f.days} día${f.days!==1?'s':''}`
    const period = f.fiscal_month && f.fiscal_year
      ? `${MONTHS[f.fiscal_month-1]} ${f.fiscal_year}`
      : f.fiscal_year ? `${f.fiscal_year}` : null

    return (
      <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: '#121714', fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {f.group_title || f.name}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 5, flexWrap: 'wrap' }}>
            <span style={{ color: '#4E5651', fontSize: 12 }}>{clientLabel}</span>
            {period && <span style={{ color: '#858C87', fontSize: 12 }}>{period}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: c.text, fontWeight: 600 }}>{daysLabel}</span>
          <span style={{ fontSize: 11, color: '#858C87' }}>{formatDate(f.due_date)}</span>
          {f.client && (
            <Link href={`/admin/clients/${f.client.id}`} style={{ color: '#4E5651', fontSize: 11, border: '1px solid rgba(18,23,20,0.12)', padding: '3px 9px', borderRadius: 6, textDecoration: 'none' }}>
              Ver →
            </Link>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F3EFE5' }}>
      <style>{`
        .page-pad { padding: 32px 24px; }
        @media(max-width:640px){ .page-pad { padding: 20px 14px; } }
      `}</style>

      <header style={{ position: 'sticky', top: 0, zIndex: 10, borderBottom: '1px solid rgba(18,23,20,0.08)', background: 'rgba(243,239,229,0.92)', backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,rgba(49,174,121,0.2),rgba(49,174,121,0.08))', border: '1px solid rgba(49,174,121,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#31AE79', fontWeight: 900, fontSize: 13 }}>B</span>
              </div>
              <span style={{ color: '#121714', fontWeight: 900, letterSpacing: '0.2em', fontSize: 13 }}>BRUCK</span>
            </Link>
            <div style={{ width: 1, height: 16, background: 'rgba(18,23,20,0.14)' }} />
            <span style={{ color: '#858C87', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Alertas</span>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button style={{ background: 'rgba(18,23,20,0.04)', border: '1px solid rgba(18,23,20,0.12)', color: '#4E5651', fontSize: 12, padding: '6px 12px', borderRadius: 8, cursor: 'pointer' }}>Salir</button>
          </form>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: '0 auto' }}>
        <div className="page-pad">
          {/* KPI strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 32 }}>
            {[
              { label: 'Vencidos', value: overdue.length,  color: '#f87171' },
              { label: 'Vencen hoy', value: today_.length, color: '#fbbf24' },
              { label: 'Próximos 30d', value: upcoming.length, color: '#60a5fa' },
              { label: 'Aprobados', value: approved.length, color: '#34d399' },
            ].map(s => (
              <div key={s.label} style={{ background: '#FFFFFF', border: '1px solid rgba(18,23,20,0.16)', borderRadius: 14, padding: '16px 18px', boxShadow: '0 1px 3px rgba(18,23,20,0.05)' }}>
                <div style={{ color: '#4E5651', fontSize: 11, marginBottom: 6 }}>{s.label}</div>
                <div style={{ color: s.color, fontSize: 24, fontWeight: 700 }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Sección vencidos */}
          {overdue.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ color: '#f87171', fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>⚠</span> VENCIDOS ({overdue.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {overdue.map(f => <FileRow key={f.id} f={f} urgency="red" />)}
              </div>
            </div>
          )}

          {/* Hoy */}
          {today_.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ color: '#fbbf24', fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', marginBottom: 10 }}>
                HOY ({today_.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {today_.map(f => <FileRow key={f.id} f={f} urgency="yellow" />)}
              </div>
            </div>
          )}

          {/* Próximos 30 días */}
          {upcoming.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ color: '#60a5fa', fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', marginBottom: 10 }}>
                PRÓXIMOS 30 DÍAS ({upcoming.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {upcoming.map(f => <FileRow key={f.id} f={f} urgency="blue" />)}
              </div>
            </div>
          )}

          {overdue.length === 0 && today_.length === 0 && upcoming.length === 0 && (
            <div style={{ border: '1px solid rgba(18,23,20,0.08)', borderRadius: 16, padding: '56px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>✅</div>
              <div style={{ color: '#4E5651', fontWeight: 500 }}>No hay alertas pendientes</div>
              <div style={{ color: '#858C87', fontSize: 13, marginTop: 6 }}>Todos los vencimientos están al día</div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
