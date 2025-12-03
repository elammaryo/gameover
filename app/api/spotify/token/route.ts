import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const cookiesStore = await cookies()
  const accessToken = cookiesStore.get('spotify_access_token')?.value || null
  if (!accessToken) {
    return NextResponse.json(
      { error: 'No access token found' },
      { status: 200 }
    )
  }
  return NextResponse.json({ accessToken })
}
