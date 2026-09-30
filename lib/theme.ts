/* ---------------------------------------------------------------------------
   Per-page colour themes. Each section keeps the colours it had before the
   refresh (Spotify green, About purple/pink, Tech indigo/cyan/magenta, home
   cyan/pink), except the studio, which is red.

   - `stops` feed the LED backdrop (left → right across the screen)
   - `accent` / `accent2` / `accent3` become --color-theme(-2/-3) for buttons,
     eyebrows, active states and the logo tint
--------------------------------------------------------------------------- */

export type ThemeId = 'home' | 'studio' | 'spotify' | 'about' | 'tech' | 'lost'

type Theme = {
  stops: [string, string, string]
  accent: string
  accentHi: string
  accent2: string
  accent3: string
}

export const THEMES: Record<ThemeId, Theme> = {
  home: {
    stops: ['#00D4FF', '#EC4899', '#A855F7'],
    accent: '#00D4FF',
    accentHi: '#5CE4FF',
    accent2: '#EC4899',
    accent3: '#A855F7'
  },
  studio: {
    stops: ['#FF3448', '#FF7A2E', '#3BE7FF'],
    accent: '#FF3448',
    accentHi: '#FF5C6A',
    accent2: '#FF7A2E',
    accent3: '#3BE7FF'
  },
  spotify: {
    stops: ['#1DB954', '#1ED760', '#00FF7F'],
    accent: '#1ED760',
    accentHi: '#4BE584',
    accent2: '#1DB954',
    accent3: '#00FF7F'
  },
  about: {
    stops: ['#A855F7', '#EC4899', '#8B5CF6'],
    accent: '#B46CFA',
    accentHi: '#C68DFB',
    accent2: '#EC4899',
    accent3: '#8B5CF6'
  },
  tech: {
    stops: ['#5227FF', '#00EAFF', '#FF00EA'],
    accent: '#00EAFF',
    accentHi: '#5CF1FF',
    accent2: '#5227FF',
    accent3: '#FF00EA'
  },
  lost: {
    stops: ['#FF3448', '#B3122A', '#FF5C6A'],
    accent: '#FF3448',
    accentHi: '#FF5C6A',
    accent2: '#B3122A',
    accent3: '#FF5C6A'
  }
}

export function themeFor(pathname: string): ThemeId {
  if (pathname === '/') return 'home'
  if (pathname.startsWith('/studio')) return 'studio'
  if (pathname.startsWith('/spotify')) return 'spotify'
  if (pathname.startsWith('/about')) return 'about'
  if (pathname.startsWith('/tech')) return 'tech'
  return 'lost'
}

/** Sets <html data-theme> before first paint (inlined in the root layout). */
export const THEME_SCRIPT = `(function(){try{var p=location.pathname,t=p==='/'?'home':p.indexOf('/studio')===0?'studio':p.indexOf('/spotify')===0?'spotify':p.indexOf('/about')===0?'about':p.indexOf('/tech')===0?'tech':'lost';document.documentElement.setAttribute('data-theme',t)}catch(e){}})()`
