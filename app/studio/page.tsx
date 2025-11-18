import Aurora from '../components/Aurora'
import { NavBar } from '../components/NavBar'

export default function Studio() {
  useEffect(() => {
    const overlay = document.getElementById('transition-overlay')
    const label = document.getElementById('transition-label')

    if (label) {
      label.classList.remove('opacity-100', 'glitch-once')
    }

    if (overlay) {
      overlay.style.opacity = '1'
      requestAnimationFrame(() => {
        overlay.style.opacity = '0'
      })
    }
  }, [])

  return (
    <div className='min-h-screen w-screen bg-black'>
      <div className='fixed h-screen w-screen'>
        <Aurora
          colorStops={['#3A29FF', '#FF94B4', '#FF3232']}
          blend={0.5}
          amplitude={1.0}
          speed={0.5}
        />
      </div>
      <NavBar selectedTab='studio' />
      Studio Page
    </div>
  )
}
