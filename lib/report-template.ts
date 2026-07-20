// Plantilla HTML con identidad visual BRUCK para "Informes personalizados".
// El contenido (bodyHtml) ya viene sanitizado/estructurado por el parser
// de origen (Word o Google Sheets) — acá solo se envuelve con el diseño.

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function sheetDataToReportBody(data: { headers: string[]; rows: string[][] }): string {
  const thead = `<tr>${data.headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr>`
  const tbody = data.rows.map(r => `<tr>${r.map(c => `<td>${escapeHtml(c ?? '')}</td>`).join('')}</tr>`).join('')
  return `<table><thead>${thead}</thead><tbody>${tbody}</tbody></table>`
}

interface BuildReportArgs {
  title: string
  clientName?: string | null
  bodyHtml: string
}

export function buildReportHtml({ title, clientName, bodyHtml }: BuildReportArgs): string {
  const generatedAt = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
  :root { --green:#31AE79; --green-light:#99D0B8; --text-dark:#121714; --text-secondary:#4E5651; --border:rgba(18,23,20,0.10); }
  * { box-sizing:border-box; }
  body { margin:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Arial,sans-serif; background:#F8F7F2; color:var(--text-dark); line-height:1.65; }
  .report-header { background:linear-gradient(135deg,#0E241D,#163C30); color:#F5F5F2; padding:36px 40px; }
  .report-header .brand { color:var(--green-light); font-weight:700; letter-spacing:0.18em; font-size:12px; text-transform:uppercase; margin-bottom:10px; }
  .report-header h1 { margin:0; font-size:28px; font-weight:600; letter-spacing:-0.01em; }
  .report-header .meta { margin-top:10px; color:#B8BDB9; font-size:13px; }
  .report-body { max-width:860px; margin:0 auto; padding:36px 24px 60px; }
  .report-body h1 { font-size:24px; font-weight:600; margin:32px 0 12px; color:var(--text-dark); }
  .report-body h2 { font-size:19px; font-weight:600; margin:28px 0 10px; color:var(--text-dark); border-left:3px solid var(--green); padding-left:10px; }
  .report-body h3 { font-size:16px; font-weight:600; margin:20px 0 8px; color:var(--text-dark); }
  .report-body p { margin:0 0 14px; color:var(--text-secondary); font-size:15px; }
  .report-body ul, .report-body ol { margin:0 0 14px; padding-left:22px; color:var(--text-secondary); font-size:15px; }
  .report-body li { margin-bottom:5px; }
  .report-body table { width:100%; border-collapse:collapse; margin:16px 0 22px; font-size:14px; }
  .report-body th { text-align:left; background:rgba(49,174,121,0.08); color:var(--text-dark); font-weight:600; padding:9px 12px; border-bottom:2px solid var(--green); white-space:nowrap; }
  .report-body td { padding:8px 12px; border-bottom:1px solid var(--border); color:var(--text-secondary); }
  .report-body tr:last-child td { border-bottom:none; }
  .report-body img { max-width:100%; border-radius:10px; margin:12px 0; display:block; }
  .report-body a { color:var(--green); }
  .report-body strong { color:var(--text-dark); }
  .report-footer { border-top:1px solid var(--border); padding:20px 24px; text-align:center; color:#858C87; font-size:12px; }
  @media (max-width:640px) {
    .report-header { padding:26px 20px; }
    .report-header h1 { font-size:22px; }
    .report-body { padding:24px 16px 40px; }
    .report-body table { display:block; overflow-x:auto; white-space:nowrap; }
  }
</style>
</head>
<body>
  <div class="report-header">
    <div class="brand">BRUCK</div>
    <h1>${escapeHtml(title)}</h1>
    <div class="meta">${clientName ? escapeHtml(clientName) + ' · ' : ''}${generatedAt}</div>
  </div>
  <div class="report-body">
    ${bodyHtml}
  </div>
  <div class="report-footer">Informe generado por BRUCK · ${generatedAt}</div>
</body>
</html>`
}
