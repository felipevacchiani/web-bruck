// Genera un bloque <svg> estático (sin JS) para insertar en el contenido
// de un informe — barras, línea o torta, a partir de filas {label,value}.

export type ReportChartType = 'barras' | 'linea' | 'torta'

const PIE_COLORS = ['#31AE79', '#3B82F6', '#F59E0B', '#E4695B', '#8B5CF6', '#06B6D4', '#EC4899', '#84CC16']

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function buildChartHtml(type: ReportChartType, rows: { label: string; value: number }[], accentColor: string): string {
  const W = 640, H = 320, padB = 46, padT = 16, padL = 16, padR = 16

  if (type === 'torta') {
    const cx = W / 2, cy = H / 2 - 6, r = Math.min(W, H) / 2 - 46
    const total = rows.reduce((a, r) => a + Math.abs(r.value), 0) || 1
    let angle = -Math.PI / 2
    const slices = rows.map((row, i) => {
      const frac = Math.abs(row.value) / total
      const start = angle
      const end = angle + frac * Math.PI * 2
      angle = end
      const x1 = cx + r * Math.cos(start), y1 = cy + r * Math.sin(start)
      const x2 = cx + r * Math.cos(end), y2 = cy + r * Math.sin(end)
      const large = end - start > Math.PI ? 1 : 0
      return { path: `M${cx},${cy} L${x1.toFixed(1)},${y1.toFixed(1)} A${r},${r} 0 ${large} 1 ${x2.toFixed(1)},${y2.toFixed(1)} Z`, color: PIE_COLORS[i % PIE_COLORS.length], pct: (frac * 100).toFixed(1) }
    })
    const legend = rows.map((row, i) => `<span style="display:inline-flex;align-items:center;gap:6px;margin:2px 12px 2px 0;font-size:12px;color:#4E5651"><span style="width:10px;height:10px;border-radius:3px;background:${slices[i].color};display:inline-block"></span>${esc(row.label)} (${slices[i].pct}%)</span>`).join('')
    return `<div class="report-chart"><svg viewBox="0 0 ${W} ${H - 40}" style="width:100%;height:auto;display:block">${slices.map(s => `<path d="${s.path}" fill="${s.color}" stroke="#fff" stroke-width="2" />`).join('')}</svg><div style="margin-top:8px;text-align:center">${legend}</div></div>`
  }

  const values = rows.map(r => r.value)
  const maxV = Math.max(1, ...values.map(v => Math.abs(v)))
  const innerW = W - padL - padR

  if (type === 'linea') {
    const step = rows.length > 1 ? innerW / (rows.length - 1) : 0
    const points = values.map((v, i) => ({ x: padL + i * step, y: H - padB - (Math.abs(v) / maxV) * (H - padB - padT) }))
    const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
    const labels = points.map((p, i) => `<text x="${p.x.toFixed(1)}" y="${H - padB + 18}" fill="#858C87" font-size="11" text-anchor="middle">${esc(rows[i].label.slice(0, 10))}</text>`).join('')
    const dots = points.map((p, i) => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4" fill="${accentColor}" /><text x="${p.x.toFixed(1)}" y="${(p.y - 10).toFixed(1)}" fill="#4E5651" font-size="11" text-anchor="middle">${esc(String(rows[i].value))}</text>`).join('')
    return `<div class="report-chart"><svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block"><line x1="${padL}" y1="${H - padB}" x2="${W - padR}" y2="${H - padB}" stroke="rgba(18,23,20,0.12)" /><path d="${path}" fill="none" stroke="${accentColor}" stroke-width="3" />${dots}${labels}</svg></div>`
  }

  const barGap = 14
  const barW = Math.max(6, Math.min(70, innerW / rows.length - barGap))
  const bars = values.map((v, i) => {
    const h = (Math.abs(v) / maxV) * (H - padB - padT)
    const x = padL + i * (barW + barGap)
    return `<rect x="${x.toFixed(1)}" y="${(H - padB - h).toFixed(1)}" width="${barW.toFixed(1)}" height="${h.toFixed(1)}" fill="${accentColor}" rx="3" /><text x="${(x + barW / 2).toFixed(1)}" y="${H - padB + 18}" fill="#858C87" font-size="11" text-anchor="middle">${esc(rows[i].label.slice(0, 10))}</text><text x="${(x + barW / 2).toFixed(1)}" y="${(H - padB - h - 8).toFixed(1)}" fill="#4E5651" font-size="11" text-anchor="middle">${esc(String(v))}</text>`
  }).join('')
  return `<div class="report-chart"><svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block"><line x1="${padL}" y1="${H - padB}" x2="${W - padR}" y2="${H - padB}" stroke="rgba(18,23,20,0.12)" />${bars}</svg></div>`
}
