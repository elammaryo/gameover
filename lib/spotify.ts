export async function requestToken() {
  try {
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(
          `${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`
        ).toString('base64')}`
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
