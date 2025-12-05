import { NextResponse } from 'next/server'
import beatsData from './beats.json'
import { BeatTrack } from '@/app/models/Track'

export async function GET() {
  try {
    beatsData.map(async beat => {
      return { ...beat, source: 'beat' }
    })

    return NextResponse.json(beatsData)
  } catch (error) {
    console.error('Error fetching beats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch beats' },
      { status: 500 }
    )
  }
}
