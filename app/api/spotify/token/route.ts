import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { refreshAccessToken } from '@/lib/spotify'

export async function GET() {
  const cookiesStore = await cookies()
  let accessToken = cookiesStore.get('spotify_access_token')?.value || null

  if (!accessToken) {
    const refreshToken =
      cookiesStore.get('spotify_refresh_token')?.value || null

    if (!refreshToken) {
      cookiesStore.delete('spotify_logged_in')
      return NextResponse.json(
        { message: 'No refresh token found, logging out user' },
        { status: 200 }
      )
    }

    token = await refreshAccessToken(refreshToken).catch(error => {
      console.error('Error refreshing Spotify access token:', error)
      return NextResponse.json(
        { message: 'Error refreshing access token' },
        { status: 500 }
      )
    })
    accessToken = token.access_token
    cookiesStore.delete('spotify_access_token')
    cookiesStore.set('spotify_access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: token.expires_in
    })

    return NextResponse.json(
      { accessToken: token.access_token },
      { message: 'Access token refreshed successfully' }
    )
  }

  if (!accessToken) {
    return NextResponse.json(
      { message: 'No access token found' },
      { status: 200 }
    )
  }

  return NextResponse.json(
    { accessToken },
    { message: 'Access token retrieved successfully' },
    { status: 200 }
  )
}
