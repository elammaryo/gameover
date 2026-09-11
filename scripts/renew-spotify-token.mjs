#!/usr/bin/env node

import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { randomBytes, timingSafeEqual } from 'node:crypto'
import { execFile } from 'node:child_process'

const localRedirectUri = 'http://127.0.0.1:8888/callback'

function readEnvFile() {
  try {
    return Object.fromEntries(
      readFileSync('.env', 'utf8')
        .split(/\r?\n/)
        .filter(line => line && !line.startsWith('#'))
        .map(line => {
          const separator = line.indexOf('=')
          return [line.slice(0, separator), line.slice(separator + 1)]
        })
    )
  } catch {
    return {}
  }
}

const fileEnv = readEnvFile()
const clientId = process.env.CLIENT_ID || fileEnv.CLIENT_ID
const clientSecret = process.env.CLIENT_SECRET || fileEnv.CLIENT_SECRET

if (!clientId || !clientSecret) {
  console.error('Missing CLIENT_ID or CLIENT_SECRET. Add them to .env first.')
  process.exit(1)
}

const state = randomBytes(16).toString('hex')
const authorizeUrl = new URL('https://accounts.spotify.com/authorize')
authorizeUrl.search = new URLSearchParams({
  response_type: 'code',
  client_id: clientId,
  redirect_uri: localRedirectUri,
  scope: 'user-top-read',
  state
}).toString()

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  )
}

const server = createServer(async (request, response) => {
  const callbackUrl = new URL(request.url || '/', localRedirectUri)

  if (callbackUrl.pathname !== '/callback') {
    response.writeHead(404).end('Not found')
    return
  }

  const error = callbackUrl.searchParams.get('error')
  const returnedState = callbackUrl.searchParams.get('state')
  const code = callbackUrl.searchParams.get('code')

  if (error || !code || !returnedState || !safeEqual(returnedState, state)) {
    response.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' })
    response.end('<h1>Spotify authorization failed.</h1>You can close this tab.')
    console.error(`Spotify authorization failed: ${error || 'invalid state'}`)
    server.close()
    process.exitCode = 1
    return
  }

  try {
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: localRedirectUri
      })
    })
    const token = await tokenResponse.json()

    if (!tokenResponse.ok || !token.refresh_token) {
      throw new Error(token.error_description || token.error || 'No refresh token returned')
    }

    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    response.end('<h1>Spotify connected.</h1>Return to your terminal for the token.')
    console.log('\nNew Spotify refresh token (keep this secret):\n')
    console.log(token.refresh_token)
    console.log('\nAdd it in Vercel as SPOTIFY_REFRESH_TOKEN, then redeploy.\n')
  } catch (reason) {
    response.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' })
    response.end('<h1>Could not exchange the Spotify authorization code.</h1>Check the terminal.')
    console.error(`Token exchange failed: ${reason.message}`)
    process.exitCode = 1
  } finally {
    server.close()
  }
})

server.listen(8888, '127.0.0.1', () => {
  console.log('Before continuing, add this Redirect URI in your Spotify developer app:')
  console.log(`  ${localRedirectUri}\n`)
  console.log('Opening Spotify sign-in…')
  console.log(`If it does not open, use this URL:\n${authorizeUrl}\n`)
  execFile('open', [authorizeUrl.toString()], () => {})
})
