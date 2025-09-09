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
    NEXT_PUBLIC_EMAIL_MODE: process.env.EMAIL_MODE || 'local',
    NEXT_PUBLIC_WORKER_URL: process.env.WORKER_URL,
  },
}

export default nextConfig