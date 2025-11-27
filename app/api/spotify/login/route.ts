import { NextResponse } from 'next/server'
import querystring from 'querystring'

export function GET() {
  const clientId = process.env.CLIENT_ID
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI
  const scopes = ['user-read-private', 'user-top-read']
  const state = generateRandomString(16)

  const authUrl =
    'https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: clientId,
      scope: scopes.join(' '),
      redirect_uri: redirectUri,
      state: state
    })

  return NextResponse.json({ url: authUrl })
}

function generateRandomString(length: number): string {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}
