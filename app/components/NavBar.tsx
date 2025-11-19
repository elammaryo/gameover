import logo from '../../public/gameover-logo.png'

export function NavBar({ selectedTab }: { selectedTab?: string }) {
  const tabs = ['studio', 'beats', 'playlists', 'tech', 'about']

  return (
    <nav className='fixed top-0 z-50 flex w-full items-center justify-between gap-8 bg-[#111111] bg-black/50 px-8 py-6 backdrop-blur-sm sm:pr-18 sm:pl-10'>
      <a href='/'>
        <img
          src={logo.src}
          className='h-3.5 w-auto object-contain'
          alt='Logo'
        />
      </a>
      <div className='flex space-x-5 sm:space-x-12'>
        {tabs.map(tab => (
          <div className='flex flex-col'>
            <a
              key={tab}
              href={`/${tab}`}
              className={
                'text-white' + (selectedTab === tab ? ' font-bold' : '')
              }
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </a>
            {selectedTab === tab && (
              <div className='mt-1 h-0.5 w-full bg-white'></div>
            )}
          </div>
        ))}
      </div>
    </nav>
  )
}
