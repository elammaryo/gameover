const credentials = `${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`
const authHeader = `Basic ${Buffer.from(credentials).toString('base64')}`
const tokenEndpoint = 'https://accounts.spotify.com/api/token'

export async function requestMyToken() {
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

export async function refreshAccessToken(refreshToken: string) {
  if (!refreshToken) return null

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken
  })

  try {
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: authHeader
      },
      body: body.toString()
    })

    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${response.statusText}`)
    }

    const data = await response.json()
    return {
      ...data,
      expires_at: Date.now() + data.expires_in * 1000
    }
  } catch (error) {
    console.error('Error during token refresh:', error)
    return null
  }
}

export async function getLoginToken(code: string) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI || ''
  })

  try {
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: authHeader
      },
      body: body.toString()
    })

    if (!response.ok) {
      throw new Error(
        `Failed to exchange code for token: ${response.statusText}`
      )
    }

    const data = await response.json()
    return {
      ...data,
      expires_at: Date.now() + data.expires_in * 1000
    }
  } catch (error) {
    console.error('Error during code exchange for token:', error)
    throw error
  }
}

export const handleLogin = async () => {
  try {
    const response = await fetch('/api/spotify/login')
    const data = await response.json()
    window.location.href = data.url
  } catch (error) {
    console.error('Error initiating Spotify login:', error)
  }
}

export const handleLogout = async () => {
  try {
    await fetch('/api/spotify/logout', { method: 'POST' })
    window.location.reload()
  } catch (error) {
    console.error('Error logging out:', error)
  }
}
