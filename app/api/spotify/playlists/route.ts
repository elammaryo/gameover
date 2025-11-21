import { NextResponse } from 'next/server'

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
      await requestToken()
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

    token = {
      ...data,
      expires_at: Date.now() + data.expires_in * 1000
    }
  } catch (error) {
    console.error('Error requesting Spotify token:', error)
    throw new Error('Failed to fetch Spotify token')
  }
}

// Get my personal top tracks from Spotify // will use in about me tab along with other stats
// async function getTopTracks() {
//   // Endpoint reference : https://developer.spotify.com/documentation/web-api/reference/get-users-top-artists-and-tracks
//   // return (
//   //   await fetchWebApi('v1/me/top/tracks?time_range=long_term&limit=5', 'GET')
//   // ).items
// }

// const topTracks = await getTopTracks()
// console.log(
//   topTracks?.map(
//     ({ name, artists }: { name: string; artists: { name: string }[] }) =>
//       `${name} by ${artists.map(artist => artist.name).join(', ')}`
//   )
// )
