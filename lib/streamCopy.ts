/* ---------------------------------------------------------------------------
   Streaming copies. Some beats' masters are lossless (WAV, AIFF, FLAC):
   1.4–2.3 Mbps, several times what a music app streams (320 kbps at most),
   which a phone's connection (or its Wi-Fi, sharing the radio with
   Bluetooth headphones) can't always keep up with. Those beats stream from a
   compressed copy instead once there is one: MP3 at 320 kbps, the format
   the rest of the catalogue is already in (every browser plays it), made by
   `npm run stream-copies` (scripts/stream-copies.mjs) and kept next to the
   masters, which stay as they are.
--------------------------------------------------------------------------- */

export const STREAM_PREFIX = 'Beats/stream/'

export const isLossless = (key: string) => /\.(wav|aiff?|flac)$/i.test(key)

/** Where a beat's streaming copy goes (null: its master streams fine as is). */
export const streamKeyFor = (beat: { id: string; s3Key: string }) =>
  isLossless(beat.s3Key) ? `${STREAM_PREFIX}${beat.id}.mp3` : null
