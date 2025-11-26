import { NextResponse } from 'next/server'
import { requestToken } from '@/lib/spotify'

const userId = process.env.USER_ID
let token: {
  access_token: string
  token_type: string
  expires_in: number
  expires_at: number
} | null = null

export async function GET(request: Request) {
  try {
    if (!token?.access_token || Date.now() >= token.expires_at) {
      token = await requestToken()
    }

    const res = await fetch(
      `https://api.spotify.com/v1/users/${userId}/playlists?limit=10`,
      {
        headers: {
          Authorization: `Bearer ${token?.access_token}`
        },
        method: 'GET'
      }
    )

    const data = await res.json()
    return NextResponse.json({ playlists: data.items || [], status: 200 })
  } catch (error) {
    console.error('Error in GET /api/spotify/playlists:', error)
    return NextResponse.json({ error: 'Internal Server Error', status: 500 })
  }
}
