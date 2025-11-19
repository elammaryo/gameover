interface BaseTrack {
  id: string
  title: string
  artist?: string
  durationMs?: number
  artworkUrl?: string
  source: TrackSource
}

export interface BeatTrack extends BaseTrack {
  source: 'beat'
  bpm: number
  genre: string
  mood?: string
  s3Key: string
  tags?: string[]
}

export interface SpotifyTrack extends BaseTrack {
  source: 'spotify'
  spotifyId: string
  artists: string[]
  albumName: string
  previewUrl?: string
  spotifyUrl: string
}

export type Track = BeatTrack | SpotifyTrack

export type TrackSource = 'beat' | 'spotify'
