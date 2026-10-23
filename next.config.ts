import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "jazgottours-shanteiy-camamas-projects.vercel.app",
        "*.vercel.app",
        "psychic-palm-tree-wrg676g9597vcvg7r-3000.app.github.dev",
        "*.app.github.dev"
      ]
    }
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.travelandleisure.com',
      },
      {
        protocol: 'https',
        hostname: 'ahvfnuwdglbohtxwmrfc.supabase.co',
      },
    ],
  },
}

export default nextConfig
