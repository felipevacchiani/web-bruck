/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    runtime: 'nodejs',
  },
  // Configuración para Cloudflare Pages con @cloudflare/next-on-pages
  images: {
    unoptimized: true,
  },
}

export default nextConfig