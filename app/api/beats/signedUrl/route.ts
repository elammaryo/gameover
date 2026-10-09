import { NextRequest, NextResponse } from 'next/server'
import { S3Client, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import beatsData from '@/app/api/beats/beats.json'
import { streamKeyFor } from '@/lib/streamCopy'

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  },
  // (an S3-compatible stand-in for local testing; unset in production)
  ...(process.env.S3_ENDPOINT ? { endpoint: process.env.S3_ENDPOINT, forcePathStyle: true } : {})
})

/*
  Which streaming copies exist, remembered per server instance: a copy is
  looked up once an hour, a missing one again after a few minutes (so a
  copy made later is picked up without a deploy).
*/
const copies = new Map<string, { found: boolean; at: number }>()
const FOUND_FOR = 60 * 60 * 1000
const MISSING_FOR = 5 * 60 * 1000

async function hasCopy(key: string): Promise<boolean> {
  const known = copies.get(key)
  if (known && Date.now() - known.at < (known.found ? FOUND_FOR : MISSING_FOR)) {
    return known.found
  }
  let found = false
  try {
    await s3Client.send(
      new HeadObjectCommand({ Bucket: process.env.S3_BUCKET_NAME, Key: key }),
      // never hold up playback for long: the master streams instead
      { abortSignal: AbortSignal.timeout(2500) }
    )
    found = true
  } catch {
    // missing (403 or 404, depending on the bucket's permissions) or slow
  }
  copies.set(key, { found, at: Date.now() })
  return found
}

export async function POST(req: NextRequest) {
  const jsonBody = await req.json()
  const trackId: string = jsonBody.trackId

  if (!trackId) {
    return NextResponse.json(
      { error: 'trackId query parameter is required' },
      { status: 400 }
    )
  }

  try {
    const beat = beatsData.find(b => b.id === trackId)
    if (!beat?.s3Key) {
      return NextResponse.json({ error: 'Unknown beat' }, { status: 404 })
    }

    // the compressed copy of a lossless master, once it's been made
    const copy = streamKeyFor(beat)
    const key = copy && (await hasCopy(copy)) ? copy : beat.s3Key

    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key
    })
    const audioUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600
    })

    return NextResponse.json({ audioUrl })
  } catch (error) {
    console.error('Error fetching beats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch beats' },
      { status: 500 }
    )
  }
}
