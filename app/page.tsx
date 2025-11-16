import logo from '../public/gameover-logo.png'
import backgroundImage from '../public/background.png'
import sentinelImage from '../public/sentinel.png'
import heroImage from '../public/hero.png'
import BlurText from '../app/components/BlurText'

export default function Home() {
  // beats website for GameOver music producer
  return (
    <div className='flex min-h-screen w-full items-center bg-[#111111] font-sans'>
      {/* <header className='absolute top-0 right-0 left-0 flex items-center justify-between p-8'>
        <img src={logo.src} className='w-50' alt='Logo' />
      </header> */}

      <main className='flex min-h-screen max-w-3xl flex-col items-center justify-center sm:items-start'>
        <div className='inset-0 flex w-screen'>
          <img src={sentinelImage.src} className='' alt='Logo' />
          <div className='w-screen-1/2 flex flex-col items-start justify-center sm:p-32'>
            <img src={logo.src} className='w-130 -translate-x-1' alt='Logo' />
            <BlurText
              text='Next Level Beats.'
              delay={750}
              animateBy='words'
              direction='top'
              className='mt-4 text-5xl font-bold text-white sm:text-6xl'
            />
            <span className='mt-12 max-w-md text-2xl text-gray-300'>
              Trap // Drill // Afrobeats // Experimental
            </span>
            <p className='mt-4 max-w-md text-2xl text-gray-300'>
              Your headphones are about to get an XP boost.
            </p>
            <div className='mt-8 flex w-full space-x-4'>
              <button className='rounded bg-blue-600 px-6 py-3 text-2xl font-semibold text-white hover:bg-blue-700'>
                PRESS TO START
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
