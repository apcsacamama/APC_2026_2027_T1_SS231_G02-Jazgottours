import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "psychic-palm-tree-wrg676g9597vcvg7r-3000.app.github.dev",
        "*.app.github.dev"
      ]
    }
  },
  images: {
    unoptimized: true, // <--- THIS FIXES THE CODESPACES IMAGE BUG
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.travelandleisure.com',
      },
    ],
  },
}

export default nextConfig