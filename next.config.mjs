/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración condicional según el entorno
  ...(process.env.NODE_ENV === 'production' && process.env.STATIC_EXPORT === 'true' 
    ? {
        // Configuración para Cloudflare Pages - Static Export
        output: 'export',
        distDir: 'out',
        trailingSlash: true,
      }
    : {
        // Configuración para desarrollo con API routes
        distDir: '.next',
      }
  ),
  images: {
    unoptimized: true,
  },
  // Variables de entorno públicas
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '/api',
  },
}

export default nextConfig