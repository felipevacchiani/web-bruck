// Lee un Google Sheet compartido públicamente ("cualquiera con el
// link puede ver") como CSV en vivo, sin guardar copia de las filas.

export function parseSheetUrl(url: string): { id: string; gid: string } | null {
  const idMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  if (!idMatch) return null
  const gidMatch = url.match(/[?#&]gid=(\d+)/)
  return { id: idMatch[1], gid: gidMatch ? gidMatch[1] : '0' }
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++ }
      else if (c === '"') { inQuotes = false }
      else { field += c }
    } else {
      if (c === '"') inQuotes = true
      else if (c === ',') { row.push(field); field = '' }
      else if (c === '\r') { /* skip */ }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
      else field += c
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row) }
  return rows.filter(r => r.some(c => c.trim() !== ''))
}

export async function fetchGoogleSheetData(url: string): Promise<{ headers: string[]; rows: string[][] }> {
  const parsed = parseSheetUrl(url)
  if (!parsed) throw new Error('URL de Google Sheet inválida')

  const exportUrl = `https://docs.google.com/spreadsheets/d/${parsed.id}/export?format=csv&gid=${parsed.gid}`
  const res = await fetch(exportUrl)
  if (!res.ok || res.url.includes('accounts.google.com')) {
    throw new Error('No se pudo leer el Sheet. Verificá que esté compartido como "Cualquiera con el link puede ver".')
  }
  const text = await res.text()
  const table = parseCSV(text)
  if (!table.length) return { headers: [], rows: [] }
  return { headers: table[0], rows: table.slice(1) }
}
