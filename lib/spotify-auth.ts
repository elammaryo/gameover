/* Browser-side Spotify session helpers (no secrets here: the token exchange
   and refresh live in lib/spotify.ts and run server-side only). */

export const handleLogin = async () => {
  try {
    const response = await fetch('/api/spotify/login')
    const data = await response.json()
    window.location.href = data.url
  } catch (error) {
    console.error('Error initiating Spotify login:', error)
  }
}

export const handleLogout = async () => {
  try {
    await fetch('/api/spotify/logout', { method: 'POST' })
    window.location.reload()
  } catch (error) {
    console.error('Error logging out:', error)
  }
}
