import Aurora from '../components/Aurora'
import { NavBar } from '../components/NavBar'

export default function Studio() {
  return (
    <div className='min-h-screen w-screen bg-black'>
      <div className='fixed h-screen w-screen'>
        <Aurora
          colorStops={['#7cff67', '#b19eef', '#5227ff']}
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
