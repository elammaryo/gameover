import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  const playlistId = params.id as string

  if (!playlistId) {
    return NextResponse.json(
      { error: 'Playlist ID is required' },
      { status: 400 }
    )
  }

  const res = await fetch(`${process.env.BASE_URL}/api/spotify/token`, {
    headers: {
      Cookie: request.headers.get('cookie') || ''
    }
  })
  const token = await res.json()

  if (!token) {
    return NextResponse.json(
      { message: 'Failed to obtain Spotify access token' },
      { status: 500 }
    )
  }

  try {
    const res = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}`,
      {
        headers: {
          Authorization: `Bearer ${token.accessToken}`
        }
      }
    )
    const data = await res.json()

    return NextResponse.json({ playlist: data, status: 200 })
  } catch (error) {
    console.error('Error fetching playlist tracks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch playlist tracks' },
      { status: 500 }
    )
  }
}
