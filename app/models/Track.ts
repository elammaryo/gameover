export type TrackSource = 'beat' | 'spotify'

abstract class BaseTrack {
  id: string
  title: string
  artist?: string
  durationMs?: number
  artworkUrl?: string
  source: TrackSource
  audioUrl: string

  constructor(data: any) {
    this.id = data.id
    this.title = data.title
    this.artist = data.artist
    this.durationMs = data.durationMs
    this.artworkUrl = data.artworkUrl
    this.source = data.source
    this.audioUrl = data.audioUrl
  }
}

export class BeatTrack extends BaseTrack {
  source: 'beat' = 'beat'
  bpm: number
  subtitle?: string
  genre: string
  mood?: string
  tags?: string[]
  key?: string

  constructor(data: any) {
    super(data)
    this.bpm = data.bpm
    this.subtitle = data.subtitle
    this.genre = data.genre
    this.mood = data.mood
    this.tags = data.tags
    this.key = data.key
  }
}

export class SpotifyTrack extends BaseTrack {
  source: 'spotify' = 'spotify'
  name: string
  album: {
    images: [{ url: string }]
  }
  artists: [{ name: string }]
  spotifyId: string
  albumName: string
  previewUrl?: string
  spotifyUrl: string
  images: { url: string; height: number; width: number }[]

  constructor(data: any) {
    super(data)
    this.name = data.name
    this.album = data.album
    this.spotifyId = data.spotifyId
    this.artists = data.artists
    this.albumName = data.albumName
    this.previewUrl = data.previewUrl
    this.spotifyUrl = data.spotifyUrl
    this.images = data.images
  }
}

export type Track = BeatTrack | SpotifyTrack
