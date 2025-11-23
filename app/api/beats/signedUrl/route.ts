import { NextRequest, NextResponse } from 'next/server'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import beatsData from '@/app/api/beats/beats.json'

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
})

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
    const s3Key = beatsData.find(beat => beat.id === trackId)?.s3Key

    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: s3Key
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
