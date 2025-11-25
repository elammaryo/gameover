import { NextResponse } from 'next/server'
import querystring from 'querystring'

let code: string

export function GET() {
  console.log('Initiating Spotify Login Process')

  console.log('Generating Spotify Auth URL')
  const clientId = process.env.CLIENT_ID
  const redirectUri = 'https://gameover.studio/spotify'
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

function spotifyAuthUrl() {}

function generateRandomString(length: number): string {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}
