/** @type {import('next').NextConfig} */
const nextConfig = {
  // Permite que el iframe cargue signed URLs de Supabase Storage
  async headers() {
    return [
      {
        source: '/view/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self'",
          },
        ],
      },
    ]
  },
}

export default nextConfig
