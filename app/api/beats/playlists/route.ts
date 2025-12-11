import { NextResponse } from 'next/server'
import playlistsData from '../playlists.json'

export async function GET() {
  try {
    playlistsData.map(async playlist => playlist)
    return NextResponse.json(playlistsData)
  } catch (error) {
    console.error('Error fetching beats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch beats' },
      { status: 500 }
    )
  }
}
