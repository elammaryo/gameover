import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'mosaic.scdn.co',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'i.scdn.co',
        pathname: '/**'
      }
    ]
  }
}

export default nextConfig
