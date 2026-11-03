import { lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

// Three.js ka code alag chunk me jaata hai, isliye first load slow nahi hota
const HeroScene = lazy(() => import('./HeroScene.jsx'))

export default function Hero() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleBookClick = (e) => {
    if (!user) {
      e.preventDefault()
      navigate('/login')
    }
  }

  return (
    <section className="hero" id="top">
      <div className="hero-bg" style={{ backgroundImage: "url('/hero.jpg')" }}></div>
      <div className="hero-scrim"></div>

      <Suspense fallback={null}>
        <HeroScene />
      </Suspense>

      <div className="hero-content">
        <p className="hero-kicker">Gangnam street flavor, plated with intent</p>
        <h1 className="hero-title">Seoul, after<br />the sun goes down.</h1>
        <p className="hero-sub">
          Charcoal-grilled bulgogi, hand-pulled noodles and a bar that glows like
          Myeong-dong at midnight — in the heart of the city.
        </p>
        <div className="hero-actions">
          <a href="#menu" className="btn btn-primary">See the menu</a>
          {(!user || user.role === 'user') && (
            <a href="#contact" className="btn btn-ghost" onClick={handleBookClick}>Book a table</a>
          )}
        </div>
      </div>
    </section>
  )
}