#!/usr/bin/env node
/* ---------------------------------------------------------------------------
   Makes the copies the site streams for beats whose masters are lossless
   (WAV, AIFF, FLAC): MP3 at 320 kbps, a quarter of a WAV's size or less,
   so playback doesn't depend on a fast, steady connection. They go to
   Beats/stream/<id>.mp3 next to the masters, which aren't touched. The
   site switches to a copy by itself within a few minutes: no deploy.

     npm run stream-copies                  make the ones that are missing
     npm run stream-copies -- --dry-run     just list what it would do
     npm run stream-copies -- --force       make them all again
     npm run stream-copies -- --only 109,107

   Needs ffmpeg (macOS: `brew install ffmpeg`, Windows: `winget install
   ffmpeg`) and the site's S3 settings (AWS_REGION, AWS_ACCESS_KEY_ID,
   AWS_SECRET_ACCESS_KEY, S3_BUCKET_NAME), from the environment or
   .env.local, for a key that can write to the bucket too.
--------------------------------------------------------------------------- */

import { spawnSync } from 'node:child_process'
import { createWriteStream } from 'node:fs'
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'
import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client
} from '@aws-sdk/client-s3'
import { streamKeyFor } from '../lib/streamCopy.ts'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const BITRATE = '320k'

// --- settings ------------------------------------------------------------------
try {
  process.loadEnvFile(path.join(root, '.env.local'))
} catch {
  // no .env.local: the environment has them (or doesn't, see below)
}
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const force = args.includes('--force')
const onlyAt = args.indexOf('--only')
const only = onlyAt >= 0 ? new Set((args[onlyAt + 1] ?? '').split(',').filter(Boolean)) : null

const missing = ['AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'S3_BUCKET_NAME'].filter(
  name => !process.env[name]
)
if (missing.length) {
  console.error(`Missing ${missing.join(', ')}: put them in .env.local (\`vercel env pull .env.local\`) or the environment.`)
  process.exit(1)
}
const Bucket = process.env.S3_BUCKET_NAME
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  },
  // (an S3-compatible stand-in for testing)
  ...(process.env.S3_ENDPOINT ? { endpoint: process.env.S3_ENDPOINT, forcePathStyle: true } : {})
})

// --- the encoder ----------------------------------------------------------------
const has = cmd => spawnSync(cmd, ['-version'], { stdio: 'ignore' }).status === 0
if (!dryRun && !has('ffmpeg')) {
  console.error('ffmpeg is needed to make the copies (macOS: `brew install ffmpeg`, Windows: `winget install ffmpeg`).')
  process.exit(1)
}

function run(cmd, cmdArgs) {
  const r = spawnSync(cmd, cmdArgs, { encoding: 'utf8' })
  if (r.status !== 0) throw new Error(`${cmd} failed: ${(r.stderr || r.stdout || '').trim().slice(-500)}`)
  return r.stdout
}

/** sample rate of the first audio stream (0 if unknown) */
function sampleRate(file) {
  if (!has('ffprobe')) return 0
  const out = run('ffprobe', ['-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=sample_rate', '-of', 'csv=p=0', file])
  return Number.parseInt(out.trim(), 10) || 0
}

function encode(input, output) {
  // MP3 tops out at 48 kHz: bring hi-res masters down
  const rate = sampleRate(input)
  run('ffmpeg', [
    '-nostdin', '-hide_banner', '-v', 'error', '-y',
    '-i', input,
    '-map', '0:a:0', '-vn', '-map_metadata', '-1',
    // constant bit rate: exact durations and seeking in every browser
    '-c:a', 'libmp3lame', '-b:a', BITRATE,
    ...(rate > 48000 ? ['-ar', '48000'] : []),
    output
  ])
}

// --- S3 ---------------------------------------------------------------------------
async function exists(Key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket, Key }))
    return true
  } catch (err) {
    const status = err?.$metadata?.httpStatusCode
    if (status === 404 || status === 403 || err?.name === 'NotFound') return false
    throw err
  }
}

async function download(Key, file) {
  const res = await s3.send(new GetObjectCommand({ Bucket, Key }))
  await pipeline(res.Body, createWriteStream(file))
}

async function upload(Key, file) {
  await s3.send(
    new PutObjectCommand({
      Bucket,
      Key,
      Body: await readFile(file),
      ContentType: 'audio/mpeg',
      // a copy never changes once it's made (remade copies get the same
      // key, and the site's links change every hour anyway)
      CacheControl: 'public, max-age=31536000, immutable'
    })
  )
}

// --- go ---------------------------------------------------------------------------
const beats = JSON.parse(await readFile(path.join(root, 'app/api/beats/beats.json'), 'utf8'))
const todo = beats.filter(b => streamKeyFor(b) && (!only || only.has(b.id)))
if (!todo.length) {
  console.log('No lossless masters to make copies of.')
  process.exit(0)
}

const mb = bytes => `${(bytes / 1024 / 1024).toFixed(1)} MB`
// back to the start of the progress line (a fresh line when it's a log)
const cr = process.stdout.isTTY ? '\r\x1b[K' : '\n'
const dir = await mkdtemp(path.join(tmpdir(), 'gameover-stream-'))
let made = 0
let failed = 0
try {
  for (const beat of todo) {
    const key = streamKeyFor(beat)
    const name = `#${beat.id} ${beat.title.trim()}`
    if (!force && (await exists(key))) {
      console.log(`✓ ${name}: already streaming from ${key}`)
      continue
    }
    if (dryRun) {
      console.log(`→ ${name}: would make ${key} from ${beat.s3Key}`)
      continue
    }
    try {
      const ext = path.extname(beat.s3Key) || '.wav'
      const master = path.join(dir, `${beat.id}${ext}`)
      const copy = path.join(dir, `${beat.id}.mp3`)
      process.stdout.write(`… ${name}: downloading`)
      await download(beat.s3Key, master)
      process.stdout.write(', encoding')
      encode(master, copy)
      process.stdout.write(', uploading')
      await upload(key, copy)
      const [a, b] = await Promise.all([stat(master), stat(copy)])
      console.log(`${cr}✓ ${name}: ${mb(a.size)} → ${mb(b.size)} (${key})`)
      made++
      await rm(master, { force: true })
      await rm(copy, { force: true })
    } catch (err) {
      failed++
      const status = err?.$metadata?.httpStatusCode
      const denied = err?.name === 'AccessDenied' || status === 403
      const gone = err?.name === 'NoSuchKey' || status === 404
      const why = denied
        ? 'access denied'
        : gone
          ? `no master at ${beat.s3Key}`
          : `${err?.message || err?.name || err}`
      console.log(`${cr}✗ ${name}: ${why}`)
      if (denied) {
        console.error(
          `  The key in use needs s3:GetObject on the masters and s3:PutObject on ${path.posix.dirname(key)}/* (the site's own key may only be able to read).`
        )
        break
      }
    }
  }
} finally {
  await rm(dir, { recursive: true, force: true })
}

if (!dryRun) {
  console.log(
    made
      ? `\n${made} made${failed ? `, ${failed} failed` : ''}. The site picks them up within a few minutes.`
      : failed
        ? `\n${failed} failed.`
        : '\nNothing new to make.'
  )
}
process.exit(failed ? 1 : 0)
