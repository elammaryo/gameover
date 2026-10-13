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
  },
  // PostHog, through the site's own domain (lib/analytics.ts): its assets and
  // remote config first, then everything else to the API. The order matters,
  // since the last rule would also match the first two.
  async rewrites() {
    return [
      {
        source: '/coin/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*'
      },
      {
        source: '/coin/array/:path*',
        destination: 'https://us-assets.i.posthog.com/array/:path*'
      },
      {
        source: '/coin/:path*',
        destination: 'https://us.i.posthog.com/:path*'
      }
    ]
  },
  // PostHog's API paths end in a slash (/e/, /s/). Next.js would answer those
  // with a redirect to the slashless path, which the SDK's POSTs don't survive,
  // so it's switched off (PostHog's own Next.js setup does the same). Pages
  // still answer with or without the slash.
  skipTrailingSlashRedirect: true
}

export default nextConfig
