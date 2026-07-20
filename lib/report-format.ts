// Utilidades de post-procesamiento estructural sobre HTML de informes.
// Sin dependencias de Node/mammoth para poder reusarse desde cualquier
// lado (rutas API o, en el futuro, cliente).

// Detecta párrafos que arrancan con un número + título corto en negrita
// ("1. Objetivo", "2) Alcance", etc. — patrón típico cuando el Word no
// usa los estilos "Heading" de Word) y los separa en un <h2> real + el
// resto del párrafo como texto normal. Determinístico, no reescribe nada.
export function promoteBoldNumberedHeadings(html: string): string {
  return html.replace(
    /<p>\s*<strong>\s*(\d{1,2}[.)]\s*[^<]{2,60}?)\s*<\/strong>\s*([\s\S]*?)<\/p>/g,
    (_m, heading: string, rest: string) => {
      const title = heading.trim()
      const body = rest.trim()
      return body ? `<h2>${title}</h2><p>${body}</p>` : `<h2>${title}</h2>`
    }
  )
}
