import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Hero from '../components/Hero.jsx'
import About from '../components/About.jsx'
import Menu from '../components/Menu.jsx'
import Chefs from '../components/Chefs.jsx'
import Gallery from '../components/Gallery.jsx'
import Culture from '../components/Culture.jsx'
import Contact from '../components/Contact.jsx'
import Footer from '../components/Footer.jsx'

export default function Home() {
  const location = useLocation()

  useEffect(() => {
    const targetId = location.state?.scrollTo
    if (!targetId) return

    const frame = requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' })
    })
    return () => cancelAnimationFrame(frame)
  }, [location.state])

  return (
    <>
      <Navbar />
      <Hero />
      <About />
      <Menu />
      <Chefs />
      <Gallery />
      <Culture />
      <Contact />
      <Footer />
    </>
  )
}