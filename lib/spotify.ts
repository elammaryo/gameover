const credentials = `${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`
const authHeader = `Basic ${Buffer.from(credentials).toString('base64')}`
const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN || ''
const tokenEndpoint = 'https://accounts.spotify.com/api/token'

export async function requestToken() {
  try {
    const res = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: authHeader
      },
      body: 'grant_type=client_credentials'
    })

    const data = await res.json()

    return {
      ...data,
      expires_at: Date.now() + data.expires_in * 1000
    }
  } catch (error) {
    console.error('Error requesting Spotify token:', error)
    throw new Error('Failed to fetch Spotify token')
  }
}

export async function refreshAccessToken(): Promise<string | null> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken
  })

  try {
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    })

    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${response.statusText}`)
    }

    const data: { access_token: string; [key: string]: any } =
      await response.json()
    return data.access_token
  } catch (error) {
    console.error('Error during token refresh:', error)
    return null
  }
}
