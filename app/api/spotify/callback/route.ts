import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getLoginToken } from '@/lib/spotify'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(
      new URL('/spotify?error=auth_failed', request.url)
    )
  }

  try {
    const tokens: {
      access_token: string
      refresh_token: string
      expires_in: number
    } = await getLoginToken(code)
    const cookieStore = await cookies()
    // Store tokens securely
    cookieStore.set('spotify_access_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: tokens.expires_in,
      sameSite: 'lax',
      path: '/'
    })
    cookieStore.set('spotify_refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: 'lax',
      path: '/'
    })
    cookieStore.set('spotify_logged_in', 'true', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: 'lax',
      path: '/'
    })

    return NextResponse.redirect(new URL('/spotify?success=true', request.url))
  } catch (error) {
    console.error('Token exchange error:', error)
    return NextResponse.redirect(
      new URL('/spotify?error=token_exchange', request.url)
    )
  }
}
