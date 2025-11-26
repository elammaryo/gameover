import { refreshAccessToken } from '@/lib/spotify'
import { NextResponse } from 'next/server'

let token: {
  access_token: string
  token_type: string
  expires_in: number
  expires_at: number
} | null = null

export async function GET() {
  if (!token?.access_token || Date.now() >= token.expires_at) {
    token = await refreshAccessToken()
  }

  if (!token) {
    return new NextResponse(JSON.stringify({ topArtists: [] }), {
      status: 500
    })
  }

  const res = await fetch('https://api.spotify.com/v1/me/top/artists?limit=5', {
    headers: {
      Authorization: `Bearer ${token?.access_token}`
    }
  })
  const data = await res.json()

  return new NextResponse(JSON.stringify({ topArtists: data.items ?? [] }), {
    status: 200
  })
}
