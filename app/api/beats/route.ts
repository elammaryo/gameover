import { NextResponse } from 'next/server'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import beatsData from './beats.json'

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
})

export async function GET() {
  try {
    const beatsWithUrls = await Promise.all(
      beatsData.map(async (beat: { s3Key: any }) => {
        const command = new GetObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: beat.s3Key
        })
        const audioUrl = await getSignedUrl(s3Client, command, {
          expiresIn: 3600
        })
        // console.log('Generated signed URL:', audioUrl)
        return { ...beat, audioUrl, source: 'beat' }
      })
    )

    return NextResponse.json(beatsWithUrls)
  } catch (error) {
    console.error('Error fetching beats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch beats' },
      { status: 500 }
    )
  }
}
