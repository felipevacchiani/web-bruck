// Plantilla HTML con identidad visual BRUCK para "Informes personalizados".
// El contenido (bodyHtml) ya viene sanitizado/estructurado por el parser
// de origen (Word o Google Sheets) — acá solo se envuelve con el diseño.
// Todo lo que se agrega (índice, numeración de secciones, tarjetas) es
// post-procesamiento estructural sobre el HTML real, no contenido inventado.

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function sheetDataToReportBody(data: { headers: string[]; rows: string[][] }): string {
  const thead = `<tr>${data.headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr>`
  const tbody = data.rows.map(r => `<tr>${r.map(c => `<td>${escapeHtml(c ?? '')}</td>`).join('')}</tr>`).join('')
  return `<div class="report-card"><table><thead>${thead}</thead><tbody>${tbody}</tbody></table></div>`
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim()
}

// Agrega id="sec-N" a cada <h1>/<h2> del body y arma un índice de contenidos
// a partir de esos mismos títulos — no inventa texto, solo lo reutiliza.
function addTocAnchors(bodyHtml: string): { html: string; tocHtml: string } {
  let i = 0
  const toc: { level: 1 | 2; text: string; id: string }[] = []
  const html = bodyHtml.replace(/<h([12])([^>]*)>([\s\S]*?)<\/h\1>/gi, (_m, level, attrs, inner) => {
    const id = `sec-${i++}`
    const text = stripTags(inner)
    if (text) toc.push({ level: Number(level) as 1 | 2, text, id })
    return `<h${level}${attrs} id="${id}">${inner}</h${level}>`
  })
  if (toc.length < 2) return { html, tocHtml: '' }
  const items = toc.map(t => `<li class="toc-l${t.level}"><a href="#${t.id}">${escapeHtml(t.text)}</a></li>`).join('')
  const tocHtml = `<nav class="report-toc"><div class="report-toc-title">Contenido</div><ul>${items}</ul></nav>`
  return { html, tocHtml }
}

interface BuildReportArgs {
  title: string
  clientName?: string | null
  bodyHtml: string
}

export function buildReportHtml({ title, clientName, bodyHtml }: BuildReportArgs): string {
  const generatedAt = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
  const { html: body, tocHtml } = addTocAnchors(bodyHtml)

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
  :root { --green:#31AE79; --green-light:#99D0B8; --green-dark:#163C30; --text-dark:#121714; --text-secondary:#4E5651; --text-tertiary:#858C87; --border:rgba(18,23,20,0.09); --cream:#F3EFE5; }
  * { box-sizing:border-box; }
  html { background:#E9E5DA; }
  body { margin:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Arial,sans-serif; background:#E9E5DA; color:var(--text-dark); line-height:1.7; -webkit-font-smoothing:antialiased; }

  .report-shell { max-width:900px; margin:0 auto; padding:40px 20px; }
  .report-paper { background:#FFFFFF; border-radius:22px; overflow:hidden; box-shadow:0 30px 70px rgba(18,23,20,0.16), 0 2px 8px rgba(18,23,20,0.06); }

  .report-header { position:relative; background:linear-gradient(135deg,#0E241D 0%,#163C30 55%,#1c4a3a 100%); color:#F5F5F2; padding:48px 48px 40px; overflow:hidden; }
  .report-header::before { content:''; position:absolute; top:-60px; right:-60px; width:280px; height:280px; border-radius:50%; background:radial-gradient(circle,rgba(49,174,121,0.35) 0%,transparent 70%); }
  .report-header::after { content:''; position:absolute; left:0; right:0; bottom:0; height:4px; background:linear-gradient(90deg,var(--green),var(--green-light)); }
  .report-header-inner { position:relative; z-index:1; }
  .report-brandrow { display:flex; align-items:center; gap:10px; margin-bottom:22px; }
  .report-logo { width:30px; height:30px; border-radius:9px; background:linear-gradient(135deg,var(--green),var(--green-light)); display:flex; align-items:center; justify-content:center; font-weight:900; font-size:14px; color:#07120D; flex-shrink:0; }
  .report-brand { color:var(--green-light); font-weight:700; letter-spacing:0.22em; font-size:12px; text-transform:uppercase; }
  .report-header h1 { margin:0; font-size:32px; font-weight:600; letter-spacing:-0.015em; line-height:1.15; max-width:640px; }
  .report-header .meta { margin-top:14px; color:#B8BDB9; font-size:13px; display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
  .report-header .meta .dot { width:3px; height:3px; border-radius:50%; background:#B8BDB9; display:inline-block; }
  .report-header .meta strong { color:#F5F5F2; font-weight:600; }

  .report-toc { margin:0 48px; margin-top:-24px; position:relative; z-index:2; background:#FFFFFF; border:1px solid var(--border); border-radius:16px; padding:18px 22px; box-shadow:0 10px 26px rgba(18,23,20,0.08); }
  .report-toc-title { font-size:11px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:var(--text-tertiary); margin-bottom:10px; }
  .report-toc ul { list-style:none; margin:0; padding:0; columns:2; column-gap:24px; }
  .report-toc li { break-inside:avoid; margin-bottom:6px; font-size:13px; }
  .report-toc .toc-l2 { padding-left:14px; }
  .report-toc a { color:var(--text-secondary); text-decoration:none; }
  .report-toc a:hover { color:var(--green); }

  .report-body { padding:40px 48px 16px; }
  .report-body h1 { font-size:23px; font-weight:600; margin:36px 0 14px; color:var(--text-dark); letter-spacing:-0.01em; scroll-margin-top:20px; }
  .report-body h1:first-child { margin-top:0; }
  .report-body h2 { font-size:18px; font-weight:600; margin:30px 0 12px; color:var(--text-dark); padding-left:12px; border-left:3px solid var(--green); scroll-margin-top:20px; }
  .report-body h3 { font-size:15px; font-weight:600; margin:22px 0 8px; color:var(--text-dark); }
  .report-body p { margin:0 0 15px; color:var(--text-secondary); font-size:15px; }
  .report-body ul, .report-body ol { margin:0 0 15px; padding-left:22px; color:var(--text-secondary); font-size:15px; }
  .report-body li { margin-bottom:6px; }
  .report-body a { color:var(--green); }
  .report-body strong { color:var(--text-dark); font-weight:600; }

  .report-card { background:#FBFAF6; border:1px solid var(--border); border-radius:14px; padding:6px; margin:18px 0 26px; overflow-x:auto; box-shadow:0 1px 3px rgba(18,23,20,0.04); }
  .report-body table { width:100%; border-collapse:collapse; font-size:13.5px; }
  .report-body th { text-align:left; background:linear-gradient(135deg,rgba(49,174,121,0.10),rgba(153,208,184,0.10)); color:var(--text-dark); font-weight:700; padding:11px 14px; border-bottom:2px solid var(--green); white-space:nowrap; }
  .report-body td { padding:9px 14px; border-bottom:1px solid var(--border); color:var(--text-secondary); }
  .report-body tr:last-child td { border-bottom:none; }
  .report-body tbody tr:nth-child(even) { background:rgba(18,23,20,0.015); }

  .report-body img { max-width:100%; border-radius:12px; margin:16px 0; display:block; box-shadow:0 8px 24px rgba(18,23,20,0.12); }

  .report-footer { display:flex; align-items:center; justify-content:space-between; gap:12px; border-top:1px solid var(--border); padding:22px 48px; background:#FBFAF6; flex-wrap:wrap; }
  .report-footer .fbrand { display:flex; align-items:center; gap:8px; color:var(--text-tertiary); font-size:12px; font-weight:600; letter-spacing:0.04em; }
  .report-footer .fdot { width:16px; height:16px; border-radius:5px; background:linear-gradient(135deg,var(--green),var(--green-light)); flex-shrink:0; }
  .report-footer .fdate { color:var(--text-tertiary); font-size:12px; }

  @media (max-width:640px) {
    .report-shell { padding:0; }
    .report-paper { border-radius:0; }
    .report-header { padding:32px 22px 30px; }
    .report-header h1 { font-size:24px; }
    .report-toc { margin:-20px 16px 0; padding:14px 16px; }
    .report-toc ul { columns:1; }
    .report-body { padding:28px 20px 8px; }
    .report-footer { padding:18px 20px; }
    .report-card { border-radius:10px; }
  }
</style>
</head>
<body>
  <div class="report-shell">
    <div class="report-paper">
      <div class="report-header">
        <div class="report-header-inner">
          <div class="report-brandrow">
            <div class="report-logo">B</div>
            <div class="report-brand">BRUCK</div>
          </div>
          <h1>${escapeHtml(title)}</h1>
          <div class="meta">${clientName ? `<strong>${escapeHtml(clientName)}</strong><span class="dot"></span>` : ''}${generatedAt}</div>
        </div>
      </div>
      ${tocHtml}
      <div class="report-body">
        ${body}
      </div>
      <div class="report-footer">
        <div class="fbrand"><span class="fdot"></span> Informe generado por BRUCK</div>
        <div class="fdate">${generatedAt}</div>
      </div>
    </div>
  </div>
</body>
</html>`
}
