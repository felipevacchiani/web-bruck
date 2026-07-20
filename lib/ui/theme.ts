// Tokens de identidad visual BRUCK — ver guía de marca interna.
// Fuente única de verdad para colores usados en style={{}} inline
// (el proyecto no compila Tailwind: sin postcss.config.js, así que
// las clases de tailwind.config.js no se aplican; se mantiene el
// patrón existente de estilos inline, ahora centralizado acá).

export const bruck = {
  green: '#31AE79',
  greenLight: '#99D0B8',
  greenDark: '#163C30',
  greenDeep: '#0E241D',

  bgPrimary: '#090B0A',
  bgSecondary: '#111512',
  bgTertiary: '#171C19',

  creamPrimary: '#F3EFE5',
  creamSecondary: '#E8E1D2',
  whiteWarm: '#F5F5F2',

  textPrimary: '#F5F5F2',
  textSecondary: '#B8BDB9',
  textTertiary: '#858C87',
  textDark: '#121714',

  borderDark: '#2A302C',
  borderLight: '#D8D1C4',

  error: '#E47B68',
  warning: '#D9AD5B',

  radiusSmall: 12,
  radiusMedium: 16,
  radiusLarge: 24,
  radiusPill: 999,
} as const
