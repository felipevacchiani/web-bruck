/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración para Cloudflare Pages - Static Export
  output: 'export',
  distDir: 'out',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
}

export default nextConfig