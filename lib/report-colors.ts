// Paleta de colores elegible para "Informes personalizados". Deriva tonos
// claros/oscuros del color base para el degradado del header, bordes y
// tintes de tabla — sin depender de un solo verde fijo.

export const REPORT_PALETTE: { label: string; value: string }[] = [
  { label: 'Verde BRUCK', value: '#31AE79' },
  { label: 'Azul',        value: '#3B82F6' },
  { label: 'Violeta',     value: '#8B5CF6' },
  { label: 'Naranja',     value: '#F59E0B' },
  { label: 'Coral',       value: '#E4695B' },
  { label: 'Celeste',     value: '#06B6D4' },
  { label: 'Marino',      value: '#25476B' },
  { label: 'Grafito',     value: '#4B5563' },
]

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const n = h.length === 3
    ? h.split('').map(c => parseInt(c + c, 16))
    : [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
  return [n[0] || 0, n[1] || 0, n[2] || 0]
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}

// Mezcla el color con blanco (t=1) o negro (t=-1), proporcional a |t|.
function mix(hex: string, t: number): string {
  const [r, g, b] = hexToRgb(hex)
  const target = t > 0 ? 255 : 0
  const amt = Math.abs(t)
  return rgbToHex([r + (target - r) * amt, g + (target - g) * amt, b + (target - b) * amt])
}

export function deriveReportTheme(accentColor: string) {
  const base = /^#[0-9a-fA-F]{3,6}$/.test(accentColor) ? accentColor : '#31AE79'
  return {
    accent: base,
    accentLight: mix(base, 0.45),
    headerFrom: mix(base, -0.72),
    headerTo: mix(base, -0.55),
    headerGlow: mix(base, -0.3),
    tableTint: mix(base, 0.9),
  }
}
