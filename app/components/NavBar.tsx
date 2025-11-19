import logo from '../../public/gameover-logo.png'

export function NavBar({ selectedTab }: { selectedTab?: string }) {
  const tabStyle = 'text-white hover:underline'
  const selectedTabStyle = 'text-white font-bold'
  return (
    <nav className='fixed top-0 z-50 flex w-full items-center justify-between bg-[#111111] bg-black/50 py-6 pr-18 pl-10 backdrop-blur-sm'>
      <a href='/'>
        <img src={logo.src} className='h-3.5 w-auto' alt='Logo' />
      </a>
      <div className='space-x-12'>
        <a
          href='/studio'
          className={selectedTab === 'studio' ? selectedTabStyle : tabStyle}
        >
          Studio
        </a>
        <a
          href='/beats'
          className={selectedTab === 'beats' ? selectedTabStyle : tabStyle}
        >
          Beats
        </a>
        <a
          href='/playlists'
          className={selectedTab === 'playlists' ? selectedTabStyle : tabStyle}
        >
          Playlists
        </a>
        <a
          href='/tech'
          className={selectedTab === 'tech' ? selectedTabStyle : tabStyle}
        >
          Tech
        </a>
        <a
          href='/contact'
          className={selectedTab === 'contact' ? selectedTabStyle : tabStyle}
        >
          Contact
        </a>
      </div>
    </nav>
  )
}
