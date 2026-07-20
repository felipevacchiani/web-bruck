import mammoth from 'mammoth'

// Convierte un .docx a HTML semántico real (títulos, párrafos, listas,
// tablas, imágenes embebidas como data URI) usando mammoth — sin IA,
// mapeo determinístico de los estilos de Word a etiquetas HTML.
export async function parseWordDocument(buffer: Buffer): Promise<{ html: string; warnings: string[] }> {
  const result = await mammoth.convertToHtml(
    { buffer },
    {
      styleMap: [
        "p[style-name='Title'] => h1:fresh",
        "p[style-name='Subtitle'] => h3:fresh",
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
      ],
    }
  )
  return { html: result.value, warnings: result.messages.map(m => m.message) }
}
